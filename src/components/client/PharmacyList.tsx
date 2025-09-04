// src/components/PharmacyList.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { usePharmacies } from "@/hooks/usePharmacies";
import { Pharmacy } from "@/types/pharmacy";
import { useRouter } from "next/navigation";
import { useMapHandlers } from "@/hooks/useMapHandlers";

//주변에 약국없을때 화면 필요

interface PharmacyListProps {
  searchParams?: {
    date?: string;
    time?: string;
  };
}

const extractCityDistrict = (address?: string): string => {
  if (!address) return "주소 정보 없음";

  const parts = address.split(" ");
  if (parts.length < 2) return "주소 정보 없음";

  const city = parts[0]; // 시/도
  const district = parts[1]; // 구/군

  return `${city} ${district}`;
};

export default function PharmacyList({}: PharmacyListProps) {
  const { pharmacies, isLoading, error, findNearbyPharmacies } =
    usePharmacies();
  const [isSearching, setIsSearching] = useState(false);
  const hasFetchedRef = useRef(false);
  const router = useRouter();

  // useMapHandlers에서 필요한 함수만 가져오기
  const { getCurrentPosition, locationError } = useMapHandlers({
    createPharmacyMarkers: () => [], // 필수 파라미터이지만 여기서는 사용하지 않음
    adjustMapBounds: () => {}, // 필수 파라미터
    handleMarkerClick: () => {}, // 필수 파라미터
    findNearbyPharmacies, // 실제로 사용할 함수
  });

  // 스플래시에서 미리 로드하므로 여기서는 별도 fetch를 하지 않음

  // 에러가 있으면 사용자에게 표시
  useEffect(() => {
    if (locationError) {
      console.error("위치 오류:", locationError);
      // 여기서 토스트 메시지나 알림을 표시할 수 있습니다.
    }
  }, [locationError]);

  // pharmacies가 비어있고 로딩 중이거나 검색 중인 경우에만 로딩 표시
  if ((pharmacies.length === 0 && isLoading) || isSearching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="text-gray-600">주변 약국 정보를 불러오고 있어요...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">오류가 발생했습니다: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4">
      <h2 className="text-xl font-bold mb-4">내 주변 약국</h2>
      <div className="space-y-6">
        {pharmacies.map((pharmacy: Pharmacy) => (
          <div key={pharmacy.p_id} className="flex gap-4 items-center">
            <div className="w-[3rem] h-[3rem] rounded-md bg-gray-200 flex justify-center items-center">
              이미지
            </div>
            <div
              className="w-[80vw] cursor-pointer"
              onClick={() => router.push(`/pharmacy/${pharmacy.p_id}`)}
            >
              <h3 className="font-bold">{pharmacy.name}</h3>
              <p className="text-gray-600">
                {extractCityDistrict(pharmacy.address)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
