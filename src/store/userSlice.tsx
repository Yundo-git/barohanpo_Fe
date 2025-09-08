// userSlice.ts (수정본)
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types/user";

export interface UserState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null; // ← 보안상 제거 권장(아래 참고)
  lastUpdated: number | null;
}

const initialState: UserState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  lastUpdated: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // 1) setUser: 이미 정의되어 있으니 그대로 유지
    setUser: (state, action: PayloadAction<User | null>) => {
      if (!action.payload) {
        state.user = null;
        state.lastUpdated = null;
        return;
      }
      state.user = {
        user_id: action.payload.user_id,
        email: action.payload.email,
        name: action.payload.name,
        phone: action.payload.phone,
        nickname: action.payload.nickname,
        role: action.payload.role || "user",
        profileImage: action.payload.profileImage,
        profileImageUrl: action.payload.profileImageUrl,
        profileImageVersion: action.payload.profileImageVersion,
        updated_at: action.payload.updated_at,
      };
      state.lastUpdated = Date.now();
    },

    // 2) setAuth: 그대로
    setAuth: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken?: string;
        expiresIn?: number;
      }>
    ) => {
      const { user, accessToken, refreshToken } = action.payload;

      state.user = {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        nickname: user.nickname,
        role: user.role || "user",
        profileImage: user.profileImage,
        profileImageUrl: user.profileImageUrl,
        profileImageVersion: user.profileImageVersion,
        updated_at: user.updated_at,
      };

      state.accessToken = accessToken;
      state.refreshToken = refreshToken || null; // ← 보안상 비권장
      state.lastUpdated = Date.now();

      // if (typeof window !== "undefined") {
      //   if (accessToken) localStorage.setItem("accessToken", accessToken);
      //   // ⚠️ refreshToken은 저장하지 마세요 (보안상 위험)
      //   // if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      // }
    },

    // 3) updateAccessToken: 기존 유지
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.lastUpdated = Date.now();
    },

    // 4) setAccessToken: 사용처 호환을 위한 alias 추가
    setAccessToken: (state, action: PayloadAction<string>) => {
      // 내부적으로 updateAccessToken과 동일 동작
      state.accessToken = action.payload;
      state.lastUpdated = Date.now();
    },

    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.lastUpdated = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken"); // 남아있다면 삭제
      }
    },

    updateUser: (
      state,
      action: PayloadAction<Partial<Omit<User, "user_id">> & { user_id?: number }>
    ) => {
      if (state.user) {
        const { user_id, ...updates } = action.payload;
        state.user = {
          ...state.user,
          ...updates,
          user_id: user_id ?? state.user.user_id,
        };
        state.lastUpdated = Date.now();
      }
    },

    updateProfileImage: (
      state,
      action: PayloadAction<{
        user_id: number;
        profileImageVersion: number;
        profileImageUrl?: string;
      }>
    ) => {
      if (state.user?.user_id === action.payload.user_id) {
        state.user.profileImageVersion = action.payload.profileImageVersion;
        if (action.payload.profileImageUrl) {
          state.user.profileImageUrl = action.payload.profileImageUrl;
        }
        state.lastUpdated = Date.now();
      }
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      (action): action is { type: string; payload?: { user?: UserState } } =>
        action.type === "persist/REHYDRATE",
      (state, action) => {
        if (!action.payload?.user) return state;
        return {
          ...state,
          user: action.payload.user.user || null,
          lastUpdated: action.payload.user.lastUpdated || null,
          // accessToken은 복원하지 않음
        };
      }
    );
  },
});

// ⬇️ setUser, setAccessToken를 함께 export
export const {
  setUser,
  setAuth,
  clearAuth,
  updateAccessToken,
  setAccessToken,     
  updateUser,
  updateProfileImage,
} = userSlice.actions;

export default userSlice.reducer;
