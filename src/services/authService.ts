import axios, { AxiosError } from "axios";
import type { User } from "@/types/user";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

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

/**
 * 로그인: 서버가 refresh_token을 HttpOnly 쿠키로 세팅하고,
 * 응답 JSON에는 { user, accessToken }만 담겨온다고 가정.
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/api/auth/login`,
      { email, password },
      {
        withCredentials: true, // refresh 쿠키 수신
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );

    const raw = res.data as unknown;

    // 가장 일반적인 형태: { success:true, data: { user, accessToken } }
    const user = (raw as { data?: { user?: User } })?.data?.user;
    const accessToken =
      (
        raw as {
          data?: { accessToken?: string; tokens?: { accessToken?: string } };
        }
      )?.data?.accessToken ??
      (raw as { data?: { tokens?: { accessToken?: string } } })?.data?.tokens
        ?.accessToken ??
      (raw as { accessToken?: string }).accessToken;

    if (user && typeof accessToken === "string" && accessToken.length > 0) {
      return { success: true, data: { user, accessToken } };
    }

    return { success: false, error: "Invalid response format" };
  } catch (e) {
    const err = e as AxiosError<ErrorResponse>;
    return {
      success: false,
      error:
        err.response?.data?.error ||
        err.response?.data?.message ||
        "로그인 중 오류가 발생했습니다.",
    };
  }
}

/** 로그아웃: 서버에서 refresh 무효화 + 쿠키 삭제 */
export async function logout(): Promise<boolean> {
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
  } catch (e) {
    const err = e as AxiosError<ErrorResponse>;
    if (err.response?.status === 401) return true; // 이미 만료된 세션도 OK 처리
    // 다른 에러는 로깅
    // eslint-disable-next-line no-console
    console.error("Logout error:", e);
    return false;
  }
}

/** 액세스 토큰 재발급: refresh는 HttpOnly 쿠키로 자동 전송됨 */
export async function refresh(): Promise<RefreshResponse> {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/api/auth/refresh-token`,
      {},
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );

    // 보통 { success:true, data:{ accessToken } } 또는 { accessToken } 형태
    const raw = res.data as unknown;
    const accessToken =
      (raw as { data?: { accessToken?: string } })?.data?.accessToken ??
      (raw as { accessToken?: string }).accessToken;

    if (typeof accessToken === "string" && accessToken.length > 0) {
      return { success: true, accessToken };
    }

    return { success: false, error: "Invalid refresh response format" };
  } catch (e) {
    const err = e as AxiosError<ErrorResponse>;
    if (err.response?.status === 401) {
      return {
        success: false,
        error: "세션이 만료되었습니다. 다시 로그인해 주세요.",
        isUnauthorized: true,
      };
    }
    return {
      success: false,
      error:
        err.response?.data?.error ||
        err.response?.data?.message ||
        "토큰 갱신 중 오류가 발생했습니다.",
    };
  }
}

/** 현재 사용자 조회: Bearer accessToken 필요 */
export async function me(
  accessToken: string
): Promise<{ ok: boolean; user?: User }> {
  if (!accessToken) {
    return { ok: false };
  }

  const res = await axios.get<{ success: boolean; data?: User }>(
    `${API_BASE_URL}/api/auth/me`,
    {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (res.data?.success && res.data?.data) {
    return { ok: true, user: res.data.data };
  }
  return { ok: false };
}

const authService = { login, logout, refresh, me } as const;
export default authService;
