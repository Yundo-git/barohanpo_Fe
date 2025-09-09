// src/hooks/useLogin.ts
'use client';

import { useCallback } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { setAuth } from "@/store/userSlice";
import { fetchReservations, fetchCancelList } from "@/store/bookingSlice";
import { fetchCompletedReviewIds } from "@/store/reviewCompletionSlice";
import { fetchUserReviews } from "@/store/userReviewsSlice";
import { login as loginApi } from "@/services/authService";
import type { User } from "@/types/user";

/** 백엔드 로그인 응답 스키마(권장) */
export interface LoginSuccessData {
  user: User;                 // 완전한 User 객체
  accessToken: string;        // 백엔드가 발급한 단기 액세스 토큰
  // refresh 쿠키는 서버가 httpOnly로 내려줌(프론트 저장 금지)
}
export type LoginResult =
  | { success: true; data: LoginSuccessData }
  | { success: false; error: string };

interface LoginParams {
  email: string;
  password: string;
}

interface UseLoginReturn {
  login: (credentials: LoginParams) => Promise<{ success: boolean; error?: string }>;
}

const useLogin = (): UseLoginReturn => {
  const dispatch = useDispatch<AppDispatch>();

  const login = useCallback<UseLoginReturn["login"]>(async ({ email, password }) => {
    if (!email || !password) {
      return { success: false, error: "이메일과 비밀번호를 입력해주세요." };
    }

    try {
      // 백엔드: 성공 시 httpOnly refresh 쿠키 + accessToken + user 반환
      const result = (await loginApi(email, password)) as LoginResult;

      if (!result.success) {
        return { success: false, error: result.error || "로그인에 실패했습니다." };
      }

      const { user, accessToken } = result.data;

      if (!accessToken) {
        return { success: false, error: "서버로부터 인증 토큰을 받지 못했습니다." };
      }

      // ✅ 리프레시 토큰은 저장하지 않음
      dispatch(
        setAuth({
          user,
          accessToken,
          expiresIn: 3600,
        })
      );

      // 로그인 직후 유저 관련 데이터 선 조회(필요한 것만)
      if (user?.user_id) {
        const uid = Number(user.user_id);
        await Promise.all([
          dispatch(fetchReservations({ userId: uid })),
          dispatch(fetchCancelList({ userId: uid })),
          dispatch(fetchCompletedReviewIds({ userId: uid })),
          dispatch(fetchUserReviews({ userId: uid })),
        ]);
      }

      return { success: true };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "로그인 처리 중 오류가 발생했습니다.";
      return { success: false, error: message };
    }
  }, [dispatch]);

  return { login };
};

export default useLogin;
