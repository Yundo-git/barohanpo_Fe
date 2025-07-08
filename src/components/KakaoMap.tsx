"use client";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

export default function KakaoMap() {
  // refs persist across renders
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  // 버튼 클릭 시 내 주변 약국 검색
  const findNearby = () => {
    if (!navigator.geolocation) {
      alert("Geolocation을 지원하지 않습니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const { latitude, longitude } = coords;
      if (!window.kakao?.maps || !mapRef.current) return;
      const center = new window.kakao.maps.LatLng(latitude, longitude);
      mapRef.current.setCenter(center);

      // 기존 마커 제거
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }

      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacy/nearby?lat=${latitude}&lng=${longitude}&radius=8000`
      )
        .then((r) => r.json())
        .then((nearby) => {
          const list = Array.isArray(nearby) ? nearby : nearby?.data ?? [];
          // 기존 마커 제거
          markersRef.current.forEach((m) => m.setMap(null));
          markersRef.current = [];
          list.forEach((p: any) => {
            const lat = parseFloat(p.lat ?? p.latitude);
            const lng = parseFloat(p.lng ?? p.longitude);
            if (!lat || !lng) return;
            const pos = new window.kakao.maps.LatLng(lat, lng);
            const m = new window.kakao.maps.Marker({ position: pos });
            m.setMap(mapRef.current);
            markersRef.current.push(m);
          });
          const bounds = new window.kakao.maps.LatLngBounds();
          markersRef.current.forEach((m) => bounds.extend(m.getPosition()));
          bounds.extend(center);
          mapRef.current.setBounds(bounds);
        })
        .catch(console.error);
    });
  };

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
          mapRef.current = new window.kakao.maps.Map(container, {
            center,
            level: 3,
          });
          // 현재 위치 마커 생성 및 저장
          userMarkerRef.current = new window.kakao.maps.Marker({
            position: center,
            map: mapRef.current,
            clickable: true,
          });
        };

        // 브라우저 Geolocation 사용
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            createMap(latitude, longitude);
            console.log("User position →", latitude, longitude);
          });
        } else {
          // 지원 안함
          createMap(37.5665, 126.978);
        }
      });
    };
  }, []);

  return (
    <>
      <div id="map" className="w-screen h-screen z-0" />

      <button
        className="fixed bottom-24 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow"
        onClick={findNearby}
      >
        주변 약국
      </button>
    </>
  );
}
