"use client";

import { useCallback, useEffect, useRef } from "react";
import { useKakaoMap } from "@/hooks/useKakaoMap";

type StaticLocationMapProps = {
  lat: number;
  lng: number;
  className?: string;
  level?: number;
};

// 지도 컨트롤 인터페이스
type MapWithControls = kakao.maps.Map & {
  setDraggable(flag: boolean): void;
  setZoomable(flag: boolean): void;
  relayout(): void;
};

export default function StaticLocationMap({ lat, lng, className = "h-48", level = 3 }: StaticLocationMapProps) {
  // 지도 컨테이너 ID 생성
  const idRef = useRef<string>(`static-map-${Math.random().toString(36).slice(2, 9)}`);
  const containerId = idRef.current;

  const onMapLoad = useCallback(
    (map: kakao.maps.Map) => {
      try {
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          console.warn("StaticLocationMap: invalid coords", { lat, lng });
          return;
        }
        const containerEl = document.getElementById(containerId);
        if (containerEl) {
          const rect = containerEl.getBoundingClientRect();
          console.log("StaticLocationMap: container rect", rect);
        }
        const position = new kakao.maps.LatLng(lat, lng);
        map.setCenter(position);
        map.setLevel(level);

        // Custom marker image
        const imageSrc = "/mapmarker.svg"; // public/icon/mapmarker.svg
        const imageSize = new kakao.maps.Size(28, 36); // width, height
        const imageOption = { offset: new kakao.maps.Point(14, 36) }; // anchor at bottom center
        const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);

        new kakao.maps.Marker({
          position: position,
          map: map,
          image: markerImage,
        });
        // 지도 인터랙션 비활성화
        (map as MapWithControls).setDraggable(false);
        (map as MapWithControls).setZoomable(false);
        
        // 컨테이너 레이아웃이 안정된 후 재정렬을 한 번 더 보장
        // 즉시 + 다음 프레임 두 번 호출
        if (typeof (map as MapWithControls).relayout === "function") {
          (map as MapWithControls).relayout();
          setTimeout(() => {
            try { (map as MapWithControls).relayout(); } catch {}
          }, 50);
        }
        // 지도 재정렬
      } catch (e) {
        console.error("StaticLocationMap: failed to initialize map:", e);
      }
    },
    [lat, lng, level, containerId]
  );
  
  // 훅에 `containerId`를 문자열로 전달하고 map accessor 획득
  const { getMap } = useKakaoMap(onMapLoad, { containerId });

  // 탭 전환 등으로 컨테이너가 표시될 때 relayout을 보장
  useEffect(() => {
    const el = document.getElementById(containerId);
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const map = getMap();
      if (!map) return;
      try {
        if (typeof (map as MapWithControls).relayout === "function") {
          (map as MapWithControls).relayout();
        }
        map.setCenter(new kakao.maps.LatLng(lat, lng));
      } catch {}
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerId, getMap, lat, lng]);

  return (
    <div className={`w-full ${className} rounded-lg overflow-hidden border border-gray-200`}>
      <div id={containerId} className="w-full h-full" style={{ minHeight: "12rem" }} />
    </div>
  );
}