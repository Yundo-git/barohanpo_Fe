"use client";

import Image from "next/image";

export default function KakaoLoginButton() {
  const handleLogin = async (): Promise<void> => {
    try {
      // 카카오 로그인 페이지로 리다이렉트
      window.location.href = `${
        process.env.NEXT_PUBLIC_API_BASE_URL || "https://barohanpo.xyz"
      }/api/auth/kakao/login`;
    } catch (error) {
      console.error("카카오 로그인 중 오류가 발생했습니다:", error);
      alert("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="w-full rounded-xl py-3 font-medium border hover:bg-yellow-400 transition flex items-center justify-center gap-2"
      aria-label="카카오로 로그인"
    >
      <Image
        src="/icon/kakaoLogo.svg"
        alt="카카오 로고"
        width={20}
        height={20}
      />
      <span>카카오로 로그인</span>
    </button>
  );
}
