// src/components/auth/KakaoLoginButton.tsx
"use client";

import { useMemo } from "react";

interface Props {
  next?: string;
  className?: string;
}

export default function KakaoLoginButton({ next, className }: Props) {
  const startUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const url = new URL("/auth/kakao/start", base);
    if (next) url.searchParams.set("next", next);
    return url.toString();
  }, [next]);

  return (
    <a
      href={startUrl}
      className={`inline-flex items-center justify-center w-full h-12 rounded-lg bg-[#FEE500] text-black font-medium hover:opacity-90 transition ${
        className ?? ""
      }`}
      aria-label="카카오로 로그인"
    >
      {/* 심볼 자리는 SVG 또는 이미지로 대체 */}
      <span className="text-base">카카오로 시작하기</span>
    </a>
  );
}
