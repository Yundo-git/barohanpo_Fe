// src/components/KakaoMap.tsx

"use client";

import { useCallback, useRef, useState } from "react";
import BottomSheet from "./BottomSheet";
import { useKakaoMap } from "@/hooks/useKakaoMap";
import { usePharmacies } from "@/hooks/usePharmacies";
import { Pharmacy } from "@/types/pharmacy";
import Bookbtn from "./Bookbtn";

export default function KakaoMap() {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(true);
  const markersRef = useRef<kakao.maps.Marker[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(
    null
  );
  const bottomSheetRef = useRef<{ reset: () => void } | null>(null);

  const {
    pharmacies,
    error,
    findNearbyPharmacies,
    createPharmacyMarkers,
    adjustMapBounds,
  } = usePharmacies();

  const handleMarkerClick = useCallback((pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setIsBottomSheetOpen(true);
  }, []);

  const handleMapLoad = useCallback(
    (map: kakao.maps.Map) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const center = new window.kakao.maps.LatLng(latitude, longitude);
            map.setCenter(center);

            // 기존 마커 제거
            markersRef.current.forEach((marker) => marker.setMap(null));
            markersRef.current = [];

            // 약국 정보 요청
            const nearbyPharmacies = await findNearbyPharmacies(
              latitude,
              longitude
            );

            if (nearbyPharmacies.length > 0) {
              const markers = createPharmacyMarkers(
                map,
                nearbyPharmacies,
                handleMarkerClick
              );
              markersRef.current = markers.filter(
                Boolean
              ) as kakao.maps.Marker[];
              adjustMapBounds(map, markersRef.current);
            }
          },
          () => {
            const defaultCenter = new window.kakao.maps.LatLng(
              37.5665,
              126.978
            );
            map.setCenter(defaultCenter);
          }
        );
      }
    },
    [
      handleMarkerClick,
      findNearbyPharmacies,
      createPharmacyMarkers,
      adjustMapBounds,
    ]
  );

  const mapRefs = useKakaoMap(handleMapLoad);

  return (
    <div className="relative w-full h-full">
      <div id="map" className="w-full h-full"></div>

      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3">
          {error}
        </div>
      )}

      <BottomSheet
        ref={bottomSheetRef}
        isOpen={isBottomSheetOpen}
        onClose={() => {
          setIsBottomSheetOpen(false);
          setSelectedPharmacy(null);
        }}
      >
        {selectedPharmacy ? (
          <div className="space-y-2 max-h-[60vh] px-2">
            <div className="border border-gray-200 rounded-md">
              <div className="flex gap-2 p-2">
                <div className="w-[5rem] h-[5rem] rounded-md bg-gray-200 flex justify-center items-center">
                  이미지 영역
                </div>
                <div className="w-[60vw]">
                  <a href={`pharmacy/${selectedPharmacy.p_id}`}>
                    {`${selectedPharmacy.name} >` || "이름 없음"}
                  </a>
                  <p className="text-xs text-gray-600">
                    {selectedPharmacy.address || "주소 정보 없음"}
                  </p>
                  {selectedPharmacy.user?.number && (
                    <p className="text-xs">{selectedPharmacy.user.number}</p>
                  )}
                </div>
              </div>
              <div className="p-2">
                <Bookbtn pharmacyId={Number(selectedPharmacy.p_id)} />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] px-2">
            {pharmacies.map((pharmacy) => (
              <div
                key={pharmacy.p_id}
                className="border border-gray-200 rounded-md"
              >
                <div className="flex gap-2 p-2">
                  <div className="w-[5rem] h-[5rem] rounded-md bg-gray-200 flex justify-center items-center">
                    이미지 영역
                  </div>
                  <div
                    className="hover:bg-gray-50 w-[60vw]"
                    onClick={() => handleMarkerClick(pharmacy)}
                  >
                    <a href={`pharmacy/${pharmacy.p_id}`}>
                      {`${pharmacy.name} >` || "이름 없음"}
                    </a>
                    <p className="text-xs text-gray-600">
                      {pharmacy.address || "주소 정보 없음"}
                    </p>
                    {pharmacy.user?.number && (
                      <p className="text-xs">{pharmacy.user.number}</p>
                    )}
                  </div>
                </div>
                <div className="p-2">
                  <Bookbtn pharmacyId={Number(pharmacy.p_id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
