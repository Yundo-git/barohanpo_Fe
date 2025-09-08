// pages/auth/kakao/callback/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function KakaoCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("login") === "success") {
      router.replace("/");
    } else {
      router.replace("/auth/error");
    }
  }, [router, searchParams]);

  return <p>카카오 로그인 처리중...</p>;
}
