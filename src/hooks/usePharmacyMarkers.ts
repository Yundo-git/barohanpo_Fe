import { useCallback } from 'react';
import { PharmacyWithUser } from '@/types/pharmacy';

type Marker = any; // Kakao Maps Marker 타입

export const usePharmacyMarkers = () => {
  // 약국 마커 생성
  const createPharmacyMarkers = useCallback(
    (
      map: any,
      pharmacies: PharmacyWithUser[],
      onClick: (pharmacy: PharmacyWithUser) => void
    ): Marker[] => {
      if (!window.kakao?.maps || !map) {
        console.error('Kakao Maps not available or map not initialized');
        return [];
      }

      console.log("Creating markers for pharmacies:", pharmacies);

      // 이전 마커 제거
      const markers: Marker[] = [];
      
      pharmacies
        .filter((pharmacy) => {
          const hasCoords = !!(pharmacy.latitude && pharmacy.longitude) || !!(pharmacy.lat && pharmacy.lng);
          if (!hasCoords) {
            console.warn(`Skipping pharmacy - missing coordinates:`, pharmacy);
          }
          return hasCoords;
        })
        .forEach((pharmacy) => {
          try {
            const lat = Number(pharmacy.latitude || pharmacy.lat || 0);
            const lng = Number(pharmacy.longitude || pharmacy.lng || 0);
            
            if (isNaN(lat) || isNaN(lng)) {
              console.error(`Invalid coordinates for ${pharmacy.name || 'unnamed'}:`, { lat, lng });
              return;
            }

            const position = new window.kakao.maps.LatLng(lat, lng);
            console.log(`Creating marker for ${pharmacy.name || 'unnamed'} at`, position);

            const marker = new window.kakao.maps.Marker({
              position,
              title: pharmacy.name || '이름 없음',
              clickable: true
            });

            marker.setMap(map);

            window.kakao.maps.event.addListener(marker, 'click', () => {
              console.log('Marker clicked:', pharmacy.name);
              onClick(pharmacy);
            });

            markers.push(marker);
          } catch (error) {
            console.error('Error creating marker:', error);
          }
        });

      console.log(`Created ${markers.length} markers`);
      return markers;
    },
    []
  );

  // 지도 경계 조정
  const adjustMapBounds = useCallback(
    (map: any, markers: Marker[]) => {
      if (!window.kakao?.maps || !map) {
        console.error('Kakao Maps not available or map not initialized');
        return;
      }

      if (!markers || markers.length === 0) {
        console.warn('No valid markers to adjust bounds');
        return;
      }

      console.log(`Adjusting map bounds for ${markers.length} markers`);
      const bounds = new window.kakao.maps.LatLngBounds();

      markers.forEach((marker, index) => {
        if (marker && marker.getPosition) {
          try {
            const position = marker.getPosition();
            if (position) {
              bounds.extend(position);
              console.log(`Extended bounds with marker ${index + 1}:`, position);
            }
          } catch (error) {
            console.error(`Error getting position for marker ${index + 1}:`, error);
          }
        }
      });

      if (!bounds.isEmpty()) {
        try {
          map.setBounds(bounds);
          console.log('Map bounds adjusted');
        } catch (error) {
          console.error('Error setting map bounds:', error);
        }
      } else {
        console.warn('No valid positions to set bounds');
      }
    },
    []
  );

  return {
    createPharmacyMarkers,
    adjustMapBounds,
  };
};
