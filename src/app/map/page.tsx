"use client";

import { useEffect } from 'react';
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
  useEffect(() => {
    // Prevent scrolling on the body
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Cleanup function to re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'visible';
      document.documentElement.style.overflow = 'visible';
    };
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden">
      <KakaoMap />
    </div>
  );
}
