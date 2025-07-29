import axios, { AxiosError } from "axios";
import type {
  LoginResponse,
  RefreshTokenResponse,
  ErrorResponse,
} from "@/types/user";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/**
 * 로그인 API 호출
 */
export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}/api/auth/login`,
      { email, password },
      { withCredentials: true }
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
 */
export const logout = async (): Promise<boolean> => {
  try {
    await axios.post(
      `${API_BASE_URL}/api/auth/logout`,
      {},
      { withCredentials: true }
    );
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
};

/**
 * 토큰 갱신 API 호출
 */
export const refreshToken = async (): Promise<RefreshTokenResponse> => {
  // 클라이언트 사이드에서만 실행
  if (typeof window === "undefined") {
    console.warn("refreshToken: 클라이언트 사이드에서만 실행 가능합니다.");
    return {
      success: false,
      error: "클라이언트에서만 실행 가능합니다."
    };
  }

  // 로컬 스토리지에서 refreshToken 가져오기
  const tokenData = localStorage.getItem("refreshToken");
  console.log("Stored refresh token data:", tokenData);

  if (!tokenData) {
    console.warn("No refresh token found in localStorage");
    return { success: false, error: "리프레시 토큰이 없습니다." };
  }

  try {
    const parsedData = JSON.parse(tokenData);
    console.log("Parsed token data:", parsedData);

    if (!parsedData || typeof parsedData !== "object") {
      console.warn("Invalid token format in localStorage");
      localStorage.removeItem("refreshToken");
      return { success: false, error: "잘못된 토큰 형식입니다." };
    }

    if (!parsedData.token) {
      console.warn("Token is missing in the stored data");
      localStorage.removeItem("refreshToken");
      return { success: false, error: "토큰이 존재하지 않습니다." };
    }

    const now = Date.now();
    if (parsedData.expiresAt) {
      console.log(`Token expires at: ${new Date(parsedData.expiresAt).toISOString()}, Current time: ${new Date(now).toISOString()}`);
      if (parsedData.expiresAt <= now) {
        console.warn("Refresh token has expired");
        localStorage.removeItem("refreshToken");
        return { success: false, error: "리프레시 토큰이 만료되었습니다." };
      }
    }

    const refreshToken = parsedData.token;
    console.log("Using refresh token:", refreshToken.substring(0, 10) + "...");

    console.log(`Sending refresh token request to: ${API_BASE_URL}/api/auth/refresh-token`);
    const response = await axios.post<RefreshTokenResponse>(
      `${API_BASE_URL}/api/auth/refresh-token`,
      JSON.stringify({ refreshToken }),
      {
        withCredentials: true,
        _retry: true,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/json"
        },
      }
    ).catch(error => {
      console.error("Refresh token request failed:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    });

    if (response.data?.success) {
      console.log("Token refresh successful");
      return response.data;
    }

    return {
      success: false,
      error: response.data?.error || "토큰 갱신에 실패했습니다.",
    };
  } catch (error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    console.error("Error in refreshToken:", {
      message: axiosError.message,
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      config: {
        url: axiosError.config?.url,
        method: axiosError.config?.method,
        headers: axiosError.config?.headers,
        data: axiosError.config?.data
      }
    });

    if (axiosError.response?.status === 401) {
      console.warn("Refresh token is invalid or expired");
      localStorage.removeItem("refreshToken");
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
