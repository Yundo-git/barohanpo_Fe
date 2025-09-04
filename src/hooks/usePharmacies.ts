import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { setPharmacies, fetchNearbyPharmacies } from "@/store/pharmacySlice";
import { PharmacyWithUser } from "@/types/pharmacy";
import { usePharmacyMarkers } from "./usePharmacyMarkers";

interface UsePharmaciesReturn {
  pharmacies: PharmacyWithUser[];
  isLoading: boolean;
  error: string | null;
  initializePharmacies: (initialPharmacies: PharmacyWithUser[]) => void;
  findNearbyPharmacies: (
    lat: number,
    lon: number
  ) => Promise<PharmacyWithUser[]>;
  createPharmacyMarkers: (
    map: kakao.maps.Map,
    pharmacies: PharmacyWithUser[],
    onClick: (pharmacy: PharmacyWithUser) => void
  ) => kakao.maps.Marker[];
  adjustMapBounds: (map: kakao.maps.Map, markers: kakao.maps.Marker[]) => void;
}

export const usePharmacies = (): UsePharmaciesReturn => {
  const dispatch: AppDispatch = useDispatch();
  const { pharmacies, isLoading, error, lastFetched } = useSelector(
    (state: RootState) => state.pharmacy
  );

  const findNearbyPharmacies = useCallback(
    async (lat: number, lng: number): Promise<PharmacyWithUser[]> => {
      // 저장된 데이터가 이미 있으면 즉시 캐시 사용 (재요청 방지)
      if (pharmacies.length > 0) {
        console.log("Using cached pharmacy data (skip fetch)");
        return pharmacies;
      }

      // 신선도 체크 (선택적으로만 사용)
      const isDataFresh =
        lastFetched && Date.now() - lastFetched < 5 * 60 * 1000;
      if (isDataFresh) {
        return pharmacies;
      }

      try {
        console.log("Fetching fresh pharmacy data...");
        const result = await dispatch(fetchNearbyPharmacies({ lat, lng }));

        // Type guard to check if the result is a fulfilled action
        if (fetchNearbyPharmacies.fulfilled.match(result)) {
          const fetchedPharmacies = Array.isArray(result.payload)
            ? result.payload
            : [];
          console.log(`Fetched ${fetchedPharmacies.length} pharmacies`);
          return fetchedPharmacies;
        } else if (fetchNearbyPharmacies.rejected.match(result)) {
          console.error("Error fetching pharmacies:", result.error);
          // If we have stale data, return it instead of throwing
          if (pharmacies.length > 0) {
            console.log("Using stale pharmacy data due to fetch error");
            return pharmacies;
          }
          throw new Error(result.error.message || "Failed to fetch pharmacies");
        }

        return [];
      } catch (error) {
        console.error("Error in findNearbyPharmacies:", error);
        // If we have any data, return it even if there was an error
        if (pharmacies.length > 0) {
          console.log("Using existing pharmacy data after error");
          return pharmacies;
        }
        throw error;
      }
    },
    [dispatch, pharmacies, lastFetched]
  );

  const initializePharmacies = useCallback(
    (initialPharmacies: PharmacyWithUser[]) => {
      dispatch(setPharmacies({ pharmacies: initialPharmacies }));
    },
    [dispatch]
  );

  const { createPharmacyMarkers, adjustMapBounds } = usePharmacyMarkers();

  return {
    pharmacies,
    isLoading,
    error,
    initializePharmacies,
    findNearbyPharmacies,
    createPharmacyMarkers,
    adjustMapBounds,
  };
};
