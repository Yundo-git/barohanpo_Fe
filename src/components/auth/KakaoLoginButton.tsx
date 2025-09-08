// src/components/auth/KakaoLoginButton.tsx
"use client";

export default function KakaoLoginButton() {
  const handleLogin = (): void => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/kakao/login`;
  };

  return (
    <button
      onClick={handleLogin}
      className="w-full rounded-xl py-3 font-medium bg-yellow-300 hover:bg-yellow-400 transition"
      aria-label="카카오로 로그인"
    >
      카카오로 로그인
    </button>
  );
}
