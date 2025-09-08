// src/components/auth/AuthBootstrap.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

export default function AuthBootstrap() {
  const { refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await refreshUser();

      // 로그인 성공 플래그가 있으면 URL 정리
      if (searchParams.get("login") === "success") {
        router.replace("/"); // ?login=success 제거
      }
    })();
  }, [refreshUser, searchParams, router]);

  return null; // UI 없음
}
