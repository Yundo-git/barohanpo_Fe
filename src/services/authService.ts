import axios, { AxiosError } from "axios";
import type { User } from "@/types/user";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type LoginSuccess = {
  user: User;
  accessToken: string;
};
export type LoginResponse =
  | { success: true; data: LoginSuccess }
  | { success: false; error: string };

export type RefreshResponse =
  | { success: true; accessToken: string }
  | { success: false; error: string; isUnauthorized?: boolean };

type ErrorResponse = { error?: string; message?: string };

/** 로그인: refresh는 httpOnly 쿠키로 내려오고, JSON엔 { user, accessToken }만 */
// src/services/authService.ts (login만 교체)
export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    // 제네릭 제거: 런타임 응답을 그대로 받아서 가공
    const res = await axios.post(
      `${API_BASE_URL}/api/auth/login`,
      { email, password },
      {
        withCredentials: true, // httpOnly refresh 쿠키 수신
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );

    // 기대되는 실제 응답: { success: true, data: { tokens: { accessToken }, user } }
    const raw = res.data;

    const user = raw?.data?.user;
    const accessToken =
      raw?.data?.tokens?.accessToken ??
      raw?.data?.accessToken ??
      raw?.accessToken; // 혹시 모를 변형 대비

    if (raw?.success === true && user && typeof accessToken === "string" && accessToken.length > 0) {
      return { success: true, data: { user, accessToken } };
    }

    // 다른 포맷도 혹시 처리 (여유분)
    if (raw?.user && (raw?.tokens?.accessToken || raw?.accessToken)) {
      return {
        success: true,
        data: {
          user: raw.user,
          accessToken: raw.tokens?.accessToken ?? raw.accessToken,
        },
      };
    }

    return { success: false, error: "Invalid response format" };
  } catch (e) {
    const err = e as AxiosError<{ error?: string; message?: string }>;
    return {
      success: false,
      error: err.response?.data?.error || err.response?.data?.message || "로그인 중 오류가 발생했습니다.",
    };
  }
}


/** 로그아웃: 서버에서 refresh 무효화 + 쿠키 제거 */
export async function logout(): Promise<boolean> {
  try {
    await axios.post(
      `${API_BASE_URL}/auth/logout`,
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
  } catch (e) {
    const err = e as AxiosError<ErrorResponse>;
    if (err.response?.status === 401) return true; // 이미 만료된 세션도 OK
    console.error("Logout error:", e);
    return false;
  }
}

/** 액세스 재발급: refresh는 httpOnly 쿠키로 자동 전송됨 */
export async function refresh(): Promise<RefreshResponse> {
  try {
    const res = await axios.post<{ accessToken: string }>(
      `${API_BASE_URL}/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-Retry-Attempt": "true",
        },
      }
    );
    return { success: true, accessToken: res.data.accessToken };
  } catch (e) {
    const err = e as AxiosError<ErrorResponse>;
    if (err.response?.status === 401) {
      return { success: false, error: "세션이 만료되었습니다. 다시 로그인해 주세요.", isUnauthorized: true };
    }
    return {
      success: false,
      error: err.response?.data?.error || err.response?.data?.message || "토큰 갱신 중 오류가 발생했습니다.",
    };
  }
}

/** 세션 확인: refresh 쿠키만으로 현재 로그인 유저 반환 */
export async function session(): Promise<{ ok: boolean; user?: User }> {
  const res = await axios.get<{ ok: boolean; user?: User }>(
    `${API_BASE_URL}/auth/session`,
    { withCredentials: true }
  );
  return res.data;
}

const authService = { login, logout, refresh, session } as const;
export default authService;
