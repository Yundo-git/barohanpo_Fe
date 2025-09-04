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
  images?: File[];
  pharmacyId?: number;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

const useUpdateReview = (): {
  updateReview: (params: UpdateReviewParams) => Promise<ApiResponse>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  const updateReviewMutation = useMutation<
    ApiResponse,
    Error,
    UpdateReviewParams
  >({
    mutationFn: async ({ reviewId, score, comment, images = [] }) => {
      const formData = new FormData();
      formData.append("score", score.toString());
      formData.append("comment", comment);

      // Separate new and existing images
      const newImages = images.filter(
        (img) => img instanceof File && !("isExisting" in img)
      );
      const existingImages = images.filter((img) => "isExisting" in img);

      // Add new images
      newImages.forEach((file) => {
        if (file instanceof File) {
          // Use the same field name that multer is configured to handle
          formData.append("photos", file);
        }
      });

      // Add info about existing images to keep
      const existingPhotoIds = existingImages
        .map((img) => (img as any).id?.replace("existing-", ""))
        .filter(Boolean);

      formData.append("existing_photo_ids", JSON.stringify(existingPhotoIds));
      formData.append(
        "has_photo_changes",
        (
          newImages.length > 0 || existingImages.length !== images.length
        ).toString()
      );

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
      // Invalidate all related review queries
      queryClient.invalidateQueries({
        queryKey: ["reviews"],
        refetchType: "active",
      });

      // Invalidate user's reviews
      if (variables.userId) {
        queryClient.invalidateQueries({
          queryKey: ["userReviews", variables.userId],
          refetchType: "active",
        });
        // Redux 동기화: 내 후기/완료된 예약 ID/메인 5점 리뷰
        const uid = Number(variables.userId);
        void dispatch(fetchUserReviews({ userId: uid }));
        void dispatch(fetchCompletedReviewIds({ userId: uid }));
        void dispatch(fetchFiveStarReviews());
      }

      // Invalidate pharmacy reviews if pharmacyId is provided
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
