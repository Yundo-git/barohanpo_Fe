'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { setUser, setLoading, setError, resetAuth } from '@/store/authSlice';
import type { User } from '@/types/user';

const useAuth = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, error } = useAppSelector((state) => state.auth);

  // Fetch the current user's data
  const fetchUser = useCallback(async () => {
    if (typeof window === 'undefined') return null;

    dispatch(setLoading(true));
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      dispatch(setUser(data.user));
      return data.user;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch user'));
      return null;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  // Login with email and password
  const login = useCallback(async (email: string, password: string) => {
    try {
      dispatch(setLoading(true));
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      dispatch(setUser(data.user));
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      dispatch(setError(error instanceof Error ? error.message : 'Login failed'));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  /**
   * Logout the current user
   */
  const logout = useCallback(async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(resetAuth());
      const redirectTo = searchParams.get('next') || '/';
      router.push(redirectTo);
    }
  }, [dispatch, router, searchParams]);

  // Check auth status on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    refreshUser: fetchUser,
  };
};

export default useAuth;
