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

/** ← 추가: me() 전용 판별 유니온 타입 */
export type MeResult = { ok: true; user: User } | { ok: false; user: null };

/**
 * 로그인
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
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );

    const raw = res.data;
    console.log("raw in authService", raw);
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

/** 로그아웃 */
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
    if (err.response?.status === 401) return true;
    console.error("Logout error:", e);
    return false;
  }
}

/** 리프레시 */
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
        validateStatus: (status) => status < 500,
      }
    );
    if (res.status === 401) {
      return {
        success: false,
        error: "세션이 만료되었습니다. 다시 로그인해 주세요.",
        isUnauthorized: true,
      };
    }

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

/** 현재 사용자 조회: Bearer accessToken 필요 (판별 유니온으로 고정) */
export async function me(accessToken: string): Promise<MeResult> {
  if (!accessToken) {
    return { ok: false, user: null } as const;
  }

  try {
    const res = await axios.get<{ success: boolean; data?: User | null }>(
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
      return { ok: true, user: res.data.data } as const;
    }
    return { ok: false, user: null } as const;
  } catch {
    // 네트워크/401 등 모든 실패는 통일해서 false 리턴
    return { ok: false, user: null } as const;
  }
}

const authService = { login, logout, refresh, me } as const;
export default authService;
