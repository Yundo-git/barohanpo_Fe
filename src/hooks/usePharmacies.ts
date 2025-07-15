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
    map: any,
    pharmacies: PharmacyWithUser[],
    onClick: (pharmacy: PharmacyWithUser) => void
  ) => any[];
  adjustMapBounds: (map: any, pharmacies: PharmacyWithUser[]) => void;
}

export const usePharmacies = (): UsePharmaciesReturn => {
  const [pharmacies, setPharmacies] = useState<PharmacyWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API 오류 처리를 위한 헬퍼 함수
  const handleError = (error: any, defaultMessage: string) => {
    console.error(error);
    setError(defaultMessage);
    return [];
  };

  // 주변 약국 찾기
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
        setPharmacies(result); // ✅ 여기 추가
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
  

  // 단일 약국의 사용자 데이터 가져오기
  const getPharmacyUser = useCallback(
    async (pharmacyId: string): Promise<PharmacyUser | null> => {
      if (!pharmacyId) return null;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pha_user/${pharmacyId}`
        );

        const data = await response.json();
        console.log("getPharmacyUser", data);
        return data;
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

  // 여러 약국들의 사용자 데이터와 함께 가져오기
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
        // 1. 약국 정보 가져오기 (기존 상태에 의존하지 않음)
        const searchLat = lat !== undefined ? lat : 37.5665; // 기본값: 서울 시청
        const searchLng = lng !== undefined ? lng : 126.978;

        console.log(
          `Searching for pharmacies near lat: ${searchLat}, lng: ${searchLng}`
        );
        const nearbyPharmacies = await findNearbyPharmacies(
          searchLat,
          searchLng
        );

        if (nearbyPharmacies.length === 0) {
          console.log("No matching pharmacies found");
          return [];
        }

        // 3. 각 약국에 대한 사용자 정보 병렬 조회
        console.log("Fetching user data for pharmacies...");
        const pharmaciesWithUsers = await Promise.all(
          nearbyPharmacies.map(async (pharmacy: Pharmacy) => {
            console.log(`Fetching user for pharmacy ${pharmacy.p_id}...`);
            const userData = await getPharmacyUser(pharmacy.p_id);
            console.log(`User data for ${pharmacy.p_id}:`, userData?.data);

            // 3. 약국 정보와 사용자 정보 결합
            const result: PharmacyWithUser = {
              ...pharmacy,
              p_id: pharmacy.p_id,
              name: pharmacy.name || "",
              address: pharmacy.address || "",
              latitude: pharmacy.latitude || pharmacy.lat || 0,
              longitude: pharmacy.longitude || pharmacy.lng || 0,
              user: userData?.data
                ? {
                    p_name: userData.data.p_name,
                    number: userData.data.number,
                  }
                : null,
            };
            console.log(`Merged data for ${pharmacy.p_id}:`, result);
            return result;
          })
        );

        // 4. 상태 업데이트
        setPharmacies(pharmaciesWithUsers);
        return pharmaciesWithUsers;
      } catch (err) {
        return handleError(err, "약사 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [pharmacies]
  );

  // 마커 관련 훅 사용
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
