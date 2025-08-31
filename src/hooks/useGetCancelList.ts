// 예약 취소 내역 조회 훅
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useCallback } from "react";

interface CancelItem {
  // Define the structure of your cancel item here
  [key: string]: unknown;
}

interface CancelListResponse {
  data?: CancelItem[];
  message?: string;
  [key: string]: unknown;
}

const useGetCancelList = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const userId = user?.user_id;

  const getCancelList = useCallback(async (): Promise<CancelItem[]> => {
    if (!userId) {
      console.log('No user ID found');
      return [];
    }
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservation/${userId}/books/cancel/list`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch cancel list');
      }
      
      const result: CancelListResponse = await response.json();
      
      // Handle different response formats
      if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.data)) {
        return result.data;
      } else if (result && typeof result === 'object') {
        return Object.values(result).filter(Array.isArray).flat() as CancelItem[];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching cancel list:', error);
      return [];
    }
  }, [userId]);

  return { getCancelList };
};

export default useGetCancelList;