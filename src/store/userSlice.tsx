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
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.lastUpdated = action.payload ? Date.now() : null;
    },
    
    // 사용자 정보와 accessToken을 설정
    setAuth: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken?: string; // Optional since we're using HTTP-only cookies
        expiresIn?: number;    // Optional since we're using HTTP-only cookies
      }>
    ) => {
      const { user, accessToken } = action.payload;

      // 상태가 없으면 초기 상태로 초기화
      if (!state) {
        state = {
          user: null,
          accessToken: null,
          lastUpdated: null,
        };
      }

      // Update user state with the new data
      state.user = user;
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
      state.accessToken = action.payload;
      state.lastUpdated = Date.now();
      
      // Note: axios 헤더는 useAuth 훅의 인터셉터에서 관리됨
    },
  },
  // Handle rehydration
  extraReducers: (builder) => {
    // Handle rehydration from persisted state
    builder.addMatcher(
      (action): action is { type: string; payload?: { user?: UserState } } =>
        action.type === 'persist/REHYDRATE',
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

export const { setAuth, clearAuth, updateAccessToken } = userSlice.actions;
export default userSlice.reducer;
