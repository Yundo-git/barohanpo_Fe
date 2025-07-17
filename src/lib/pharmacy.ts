// src/lib/pharmacy.ts

import { Pharmacy, PharmacyUser, PharmacyWithUser } from "@/types/pharmacy";

const getPharmacyUser = async (
  pharmacyId: string
): Promise<PharmacyUser | null> => {
  if (!pharmacyId) return null;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pha_user/${pharmacyId}`,
      { cache: "no-store" } // 항상 최신 데이터를 가져오도록 설정
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data?.data ?? null;
  } catch (err) {
    console.error(`Error fetching user data for pharmacy ${pharmacyId}:`, err);
    return null;
  }
};

export const findNearbyPharmaciesOnServer = async (
  lat: number,
  lng: number,
  radius = 2000
): Promise<PharmacyWithUser[]> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacy/nearby?lat=${lat}&lon=${lng}&radius=${radius}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      console.error("Failed to fetch nearby pharmacies");
      return [];
    }

    const responseData = await response.json();
    const data: Pharmacy[] = responseData.data;

    const pharmaciesWithUsers = await Promise.all(
      data.map(async (pharmacy) => {
        const user = await getPharmacyUser(pharmacy.p_id);
        return { ...pharmacy, user };
      })
    );

    return pharmaciesWithUsers;
  } catch (err) {
    if (err instanceof Error) {
      console.error(" 에러:", err.message);
    } else {
      console.error("예상치 못한 에러:", err);
    }
    return [];
  }
};
