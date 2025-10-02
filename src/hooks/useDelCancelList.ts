import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { fetchCancelList } from "@/store/bookingSlice";

interface DeleteResponse {
  success: boolean;
  message?: string;
  data?: {
    success: boolean;
    message?: string;
    [key: string]: unknown;
  };
}

interface DeleteParams {
  bookId: number;
  pharmacyId: number;
}

const useDelCancelList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const userId = useSelector((state: RootState) => state.user.user?.user_id);

  const deleteCanceledReservation = useMutation<
    DeleteResponse,
    Error,
    DeleteParams
  >({
    mutationFn: async ({ bookId, pharmacyId }) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservation/cancel/${bookId}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            book_id: bookId,
            p_id: pharmacyId,
            status: "pending",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "예약 상태 변경에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch the cancel list to update the UI
      // Use the same query key that was used to fetch the cancel list
      queryClient.invalidateQueries({
        queryKey: ["canceledReservations"],
      });
      // Also refresh the cancel list in Redux store
      if (userId) {
        dispatch(fetchCancelList({ userId }));
      }
    },
  });

  return {
    deleteCanceledReservation: deleteCanceledReservation.mutate,
    isLoading: deleteCanceledReservation.isPending,
    error: deleteCanceledReservation.error,
  };
};

export default useDelCancelList;
