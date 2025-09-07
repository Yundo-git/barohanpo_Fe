import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Review } from "@/types/review";

interface UseGetUserReviewReturn {
  reviews: Review[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const useGetUserReview = (userId: number): UseGetUserReviewReturn => {
  const queryClient = useQueryClient();

  const {
    data: reviewsData = [],
    isLoading,
    error,
  } = useQuery<Review[]>({
    queryKey: ["userReviews", userId],
    queryFn: async () => {
      if (!userId) return [];

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reviews/${userId}`
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch reviews: ${res.statusText}`);
      }

      const data = await res.json();
      return Array.isArray(data?.data) ? data.data : [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Refetch function that can be called manually
  const handleRefetch = async () => {
    await queryClient.invalidateQueries({ queryKey: ["userReviews", userId] });
  };

  return {
    reviews: reviewsData,
    isLoading,
    error: error as Error | null,
    refetch: handleRefetch,
  };
};

export default useGetUserReview;
