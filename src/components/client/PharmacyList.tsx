// src/components/PharmacyList.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePharmacies } from "@/hooks/usePharmacies";
import type { Pharmacy } from "@/types/pharmacy";

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
  const { pharmacies, isLoading, error } = usePharmacies();
  const router = useRouter();

  // PharmacyList에서는 지도 관련 기능이 필요하지 않으므로, useMapHandlers 대신 직접 필요한 상태만 가져옵니다.
  // locationError는 여기서는 사용하지 않으므로 제거합니다.
  // findNearbyPharmacies는 이미 usePharmacies 훅에서 가져왔으므로 그대로 사용합니다.

  // 스플래시에서 미리 로드하므로 여기서는 별도 fetch를 하지 않음

  // 에러가 있으면 사용자에게 표시
  useEffect(() => {
    if (error) {
      console.error("약국 정보를 불러오는 중 오류 발생:", error);
      // 여기서 토스트 메시지나 알림을 표시할 수 있습니다.
    }
  }, [error]);

  // pharmacies가 비어있고 로딩 중이거나 검색 중인 경우에만 로딩 표시
  if (pharmacies.length === 0 && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main mx-auto" />
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
    <div className="flex-1 py-6">
      <h2 className="H3_SB_20 text-mainText">내 주변 약국</h2>
      <div className="space-y-6 pt-4">
        {pharmacies.map((pharmacy: Pharmacy) => (
          <div key={pharmacy.p_id} className="flex gap-4 items-center">
            <div className="w-[3rem] h-[3rem] rounded-md bg-gray-200 flex justify-center items-center">
              이미지
            </div>
            <div
              className="w-[80vw] cursor-pointer"
              onClick={() => router.push(`/pharmacy/${pharmacy.p_id}`)}
            >
              <h3 className="T3_SB_18 text-mainText">{pharmacy.name}</h3>
              <p className="B1_RG_15 text-subText2">
                {extractCityDistrict(pharmacy.address)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
