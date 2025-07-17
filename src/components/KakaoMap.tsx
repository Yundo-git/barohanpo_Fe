// src/components/KakaoMap.tsx

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BottomSheet from "./BottomSheet";
import { useKakaoMap } from "@/hooks/useKakaoMap";
import { usePharmacies } from "@/hooks/usePharmacies";
import { useMapHandlers } from "@/hooks/useMapHandlers";
import { Pharmacy, PharmacyUser, PharmacyWithUser } from "@/types/pharmacy";
import Bookbtn from "./Bookbtn";

interface KakaoMapProps {
  initialPharmacies?: PharmacyWithUser[];
}

export default function KakaoMap({ initialPharmacies }: KakaoMapProps) {
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

  const handleMarkerClick = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setIsBottomSheetOpen(true);
  };

  const { handleMapLoad } = useMapHandlers({
    createPharmacyMarkers,
    adjustMapBounds,
    handleMarkerClick,
    findNearbyPharmacies,
  });
  
  const { getMap } = useKakaoMap(handleMapLoad, { initialPharmacies });

  // 마커 참조를 위한 useEffect 추가
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 마커 정리
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  // 위치 버튼 클릭 핸들러
  const handleLocationClick = useCallback(async () => {
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
        
        const { latitude, longitude } = position.coords;
        const moveLatLon = new window.kakao.maps.LatLng(latitude, longitude);
        
        // useKakaoMap 훅을 통해 map 인스턴스 가져오기
        const mapInstance = getMap();
        if (mapInstance) {
          mapInstance.setCenter(moveLatLon);
          mapInstance.setLevel(3);
        }
      } catch (error) {
        console.error('현재 위치로 이동할 수 없습니다:', error);
        alert('현재 위치를 가져올 수 없습니다. 위치 서비스를 확인해주세요.');
      }
    } else {
      alert('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
    }
  }, [getMap]);

  return (
    <div className="relative w-full h-full">
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 z-50">
          {error}
        </div>
      )}
      
      {/* 위치 버튼 추가 */}
      <button
        onClick={handleLocationClick}
        className="fixed bottom-24 right-4 bg-white rounded-full p-3 shadow-lg z-10"
        aria-label="현재 위치로 이동"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      <BottomSheet
        ref={bottomSheetRef}
        isOpen={isBottomSheetOpen}
        onClose={() => {
          setIsBottomSheetOpen(false);
          setSelectedPharmacy(null);
        }}
      >
        {selectedPharmacy ? (
          <div className="space-y-2 max-h-[50vh] px-2">
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
                  {(selectedPharmacy.user as PharmacyUser)?.number && (
                    <p className="text-xs">
                      {(selectedPharmacy.user as PharmacyUser)?.number}
                    </p>
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
                    {(pharmacy.user as PharmacyUser)?.number && (
                      <p className="text-xs">
                        {(pharmacy.user as PharmacyUser)?.number}
                      </p>
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
