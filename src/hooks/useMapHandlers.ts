import { useCallback, useEffect, useRef } from 'react';
import { Pharmacy, PharmacyWithUser } from '@/types/pharmacy';

type MarkerType = kakao.maps.Marker;

interface UseMapHandlersProps {
  createPharmacyMarkers: (
    map: kakao.maps.Map,
    pharmacies: PharmacyWithUser[],
    onClick: (pharmacy: Pharmacy) => void
  ) => (kakao.maps.Marker | null)[];
  adjustMapBounds: (map: kakao.maps.Map, markers: kakao.maps.Marker[]) => void;
  handleMarkerClick: (pharmacy: Pharmacy) => void;
  findNearbyPharmacies: (lat: number, lng: number) => Promise<PharmacyWithUser[]>;
}

export const useMapHandlers = ({
  createPharmacyMarkers,
  adjustMapBounds,
  handleMarkerClick,
  findNearbyPharmacies,
}: UseMapHandlersProps) => {
  const markersRef = useRef<MarkerType[]>([]);
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  }, []);

  const handleMapLoad = useCallback(
    async (map: kakao.maps.Map, initialPharmacies?: PharmacyWithUser[]) => {
      // 기존 마커 정리
      clearMarkers();

      if (initialPharmacies && initialPharmacies.length > 0) {
        // 초기 약국 데이터가 있는 경우
        const markers = createPharmacyMarkers(
          map,
          initialPharmacies,
          handleMarkerClick
        );
        const filteredMarkers = markers.filter(Boolean) as MarkerType[];
        markersRef.current = filteredMarkers;
        adjustMapBounds(map, filteredMarkers);
        return filteredMarkers;
      } else if (navigator.geolocation) {
        try {
          // 위치 기반으로 약국 검색
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });

          const { latitude, longitude } = position.coords;
          const center = new window.kakao.maps.LatLng(latitude, longitude);
          map.setCenter(center);

          // 약국 정보 요청
          const nearbyPharmacies = await findNearbyPharmacies(latitude, longitude);

          if (nearbyPharmacies.length > 0) {
            const markers = createPharmacyMarkers(
              map,
              nearbyPharmacies,
              handleMarkerClick
            );
            const filteredMarkers = markers.filter(Boolean) as MarkerType[];
            markersRef.current = filteredMarkers;
            adjustMapBounds(map, filteredMarkers);
            return filteredMarkers;
          }
        } catch (error) {
          console.error('위치 정보를 가져오는데 실패했습니다:', error);
          // 위치 정보를 가져오지 못한 경우 기본 위치로 설정
          const defaultCenter = new window.kakao.maps.LatLng(37.5665, 126.978);
          map.setCenter(defaultCenter);
        }
      }
      return [];
    },
    [createPharmacyMarkers, adjustMapBounds, handleMarkerClick, findNearbyPharmacies, clearMarkers]
  );

  // 컴포넌트 언마운트 시 마커 정리
  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, [clearMarkers]);

  return { 
    handleMapLoad,
    clearMarkers,
    markers: markersRef.current 
  };
};
