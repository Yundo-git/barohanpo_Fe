import { useCallback } from "react";
import { PharmacyWithUser } from "@/types/pharmacy";

export const usePharmacyMarkers = () => {
  // 약국 마커 생성
  const createPharmacyMarkers = useCallback(
    (
      map: kakao.maps.Map,
      pharmacies: PharmacyWithUser[],
      onClick: (pharmacy: PharmacyWithUser) => void
    ): kakao.maps.Marker[] => {
      if (!window.kakao?.maps || !map) {
        console.error("Kakao Maps not available or map not initialized");
        return [];
      }

      const markers: kakao.maps.Marker[] = [];

      pharmacies
        .filter((pharmacy) => {
          const hasCoords =
            !!(pharmacy.latitude && pharmacy.longitude) ||
            !!(pharmacy.lat && pharmacy.lng);
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
              console.error(
                `Invalid coordinates for ${pharmacy.name || "unnamed"}:`,
                { lat, lng }
              );
              return;
            }

            const position = new window.kakao.maps.LatLng(lat, lng);

            const marker = new window.kakao.maps.Marker({
              position,
              title: pharmacy.name || "이름 없음",
              clickable: true,
            });

            marker.setMap(map);

            window.kakao.maps.event.addListener(marker, "click", () => {
              onClick(pharmacy);
            });

            markers.push(marker);
          } catch (error) {
            console.error("Error creating marker:", error);
          }
        });

      return markers;
    },
    []
  );

  // 지도 경계 조정
  const adjustMapBounds = useCallback(
    (map: kakao.maps.Map, markers: kakao.maps.Marker[]) => {
      if (!window.kakao?.maps || !map) return;
      if (!markers || markers.length === 0) return;

      const bounds = new window.kakao.maps.LatLngBounds();

      markers.forEach((marker) => {
        try {
          const position = marker.getPosition();
          if (position) bounds.extend(position);
        } catch (error) {
          console.error("Marker position error:", error);
        }
      });

      if (!bounds.isEmpty()) {
        try {
          map.setBounds(bounds);
        } catch (error) {
          console.error("Map bounds set error:", error);
        }
      }
    },
    []
  );

  return {
    createPharmacyMarkers,
    adjustMapBounds,
  };
};
