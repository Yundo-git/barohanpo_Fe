"use client";

import dynamic from "next/dynamic";

const KakaoMap = dynamic(() => import("@/components/KakaoMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="w-full h-screen">
      <KakaoMap />
    </div>
  );
}
