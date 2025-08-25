//예약 내역 불러오는 훅
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useCallback } from "react";

const useGetBook = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const userId = user?.user_id;

  const getBook = useCallback(async () => {
    if (!userId) return [];
    
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservation/${userId}/books`
      );
      if (!res.ok) throw new Error('Failed to fetch reservations');
      
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Error fetching reservations:', error);
      return [];
    }
  }, [userId]);

  return { getBook };
};

export default useGetBook;
