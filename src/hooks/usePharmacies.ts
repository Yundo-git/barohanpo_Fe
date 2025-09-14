import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { setPharmacies, fetchNearbyPharmacies } from "@/store/pharmacySlice";
import { PharmacyWithUser } from "@/types/pharmacy";

interface UsePharmaciesReturn {
  pharmacies: PharmacyWithUser[];
  isLoading: boolean;
  error: string | null;
  findNearbyPharmacies: (
    lat: number,
    lon: number
  ) => Promise<PharmacyWithUser[]>;
  setPharmacies: (payload: { pharmacies: PharmacyWithUser[] }) => void;
}

export const usePharmacies = (): UsePharmaciesReturn => {
  const dispatch: AppDispatch = useDispatch();
  const { pharmacies, isLoading, error, lastFetched } = useSelector(
    (state: RootState) => state.pharmacy
  );

  const findNearbyPharmacies = useCallback(
    async (lat: number, lng: number): Promise<PharmacyWithUser[]> => {
      const isDataFresh = lastFetched && Date.now() - lastFetched < 5 * 60 * 1000;
      if (isDataFresh) {
        console.log("Using cached pharmacy data");
        return pharmacies;
      }

      try {
        console.log("Fetching fresh pharmacy data...");
        const result = await dispatch(fetchNearbyPharmacies({ lat, lng }));

        if (fetchNearbyPharmacies.fulfilled.match(result)) {
          const fetchedPharmacies = Array.isArray(result.payload)
            ? result.payload
            : [];
          console.log(`Fetched ${fetchedPharmacies.length} pharmacies`);
          return fetchedPharmacies;
        } else if (fetchNearbyPharmacies.rejected.match(result)) {
          console.error("Error fetching pharmacies:", result.error);
          if (pharmacies.length > 0) {
            console.log("Using stale pharmacy data due to fetch error");
            return pharmacies;
          }
          throw new Error(result.error.message || "Failed to fetch pharmacies");
        }
      } catch (error) {
        console.error("Error in findNearbyPharmacies:", error);
        if (pharmacies.length > 0) {
          console.log("Using existing pharmacy data after error");
          return pharmacies;
        }
        throw error;
      }
      return [];
    },
    [dispatch, pharmacies, lastFetched]
  );

  const handleSetPharmacies = useCallback(
    (payload: { pharmacies: PharmacyWithUser[] }) => {
      dispatch(setPharmacies(payload));
    },
    [dispatch]
  );

  return {
    pharmacies,
    isLoading,
    error,
    findNearbyPharmacies,
    setPharmacies: handleSetPharmacies,
  };
};