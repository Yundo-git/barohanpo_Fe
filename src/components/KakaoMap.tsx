"use client";

import { useCallback, useRef, useState } from "react";
import BottomSheet from "./BottomSheet";
import { useKakaoMap } from "@/hooks/useKakaoMap";
import { usePharmacies } from "@/hooks/usePharmacies";
import { Pharmacy } from "@/types/pharmacy";
import { useRouter } from "next/navigation";

export default function KakaoMap() {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const markersRef = useRef<any[]>([]);
  const router = useRouter();
  const bottomSheetRef = useRef<{ reset: () => void } | null>(null);

  const {
    pharmacies,
    isLoading,
    error,
    findNearbyPharmacies,
    getPharmaciesWithUsers,
    createPharmacyMarkers,
    adjustMapBounds,
  } = usePharmacies();

  const handleMarkerClick = useCallback(
    (pharmacy: Pharmacy) => {
      console.log("마커 클릭됨:", pharmacy);
      // Navigate to pharmacy detail page
      router.push(`/pharmacy/${pharmacy.p_id}`);
      if (pharmacy.name) {
        console.log(
          `${pharmacy.name}이(가) 클릭되었습니다.\n주소: ${
            pharmacy.address || "주소 없음"
          }`
        );
      }
    },
    [router]
  );

  const handleMapLoad = useCallback((map: any) => {
    // 지도가 로드되면 현재 위치만 표시하고, 약국은 표시하지 않습니다.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const center = new window.kakao.maps.LatLng(latitude, longitude);
          map.setCenter(center);

          // 사용자 위치 마커 업데이트
          if (mapRefs.current.userMarker) {
            mapRefs.current.userMarker.setPosition(center);
          }
        },
        (error) => {
          console.error("Error getting current location:", error);
          // 기본 위치 (서울 시청)로 설정
          const defaultCenter = new window.kakao.maps.LatLng(37.5665, 126.978);
          map.setCenter(defaultCenter);
        }
      );
    }
  }, []);

  const mapRefs = useKakaoMap(handleMapLoad);

  const handleFindNearby = async (map: any, center?: any) => {
    console.log("handleFindNearby called");
    if (!map || !window.kakao?.maps) {
      console.error("Map or Kakao Maps not available");
      return;
    }

    // 기존 약국 마커만 제거 (사용자 위치 마커는 유지)
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    try {
      console.log("Requesting geolocation...");
      // 현재 위치 가져오기
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          };
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              console.log("Geolocation success:", pos.coords);
              resolve(pos);
            },
            (err) => {
              console.error("Geolocation error:", err);
              reject(err);
            },
            options
          );
        }
      );

      const { latitude, longitude, accuracy } = position.coords;
      console.log(
        `Current location - lat: ${latitude}, lng: ${longitude}, accuracy: ${accuracy}m`
      );

      const currentCenter = new window.kakao.maps.LatLng(latitude, longitude);
      console.log("Setting map center to:", currentCenter);
      map.setCenter(currentCenter);

      // 사용자 위치 마커 업데이트
      if (mapRefs.current.userMarker) {
        console.log("Updating user marker position");
        mapRefs.current.userMarker.setPosition(currentCenter);
      }

      // 주변 약국 찾기
      const nearbyPharmacies = await findNearbyPharmacies(latitude, longitude);
      console.log("Nearby pharmacies:", nearbyPharmacies);

      // 약국 ID와 현재 위치로 사용자 정보와 함께 가져오기
      const pharmacies = await getPharmaciesWithUsers(
        nearbyPharmacies.map((pharmacy) => pharmacy.p_id),
        latitude, // 현재 위도 추가
        longitude // 현재 경도 추가
      );
      console.log("Pharmacies with user data:", pharmacies);

      if (pharmacies.length > 0) {
        // 약국 마커 생성
        const markers = createPharmacyMarkers(
          map,
          pharmacies,
          handleMarkerClick
        );

        markersRef.current = markers.filter(Boolean) as any[];

        // 지도 범위 조정
        adjustMapBounds(map, markersRef.current);
      } else {
        console.log("No pharmacies found near the current location");
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      // 기본 위치 (서울 시청)로 설정
      const defaultLat = 37.5665;
      const defaultLng = 126.978;
      console.log(
        `Falling back to default location: ${defaultLat}, ${defaultLng}`
      );

      const defaultCenter = new window.kakao.maps.LatLng(
        defaultLat,
        defaultLng
      );
      map.setCenter(defaultCenter);

      // 기본 위치로 약국 검색 시도
      console.log("Searching for pharmacies near default location...");
      const nearbyPharmacies = await findNearbyPharmacies(
        defaultLat,
        defaultLng
      );
      console.log("Nearby pharmacies (default location):", nearbyPharmacies);

      if (nearbyPharmacies.length > 0) {
        const pharmacies = await getPharmaciesWithUsers(
          nearbyPharmacies.map((pharmacy) => pharmacy.p_id),
          defaultLat, // 기본 위치 위도 추가
          defaultLng // 기본 위치 경도 추가
        );
        console.log(
          "Pharmacies with user data (default location):",
          pharmacies
        );

        if (pharmacies.length > 0) {
          const markers = createPharmacyMarkers(
            map,
            pharmacies,
            handleMarkerClick
          );
          markersRef.current = markers.filter(Boolean) as any[];
          adjustMapBounds(map, markersRef.current);
        }
      }
    }

    // 바텀 시트 열기 및 초기화
    setIsBottomSheetOpen(true);
    if (bottomSheetRef.current) {
      bottomSheetRef.current.reset();
    }
  };

  return (
    <div className="relative w-full h-full">
      <div id="map" className="w-full h-full"></div>

      <button
        className="fixed bottom-24 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow z-10"
        onClick={() => handleFindNearby(mapRefs.current.map)}
        disabled={isLoading}
      >
        {isLoading ? "검색 중..." : "주변 약국"}
      </button>

      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3">
          {error}
        </div>
      )}

      <BottomSheet
        ref={bottomSheetRef}
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
      >
        <div>
          <div className="space-y-2 max-h-[60vh] ">
            {/* 약국 로딩 중 */}
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : pharmacies.length > 0 ? (
              pharmacies.map((pharmacy, index) => (
                <div key={`pharmacy-${pharmacy.id || index}`}>
                  <div
                    className="flex bottom-14 gap-2 p-2 h-[6.25rem] border border-gray-200 rounded-md"
                  >
                    <div className="w-[5rem] h-[5rem] rounded-md bg-gray-200 flex justify-center items-center">
                      이미지 영역
                    </div>
                    <div
                      className=" hover:bg-gray-50 w-[60vw] h-[6.25rem]"
                      onClick={() => handleMarkerClick(pharmacy)}
                    >
                      <p className="text-sm font-bold">
                        {pharmacy.name || "이름 없음"}
                      </p>
                      <p className="text-xs text-gray-600 ">
                        {pharmacy.address || "주소 정보 없음"}
                      </p>
                      {pharmacy.user?.number && (
                        <p className="text-xs ">{pharmacy.user.number}</p>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-[1.25rem] bg-gray-200">
                    예약 버튼 영역
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                주변에 약국이 없습니다.
              </p>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
