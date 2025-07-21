"use client";

import Link from "next/link";

export default function SignupChoice() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col  sm:px-6 lg:px-8">
      <h1 className="font-bold text-3xl mx-4 my-20">
          당신만의 <span className="font-bold text-blue-600">건강 루틴</span>, <br />
          <span className="font-bold">지금 시작해보세요.</span>
      </h1>
     

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="space-y-4 m-4">
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                // Handle Kakao login
                // window.location.href = 'YOUR_KAKAO_OAUTH_URL';
              }}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-gray-900 bg-[#FEE500] hover:bg-[#FEE500]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FEE500]/50"
            >
              카카오로 로그인
            </button>

            <button
              type="button"
              onClick={() => {
                // Handle Naver login
                // window.location.href = 'YOUR_NAVER_OAUTH_URL';
              }}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-[#03C75A] hover:bg-[#03C75A]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#03C75A]/50"
            >
              네이버로 로그인
            </button>

            <Link
              href="/auth/user-signin"
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium   hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              이메일로 로그인
            </Link>
           
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">처음오셨나요? </span>
            <Link
              href="/auth/user-signup"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
