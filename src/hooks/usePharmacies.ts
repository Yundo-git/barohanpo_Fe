import { useState } from 'react';
import { Pharmacy } from '@/types/pharmacy';

export const usePharmacies = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findNearbyPharmacies = async (lat: number, lng: number) => {
    if (!window.kakao?.maps) return [];
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacy/nearby?lat=${lat}&lng=${lng}&radius=8000`
      );
      const data = await response.json();
      const pharmacyList = Array.isArray(data) ? data : data?.data || [];
      setPharmacies(pharmacyList);
      return pharmacyList;
    } catch (err) {
      console.error('Error finding nearby pharmacies:', err);
      setError('약국을 찾는 중 오류가 발생했습니다.');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createPharmacyMarkers = (map: any, pharmacies: Pharmacy[], onMarkerClick?: (pharmacy: Pharmacy) => void) => {
    if (!window.kakao?.maps) return [];

    return pharmacies.map((pharmacy) => {
      const lat = parseFloat(String(pharmacy.lat ?? pharmacy.latitude));
      const lng = parseFloat(String(pharmacy.lng ?? pharmacy.longitude));
      if (isNaN(lat) || isNaN(lng)) return null;

      const position = new window.kakao.maps.LatLng(lat, lng);
      const marker = new window.kakao.maps.Marker({
        position,
        clickable: true,
      });

      if (onMarkerClick) {
        window.kakao.maps.event.addListener(marker, 'click', () => {
          onMarkerClick(pharmacy);
        });
      }

      marker.setMap(map);
      return marker;
    }).filter(Boolean);
  };

  const adjustMapBounds = (map: any, markers: any[], center: any) => {
    if (!window.kakao?.maps || markers.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();
    markers.forEach((marker) => bounds.extend(marker.getPosition()));
    bounds.extend(center);
    map.setBounds(bounds);
  };

  return {
    pharmacies,
    isLoading,
    error,
    findNearbyPharmacies,
    createPharmacyMarkers,
    adjustMapBounds,
  };
};
