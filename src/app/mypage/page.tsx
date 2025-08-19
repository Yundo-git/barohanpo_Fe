"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { clearAuth } from "@/store/userSlice";
import { logout as logoutApi } from "@/services/authService";
import type { RootState } from "@/store/store";

export default function MyPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);
  console.log(user);
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
  // const handleMyBook = () => {
  //   router.push("/mybook/" + user?.user_id);
  // };

  return (
    <div className="flex flex-col  min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg ">
        <h1 className="text-2xl font-bold text-center">마이페이지</h1>
        {/* 유저 정보 */}
        <div className="text-gray-600 text-sm">
          <p>유저 ID: {user?.name || "N/A"}</p>
          <p>전화번호: {user?.phone || "N/A"}</p>
          <p>이메일: {user?.email || "N/A"}</p>
        </div>{" "}
        {/* <button
          onClick={handleMyBook}
          className="w-full px-4 py-2 font-medium  rounded-md border border-gray-300"
        >
          내 예약
        </button> */}
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 font-medium  rounded-md border border-gray-300"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
