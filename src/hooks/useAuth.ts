"use client";

import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { updateAccessToken, clearAuth } from "@/store/userSlice";
import axios, { AxiosError } from "axios";
import { refreshToken as refreshTokenApi } from "@/services/authService";
import type { ErrorResponse } from "@/types/user";

// Axios 요청 타입 확장
declare module "axios" {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

const useAuth = () => {
  const dispatch = useAppDispatch();
  const userState = useAppSelector((state) => state.user);
  const accessToken = userState?.accessToken;

  const handleRefreshToken = useCallback(async () => {
    if (typeof window === "undefined") return null;

    const rawTokenData = localStorage.getItem("refreshToken");
    if (!rawTokenData) {
      return null;
    }

    try {
      const result = await refreshTokenApi();

      if (result.success && result.accessToken) {
        dispatch(updateAccessToken(result.accessToken));
        return result.accessToken;
      }

      if (result.isUnauthorized) {
        await dispatch(clearAuth());
        if (typeof window !== "undefined") {
          window.location.href = "/auth/user-signin";
        }
        return null;
      }

      return null;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error(
        "Unexpected error during token refresh:",
        axiosError.message
      );
      return null;
    }
  }, [dispatch]);

  // //  앱 마운트 시 토큰 복원 로직
  // useEffect(() => {
  //   const restoreAuth = async () => {
  //     if (typeof window === "undefined") return;
  //     if (accessToken) return;

  //     const refreshToken = localStorage.getItem("refreshToken");
  //     if (!refreshToken) return; // 없으면 복원 시도 X

  //     try {
  //       await handleRefreshToken();
  //     } catch (error) {
  //       console.error("⚠️ Failed to restore session:", error);
  //       window.location.href = "/auth/user-signin";
  //     }
  //   };

  //   restoreAuth();
  // }, [accessToken, handleRefreshToken]);

  //  Axios 인터셉터 설정
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes("/auth/refresh-token")
        ) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await handleRefreshToken();
            if (newAccessToken) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            console.error(" Failed to refresh token:", refreshError);
          }

          if (typeof window !== "undefined") {
            window.location.href = "/auth/user-signin";
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, dispatch, handleRefreshToken]);

  return null;
};

export default useAuth;
