"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BottomSheet from "./BottomSheet";
import { useKakaoMap } from "@/hooks/useKakaoMap";
import { usePharmacies } from "@/hooks/usePharmacies";
import { Pharmacy } from "@/types/pharmacy";
import { useRouter } from "next/navigation";

export default function KakaoMap() {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const markersRef = useRef<any[]>([]);
  const router = useRouter();

  const {
    pharmacies,
    isLoading,
    error,
    findNearbyPharmacies,
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
    if (!map || !window.kakao?.maps) return;

    // 기존 약국 마커만 제거 (사용자 위치 마커는 유지)
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // 현재 위치를 가져오거나 기본 위치 사용
    let currentCenter = center;
    if (!currentCenter) {
      currentCenter = map.getCenter();
    }

    // 사용자 위치 마커 업데이트
    if (mapRefs.current.userMarker) {
      mapRefs.current.userMarker.setPosition(currentCenter);
    }

    // 주변 약국 찾기
    const pharmacyList = await findNearbyPharmacies(
      currentCenter.getLat(),
      currentCenter.getLng()
    );

    if (pharmacyList.length > 0) {
      // 약국 마커 생성
      const markers = createPharmacyMarkers(
        map,
        pharmacyList,
        handleMarkerClick
      );

      markersRef.current = markers.filter(Boolean) as any[];

      // 지도 범위 조정
      adjustMapBounds(map, markersRef.current, currentCenter);
    }

    // 바텀 시트 열기
    setIsBottomSheetOpen(true);
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
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-10">
          {error}
        </div>
      )}

      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
      >
        <div className="space-y-4">
          <h2 className="text-xl font-bold">주변 약국 ({pharmacies.length})</h2>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : pharmacies.length > 0 ? (
              pharmacies.map((pharmacy, index) => (
                <div
                  key={pharmacy.id || index}
                  className="p-3 border-b border-gray-200 hover:bg-gray-50"
                  onClick={() => handleMarkerClick(pharmacy)}
                >
                  <h3 className="font-medium">
                    {pharmacy.name || "이름 없음"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {pharmacy.address || "주소 정보 없음"}
                  </p>
                  {pharmacy.phone && (
                    <p className="text-sm text-blue-600">{pharmacy.phone}</p>
                  )}
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
