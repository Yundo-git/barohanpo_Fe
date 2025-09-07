import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types/user";

export interface UserState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
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
    // 사용자 정보만 설정 (accessToken 없이)
    setUser: (
      state,
      action: PayloadAction<User | null>
    ) => {
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
        updated_at: action.payload.updated_at
      };
      state.lastUpdated = Date.now();
    },

    // 사용자 정보와 accessToken을 설정
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
        updated_at: user.updated_at
      };

      state.accessToken = accessToken;
      state.refreshToken = refreshToken || null;
      state.lastUpdated = Date.now();
      
      // Save tokens to localStorage for persistence
      if (typeof window !== 'undefined') {
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
      }
    },

    // 로그아웃 시 모든 인증 정보 제거
    clearAuth: (state) => {
      // 상태가 이미 null이 아닌 경우에만 업데이트
      if (state) {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.lastUpdated = null;
      }

      // Remove tokens from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    },

    // accessToken 갱신
    updateAccessToken: (state, action: PayloadAction<string>) => {
      if (state) {
        state.accessToken = action.payload;
        state.lastUpdated = Date.now();
      }
    },

    // Update user information without affecting auth state
    updateUser: (
      state,
      action: PayloadAction<Partial<Omit<User, 'user_id'>> & { user_id?: number }>
    ) => {
      if (state.user) {
        const { user_id, ...updates } = action.payload;
        state.user = {
          ...state.user,
          ...updates,
          user_id: user_id !== undefined ? user_id : state.user.user_id,
        };
        state.lastUpdated = Date.now();
      }
    },
    
    // Update just the profile image version
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
  // Handle rehydration
  extraReducers: (builder) => {
    // Handle rehydration from persisted state
    builder.addMatcher(
      (action): action is { type: string; payload?: { user?: UserState } } =>
        action.type === "persist/REHYDRATE",
      (state, action) => {
        if (!action.payload?.user) {
          return state;
        }

        // Only restore user data, not accessToken (it will be refreshed)
        return {
          ...state,
          user: action.payload.user.user || null,
          lastUpdated: action.payload.user.lastUpdated || null,
          // accessToken is intentionally not restored from persisted state
        };
      }
    );
  },
});

export const { 
  setAuth, 
  clearAuth, 
  updateAccessToken, 
  updateUser, 
  updateProfileImage 
} = userSlice.actions;
export default userSlice.reducer;
