import { useMutation, useQueryClient } from "@tanstack/react-query";

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
  
  const updateReviewMutation = useMutation<
    ApiResponse,
    Error,
    UpdateReviewParams
  >({
    mutationFn: async ({ reviewId, score, comment, images = [] }) => {
      const formData = new FormData();
      formData.append("score", score.toString());
      formData.append("comment", comment);

      images.forEach((file) => {
        formData.append("images", file);
      });

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
    onSuccess: (_, variables) => {
      // Invalidate all related review queries
      queryClient.invalidateQueries({
        queryKey: ['reviews'],
        refetchType: 'active',
      });
      
      // Invalidate user's reviews
      if (variables.userId) {
        queryClient.invalidateQueries({
          queryKey: ['userReviews', variables.userId],
          refetchType: 'active',
        });
      }
      
      // Invalidate pharmacy reviews if pharmacyId is provided
      if (variables.pharmacyId) {
        queryClient.invalidateQueries({
          queryKey: ['pharmacy', variables.pharmacyId, 'reviews'],
          refetchType: 'active',
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
