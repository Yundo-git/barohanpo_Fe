// src/components/MapLoader.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { PharmacyWithUser } from "@/types/pharmacy";

const KakaoMap = dynamic(() => import("./KakaoMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[65vh] flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
      <p className="text-gray-600">지도를 로드하는 중입니다...</p>
    </div>
  ),
});

interface MapLoaderProps {
  initialPharmacies?: PharmacyWithUser[];
}

export default function MapLoader({ initialPharmacies }: MapLoaderProps) {
  const [isMounted, setIsMounted] = useState(false);

  // 컴포넌트가 마운트된 후에만 KakaoMap을 렌더링
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-[65vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" style={{ height: "100vh" }}>
      {/* 지도 컨테이너를 먼저 렌더링 */}
      <div
        id="map"
        className="w-full h-full"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
        }}
      ></div>
      {/* 그 다음에 KakaoMap 컴포넌트 렌더링 */}
      <KakaoMap initialPharmacies={initialPharmacies} />
    </div>
  );
}
