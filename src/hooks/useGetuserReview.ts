import { useCallback, useEffect, useState } from "react";
import { Review } from "@/types/review";

interface UseGetUserReviewReturn {
  reviews: Review[];
}

const useGetUserReview = (userId: number): UseGetUserReviewReturn => {
  const [reviews, setReviews] = useState<Review[]>([]);

  const fetchReviews = useCallback(async () => {
    if (!userId) {
      setReviews([]);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reviews/${userId}`
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch reviews: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("API Response data:", data);
      const reviewsData = Array.isArray(data?.data) ? data.data : [];
      console.log("Reviews datasdadsf:", reviewsData);
      setReviews(reviewsData);
      // console.log("Reviews data:", reviews);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setReviews([]);
    }
  }, [userId]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (isMounted) {
        await fetchReviews();
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [fetchReviews]);

  return { reviews };
};

export default useGetUserReview;
