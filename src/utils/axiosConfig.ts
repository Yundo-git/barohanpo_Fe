import axios from 'axios';

// Axios 기본 설정
export const axiosInstance = axios.create({
  baseURL: 'https://barohanpo.xyz/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  (config) => {
    // 요청 전에 수행할 작업 (예: 토큰 추가)
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 에러 처리 로직 (예: 401 에러 시 로그인 페이지로 리다이렉트)
    if (error.response?.status === 401) {
      // 로그인 페이지로 리다이렉트 또는 토큰 갱신 로직
      console.error('인증 오류가 발생했습니다.');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
