import { useEffect, useRef } from "react";
import { KakaoMapRefs } from "@/types/pharmacy";

declare global {
  interface Window {
    kakao: any;
  }
}

export const useKakaoMap = (onMapLoad?: (map: any) => void) => {
  const mapRefs = useRef<KakaoMapRefs>({
    map: null,
    markers: [],
    userMarker: null,
  });

  // Initialize the map
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAPS_KEY}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById("map");
        if (!container) return;

        const createMap = (lat: number, lng: number) => {
          const center = new window.kakao.maps.LatLng(lat, lng);
          const map = new window.kakao.maps.Map(container, {
            center,
            level: 3,
          });

          mapRefs.current.map = map;

          const dotImage = new window.kakao.maps.MarkerImage(
            "data:image/svg+xml;charset=utf-8," +
              encodeURIComponent(
                '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
                  '<circle cx="12" cy="12" r="12" fill="%23FF6B6B" fill-opacity="0.3"/>' +
                  '<circle cx="12" cy="12" r="6" fill="%23FF0000"/>' +
                  "</svg>"
              ),
            new window.kakao.maps.Size(24, 24),
            {
              offset: new window.kakao.maps.Point(12, 12),
            }
          );

          const marker = new window.kakao.maps.Marker({
            position: center,
            map: map,
            image: dotImage,
            zIndex: 3,
          });

          mapRefs.current.userMarker = marker;

          map.setCenter(center);

          if (onMapLoad) onMapLoad(map);
        };

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              createMap(latitude, longitude);
            },
            () => {
              createMap(37.5665, 126.978);
            }
          );
        } else {
          createMap(37.5665, 126.978);
          createMap(37.5665, 126.978);
        }
      });
    };

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Clear markers
      mapRefs.current.markers.forEach((marker) => marker.setMap(null));
      if (mapRefs.current.userMarker) {
        mapRefs.current.userMarker.setMap(null);
      }
    };
  }, [onMapLoad]);

  return mapRefs;
};
