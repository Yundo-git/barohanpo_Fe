//리뷰 내용 조회하는 훅
import { useCallback, useState } from "react";
import { Review } from "@/types/review";

interface UseGetPharmaciesReviewReturn {
  reviews: Review[];
  isLoading: boolean;
  error: Error | null;
  fetchReviews: () => Promise<void>;
}

const useGetPharmaciesReview = (
  pharmacyId: number
): UseGetPharmaciesReviewReturn => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!pharmacyId) {
      setReviews([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reviews/${pharmacyId}/pharmacyReview`
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch reviews: ${res.statusText}`);
      }

      const data = await res.json();
      const reviewsData = Array.isArray(data?.data) ? data.data : [];
      setReviews(reviewsData);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch reviews")
      );
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [pharmacyId]);

  return { reviews, isLoading, error, fetchReviews };
};

export default useGetPharmaciesReview;
