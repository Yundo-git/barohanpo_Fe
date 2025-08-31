import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types/user";

export interface UserState {
  user: User | null;
  accessToken: string | null;
  lastUpdated: number | null;
}

const initialState: UserState = {
  user: null,
  accessToken: null,
  lastUpdated: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // 사용자 정보만 설정 (accessToken 없이)
    setUser: (
      state,
      action: PayloadAction<(Omit<User, "id"> & { id?: number }) | null>
    ) => {
      if (!action.payload) {
        state.user = null;
        state.lastUpdated = null;
        return;
      }

      // Ensure required fields are present
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...userData } = action.payload;
      state.user = {
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        user_id: userData.user_id,
        nickname: userData.nickname,
        role: userData.role || "user", // Default to 'user' if not specified
      };
      state.lastUpdated = Date.now();
    },

    // 사용자 정보와 accessToken을 설정
    setAuth: (
      state,
      action: PayloadAction<{
        user: Omit<User, "id"> & { id?: number }; // Allow both id and user_id for backward compatibility
        accessToken: string;
        refreshToken?: string;
        expiresIn?: number;
      }>
    ) => {
      const { user: rawUser, accessToken } = action.payload;

      // 상태가 없으면 초기 상태로 초기화
      if (!state) {
        state = {
          user: null,
          accessToken: null,
          lastUpdated: null,
        };
      }

      // Map user data to ensure consistent structure
      if (rawUser) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...userData } = rawUser;
        state.user = {
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          user_id: userData.user_id,
          nickname: userData.nickname,
          role: userData.role || "user",
          // Include profile image related fields
          profileImage: userData.profileImage,
          profileImageUrl: userData.profileImageUrl,
          profileImageVersion: userData.profileImageVersion,
          updated_at: userData.updated_at
        };
      } else {
        state.user = null;
      }

      state.accessToken = accessToken;
      state.lastUpdated = Date.now();
      // Note: refreshToken and axios header management are handled in useAuth hook
    },

    // 로그아웃 시 모든 인증 정보 제거
    clearAuth: (state) => {
      // 상태가 이미 null이 아닌 경우에만 업데이트
      if (state) {
        state.user = null;
        state.accessToken = null;
        state.lastUpdated = null;
      }

      // Note: refreshToken은 서버 쿠키로 관리되므로 클라이언트에서는 제거할 필요 없음
      // Authorization 헤더는 useAuth 훅의 인터셉터에서 관리됨
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
      action: PayloadAction<Partial<Omit<User, "id">> & { id?: number }>
    ) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
          user_id: action.payload.user_id ?? state.user.user_id,
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
