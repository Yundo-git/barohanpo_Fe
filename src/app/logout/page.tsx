'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { resetAuth } from '@/store/authSlice';
import { AppDispatch } from '@/store/store';

export default function LogoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const next = searchParams.get('next') || '/';

  useEffect(() => {
    const logout = async () => {
      try {
        // Call the logout API
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/logout`,
          {
            method: 'POST',
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Logout failed');
        }
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Clear the auth state regardless of the API call result
        dispatch(resetAuth());
        
        // Redirect to the login page with the next parameter
        router.push(`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`);
      }
    };

    logout();
  }, [dispatch, router, next]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">로그아웃 중입니다...</p>
      </div>
    </div>
  );
}
