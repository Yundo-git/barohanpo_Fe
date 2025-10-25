"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import BottomSheet from "../ui/BottomSheet";
import LocationButton from "../ui/LocationButton";
import { useKakaoMap } from "@/hooks/useKakaoMap";
import { usePharmacies } from "@/hooks/usePharmacies";
import { useMapHandlers } from "@/hooks/useMapHandlers";
import { useGeolocation } from "@/hooks/useGeolocation";
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
  const { getCurrentLocation } = useGeolocation();

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

    try {
      const { latitude, longitude } = await getCurrentLocation();
      
      // 지도 이동 공통 로직
      const moveLatLon = new window.kakao.maps.LatLng(latitude, longitude);
      mapInstance.setCenter(moveLatLon);
      mapInstance.setLevel(3);
    } catch (err) {
      console.error("현재 위치로 이동할 수 없습니다:", err);
      alert(`현재 위치를 가져올 수 없습니다. ${err instanceof Error ? err.message : '위치 서비스 및 권한을 확인해주세요.'}`);
    }
  }, [getMap, getCurrentLocation]);

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
            className="bg-main hover:bg-main/80 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      <LocationButton onClick={handleLocationClick} />

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