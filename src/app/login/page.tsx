'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import KakaoLoginButton from '@/components/auth/KakaoLoginButton';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    // 로그인 성공 시 홈으로 리다이렉트
    const success = searchParams.get('success');
    if (success === 'true') {
      router.push('/');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            바로한포에 오신 것을 환영합니다
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            간편하게 로그인하고 서비스를 이용해보세요
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {error === 'unauthorized' && '로그인에 실패했습니다. 다시 시도해주세요.'}
                    {error === 'session_expired' && '세션이 만료되었습니다. 다시 로그인해주세요.'}
                    {!['unauthorized', 'session_expired'].includes(error || '') && '로그인 중 오류가 발생했습니다.'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <KakaoLoginButton />
          </div>
        </div>
      </div>
    </div>
  );
}

// This ensures the page is not statically generated at build time
export const dynamic = 'force-dynamic';
