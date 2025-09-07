'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/store';

export default function AuthGuard({
  children,
  requireAdmin = false,
  loadingFallback,
  unauthorizedFallback,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
  loadingFallback?: React.ReactNode;
  unauthorizedFallback?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = !!user;
  const isAuthorized = requireAdmin ? user?.role === 'admin' : isAuthenticated;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const searchParams = new URLSearchParams();
      searchParams.set('next', pathname);
      router.push(`/login?${searchParams.toString()}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  useEffect(() => {
    // Simulate loading user data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return loadingFallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return unauthorizedFallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">접근 권한이 없습니다.</h2>
          <p className="text-gray-600 mb-6">이 페이지를 보려면 로그인이 필요합니다.</p>
          <button
            onClick={() => router.push(`/login?next=${encodeURIComponent(pathname)}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
