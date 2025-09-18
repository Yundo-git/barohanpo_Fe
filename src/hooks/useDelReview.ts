import { useMutation } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { fetchUserReviews } from "@/store/userReviewsSlice";
import { fetchCompletedReviewIds } from "@/store/reviewCompletionSlice";
import { fetchFiveStarReviews } from "@/store/reviewSlice";

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: {
    success: boolean;
    message?: string;
    review_id?: number;
    [key: string]: unknown;
  };
}

export default function useDelReview() {
  const dispatch = useDispatch<AppDispatch>();
  const userId = useSelector((s: RootState) => s.user.user?.user_id);
  const deleteReviewMutation = useMutation<ApiResponse, Error, number>({
    mutationFn: async (reviewId: number) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reviews/${reviewId}/del`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "리뷰 삭제에 실패했습니다.");
      }

      return response.json();
    },
    onError: (error: Error) => {
      console.error("리뷰 삭제 중 오류 발생:", error);
      alert(error.message || "리뷰 삭제 중 오류가 발생했습니다.");
    },
    onSuccess: () => {
      if (userId) {
        void dispatch(fetchUserReviews({ userId: Number(userId) }));
        void dispatch(fetchCompletedReviewIds({ userId: Number(userId) }));
        void dispatch(fetchFiveStarReviews());
      }
    },
  });

  return {
    delReview: deleteReviewMutation.mutateAsync,
    isLoading: deleteReviewMutation.isPending,
    isError: deleteReviewMutation.isError,
    error: deleteReviewMutation.error,
  };
}
