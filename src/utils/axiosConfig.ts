import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Axios 기본 설정
export const axiosInstance = axios.create({
  baseURL: "https://barohanpo.xyz/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 토큰 리프레시 관련 상태
let isRefreshing = false;
let lastRefreshTime = 0;
const REFRESH_COOLDOWN = 5 * 60 * 1000; // 5분 쿨다운
let refreshPromise: Promise<string> | null = null;
let refreshSubscribers: ((token: string) => void)[] = [];

// 리프레시 완료 후 저장된 요청 재시도
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// 리프레시 중일 때 요청을 저장하는 함수
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 여기서 access token을 헤더에 추가할 수 있습니다.
    // 예: const token = getTokenFromStorage();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401 에러이고, 리프레시 토큰 요청이 아닌 경우에만 처리
    if (error.response?.status === 401 && !originalRequest._retry) {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime;
      
      // 이미 갱신 중이면 대기
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      // 최근에 갱신했으면 다시 시도하지 않음
      if (timeSinceLastRefresh < REFRESH_COOLDOWN) {
        console.log('최근에 토큰을 갱신했으므로 다시 시도하지 않습니다.');
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // 단일 갱신 프로미스 생성
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            console.log("토큰 갱신 시도...");
            const response = await axios.post(
              "https://barohanpo.xyz/api/auth/refresh-token",
              {},
              {
                withCredentials: true,
                headers: {
                  "X-Requested-With": "XMLHttpRequest",
                  Accept: "application/json",
                },
              }
            );

            if (response.status === 200 && response.data?.accessToken) {
              lastRefreshTime = Date.now();
              onRefreshed(response.data.accessToken);
              return response.data.accessToken;
            }
            throw new Error("토큰 갱신 실패");
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        })();
      }

      try {
        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError: any) {
        // 401 에러 처리 (리프레시 토큰 만료 등)
        if (refreshError.response) {
          const { status, headers } = refreshError.response;

          // Rate limit 정보 확인
          const rateLimitRemaining = headers["ratelimit-remaining"];
          const rateLimitReset = headers["ratelimit-reset"];

          if (status === 401) {
            console.error(
              "세션이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요."
            );
            // 로그아웃 로직 (예: clearAuth())
            // clearAuth();

            // 로그인 페이지로 리다이렉트 (Next.js의 router 사용)
            if (typeof window !== "undefined") {
              // 현재 경로를 쿼리 파라미터로 전달하여 로그인 후 되돌아올 수 있도록 함
              const currentPath =
                window.location.pathname + window.location.search;
              window.location.href = `/login?redirect=${encodeURIComponent(
                currentPath
              )}`;
            }
          } else if (status === 429) {
            // Rate limit 초과 시
            const resetTime = rateLimitReset
              ? new Date(parseInt(rateLimitReset) * 1000)
              : null;
            console.error(
              `요청 한도 초과. 남은 요청: ${rateLimitRemaining || 0}개, ` +
                `재설정 시간: ${
                  resetTime?.toLocaleTimeString() || "알 수 없음"
                }`
            );
          }
        } else {
          console.error(
            "토큰 갱신 중 오류가 발생했습니다:",
            refreshError.message
          );
        }
        return Promise.reject(refreshError);
      }
    }

    // 401 에러가 아니거나, 이미 재시도한 경우 그대로 반환
    return Promise.reject(error);
  }
);

export default axiosInstance;
