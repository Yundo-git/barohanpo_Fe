import { useCallback, useRef, useState } from "react";
import { PharmacyWithUser } from "@/types/pharmacy";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import { usePharmacyMarkers } from "./usePharmacyMarkers";

// Kakao Maps types are imported from src/types/kakao.d.ts

declare global {
  interface Window {
    Capacitor: typeof Capacitor;
    kakao: typeof kakao;
  }
}

type MarkerType = kakao.maps.Marker;

interface UseMapHandlersProps {
  handleMarkerClick: (pharmacy: PharmacyWithUser) => void;
  findNearbyPharmacies: (
    lat: number,
    lng: number
  ) => Promise<PharmacyWithUser[]>;
  setPharmacies: (payload: { pharmacies: PharmacyWithUser[] }) => void;
}

const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const useMapHandlers = ({
  handleMarkerClick,
  findNearbyPharmacies,
  setPharmacies,
}: UseMapHandlersProps) => {
  const markersRef = useRef<MarkerType[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);

  const checkLocationPermission = async (): Promise<boolean> => {
    try {
      if (isMobile() && window.Capacitor) {
        const permission = await Geolocation.checkPermissions();
        if (permission.location !== "granted") {
          const request = await Geolocation.requestPermissions();
          return request.location === "granted";
        }
        return true;
      } else {
        return new Promise((resolve) => {
          if (!navigator.geolocation) {
            resolve(false);
            return;
          }
          navigator.permissions
            .query({ name: "geolocation" })
            .then((result) => {
              resolve(result.state === "granted");
            })
            .catch(() => resolve(false));
        });
      }
    } catch (error) {
      console.error("Error checking location permission:", error);
      return false;
    }
  };

  const getCurrentPosition = async (): Promise<{
    coords: { latitude: number; longitude: number };
  }> => {
    try {
      if (isMobile() && window.Capacitor) {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
        return {
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        };
      } else {
        return new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
          });
        });
      }
    } catch (error) {
      console.error("Error getting current position:", error);
      throw error;
    }
  };

  const createMarkerImage = useCallback(():
    | kakao.maps.MarkerImage
    | undefined => {
    if (!window.kakao?.maps) return undefined;
    const kakao = window.kakao as typeof window.kakao;
    const imageSrc = "/mapmarker.svg";
    const imageSize = new kakao.maps.Size(36, 48);
    const imageOption = { offset: new kakao.maps.Point(18, 48) };
    return new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
  }, []);

  const { createPharmacyMarkers, adjustMapBounds } = usePharmacyMarkers();

  const createAndDisplayMarkers = useCallback(
    (map: kakao.maps.Map, pharmaciesToDisplay: PharmacyWithUser[]) => {
      // 마커 초기화
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      // 유효한 약국 필터링
      const validPharmacies = pharmaciesToDisplay.filter(
        (p) => (p.latitude || p.lat) && (p.longitude || p.lng)
      ) as PharmacyWithUser[];

      if (validPharmacies.length === 0) {
        console.warn("No valid pharmacies with coordinates found");
        return;
      }

      // 마커 이미지 생성
      const markerImage = createMarkerImage();

      // 마커 생성 및 표시
      const newMarkers = createPharmacyMarkers(
        map,
        validPharmacies,
        handleMarkerClick,
        markerImage
      );

      markersRef.current = newMarkers;

      // 지도의 영역을 마커들을 포함하도록 조정
      adjustMapBounds(map, newMarkers);
    },
    [
      createMarkerImage,
      handleMarkerClick,
      createPharmacyMarkers,
      adjustMapBounds,
    ]
  );

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  }, []);

  const handleMapLoad = useCallback(
    async (map: kakao.maps.Map, initialPharmacies?: PharmacyWithUser[]) => {
      clearMarkers();

      if (initialPharmacies && initialPharmacies.length > 0) {
        setPharmacies({ pharmacies: initialPharmacies });
        createAndDisplayMarkers(map, initialPharmacies);
        return;
      }

      try {
        setLocationError(null);
        const hasPermission = await checkLocationPermission();
        if (!hasPermission) {
          throw new Error(
            "위치 정보 사용 권한이 필요합니다. 설정에서 위치 서비스를 활성화해주세요."
          );
        }

        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;

        const center = new window.kakao.maps.LatLng(latitude, longitude);
        map.setCenter(center);
        map.setLevel(3);

        const nearbyPharmacies = await findNearbyPharmacies(
          latitude,
          longitude
        );
        setPharmacies({ pharmacies: nearbyPharmacies });
        createAndDisplayMarkers(map, nearbyPharmacies);
      } catch (error) {
        console.error("Failed to get location or pharmacies:", error);
        setLocationError(
          "현재 위치를 가져올 수 없습니다. 기본 위치로 지도를 표시합니다."
        );
        const defaultCenter = new window.kakao.maps.LatLng(37.5665, 126.978);
        map.setCenter(defaultCenter);
        map.setLevel(6);
      }
    },
    [clearMarkers, createAndDisplayMarkers, findNearbyPharmacies, setPharmacies]
  );

  return {
    handleMapLoad,
    clearMarkers,
    locationError,
  };
};
