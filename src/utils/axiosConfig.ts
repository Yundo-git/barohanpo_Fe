import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Axios 기본 설정
export const axiosInstance = axios.create({
  baseURL: 'https://barohanpo.xyz/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 토큰 리프레시 중인지 확인하는 플래그
let isRefreshing = false;
// 리프레시 중인 동안 들어온 요청을 저장할 배열
let refreshSubscribers: ((token: string) => void)[] = [];

// 리프레시 완료 후 저장된 요청 재시도
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
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
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 에러이고, 리프레시 토큰 요청이 아닌 경우에만 처리
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 토큰 갱신 중이면 요청을 저장하고 대기
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 토큰 갱신 요청
        const response = await axios.post(
          'https://barohanpo.xyz/api/auth/refresh-token',
          {},
          { withCredentials: true }
        );

        // 새로운 토큰으로 저장 (필요한 경우)
        // saveNewToken(response.data.accessToken);
        
        // 저장된 요청 재시도
        onRefreshed(response.data.accessToken);
        
        // 원래 요청 재시도
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // 리프레시 토큰도 만료된 경우 로그아웃 처리
        console.error('세션이 만료되었습니다. 다시 로그인해주세요.', refreshError);
        // 로그아웃 로직 (예: clearAuth(), redirect to login)
        // clearAuth();
        // window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 401 에러가 아니거나, 이미 재시도한 경우 그대로 반환
    return Promise.reject(error);
  }
);

export default axiosInstance;
