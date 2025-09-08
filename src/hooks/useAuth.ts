"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { clearAuth, updateAccessToken, setUser } from "@/store/userSlice";
import authService from "@/services/authService";
import type { User } from "@/types/user";

interface UseAuthReturn {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

const useAuth = (): UseAuthReturn => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, accessToken } = useAppSelector((state) => state.user);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 사용자 정보 동기화:
   * - accessToken 없으면 refresh 시도
   * - accessToken 확보 후 /api/auth/me 호출하여 Redux 갱신
   */
  const fetchUser = useCallback(async (): Promise<User | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // 카카오 콜백 직후 처리 플래그
      const shouldForceRefresh = searchParams.get("login") === "success";

      // 1) 토큰 소스: Redux → localStorage
      let token: string | null = accessToken ?? null;
      if (!token && typeof window !== "undefined") {
        token = localStorage.getItem("accessToken");
        if (token) dispatch(updateAccessToken(token));
      }

      // 2) 강제 refresh (콜백 직후) 또는 토큰이 아예 없을 때 refresh
      if (!token || shouldForceRefresh) {
        const refreshed = await authService.refresh();
        if (!refreshed.success) {
          dispatch(clearAuth());
          if (typeof window !== "undefined")
            localStorage.removeItem("accessToken");
          return null;
        }
        token = refreshed.accessToken;
        dispatch(updateAccessToken(token));
        if (typeof window !== "undefined")
          localStorage.setItem("accessToken", token);
      }

      // 3) me 호출
      const me1 = await authService.me(token);
      if (me1.ok && me1.user) {
        dispatch(setUser(me1.user));
        return me1.user;
      }

      // 4) 만료 가능성 → refresh 후 재시도
      const refreshedAgain = await authService.refresh();
      if (!refreshedAgain.success) {
        dispatch(clearAuth());
        if (typeof window !== "undefined")
          localStorage.removeItem("accessToken");
        return null;
      }

      const newToken = refreshedAgain.accessToken;
      dispatch(updateAccessToken(newToken));
      if (typeof window !== "undefined")
        localStorage.setItem("accessToken", newToken);

      const me2 = await authService.me(newToken);
      if (me2.ok && me2.user) {
        dispatch(setUser(me2.user));
        return me2.user;
      }

      // 그래도 실패 시 비로그인 처리
      dispatch(clearAuth());
      if (typeof window !== "undefined") localStorage.removeItem("accessToken");
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch user";
      setError(msg);
      dispatch(clearAuth());
      if (typeof window !== "undefined") localStorage.removeItem("accessToken");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, dispatch, searchParams]);

  /**
   * 이메일/비밀번호 로그인:
   * - 서버가 refresh 쿠키 발급
   * - 응답 accessToken으로 즉시 Redux 세팅
   */
  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await authService.login(email, password);
        if (!result.success) {
          return { success: false, error: result.error };
        }

        const { user: u, accessToken: at } = result.data;
        dispatch(updateAccessToken(at));
        dispatch(setUser(u));
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", at);
        }
        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Login failed";
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch]
  );

  /**
   * 로그아웃:
   * - 서버 refresh 무효화 + 쿠키 삭제
   * - 클라이언트 스토어 정리
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", e);
    } finally {
      dispatch(clearAuth());
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }
      const redirectTo = searchParams.get("next") || "/";
      router.push(redirectTo);
    }
  }, [dispatch, router, searchParams]);

  // 최초 마운트/리다이렉트 후 상태 동기화
  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  return {
    user,
    accessToken,
    isLoading,
    error,
    isAuthenticated: Boolean(accessToken && user?.user_id),
    login,
    logout,
    refreshUser: fetchUser,
  };
};

export default useAuth;
