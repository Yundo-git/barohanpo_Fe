"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

export default function KakaoMap() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAPS_KEY}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById("map");
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.978), // 서울시청
          level: 3,
        };
        const map = new window.kakao.maps.Map(container, options);
      });
    };
  }, []);

  return <div id="map" className="w-full h-full" />;
}
