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
      // 컴포넌트 언마운트 시 스크립트 제거
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
      mapRef.current = null;
    };
  }, [mapLoaded, scriptId]);

  // 2. 스크립트 로드 완료 후 지도 생성
  useEffect(() => {
    if (!mapLoaded || mapRef.current) {
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`useKakaoMap: Map container with ID "${containerId}" not found. Retrying...`);
      return;
    }

    const initializeMap = async () => {
      try {
        console.log("useKakaoMap: 지도 생성 시작.");
        
        // 기본 위치는 서울 시청으로 설정
        let defaultLat = 37.5665;
        let defaultLng = 126.978;
        
        // 사용자 위치 가져오기 시도
        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
              });
            });
            
            // 사용자 위치로 기본 위치 업데이트
            defaultLat = position.coords.latitude;
            defaultLng = position.coords.longitude;
            console.log("useKakaoMap: 사용자 위치를 가져왔습니다.", { lat: defaultLat, lng: defaultLng });
          } catch (error) {
            console.warn("useKakaoMap: 사용자 위치를 가져오는데 실패했습니다.", error);
          }
        }
        
        const defaultCenter = new window.kakao.maps.LatLng(defaultLat, defaultLng);
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
    
    initializeMap();
  }, [mapLoaded, containerId, onMapLoad, initialPharmacies]);

  return { getMap };
};