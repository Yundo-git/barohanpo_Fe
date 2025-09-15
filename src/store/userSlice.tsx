// src/store/userSlice.ts
"use client";

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
        profileImageUrl: action.payload.profileImageUrl, 
        profileImageVersion: action.payload.profileImageVersion, 
        updated_at: action.payload.updated_at,
      };
      state.lastUpdated = Date.now();
    },

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
        profileImageUrl: user.profileImageUrl, 
        profileImageVersion: user.profileImageVersion, 
        updated_at: user.updated_at,
      };
      state.accessToken = accessToken;
      state.refreshToken = refreshToken || null;
      state.lastUpdated = Date.now();
    },

    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.lastUpdated = Date.now();
    },

    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.lastUpdated = Date.now();
    },

    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.lastUpdated = null;
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
        profileImageUrl?: string;
      }>
    ) => {
      if (state.user?.user_id === action.payload.user_id) {
        state.user.profileImageVersion = Date.now();
        if (action.payload.profileImageUrl) {
          state.user.profileImageUrl = action.payload.profileImageUrl; // <-- 이 부분도 수정
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
        };
      }
    );
  },
});

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