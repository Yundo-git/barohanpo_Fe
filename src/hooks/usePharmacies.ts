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
  findNearbyPharmacies: (lat: number, lon: number) => Promise<PharmacyWithUser[]>;
  createPharmacyMarkers: (
    map: kakao.maps.Map,
    pharmacies: PharmacyWithUser[],
    onClick: (pharmacy: PharmacyWithUser) => void
  ) => kakao.maps.Marker[];
  adjustMapBounds: (map: kakao.maps.Map, markers: kakao.maps.Marker[]) => void;
}

export const usePharmacies = (): UsePharmaciesReturn => {
  const dispatch: AppDispatch = useDispatch();
  const { pharmacies, isLoading, error } = useSelector(
    (state: RootState) => state.pharmacy
  );

  const findNearbyPharmacies = useCallback(
    async (lat: number, lng: number): Promise<PharmacyWithUser[]> => {
      // 이미 데이터가 있는 경우에는 기존 데이터 반환
      if (pharmacies.length > 0) {
        return pharmacies;
      }

      try {
        // 데이터가 없는 경우에만 API 호출
        const result = await dispatch(fetchNearbyPharmacies({ lat, lng }));
        
        // Type guard to check if the result is a fulfilled action
        if (fetchNearbyPharmacies.fulfilled.match(result)) {
          return Array.isArray(result.payload) ? result.payload : [];
        } else if (fetchNearbyPharmacies.rejected.match(result)) {
          console.error('Error fetching pharmacies:', result.error);
          throw new Error(result.error.message || 'Failed to fetch pharmacies');
        }
        
        return [];
      } catch (error) {
        console.error('Error in findNearbyPharmacies:', error);
        throw error;
      }
    },
    [dispatch, pharmacies]
  );

  const initializePharmacies = useCallback(
    (initialPharmacies: PharmacyWithUser[]) => {
      dispatch(setPharmacies(initialPharmacies));
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
