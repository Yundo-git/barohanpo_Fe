"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import BottomSheet from "./BottomSheet";
import { useKakaoMap } from "@/hooks/useKakaoMap";
import { usePharmacies } from "@/hooks/usePharmacies";
import { Pharmacy } from "@/types/pharmacy";
import { useRouter } from "next/navigation";
import Bookbtn from "./Bookbtn";

export default function KakaoMap() {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(true);
  const markersRef = useRef<any[]>([]);
  const router = useRouter();
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(
    null
  );
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

  const handleMarkerClick = useCallback((pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setIsBottomSheetOpen(true);
  }, []);

  const handleMapLoad = useCallback(
    (map: any) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const center = new window.kakao.maps.LatLng(latitude, longitude);
            map.setCenter(center);

            // 기존 마커들 제거
            markersRef.current.forEach((marker) => marker.setMap(null));
            markersRef.current = [];

            // 사용자 위치 마커 설정
            if (mapRefs.current.userMarker) {
              mapRefs.current.userMarker.setPosition(center);
            } else {
              const userMarker = new window.kakao.maps.Marker({
                position: center,
                image: new window.kakao.maps.MarkerImage(
                  "/images/user-marker.png",
                  new window.kakao.maps.Size(30, 30)
                ),
                clickable: true,
              });
              userMarker.setMap(map);
              mapRefs.current.userMarker = userMarker;
            }

            // 약국 정보 요청 실행
            const nearbyPharmacies = await findNearbyPharmacies(
              latitude,
              longitude
            );

            // 약국 정보로 마커 생성
            if (nearbyPharmacies.length > 0) {
              const markers = createPharmacyMarkers(
                map,
                nearbyPharmacies,
                handleMarkerClick
              );
              markersRef.current = markers.filter(Boolean) as any[];
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
    [handleMarkerClick, findNearbyPharmacies]
  );

  const mapRefs = useKakaoMap(handleMapLoad);

  // useEffect(() => {
  //   // 지도 로드 후에는 바텀시트를 자동으로 열지 않음
  //   if (mapRefs.current?.map) {
  //     bottomSheetRef.current?.reset();
  //   }
  // }, [mapRefs.current?.map]);

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
