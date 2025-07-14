"use client";

import { useCallback, useRef, useState } from "react";
import BottomSheet from "./BottomSheet";
import { useKakaoMap } from "@/hooks/useKakaoMap";
import { usePharmacies } from "@/hooks/usePharmacies";
import { Pharmacy } from "@/types/pharmacy";
import { useRouter } from "next/navigation";
import Bookbtn from "./Bookbtn";
import { setPharmacies } from "@/store/pharmacySlice";
import { useDispatch } from "react-redux";

export default function KakaoMap() {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const markersRef = useRef<any[]>([]);
  const router = useRouter();
  const bottomSheetRef = useRef<{ reset: () => void } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const dispatch = useDispatch();

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
      router.push(`/pharmacy/${pharmacy.p_id}`);
    },
    [router]
  );

  const handleMapLoad = useCallback((map: any) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const center = new window.kakao.maps.LatLng(latitude, longitude);
          map.setCenter(center);

          if (mapRefs.current.userMarker) {
            mapRefs.current.userMarker.setPosition(center);
          }
        },
        () => {
          const defaultCenter = new window.kakao.maps.LatLng(37.5665, 126.978);
          map.setCenter(defaultCenter);
        }
      );
    }
  }, []);

  const mapRefs = useKakaoMap(handleMapLoad);

  const handleFindNearby = async (map: any) => {
    if (isSearching) return;
    setIsSearching(true);

    if (!map || !window.kakao?.maps) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    try {
      dispatch(setPharmacies([])); // 기존 데이터 초기화

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        }
      );

      const { latitude, longitude } = position.coords;
      const center = new window.kakao.maps.LatLng(latitude, longitude);
      map.setCenter(center);

      if (mapRefs.current.userMarker) {
        mapRefs.current.userMarker.setPosition(center);
      }

      const nearbyPharmacies = await findNearbyPharmacies(latitude, longitude);
      const pharmacies = await getPharmaciesWithUsers(
        nearbyPharmacies.map((p) => p.p_id),
        latitude,
        longitude
      );

      dispatch(setPharmacies(pharmacies));

      if (pharmacies.length > 0) {
        const markers = createPharmacyMarkers(
          map,
          pharmacies,
          handleMarkerClick
        );
        markersRef.current = markers.filter(Boolean) as any[];
        adjustMapBounds(map, markersRef.current);
      }
    } catch (error) {
      console.error("위치 기반 약국 조회 실패:", error);
    } finally {
      setIsSearching(false);
      setIsBottomSheetOpen(true);
      bottomSheetRef.current?.reset();
    }
  };

  return (
    <div className="relative w-full h-full">
      <div id="map" className="w-full h-full"></div>

      <button
        className="fixed bottom-24 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow z-10"
        onClick={() => handleFindNearby(mapRefs.current.map)}
        disabled={isLoading || isSearching}
      >
        {isLoading || isSearching ? "검색 중..." : "주변 약국"}
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
        <div className="space-y-2 max-h-[60vh] px-2">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : pharmacies.length > 0 ? (
            pharmacies.map((pharmacy, index) => (
              <div
                key={`pharmacy-${pharmacy.p_id || index}`}
                className="border border-gray-200 rounded-md h-full"
              >
                <div className="flex bottom-14 gap-2 p-2 h-[6.25rem] ">
                  <div className="w-[5rem] h-[5rem] rounded-md bg-gray-200 flex justify-center items-center">
                    이미지 영역
                  </div>
                  <div
                    className="hover:bg-gray-50 w-[60vw] h-[6.25rem]"
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
                <div className="w-full h-full ">
                  <Bookbtn pharmacyId={Number(pharmacy.p_id)} />
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">
              주변에 약국이 없습니다.
            </p>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
