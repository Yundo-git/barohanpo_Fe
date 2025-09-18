import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { fetchCompletedReviewIds } from "@/store/reviewCompletionSlice";
import { fetchUserReviews } from "@/store/userReviewsSlice";
import { fetchFiveStarReviews } from "@/store/reviewSlice";
import { useCallback } from "react";

/** 리뷰 생성 시 파라미터 타입 정의 */
interface CreateReviewParams {
  /** 예약 ID */
  bookId: number;
  /** 평점 (1-5) */
  score: number;
  /** 리뷰 내용 */
  comment: string;
  /** 약국 ID */
  p_id: number;
  /** 예약 날짜 */
  book_date: string;
  /** 예약 시간 */
  book_time: string;
  /** 업로드할 이미지 파일 배열 (선택사항, 최대 3장) */
  images?: File[];
}

/** 리뷰 생성을 위한 커스텀 훅 */
const useCreateReview = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const userId = user?.user_id;
  const dispatch = useDispatch<AppDispatch>();

  const createReview = useCallback(
    async ({
      bookId,
      score,
      comment,
      p_id,
      book_date,
      book_time,
      images = [],
    }: CreateReviewParams) => {
      if (!userId) {
        throw new Error("로그인이 필요합니다.");
      }

      try {
        const formData = new FormData();

        // 필수 필드 추가
        formData.append("user_id", userId.toString());
        formData.append("book_id", bookId.toString());
        formData.append("score", score.toString());
        formData.append("comment", comment);
        formData.append("p_id", p_id.toString());
        formData.append("book_date", book_date);
        formData.append("book_time", book_time);

        // 이미지 파일 추가 (선택사항, 최대 5장)
        if (images && images.length > 0) {
          // 이미지 개수 제한 (5장)
          const imagesToUpload = images.slice(0, 3);

          // 여러 이미지를 'photos' 필드로 추가
          imagesToUpload.forEach((image) => {
            if (image instanceof File) {
              formData.append("photos", image);
            }
          });
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reviews`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              // Content-Type은 명시적으로 설정하지 않음 (브라우저가 자동으로 설정)
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "리뷰 등록에 실패했습니다.");
        }

        const created = await response.json();
        // 리뷰 생성 성공 후, 리덕스 상태 최신화
        if (userId) {
          void dispatch(fetchUserReviews({ userId: Number(userId) }));
          void dispatch(fetchCompletedReviewIds({ userId: Number(userId) }));
          void dispatch(fetchFiveStarReviews());
        }
        return created;
      } catch (error) {
        console.error("리뷰 생성 중 오류 발생:", error);
        throw error;
      }
    },
    [userId, dispatch]
  );

  return { createReview };
};

export default useCreateReview;
