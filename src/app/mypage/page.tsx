"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { clearAuth } from "@/store/userSlice";
import { logout as logoutApi } from "@/services/authService";

export default function MyPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      // 서버에 로그아웃 요청
      await logoutApi();
    } catch (error) {
      console.error("Logout error:", error);
      // 서버 요청 실패해도 클라이언트 상태는 정리
    } finally {
      // Redux 상태 초기화
      dispatch(clearAuth());

      // 로그인 페이지로 리다이렉트
      router.push("/auth/user-signin");
      router.refresh(); // Next.js 캐시 초기화
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">마이페이지</h1>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 font-medium  rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
