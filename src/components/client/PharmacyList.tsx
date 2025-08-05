// src/components/PharmacyList.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { usePharmacies } from "@/hooks/usePharmacies";
import { Pharmacy } from "@/types/pharmacy";
import { useRouter } from "next/navigation";
import { useMapHandlers } from "@/hooks/useMapHandlers";

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

  useEffect(() => {
    // 이미 약국 데이터가 있거나 이미 요청을 보냈으면 위치 조회를 하지 않음
    if (pharmacies.length > 0 || hasFetchedRef.current) {
      return;
    }

    const fetchPharmacies = async () => {
      setIsSearching(true);
      hasFetchedRef.current = true; // 요청 시작 시 플래그 설정

      try {
        // useMapHandlers의 getCurrentPosition 사용
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        console.log("position", position);
        await findNearbyPharmacies(latitude, longitude);
      } catch (error: unknown) {
        hasFetchedRef.current = false; // 실패 시 플래그 초기화하여 재시도 가능하도록

        const errorMessage =
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.";

        console.error("약국 정보를 가져오는 중 오류가 발생했습니다:", {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        });
        // 사용자에게 오류 메시지 표시 (예: 토스트 메시지)
      } finally {
        setIsSearching(false);
      }
    };

    fetchPharmacies();
  }, [pharmacies.length, findNearbyPharmacies, getCurrentPosition]);

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
