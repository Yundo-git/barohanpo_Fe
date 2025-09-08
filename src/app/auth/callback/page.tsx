// 콜백처리 페이지(URL fragment → access 추출 → 리덕스 저장 + 세션 동기화)
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setAccessToken, setUser } from '@/store/userSlice';
import type { User } from '@/types/user';

type SessionResponse =
  | { ok: true; user: User }
  | { ok: false };

export default function AuthCallbackPage(){
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const access = params.get('access');
    if (access) dispatch(setAccessToken(access));

    (async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/session`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = (await res.json()) as SessionResponse;
        if (data.ok) {
          const userData: User = {
            ...data.user,
            // Ensure all required fields are present with default values if missing
            email: data.user.email || '',
            name: data.user.name || '',
            phone: data.user.phone || 0,
            nickname: data.user.nickname || `user_${data.user.user_id}`,
            role: data.user.role || 'user',
          };
          dispatch(setUser(userData));
        }
      }
      router.replace('/'); // 원하는 경로로 이동
    })();
  }, [dispatch, router]);

  return <p className="p-6 text-sm text-gray-500">로그인 처리중…</p>;
}
