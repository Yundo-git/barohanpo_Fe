"use client";

import React from "react";
import { useRouter } from "next/navigation";
// import { useAppDispatch } from "@/store/store";
import useLogin from "@/hooks/useLogin";
import Link from "node_modules/next/link";

const UserSignInPage = () => {
  const router = useRouter();
  const [email, setEmail] = React.useState("1234@123.com");
  const [password, setPassword] = React.useState("keroro2424.");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { login } = useLogin();
  // const dispatch = useAppDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const loginData = { email, password };
      console.log("로그인 시도:", { email: loginData });

      const result = await login(loginData);
      if (result.success) {
        console.log("로그인 성공, 홈으로 리다이렉트 중...");
        router.push("/");
        router.refresh();
      } else {
        setError(result.error || "로그인에 실패했습니다.");
      }
    } catch (err) {
      console.error("로그인 처리 중 오류 발생:", err);
      setError("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5">
      <form onSubmit={handleSubmit} className="mt-12">
        <div className="space-y-4">
          <div>
            <label htmlFor="email-address" className="sr-only">
              이메일 주소
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="relative block w-full px-3 py-2 border-b border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-main focus:border-main focus:z-10 sm:text-sm"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="relative block w-full px-3 py-2 border-b border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-main focus:border-main focus:z-10 sm:text-sm"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <div className="flex justify-end text-disabled pt-4">
          <Link href="">아이디 / 비밀번호 찾기</Link>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className={`w-full py-3 rounded-lg font-medium ${
              !isLoading && email && password
                ? "bg-main text-white"
                : "bg-gray-200 text-subText2"
            } transition-colors`}
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserSignInPage;
