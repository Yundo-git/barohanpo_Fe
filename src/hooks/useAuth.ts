"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { updateAccessToken, clearAuth, setAuth } from "@/store/userSlice";
import type { AppDispatch } from "@/store/store";
import axios, { AxiosError } from "axios";
import { refreshToken as refreshTokenApi } from "@/services/authService";
import type { ErrorResponse, User } from "@/types/user";

// Axios 요청 타입 확장
declare module "axios" {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

// 전역으로 인터셉터가 등록되었는지 확인
let isInterceptorSetUp = false;

const useAuth = () => {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.user.accessToken);
  const user = useAppSelector((state) => state.user.user);
  const isRefreshing = useRef(false);

  /**
   * 액세스 토큰 갱신 및 사용자 정보 가져오기
   */
  const refreshAuth = useCallback(async () => {
    if (typeof window === "undefined" || isRefreshing.current) {
      return null;
    }

    isRefreshing.current = true;
    
    try {
      // 1. 액세스 토큰 갱신 시도
      const refreshResult = await refreshTokenApi();
      
      if (!refreshResult.success || !refreshResult.accessToken) {
        throw new Error(refreshResult.error || '토큰 갱신에 실패했습니다.');
      }

      // 2. 새로운 액세스 토큰 저장
      dispatch(updateAccessToken(refreshResult.accessToken));

      // 3. 사용자 정보 가져오기
      const userResponse = await axios.get<{ user: User }>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${refreshResult.accessToken}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      // 4. 사용자 정보 저장 (기존 액세스 토큰 유지)
      if (userResponse.data?.user) {
        dispatch(setAuth({
          user: userResponse.data.user,
          accessToken: refreshResult.accessToken,
          refreshToken: '', // 서버 쿠키로 관리되므로 빈 문자열로 설정
          expiresIn: 3600 // 기본값으로 1시간 설정 (실제로는 서버에서 설정한 만료 시간 사용)
        }));
      }

      return refreshResult.accessToken;
    } catch (error) {
      console.error('인증 갱신 실패:', error);
      dispatch(clearAuth());
      return null;
    } finally {
      isRefreshing.current = false;
    }
  }, [dispatch]);

  /**
   * 앱 마운트 시 인증 상태 복원
   */
  useEffect(() => {
    const restoreAuth = async () => {
      if (accessToken || !user) {
        // 이미 액세스 토큰이 있거나 사용자 정보가 없을 때만 시도
        await refreshAuth();
      }
    };

    restoreAuth();
  }, [accessToken, user, refreshAuth]);

  // Axios 인터셉터 설정 (한 번만 실행)
  useEffect(() => {
    if (isInterceptorSetUp) {
      return () => {}; // No-op cleanup if interceptors are already set up
    }

    // 요청 인터셉터: 모든 요청에 액세스 토큰 추가
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        // withCredentials는 모든 요청에 대해 true로 설정
        config.withCredentials = true;
        
        // 액세스 토큰이 있으면 헤더에 추가
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 응답 인터셉터: 401 에러 처리 및 토큰 갱신 시도
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ErrorResponse>) => {
        const originalRequest = error.config;
        
        // originalRequest가 없거나 401 에러가 아니거나 이미 재시도한 경우
        if (!originalRequest || error.response?.status !== 401) {
          return Promise.reject(error);
        }

        // 리프레시 토큰 요청인 경우
        if (originalRequest.url?.includes('/auth/refresh-token')) {
          // 로그인 페이지로 리다이렉트
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/user-signin';
          }
          return Promise.reject(error);
        }

        // 이미 재시도한 경우
        if ((originalRequest as any)._retry) {
          return Promise.reject(error);
        }

        (originalRequest as any)._retry = true;

        try {
          const newAccessToken = await refreshAuth();
          
          if (newAccessToken) {
            // 원래 요청 재시도
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          }
        } catch (refreshError) {
          console.error('토큰 갱신 실패:', refreshError);
          // 토큰 갱신 실패 시 로그인 페이지로 리다이렉트
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/user-signin';
          }
        }

        return Promise.reject(error);
      }
    );

    isInterceptorSetUp = true;

    return () => {
      // 컴포넌트 언마운트 시 인터셉터 제거
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
      isInterceptorSetUp = false;
    };
  }, [accessToken, refreshAuth]);

  return null;
};

export default useAuth;
