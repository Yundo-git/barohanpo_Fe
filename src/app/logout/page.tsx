'use client';

'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { clearAuth } from '@/store/userSlice';
import { AppDispatch } from '@/store/store';

export default function LogoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const redirectTo = searchParams.get('redirect') || '/';
  const from = searchParams.get('from');

  useEffect(() => {
    const logout = async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Clear auth state in Redux
        dispatch(clearAuth());
        
        // Redirect to the specified page or home
        // If logging out from mypage, redirect to signin with proper redirect back
        if (from === 'mypage') {
          router.push(`/auth/user-signin?redirect=${encodeURIComponent(redirectTo)}`);
        } else {
          router.push(redirectTo);
        }
      }
    };

    logout();
  }, [dispatch, router, redirectTo, from]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">로그아웃 중입니다...</p>
      </div>
    </div>
  );
}
