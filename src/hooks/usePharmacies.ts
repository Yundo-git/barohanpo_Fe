import { useState, useCallback } from "react";
import { Pharmacy, PharmacyWithUser, PharmacyUser } from "@/types/pharmacy";
import { usePharmacyMarkers } from "./usePharmacyMarkers";

interface UsePharmaciesReturn {
  pharmacies: PharmacyWithUser[];
  isLoading: boolean;
  error: string | null;
  findNearbyPharmacies: (
    lat: number,
    lng: number,
    radius?: number
  ) => Promise<PharmacyWithUser[]>;
  getPharmacyUser: (pharmacyId: string) => Promise<PharmacyUser | null>;
  getPharmaciesWithUsers: (
    pharmacyIds: string[],
    lat?: number,
    lng?: number
  ) => Promise<PharmacyWithUser[]>;
  createPharmacyMarkers: (
    map: kakao.maps.Map,
    pharmacies: PharmacyWithUser[],
    onClick: (pharmacy: PharmacyWithUser) => void
  ) => kakao.maps.Marker[];
  adjustMapBounds: (map: kakao.maps.Map, markers: kakao.maps.Marker[]) => void;
}

export const usePharmacies = (): UsePharmaciesReturn => {
  const [pharmacies, setPharmacies] = useState<PharmacyWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (error: Error, defaultMessage: string) => {
    console.error(error);
    setError(defaultMessage);
    return [];
  };

  const findNearbyPharmacies = useCallback(
    async (lat: number, lng: number, radius = 8000) => {
      console.log(`Searching for pharmacies near lat: ${lat}, lng: ${lng}`);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacy/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
        );

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const result = Array.isArray(data) ? data : data?.data || [];

        console.log(`Found ${result.length} pharmacies`);
        setPharmacies(result);
        return result;
      } catch (err) {
        console.error("Error in findNearbyPharmacies:", err);
        setError("약국 정보를 불러오는 중 오류가 발생했습니다.");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getPharmacyUser = useCallback(
    async (pharmacyId: string): Promise<PharmacyUser | null> => {
      if (!pharmacyId) return null;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pha_user/${pharmacyId}`
        );

        const data = await response.json();
        console.log("getPharmacyUser", data);

        // API에서 user 정보가 data.data로 내려온다면
        return data?.data ?? null;
      } catch (err) {
        console.error(
          `Error fetching user data for pharmacy ${pharmacyId}:`,
          err
        );
        return null;
      }
    },
    []
  );

  const getPharmaciesWithUsers = useCallback(
    async (
      pharmacyIds: string[],
      lat?: number,
      lng?: number
    ): Promise<PharmacyWithUser[]> => {
      if (!pharmacyIds.length) {
        console.log("No pharmacy IDs provided");
        return [];
      }

      setIsLoading(true);
      try {
        const searchLat = lat ?? 37.5665;
        const searchLng = lng ?? 126.978;

        const nearbyPharmacies = await findNearbyPharmacies(
          searchLat,
          searchLng
        );

        if (nearbyPharmacies.length === 0) return [];

        const pharmaciesWithUsers = await Promise.all(
          nearbyPharmacies.map(async (pharmacy: Pharmacy) => {
            const userData = await getPharmacyUser(pharmacy.p_id);

            const result: PharmacyWithUser = {
              ...pharmacy,
              latitude: pharmacy.latitude || pharmacy.lat || 0,
              longitude: pharmacy.longitude || pharmacy.lng || 0,
              user: userData ?? null,
            };

            return result;
          })
        );

        setPharmacies(pharmaciesWithUsers);
        return pharmaciesWithUsers;
      } catch (err) {
        return handleError(
          err as Error,
          "약사 정보를 불러오는 중 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [pharmacies]
  );

  const { createPharmacyMarkers, adjustMapBounds } = usePharmacyMarkers();

  return {
    pharmacies,
    isLoading,
    error,
    findNearbyPharmacies,
    getPharmacyUser,
    getPharmaciesWithUsers,
    createPharmacyMarkers,
    adjustMapBounds,
  };
};
