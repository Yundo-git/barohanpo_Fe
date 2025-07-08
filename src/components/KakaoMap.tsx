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
        if (!container) return;

        const createMap = (lat: number, lng: number) => {
          const center = new window.kakao.maps.LatLng(lat, lng);
          const map = new window.kakao.maps.Map(container, {
            center,
            level: 3,
          });
          // 현재 위치 마커
          new window.kakao.maps.Marker({ position: center }).setMap(map);
        };

        // 브라우저 Geolocation 사용
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              createMap(latitude, longitude);
              console.log("User position →", latitude, longitude);
            },
            (err) => {
              console.warn("Geolocation error", err);
              // 실패 시 서울시청으로 fallback
              createMap(37.5665, 126.978);
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        } else {
          // 지원 안함
          createMap(37.5665, 126.978);
        }
      });
    };
  }, []);

  return <div id="map" className="w-screen h-screen z-0" />;
}
