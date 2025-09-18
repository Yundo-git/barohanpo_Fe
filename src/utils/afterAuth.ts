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
  try {
    // 1) 인증 상태 저장
    dispatch(
      setAuth({
        user,
        accessToken,
        expiresIn: 3600,
      })
    );

    // 2) URL에서 next 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const nextPath = urlParams.get('next') || '/';
    
    // 3) 카카오 로그인 후 리다이렉트 처리
    if (window.location.search.includes('login=success')) {
      // URL 정리 (토큰 등 민감 정보 제거)
      const cleanUrl = window.location.pathname + (nextPath ? `?next=${encodeURIComponent(nextPath)}` : '');
      window.history.replaceState({}, '', cleanUrl);
    }

    // 4) 유저 관련 초기 데이터 병렬 조회 (필요한 경우에만)
    if (user?.user_id) {
      const uid = Number(user.user_id);
      await Promise.all([
        dispatch(fetchReservations({ userId: uid })),
        dispatch(fetchCancelList({ userId: uid })),
        dispatch(fetchCompletedReviewIds({ userId: uid })),
        dispatch(fetchUserReviews({ userId: uid })),
      ]);
    }
  } catch (error) {
    console.error('Error in afterAuthBootstrap:', error);
    // 오류 발생 시 로그인 페이지로 리다이렉트
    window.location.href = `/login?error=auth_failed`;
  }
}
