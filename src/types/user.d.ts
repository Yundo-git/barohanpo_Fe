export interface User {
  email: string;
  name: string;
  phone: number;
  user_id: number;
  nickname: string;
  role: "user" | "admin";
}

export interface LoginResponse {
  success: boolean;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
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
