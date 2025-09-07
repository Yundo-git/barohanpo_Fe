// 예약 취소 훅
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { fetchReservations, fetchCancelList } from "@/store/bookingSlice";
import { useCallback } from "react";

interface CancelResponse {
  success: boolean;
  message?: string;
  data?: {
    reservation_id?: number;
    status?: string;
    // Add other expected properties from the API response
    [key: string]: unknown;
  };
}

const useBookCancel = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.user);
  const userId = user?.user_id;

  const bookCancel = useCallback(
    async (book_id: number): Promise<CancelResponse> => {
      if (!userId || !book_id) {
        console.error("User ID or Book ID is missing");
        return { success: false, message: "User ID or Book ID is missing" };
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservation/${userId}/books/cancel`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: userId,
              book_id: book_id,
            }),
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to cancel reservation");
        }

        const data = await res.json();
        // 성공 시 예약/취소 리스트 최신화
        if (userId) {
          void dispatch(fetchReservations({ userId: Number(userId) }));
          void dispatch(fetchCancelList({ userId: Number(userId) }));
        }
        return { success: true, data };
      } catch (error) {
        console.error("Error canceling reservation:", error);
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to cancel reservation",
        };
      }
    },
    [userId, dispatch]
  );

  return { bookCancel };
};

export default useBookCancel;
