// src/utils/afterAuth.ts
import { setAuth } from "@/store/userSlice";
import { fetchReservations, fetchCancelList } from "@/store/bookingSlice";
import { fetchCompletedReviewIds } from "@/store/reviewCompletionSlice";
import { fetchUserReviews } from "@/store/userReviewsSlice";
import type { AppDispatch } from "@/store/store";
import type { User } from "@/types/user";

export interface LoginSuccessData {
  user: User;
  accessToken: string;
}

export async function afterAuthBootstrap(
  dispatch: AppDispatch,
  { user, accessToken }: LoginSuccessData
): Promise<void> {
  // 1) 인증 상태 저장
  dispatch(
    setAuth({
      user,
      accessToken,
      expiresIn: 3600,
    })
  );

  // 2) 유저 관련 초기 데이터 병렬 조회
  if (user?.user_id) {
    const uid = Number(user.user_id);
    await Promise.all([
      dispatch(fetchReservations({ userId: uid })),
      dispatch(fetchCancelList({ userId: uid })),
      dispatch(fetchCompletedReviewIds({ userId: uid })),
      dispatch(fetchUserReviews({ userId: uid })),
    ]);
  }
}
