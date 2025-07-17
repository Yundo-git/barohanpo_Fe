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
          // 위치 기반으로 약국 검색 (타임아웃 10초, 캐시 5분)
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              (error) => {
                console.error('Geolocation error:', error);
                reject(error);
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5 * 60 * 1000 // 5분 캐시
              }
            );
          });

          const { latitude, longitude } = position.coords;
          console.log('User location:', { latitude, longitude });
          
          // 지도 중심 설정
          const center = new window.kakao.maps.LatLng(latitude, longitude);
          map.setCenter(center);
          
          // 약간의 줌 레벨 조정 (전체적인 시야 확보)
          map.setLevel(3);

          // 약국 정보 요청
          try {
            const nearbyPharmacies = await findNearbyPharmacies(latitude, longitude);
            console.log('Found pharmacies:', nearbyPharmacies.length);

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
          } catch (pharmacyError) {
            console.error('Error fetching pharmacies:', pharmacyError);
            // 약국 정보를 가져오지 못해도 지도는 계속 표시
          }
        } catch (error) {
          console.error('Failed to get location:', error);
          // 위치 정보를 가져오지 못한 경우 기본 위치로 설정 (서울 시청)
          const defaultCenter = new window.kakao.maps.LatLng(37.5665, 126.978);
          map.setCenter(defaultCenter);
          map.setLevel(6); // 기본 줌 레벨 설정
          
          // 사용자에게 위치 정보를 허용해달라는 메시지 표시
          console.warn('위치 정보 접근이 거부되었거나 지원되지 않는 브라우저입니다.');
          // 여기서는 콘솔에만 경고를 표시하지만, 필요시 UI에 표시할 수 있습니다.
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
