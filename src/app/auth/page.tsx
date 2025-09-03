"use client";

import Link from "next/link";

export default function SignupChoice() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col  sm:px-6 lg:px-8">
      <h1 className="font-bold text-3xl mx-4 my-20">
          <span className="font-bold text-blue-600">약사</span>가 함께 만든 <br />
          <span className="font-bold">당신만의 건강 루틴</span>
          <p className="text-lg text-gray-600 mt-2">
            지금 시작해보세요.
          </p>
      </h1>
    
     

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="space-y-4 m-4">
          <div className="space-y-4 flex flex-col">
            <button
              type="button"
              onClick={() => {
                // Handle Kakao login
                // window.location.href = 'YOUR_KAKAO_OAUTH_URL';
              }}
              className="border border-gray-300 rounded-md px-4 py-2"
            >
              카카오로 로그인
            </button>

            <button
              type="button"
              onClick={() => {
                // Handle Naver login
                // window.location.href = 'YOUR_NAVER_OAUTH_URL';
              }}
              className="border border-gray-300 rounded-md px-4 py-2"
            >
              네이버로 로그인
            </button>
            <div className="flex justify-around">

            <Link
              href="/auth/user-signin"
            >
              이메일 로그인
            </Link>
            <Link
              href="/auth/user-signup"
            >
              회원가입
            </Link>
            </div>
          </div>

        
        </div>
      </div>
    </div>
  );
}
