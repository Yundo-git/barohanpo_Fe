"use client";
import { useEffect, useRef, useState } from "react";
import BottomSheet from "./BottomSheet";

declare global {
  interface Window {
    kakao: any;
  }
}

interface Pharmacy {
  id?: string;
  name?: string;
  address?: string;
  phone?: string;
  lat?: number | string;
  lng?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  [key: string]: any;
}

export default function KakaoMap() {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  // 버튼 클릭 시 내 주변 약국 검색
  const findNearby = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation을 지원하지 않습니다.");
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        }
      );
      // 기존 마커들 제거 (사용자 위치 마커 + 약국 마커)
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }

      if (markersRef.current && markersRef.current.length > 0) {
        markersRef.current.forEach((marker) => {
          if (marker) {
            marker.setMap(null);
          }
        });
        markersRef.current = [];
      }

      const { latitude, longitude } = position.coords;
      if (!window.kakao?.maps || !mapRef.current) return;

      const center = new window.kakao.maps.LatLng(latitude, longitude);
      mapRef.current.setCenter(center);

      // 약국 데이터 가져오기
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacy/nearby?lat=${latitude}&lng=${longitude}&radius=8000`
      );
      const data = await response.json();
      const pharmacyList = Array.isArray(data) ? data : data?.data || [];
      setPharmacies(pharmacyList);

      // 새로운 약국 마커 추가
      pharmacyList.forEach((pharmacy: Pharmacy) => {
        const lat = parseFloat(String(pharmacy.lat ?? pharmacy.latitude));
        const lng = parseFloat(String(pharmacy.lng ?? pharmacy.longitude));
        if (isNaN(lat) || isNaN(lng)) return;

        const position = new window.kakao.maps.LatLng(lat, lng);
        const marker = new window.kakao.maps.Marker({ position });
        marker.setMap(mapRef.current);
        markersRef.current.push(marker);
      });

      // 지도 범위 조정
      if (pharmacyList.length > 0) {
        const bounds = new window.kakao.maps.LatLngBounds();
        markersRef.current.forEach((marker) =>
          bounds.extend(marker.getPosition())
        );
        bounds.extend(center);
        mapRef.current.setBounds(bounds);
      }

      // 바텀 시트 열기
      setIsBottomSheetOpen(true);
    } catch (error) {
      console.error("Error finding nearby pharmacies:", error);
      alert("약국을 찾는 중 오류가 발생했습니다.");
    }
  };

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
          mapRef.current = new window.kakao.maps.Map(container, {
            center,
            level: 3,
          });
          // 현재 위치 마커 생성 및 저장
          userMarkerRef.current = new window.kakao.maps.Marker({
            position: center,
            map: mapRef.current,
            clickable: true,
          });
        };

        // 브라우저 Geolocation 사용
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              createMap(latitude, longitude);
            },
            () => {
              // 기본 위치 (서울 시청)로 설정
              createMap(37.5665, 126.978);
            }
          );
        } else {
          // Geolocation을 사용할 수 없는 경우
          createMap(37.5665, 126.978);
        }
      });
    };

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <>
      <div id="map" className="w-screen h-screen z-0" />

      <button
        className="fixed bottom-24 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow z-10"
        onClick={findNearby}
      >
        주변 약국
      </button>

      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
      >
        <div className="space-y-4">
          <h2 className="text-xl font-bold">주변 약국 ({pharmacies.length})</h2>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {pharmacies.length > 0 ? (
              pharmacies.map((pharmacy, index) => (
                <div
                  key={pharmacy.id || index}
                  className="p-3 border-b border-gray-200 hover:bg-gray-50"
                >
                  <h3 className="font-medium">
                    {pharmacy.name || "이름 없음"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {pharmacy.address || "주소 정보 없음"}
                  </p>
                  {pharmacy.phone && (
                    <p className="text-sm text-blue-600">{pharmacy.phone}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                주변에 약국이 없습니다.
              </p>
            )}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
