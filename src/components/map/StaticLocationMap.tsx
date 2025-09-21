"use client";

import { useCallback, useEffect, useRef } from "react";
import { useKakaoMap } from "@/hooks/useKakaoMap";

type StaticLocationMapProps = {
  lat: number;
  lng: number;
  className?: string;
  level?: number;
};

// Augment map type with runtime-available methods missing in some typings
type MapWithControls = kakao.maps.Map & {
  setDraggable(flag: boolean): void;
  setZoomable(flag: boolean): void;
  relayout(): void;
};

export default function StaticLocationMap({ lat, lng, className = "h-48", level = 3 }: StaticLocationMapProps) {
  // Use a stable, simple DOM-safe id (avoid characters like ':')
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

        // Place marker (no binding to variable to avoid unused-var)
        new kakao.maps.Marker({
          position: position,
          map: map,
        });

        // Disable interactions using a narrowed type with known methods
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
        // re-center to keep marker centered
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