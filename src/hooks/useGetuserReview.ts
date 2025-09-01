//유저 후기 불러오는 훅
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useCallback, useState } from "react";

const useGetUserReview = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const userId = user?.user_id;
  const [, setRefreshTrigger] = useState(0);

  const getUserReview = useCallback(async () => {
    if (!userId) return [];

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/review/${userId}`
      );
      if (!res.ok) throw new Error("Failed to fetch reviews");

      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }
  }, [userId]);

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return { getUserReview, refresh };
};

export default useGetUserReview;
