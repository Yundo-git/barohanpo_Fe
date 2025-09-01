//리뷰 등록 훅
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useCallback } from "react";

const useCreateReview = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const userId = user?.user_id;
  const createReview = useCallback(
    async (
      bookId: number,
      score: number,
      comment: string,
      p_id: number,
      book_date: string,
      book_time: string
    ) => {
      console.log("db에 들어갈애들=====");
      console.log("bookid", bookId);
      console.log("score", score);
      console.log("comment", comment);
      console.log("p_id", p_id);
      console.log("book_date", book_date);
      console.log("book_time", book_time);
      console.log("user_id", userId);

      if (!userId) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            book_id: bookId,
            score,
            comment,
            p_id,
            book_date,
            book_time,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "리뷰 등록에 실패했습니다.");
      }

      return await response.json();
    },
    [userId]
  );

  return { createReview };
};

export default useCreateReview;
