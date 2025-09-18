// src/lib/axios.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { store } from "@/store/store";
import { updateAccessToken, clearAuth } from "@/store/userSlice";

import { RootState } from "@/store/store";
import type { RefreshResponse } from "@/services/authService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// 토큰 갱신 요청을 관리할 전역 변수
let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const state: RootState = store.getState();
    const isLoggingOutState = state.user.isLoggingOut;
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (isLoggingOutState) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // 이미 토큰 갱신 중이라면, 대기열에 추가
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // 첫 번째 401 에러, 갱신 시작
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const res = await refreshClient.post<RefreshResponse>(
            "/api/auth/refresh-token"
          );

          if (!res.data.success) {
            throw new Error(
              res.data.error || "리프레시 토큰 갱신에 실패했습니다."
            );
          }

          const newAccessToken = res.data.accessToken;
          store.dispatch(updateAccessToken(newAccessToken));

          isRefreshing = false;
          processQueue(null, newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          store.dispatch(clearAuth());
          processQueue(refreshError as AxiosError, null);
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
