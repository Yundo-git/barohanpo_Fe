export interface User {
  user_id: number;
  email: string;
  name: string;
  phone: number;
  nickname: string;
  role: "user" | "admin";
  profileImage?: string;
  profileImageVersion?: number;
  profileImageUrl?: string;
  updated_at?: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
  error?: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken?: string;
  error?: string;
  isUnauthorized?: boolean;
}

export interface ErrorResponse {
  success: boolean;
  error: string;
  isUnauthorized?: boolean;
}

declare global {
  interface Window {
    user: LoginResponse;
  }
}

export interface LoginApiResponse {
  success: boolean;
  data: LoginResponseData;
}