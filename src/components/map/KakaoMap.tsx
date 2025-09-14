"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import BottomSheet from "../BottomSheet";
import { useKakaoMap } from "@/hooks/useKakaoMap";
import { usePharmacies } from "@/hooks/usePharmacies";
import { useMapHandlers } from "@/hooks/useMapHandlers";
import { Pharmacy, PharmacyWithUser } from "@/types/pharmacy";
import ReservationSheetContent from "../reservation/ReservationSheetContent";
import MapPharmacyList from "./MapPharmacyList";

interface KakaoMapProps {
  initialPharmacies?: PharmacyWithUser[];
}

type SheetView = "list" | "detail" | "reserve" | "complete";

export default function KakaoMap({ initialPharmacies }: KakaoMapProps) {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState<boolean>(true);
  const [sheetView, setSheetView] = useState<SheetView>("list");
  const [selectedPharmacy, setSelectedPharmacy] =
    useState<PharmacyWithUser | null>(null);
  const [initialDate, setInitialDate] = useState<string>("");

  const bottomSheetRef = useRef<{ reset: () => void } | null>(null);

  const { pharmacies, error, findNearbyPharmacies, setPharmacies } =
    usePharmacies();

  const handleMarkerClick = useCallback((pharmacy: PharmacyWithUser) => {
    setSelectedPharmacy(pharmacy);
    setSheetView("detail");
    setIsBottomSheetOpen(true);
  }, []);

  const { handleMapLoad, clearMarkers, locationError } = useMapHandlers({
    handleMarkerClick,
    findNearbyPharmacies,
    setPharmacies,
  });

  const { getMap } = useKakaoMap(handleMapLoad, { initialPharmacies });

  // 컴포넌트 언마운트 시 마커 정리
  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, [clearMarkers]);

  const handleLocationClick = useCallback(async () => {
    const mapInstance = getMap();
    if (!mapInstance) {
      alert("지도가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

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
      mapInstance.setCenter(moveLatLon);
      mapInstance.setLevel(3);
    } catch (err) {
      console.error("현재 위치로 이동할 수 없습니다:", err);
      alert("현재 위치를 가져올 수 없습니다. 위치 서비스를 확인해주세요.");
    }
  }, [getMap]);

  const handleRetry = useCallback(async () => {
    const map = getMap();
    if (!map) return;
    try {
      const center = map.getCenter();
      await findNearbyPharmacies(center.getLat(), center.getLng());
    } catch (err) {
      console.error("Error getting map center:", err);
      await findNearbyPharmacies(37.5665, 126.978);
    }
  }, [findNearbyPharmacies, getMap]);

  const openReserveView = useCallback(
    (pharmacy: Pharmacy, date: string) => {
      setSelectedPharmacy(pharmacy);
      setInitialDate(date);
      setSheetView("reserve");
      setIsBottomSheetOpen(true);
    },
    [setSelectedPharmacy, setInitialDate, setSheetView, setIsBottomSheetOpen]
  );

  const closeBottomSheet = () => {
    setIsBottomSheetOpen(false);
  };

  return (
    <div className="relative w-full h-full" id="map">
      {(error || locationError) && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 z-50 rounded-md shadow-lg flex items-center gap-4">
          <span>{error || locationError}</span>
          <button
            onClick={handleRetry}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

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
        onDragUp={() => setSheetView("list")}
      >
        {sheetView === "reserve" && selectedPharmacy ? (
          <ReservationSheetContent
            pharmacyId={Number(selectedPharmacy.p_id)}
            pharmacyName={selectedPharmacy.name}
            initialDate={initialDate || format(new Date(), "yyyy-MM-dd")}
            onClose={() => setSheetView("detail")}
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