// src/hooks/useKakaoMap.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PharmacyWithUser } from "@/types/pharmacy";

interface UseKakaoMapOptions {
  initialPharmacies?: PharmacyWithUser[];
  containerId?: string;
}

type MapLoadHandler = (
  map: kakao.maps.Map,
  initialData?: PharmacyWithUser[]
) => void;

interface UseKakaoMapReturn {
  getMap: () => kakao.maps.Map | null;
}

export const useKakaoMap = (
  onMapLoad: MapLoadHandler,
  options: UseKakaoMapOptions = {}
): UseKakaoMapReturn => {
  const { containerId = "map", initialPharmacies } = options;
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const scriptId = "kakao-maps-sdk";

  const getMap = useCallback(() => mapRef.current, []);

  // 1. 카카오 맵 스크립트 로드
  useEffect(() => {
    // 스크립트가 이미 존재하면 로드 로직을 건너뜀
    if (document.getElementById(scriptId)) {
      if (window.kakao && window.kakao.maps && !mapLoaded) {
        console.log("useKakaoMap: 이미 로드된 스크립트가 있습니다.");
        setMapLoaded(true);
      }
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAPS_KEY}&libraries=services&autoload=false`;
    script.async = true;

    script.onload = () => {
      console.log("useKakaoMap: 스크립트 로드 완료. SDK 로드 시작.");
      window.kakao.maps.load(() => {
        setMapLoaded(true);
        console.log("useKakaoMap: SDK 로드 완료.");
      });
    };

    script.onerror = (e) => {
      console.error("useKakaoMap: 카카오맵 스크립트 로드 실패", e);
    };

    document.head.appendChild(script);

    return () => {
      // 다른 컴포넌트에서 카카오맵을 사용할 수 있으니 스크립트는 제거하지 않음
      mapRef.current = null;
    };
  }, [mapLoaded, scriptId]);

  // 2. 스크립트 로드 완료 후 지도 생성 (컨테이너가 늦게 렌더되는 경우를 대비해 재시도 로직 포함)
  useEffect(() => {
    if (!mapLoaded || mapRef.current) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 30; // 최대 30회 시도 (~3초)
    const intervalMs = 100;

    const initializeMap = async (container: HTMLElement) => {
      try {
        console.log("useKakaoMap: 지도 생성 시작.");

        // 기본 위치는 서울 시청으로 설정
        let defaultLat = 37.5665;
        let defaultLng = 126.978;

        // 사용자 위치 가져오기 시도
        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>(
              (resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: true,
                  timeout: 5000,
                  maximumAge: 0,
                });
              }
            );

            // 사용자 위치로 기본 위치 업데이트
            defaultLat = position.coords.latitude;
            defaultLng = position.coords.longitude;
            console.log("useKakaoMap: 사용자 위치를 가져왔습니다.", {
              lat: defaultLat,
              lng: defaultLng,
            });
          } catch (error) {
            console.warn(
              "useKakaoMap: 사용자 위치를 가져오는데 실패했습니다.",
              error
            );
          }
        }

        const defaultCenter = new window.kakao.maps.LatLng(
          defaultLat,
          defaultLng
        );
        const defaultOptions = {
          center: defaultCenter,
          level: 3, // 더 가까운 레벨로 조정
        };

        const newMap = new window.kakao.maps.Map(container, defaultOptions);
        mapRef.current = newMap;
        console.log("useKakaoMap: 지도 인스턴스 생성 완료.");

        // 지도가 생성된 후 콜백 함수 실행
        onMapLoad(newMap, initialPharmacies);
      } catch (error) {
        console.error("useKakaoMap: 지도 초기화 중 오류 발생:", error);
      }
    };

    const tryInit = () => {
      if (mapRef.current) return; // 이미 초기화됨
      const container = document.getElementById(containerId);
      if (!container) {
        attempts += 1;
        if (attempts <= maxAttempts) {
          if (attempts === 1) {
            console.warn(
              `useKakaoMap: container #${containerId} not found. Retrying...`
            );
          }
          setTimeout(tryInit, intervalMs);
        } else {
          console.error(
            `useKakaoMap: Failed to find container #${containerId} after ${maxAttempts} attempts.`
          );
        }
        return;
      }
      // 컨테이너가 표시되었지만 아직 사이즈가 0인 경우 초기화를 지연
      const rect = container.getBoundingClientRect();
      if ((rect.width === 0 || rect.height === 0) && attempts <= maxAttempts) {
        attempts += 1;
        if (attempts % 5 === 1) {
          console.warn(
            `useKakaoMap: container #${containerId} size is 0. Retrying...`,
            rect
          );
        }
        setTimeout(tryInit, intervalMs);
        return;
      }

      void initializeMap(container);
    };

    tryInit();
  }, [mapLoaded, containerId, onMapLoad, initialPharmacies]);

  return { getMap };
};
