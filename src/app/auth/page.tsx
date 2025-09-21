"use client";

import Link from "next/link";
import KakaoLoginButton from "@/components/auth/KakaoLoginButton";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAppSelector } from "@/store/store";

export default function SignupChoice() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const isAuthenticated = useAppSelector((state) => state.user.user !== null);

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = next;
    }
  }, [isAuthenticated, next]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col  sm:px-6 lg:px-8">
      <h1 className="font-bold text-3xl mx-4 my-20">
        <span className="font-bold text-main">약사</span>가 함께 만든 <br />
        <span className="font-bold">당신만의 건강 루틴</span>
        <p className="text-lg text-gray-600 mt-2">지금 시작해보세요.</p>
      </h1>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="space-y-4 m-4">
          <div className="space-y-3 flex flex-col">
            <KakaoLoginButton />

            {/* <button
              type="button"
              onClick={() => {
                // Handle Naver login
                // window.location.href = 'YOUR_NAVER_OAUTH_URL';
              }}
              className="border border-gray-300 rounded-md px-4 py-2"
            >
              네이버로 로그인
            </button> */}
            
    <Link href="/auth/user-signin" className="w-full rounded-xl py-3 font-medium border flex items-center justify-center">이메일 로그인</Link>
            <div className="flex justify-around text-disabled">
              {/* <Link href="/auth/user-signin">이메일 로그인</Link> */}
              <Link href="/auth/user-signup">이메일 회원가입</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
