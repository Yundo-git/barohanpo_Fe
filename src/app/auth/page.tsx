"use client";

import Link from "next/link";

export default function SignupChoice() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col  sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h3 className="text-center font-bold">
          AI와 약사가 함께 만든 당신만의 건강 루틴, <br />
          지금 시작해보세요.
        </h3>
      </div>
      <div className="flex items-center justify-center w-full">
        <div className="w-[100px] h-[100px] bg-gray-500 rounded-full flex  items-center justify-center">
          사진영역
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 space-y-6">
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                // Handle Kakao login
                // window.location.href = 'YOUR_KAKAO_OAUTH_URL';
              }}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-[#FEE500] hover:bg-[#FEE500]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FEE500]/50"
            >
              카카오로 로그인
            </button>

            <button
              type="button"
              onClick={() => {
                // Handle Naver login
                // window.location.href = 'YOUR_NAVER_OAUTH_URL';
              }}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#03C75A] hover:bg-[#03C75A]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#03C75A]/50"
            >
              네이버로 로그인
            </button>

            <Link
              href="/auth/user-signin"
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              이메일로 로그인
            </Link>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>
            <Link
              href="/auth/pharmacist-signin"
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              약사회원으로 로그인
            </Link>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">처음오셨나요? </span>
            <Link
              href="/signup"
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
