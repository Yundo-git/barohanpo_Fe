import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types/user";
import axios from "axios";

type PersistAction = {
  type: string;
  payload?: {
    user: {
      user: User | null;
      accessToken: string | null;
      lastUpdated: number | null;
    };
  };
};

interface UserState {
  user: User | null;
  accessToken: string | null;
  lastUpdated: number | null;
}

const initialState: UserState = {
  user: null,
  accessToken: null,
  lastUpdated: null,
};

// localStorage에서 refreshToken 가져오기
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const tokenData = localStorage.getItem("refreshToken");
  if (!tokenData) return null;

  try {
    const { token } = JSON.parse(tokenData);
    return token;
  } catch (error) {
    console.error("Error parsing refresh token:", error);
    return null;
  }
};

// localStorage에 refreshToken 설정
const setRefreshToken = (token: string, expiresIn: number) => {
  if (typeof window === "undefined") return;

  const tokenData = {
    token,
    expiresAt: Date.now() + expiresIn * 1000, // 유효 기간 설정 (밀리초 단위)
  };

  localStorage.setItem("refreshToken", JSON.stringify(tokenData));
};

// localStorage에서 refreshToken 제거
const removeRefreshToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("refreshToken");
};

// This function is intentionally left unused but kept for future reference
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isValidRefreshToken = (): boolean => {
  if (typeof window === "undefined") return false;

  const tokenData = localStorage.getItem("refreshToken");
  if (!tokenData) return false;

  try {
    const { token, expiresAt } = JSON.parse(tokenData);
    return Boolean(token && expiresAt > Date.now());
  } catch (error) {
    console.error("Error validating refresh token:", error);
    return false;
  }
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // 사용자 정보와 accessToken을 설정
    setAuth: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }>
    ) => {
      const { user, accessToken, refreshToken, expiresIn } = action.payload;

      // 상태가 없으면 초기 상태로 초기화
      if (!state) {
        state = {
          user: null,
          accessToken: null,
          lastUpdated: null,
        };
      }

      try {
        // accessToken은 Redux에 저장 (메모리)
        state.user = user;
        state.accessToken = accessToken;
        state.lastUpdated = Date.now();

        // refreshToken은 쿠키에 저장 (HTTP Only)
        setRefreshToken(refreshToken, expiresIn);

        // axios 기본 헤더에 accessToken 설정
        if (typeof window !== "undefined" && accessToken) {
          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${accessToken}`;
        }
      } catch (error) {
        console.error("Error in setAuth:", error);
        // 상태 업데이트 실패 시 명시적으로 초기화
        if (state) {
          state.user = null;
          state.accessToken = null;
          state.lastUpdated = null;
        }
      }
    },

    // 로그아웃 시 모든 인증 정보 제거
    clearAuth: (state) => {
      // 상태가 이미 null이 아닌 경우에만 업데이트
      if (state) {
        state.user = null;
        state.accessToken = null;
        state.lastUpdated = null;
      }

      // 쿠키에서 refreshToken 제거
      removeRefreshToken();

      // axios 기본 헤더에서 Authorization 제거
      if (typeof window !== "undefined") {
        delete axios.defaults.headers.common["Authorization"];
      }
    },

    // accessToken 갱신
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.lastUpdated = Date.now();

      // axios 기본 헤더 업데이트
      if (typeof window !== "undefined") {
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${action.payload}`;
      }
    },
  },
  // Handle rehydration
  extraReducers: (builder) => {
    // rehydration이 완료된 후 실행
    builder.addCase("persist/REHYDRATE", (state, action: PersistAction) => {
      if (action.payload?.user) {
        const { user, accessToken, lastUpdated } = action.payload.user;
        if (user && accessToken && lastUpdated) {
          // 클라이언트 사이드에서만 axios 헤더 설정
          if (typeof window !== "undefined") {
            axios.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${accessToken}`;
          }
          return {
            ...state,
            user,
            accessToken,
            lastUpdated,
          };
        }
      }
      return state || initialState;
    });
  },
});

export const { setAuth, clearAuth, updateAccessToken } = userSlice.actions;
export default userSlice.reducer;
