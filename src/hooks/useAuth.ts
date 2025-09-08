'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { clearAuth, updateAccessToken, setUser } from '@/store/userSlice';
import authService from '@/services/authService';
import type { User } from '@/types/user';

interface UseAuthReturn {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

const useAuth = (): UseAuthReturn => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, accessToken } = useAppSelector((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 세션 기반 사용자 조회
   */
  const fetchUser = useCallback(async (): Promise<User | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // 1) 세션 시도 (쿠키 기반)
      let ses = await authService.session();

      // 2) 세션 실패 → refresh 시도
      if (!ses.ok) {
        const refreshed = await authService.refresh();
        if (refreshed.success && refreshed.accessToken) {
          dispatch(updateAccessToken(refreshed.accessToken));
          ses = await authService.session();
        }
      }

      if (!ses.ok || !ses.user) {
        dispatch(clearAuth());
        throw new Error('No user in session');
      }

      dispatch(setUser(ses.user));
      return ses.user;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch user';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  /**
   * 이메일/비번 로그인 (백엔드에서 refresh 쿠키 발급 + access 반환)
   */
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.login(email, password);
      if (!result.success) {
        return { success: false, error: result.error };
      }

      const { user, accessToken } = result.data;
      dispatch(updateAccessToken(accessToken));
      dispatch(setUser(user));
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  /**
   * 로그아웃 (refresh 무효화 + 쿠키 삭제)
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      dispatch(clearAuth());
      const redirectTo = searchParams.get('next') || '/';
      router.push(redirectTo);
    }
  }, [dispatch, router, searchParams]);

  // 최초 마운트 시 세션 확인
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
