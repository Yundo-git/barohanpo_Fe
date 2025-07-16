// src/components/PharmacyList.tsx

"use client";

import { useEffect, useState } from "react";
import { usePharmacies } from "@/hooks/usePharmacies";
import { Pharmacy } from "@/types/pharmacy";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  useEffect(() => {
    if (navigator.geolocation) {
      setIsSearching(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await findNearbyPharmacies(latitude, longitude);
          setIsSearching(false);
        },
        () => {
          console.error("위치 정보를 가져오지 못했습니다.");
          setIsSearching(false);
        }
      );
    }
  }, [findNearbyPharmacies]);

  if (isLoading || isSearching) {
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
