// src/hooks/useAuth.ts
"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { clearAuth } from "@/store/userSlice";
import authService from "@/services/authService";
import type { User } from "@/types/user";
import { afterAuthBootstrap, type LoginSuccessData } from "@/utils/afterAuth";

interface RefreshResultOk {
  success: true;
  accessToken: string;
}
interface RefreshResultErr {
  success: false;
  error?: string;
}
type RefreshResult = RefreshResultOk | RefreshResultErr;

interface MeResultOk {
  ok: true;
  user: User;
}
interface MeResultErr {
  ok: false;
  user: null;
}
type MeResult = MeResultOk | MeResultErr;

interface LoginResultOk {
  success: true;
  data: LoginSuccessData;
}
interface LoginResultErr {
  success: false;
  error: string;
}
type LoginResult = LoginResultOk | LoginResultErr;

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

const ACCESS_TOKEN_KEY = "accessToken";

const useAuth = (): UseAuthReturn => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, accessToken } = useAppSelector((state) => state.user);
  const currentUserId = user?.user_id ? Number(user.user_id) : null;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 안전한 토큰 읽기 (Redux → localStorage)
   */
  const getTokenFromStateOrStorage = useCallback((): string | null => {
    if (accessToken) return accessToken;
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }, [accessToken]);

  /**
   * 안전한 토큰 저장/삭제
   */
  const persistToken = useCallback((token: string | null) => {
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  }, []);

  /**
   * 사용자 정보 동기화:
   * - accessToken 없거나 카카오 콜백 직후면 refresh 강제
   * - accessToken 확보 후 /api/auth/me로 유저 조회
   * - 부트스트랩(예약/취소/리뷰 선조회)은 "필요할 때"만 실행 (중복 호출 방지)
   */
  const fetchUser = useCallback(async (): Promise<User | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const forcedByCallback = searchParams.get("login") === "success";

      // 1) 토큰 소스 확인
      let token = getTokenFromStateOrStorage();

      // 2) 토큰이 없거나, 콜백 직후면 refresh 시도
      if (!token || forcedByCallback) {
        const refreshed: RefreshResult = await authService.refresh();
        if (!refreshed.success) {
          // 세션 없음/만료 → 비로그인 처리
          dispatch(clearAuth());
          persistToken(null);
          return null;
        }
        token = refreshed.accessToken;
        persistToken(token);
      }

      // 3) me 호출 (토큰 유효성 + 유저 정보)
      const me1: MeResult = await authService.me(token);
      if (me1.ok && me1.user) {
        const nextUser = me1.user;

        // 부트스트랩이 필요한 조건:
        // - 카카오 콜백 직후이거나
        // - 현재 로그인된 유저와 달라졌거나
        // - 토큰이 처음 생긴 경우(= accessToken이 없던 상태)
        const shouldBootstrap =
          forcedByCallback ||
          currentUserId === null ||
          Number(currentUserId) !== Number(nextUser.user_id) ||
          !accessToken;

        if (shouldBootstrap) {
          await afterAuthBootstrap(dispatch, { user: nextUser, accessToken: token });
        } else {
          // 동일 유저 + 콜백 아님 → 불필요한 대량 프리패치 방지
          // 토큰만 갱신된 상태라면 setAuth 내부 로직이 이미 유지되고 있을 것.
          // 여기서는 로컬스토리지만 최신화 유지.
          persistToken(token);
        }

        return nextUser;
      }

      // 4) 만료 가능성 → refresh 후 재시도
      const refreshedAgain: RefreshResult = await authService.refresh();
      if (!refreshedAgain.success) {
        dispatch(clearAuth());
        persistToken(null);
        return null;
      }

      const newToken = refreshedAgain.accessToken;
      persistToken(newToken);

      const me2: MeResult = await authService.me(newToken);
      if (me2.ok && me2.user) {
        await afterAuthBootstrap(dispatch, { user: me2.user, accessToken: newToken });
        return me2.user;
      }

      // 그래도 실패 → 비로그인 처리
      dispatch(clearAuth());
      persistToken(null);
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch user";
      setError(msg);
      dispatch(clearAuth());
      persistToken(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, getTokenFromStateOrStorage, persistToken, dispatch, currentUserId, accessToken]);

  /**
   * 이메일/비밀번호 로그인:
   * - 서버가 refresh 쿠키 발급
   * - 응답 accessToken + user로 공통 부트스트랩 호출
   */
  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result: LoginResult = await authService.login(email, password);
        if (!result.success) {
          return { success: false, error: result.error };
        }

        const { user: nextUser, accessToken: at } = result.data;

        // 공통 부트스트랩(스토어 setAuth + 예약/취소/리뷰 병렬 선조회)
        await afterAuthBootstrap(dispatch, { user: nextUser, accessToken: at });

        // 로컬스토리지 토큰도 동기화
        persistToken(at);

        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Login failed";
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, persistToken]
  );

  /**
   * 로그아웃:
   * - 서버 refresh 무효화 + 쿠키 삭제
   * - 클라이언트 스토어/로컬 정리
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", e);
    } finally {
      dispatch(clearAuth());
      persistToken(null);

      const redirectTo = searchParams.get("next") || "/";
      router.push(redirectTo);
    }
  }, [dispatch, persistToken, router, searchParams]);

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
