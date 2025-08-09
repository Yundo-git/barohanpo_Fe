import axios, { AxiosError } from "axios";
import type {
  LoginResponse,
  RefreshTokenResponse,
  ErrorResponse,
} from "@/types/user";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/**
 * 로그인 API 호출
 * 성공 시 서버에서 refreshToken을 HttpOnly 쿠키로 설정
 */
export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}/api/auth/login`,
      { email, password },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    const axiosError = error as AxiosError<ErrorResponse>;
    return {
      success: false,
      error:
        axiosError.response?.data?.error || "로그인 중 오류가 발생했습니다.",
    };
  }
};

/**
 * 로그아웃 API 호출
 * 서버에서 refreshToken 쿠키를 제거
 */
export const logout = async (): Promise<boolean> => {
  try {
    await axios.post(
      `${API_BASE_URL}/api/auth/logout`,
      {},
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
};

/** 토큰 갱신 API 호출
 * refreshToken은 HttpOnly 쿠키로 자동 전송됨*/
export const refreshToken = async (): Promise<RefreshTokenResponse> => {
  // 클라이언트 사이드에서만 실행
  if (typeof window === "undefined") {
    console.warn("refreshToken: 클라이언트 사이드에서만 실행 가능합니다.");
    return {
      success: false,
      error: "클라이언트에서만 실행 가능합니다.",
    };
  }

  try {
    const response = await axios.post<RefreshTokenResponse>(
      `${API_BASE_URL}/api/auth/refresh-token`,
      {},
      {
        withCredentials: true,
        _retry: true,
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ErrorResponse>;

    if (axiosError.response?.status === 401) {
      return {
        success: false,
        error: "세션이 만료되었습니다. 다시 로그인해 주세요.",
        isUnauthorized: true,
      };
    }

    console.error("Refresh token error:", error);
    return {
      success: false,
      error:
        axiosError.response?.data?.error || "토큰 갱신 중 오류가 발생했습니다.",
    };
  }
};

const authService = {
  login,
  logout,
  refreshToken,
} as const;

export default authService;
