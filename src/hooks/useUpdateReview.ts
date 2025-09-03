import { useMutation, UseMutationResult } from "@tanstack/react-query";

interface UpdateReviewParams {
  reviewId: number;
  score: number;
  comment: string;
  images?: File[];
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/reviews/${reviewId}`,
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
    onSuccess: () => {
      // 성공 시 캐시 무효화 또는 쿼리 다시 가져오기
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
