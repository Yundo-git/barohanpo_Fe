// src/components/auth/KakaoLoginButton.tsx
"use client";

export default function KakaoLoginButton() {
  const handleLogin = (): void => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/kakao/login`;
  };

  return (
    <button
      onClick={handleLogin}
      className="w-full rounded-xl py-3 font-medium border hover:bg-yellow-400 transition flex items-center justify-center gap-2"
      aria-label="카카오로 로그인"
    >
      <img src="/icon/kakaoLogo.svg" alt="카카오 로고" />
      <span>카카오로 로그인</span>
    </button>
  );
}
