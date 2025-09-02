import { useState, useEffect } from "react";
import { Review } from "@/types/review";

const useFiveStarReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFiveStarReviews = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reviews/fivestar`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch 5-star reviews");
        }
        const data = await response.json();
        console.log(data);
        setReviews(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An error occurred"));
      } finally {
        setLoading(false);
      }
    };

    fetchFiveStarReviews();
  }, []);

  return { reviews, loading, error };
};

export default useFiveStarReviews;
