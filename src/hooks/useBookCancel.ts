// 예약 취소 훅
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useCallback } from "react";

interface CancelResponse {
  success: boolean;
  message?: string;
  data?: any;
}

const useBookCancel = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const userId = user?.user_id;

  const bookCancel = useCallback(async (book_id: number): Promise<CancelResponse> => {
    if (!userId || !book_id) {
      console.error('User ID or Book ID is missing');
      return { success: false, message: 'User ID or Book ID is missing' };
    }
    
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservation/${userId}/books/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            book_id: book_id
          })
        }
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to cancel reservation');
      }
      
      const data = await res.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error canceling reservation:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to cancel reservation' 
      };
    }
  }, [userId]);

  return { bookCancel };
};


export default useBookCancel;