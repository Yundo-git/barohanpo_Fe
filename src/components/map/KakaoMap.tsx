// src/components/KakaoMap.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import BottomSheet from "../BottomSheet";
import { useKakaoMap } from "@/hooks/useKakaoMap";
import { usePharmacies } from "@/hooks/usePharmacies";
import { useMapHandlers } from "@/hooks/useMapHandlers";
import { usePharmacyMarkers } from "@/hooks/usePharmacyMarkers";
import { Pharmacy } from "@/types/pharmacy";
import ReservationSheetContent from "../reservation/ReservationSheetContent";
import MapPharmacyList from "./MapPharmacyList";

interface KakaoMapProps {
  initialPharmacies?: Pharmacy[];
}

type SheetView = "list" | "detail" | "reserve" | "complete";

export default function KakaoMap({ initialPharmacies }: KakaoMapProps) {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState<boolean>(true);
  const [sheetView, setSheetView] = useState<SheetView>("list");
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(
    null
  );
  const [initialDate, setInitialDate] = useState<string>("");

  // 마커들 관리용 레퍼런스
  const markersRef = useRef<kakao.maps.Marker[]>([]);
  const bottomSheetRef = useRef<{ reset: () => void } | null>(null);

  const {
    pharmacies,
    error,
    findNearbyPharmacies,
    // createPharmacyMarkers, // 이제 훅(usePharmacyMarkers)을 사용
    adjustMapBounds,
  } = usePharmacies();

  const { createPharmacyMarkers, adjustMapBounds: adjustBoundsFromHook } =
    usePharmacyMarkers();

  const handleMarkerClick = useCallback((pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setSheetView("detail");
    setIsBottomSheetOpen(true);
  }, []);

  const { handleMapLoad } = useMapHandlers({
    // 기존 createPharmacyMarkers는 넘기지 않음 — 마커 관리는 이 컴포넌트에서 훅으로 처리
    createPharmacyMarkers,
    adjustMapBounds,
    handleMarkerClick,
    findNearbyPharmacies,
  });

  const { getMap } = useKakaoMap(handleMapLoad, { initialPharmacies });

  // public/mapmarker.svg 를 kakao MarkerImage로 생성
  const createMarkerImage = useCallback((): kakao.maps.MarkerImage | undefined => {
    if (!window.kakao?.maps) return undefined;
    const kakao = window.kakao as typeof window.kakao;
    const imageSrc = "/mapmarker.svg";
    const imageSize = new kakao.maps.Size(36, 48);
    const imageOption = { offset: new kakao.maps.Point(18, 48) };
    return new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
  }, []);

  // map or pharmacies 변경 시, 훅의 createPharmacyMarkers로 마커 생성 (한 번만)
  useEffect(() => {
    const map = getMap();
    if (!map) return;
    if (!Array.isArray(pharmacies)) return;
    if (!window.kakao?.maps) return;

    // 기존 마커 정리
    markersRef.current.forEach((m) => {
      try {
        window.kakao.maps.event.clearInstanceListeners(m);
      } catch {
        /* ignore */
      }
      m.setMap(null);
    });
    markersRef.current = [];

    // 커스텀 MarkerImage 전달
    const markerImage = createMarkerImage();

    // createPharmacyMarkers는 반환된 마커 배열을 리턴함
    const newMarkers = createPharmacyMarkers(
      map,
      pharmacies as any, // PharmacyWithUser 타입을 기대하지만 runtime에서는 호환되면 ok
      (ph) => handleMarkerClick(ph as unknown as Pharmacy),
      markerImage
    );

    markersRef.current = newMarkers;

    // (선택) bounds 조정 — 필요하면 적용
    try {
      adjustBoundsFromHook(map, newMarkers);
    } catch {
      // ignore
    }

    return () => {
      markersRef.current.forEach((m) => {
        try {
          window.kakao.maps.event.clearInstanceListeners(m);
        } catch {
          /* ignore */
        }
        m.setMap(null);
      });
      markersRef.current = [];
    };
  }, [
    pharmacies,
    getMap,
    createPharmacyMarkers,
    createMarkerImage,
    handleMarkerClick,
    adjustBoundsFromHook,
  ]);

  // 컴포넌트 언마운트 시 정리(보조)
  useEffect(() => {
    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, []);

  const handleLocationClick = useCallback(async () => {
    if (!navigator.geolocation) {
      alert("이 브라우저에서는 위치 서비스를 지원하지 않습니다.");
      return;
    }
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        }
      );
      const { latitude, longitude } = position.coords;
      const moveLatLon = new window.kakao.maps.LatLng(latitude, longitude);
      const mapInstance = getMap();
      if (mapInstance) {
        mapInstance.setCenter(moveLatLon);
        mapInstance.setLevel(3);
      }
    } catch (err) {
      console.error("현재 위치로 이동할 수 없습니다:", err);
      alert("현재 위치를 가져올 수 없습니다. 위치 서비스를 확인해주세요.");
    }
  }, [getMap]);

  const handleRetry = useCallback(() => {
    if (!(window as any).kakao || !(window as any).kakao.maps) return;
    const map = getMap();
    if (!map) return;
    try {
      const center = map.getCenter();
      if (center) {
        findNearbyPharmacies(center.getLat(), center.getLng());
      } else {
        findNearbyPharmacies(37.5665, 126.978);
      }
    } catch (err) {
      console.error("Error getting map center:", err);
      findNearbyPharmacies(37.5665, 126.978);
    }
  }, [findNearbyPharmacies, getMap]);

  const openReserveView = useCallback((pharmacy: Pharmacy, date: string) => {
    setSelectedPharmacy(pharmacy);
    setInitialDate(date);
    setSheetView("reserve" as SheetView);
    setIsBottomSheetOpen(true);
  }, []);

  const closeBottomSheet = () => {
    setIsBottomSheetOpen(false);
  };

  return (
    <div className="relative w-full h-full">
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 z-50 rounded-md shadow-lg flex items-center gap-4">
          <span>{error}</span>
          <button
            onClick={handleRetry}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 위치 버튼 */}
      <button
        onClick={handleLocationClick}
        className="fixed bottom-24 right-4 bg-white rounded-full p-3 shadow-lg z-10"
        aria-label="현재 위치로 이동"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-main"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      <BottomSheet
        ref={bottomSheetRef}
        isOpen={isBottomSheetOpen}
        onClose={closeBottomSheet}
        onDragUp={() => setSheetView("list" as SheetView)}
      >
        {sheetView === "reserve" && selectedPharmacy ? (
          <ReservationSheetContent
            pharmacyId={Number(selectedPharmacy.p_id)}
            pharmacyName={selectedPharmacy.name}
            initialDate={initialDate || format(new Date(), "yyyy-MM-dd")}
            onClose={() => setSheetView("detail" as SheetView)}
          />
        ) : (
          <MapPharmacyList
            pharmacies={sheetView === "list" ? pharmacies : []}
            selectedPharmacy={selectedPharmacy}
            sheetView={sheetView}
            onPharmacySelect={(pharmacy) => {
              setSelectedPharmacy(pharmacy);
              setSheetView("detail");
              setIsBottomSheetOpen(true);
            }}
            onReserve={openReserveView}
          />
        )}
      </BottomSheet>
    </div>
  );
}
