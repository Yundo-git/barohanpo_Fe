import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { fetchUserReviews } from "@/store/userReviewsSlice";
import { fetchCompletedReviewIds } from "@/store/reviewCompletionSlice";
import { fetchFiveStarReviews } from "@/store/reviewSlice";

export interface UpdateReviewParams {
  reviewId: number;
  userId: number;
  score: number;
  comment: string;
  // 기존 이미지와 새로운 이미지를 구분하여 전달
  newFiles: File[]; // 새로 업로드할 파일 목록
  existingPhotoIds: string[]; // 유지할 기존 사진 ID 목록
  pharmacyId?: number;
}
interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

const useUpdateReview = (): {
  updateReview: (
    params: UpdateReviewParams
  ) => Promise<ApiResponse<unknown>>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  const updateReviewMutation = useMutation<
    ApiResponse<unknown>,
    Error,
    UpdateReviewParams
  >({
    mutationFn: async ({ reviewId, score, comment, newFiles, existingPhotoIds }) => {
      const formData = new FormData();
      formData.append("score", score.toString());
      formData.append("comment", comment);

      // Add new files directly
      newFiles.forEach((file) => {
        formData.append("photos", file);
      });

      // Add info about existing images to keep
      formData.append("existing_photo_ids", JSON.stringify(existingPhotoIds));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reviews/${reviewId}/update`,
        {
          method: "PUT",
          credentials: "include",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "리뷰 수정에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews"],
        refetchType: "active",
      });

      if (variables.userId) {
        const uid = Number(variables.userId);
        queryClient.invalidateQueries({
          queryKey: ["userReviews", uid],
          refetchType: "active",
        });
        
        void dispatch(fetchUserReviews({ userId: uid }));
        void dispatch(fetchCompletedReviewIds({ userId: uid }));
      }

      void dispatch(fetchFiveStarReviews());

      if (variables.pharmacyId) {
        queryClient.invalidateQueries({
          queryKey: ["pharmacy", variables.pharmacyId, "reviews"],
          refetchType: "active",
        });
      }
    },
  });

  return {
    updateReview: updateReviewMutation.mutateAsync,
    isLoading: updateReviewMutation.isPending,
    isError: updateReviewMutation.isError,
    error: updateReviewMutation.error,
  };
};

export default useUpdateReview;