import { useMutation } from '@tanstack/react-query';

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export default function useDelReview() {
  const deleteReviewMutation = useMutation<ApiResponse, Error, number>({
    mutationFn: async (reviewId: number) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reviews/${reviewId}/del`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '리뷰 삭제에 실패했습니다.');
      }

      return response.json();
    },
    onError: (error: Error) => {
      console.error('리뷰 삭제 중 오류 발생:', error);
      alert(error.message || '리뷰 삭제 중 오류가 발생했습니다.');
    },
    onSuccess: () => {
      // Optional: Add any success handling here
      // For example, you might want to invalidate queries or show a success message
    },
  });

  return {
    delReview: deleteReviewMutation.mutateAsync,
    isLoading: deleteReviewMutation.isPending,
    isError: deleteReviewMutation.isError,
    error: deleteReviewMutation.error,
  };
}
