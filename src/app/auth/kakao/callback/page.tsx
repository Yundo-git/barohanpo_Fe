'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setLoading, setUser, setError } from '@/store/authSlice';
import { AppDispatch } from '@/store/store';

export default function KakaoCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const next = searchParams.get('next') || '/';

    const handleCallback = async () => {
      if (error) {
        dispatch(setError(error));
        router.push(`/login?error=${encodeURIComponent(error)}`);
        return;
      }

      if (!code) {
        dispatch(setError('No authorization code received'));
        router.push('/login?error=no_code');
        return;
      }

      try {
        dispatch(setLoading(true));
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/kakao/callback`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, state: searchParams.get('state') }),
            credentials: 'include',
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Authentication failed');
        }

        const { user } = await response.json();
        dispatch(setUser(user));
        router.replace(next);
      } catch (err) {
        console.error('Authentication error:', err);
        dispatch(setError(err instanceof Error ? err.message : 'Authentication failed'));
        router.push(`/login?error=${encodeURIComponent('authentication_failed')}`);
      } finally {
        dispatch(setLoading(false));
      }
    };

    handleCallback();
  }, [dispatch, router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 중입니다. 잠시만 기다려주세요...</p>
      </div>
    </div>
  );
}
