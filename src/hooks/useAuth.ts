'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { clearAuth, updateUser, setAuth, updateAccessToken } from '@/store/userSlice';
import { refreshToken as refreshTokenApi } from '@/services/authService';
import { User, LoginResponse } from '@/types/user';

interface UseAuthReturn {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

const useAuth = (): UseAuthReturn => {
  console.log('useAuth hook is running'); // Add this line
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, accessToken } = useAppSelector((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch the current user's data
  const fetchUser = useCallback(async (): Promise<User | null> => {
    if (typeof window === 'undefined') return null;
    
    // Get token from Redux store or localStorage
    let token = accessToken;
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('accessToken') || null;
      if (token) {
        // Update Redux store with token from localStorage
        dispatch(updateAccessToken(token));
      } else {
        // No token available, ensure we're logged out
        dispatch(clearAuth());
        return null;
      }
    }
    
    console.log('fetchUser - Current auth state:', { 
      hasAccessToken: !!token,
      accessTokenLength: token?.length || 0,
      hasUser: !!user
    });
    
    // If there's no access token, clear the user and return
    if (!token) {
      console.log('fetchUser - No access token available');
      dispatch(clearAuth());
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const headers: HeadersInit = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      console.log('fetchUser - Making request with headers:', {
        ...headers,
        Authorization: accessToken ? `Bearer ${accessToken.substring(0, 10)}...` : 'none' // Log first 10 chars of token
      });
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/me`;
      console.log('fetchUser - Making request to:', apiUrl);
      console.log('fetchUser - Request headers:', JSON.stringify({
        ...headers,
        Authorization: headers['Authorization'] ? 'Bearer [REDACTED]' : 'none'
      }, null, 2));
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      console.log('fetchUser - Response status:', response.status);
      console.log('fetchUser - Response headers:', JSON.stringify([...response.headers.entries()]));
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to read error response');
        console.error('fetchUser - Error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: apiUrl,
          requestMethod: 'GET',
          requestHeaders: headers
        });
        
        // If unauthorized, clear the auth state
        if (response.status === 401) {
          console.log('fetchUser - Unauthorized, clearing auth state');
          dispatch(clearAuth());
        }
        
        throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('fetchUser - Response data:', {
        hasUser: !!data?.user,
        userId: data?.user?.user_id,
        hasAccessToken: !!data?.accessToken,
        responseKeys: Object.keys(data)
      });

      if (data?.user) {
        // Spread the user object to match the expected type
        const { user_id: _userId, ...userData } = data.user;
        dispatch(updateUser(userData));
        return data.user;
      } else {
        console.error('fetchUser - No user data in response:', data);
        throw new Error('No user data in response');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user';
      console.error('Failed to fetch user:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, accessToken, setError, setIsLoading, user]);

  // Login with email and password
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    console.log('Login request:', {
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      hasCredentials: true,
      email: email
    });
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`,
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

      const responseData = await response.json() as LoginResponse;
      
      if (responseData.success && responseData.data) {
        const { user, tokens } = responseData.data;
        
        dispatch(setAuth({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: 3600 // Default expiry time
        }));
        
        // Save refresh token to localStorage (access token stays in memory)
        if (typeof window !== 'undefined') {
          localStorage.setItem('refreshToken', tokens.refreshToken);
        }
        
        return { success: true };
      }
      throw new Error('Invalid response format');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('Login error:', errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  /**
   * Logout the current user
   */
  const logout = useCallback(async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(clearAuth());
      const redirectTo = searchParams.get('next') || '/';
      router.push(redirectTo);
    }
  }, [dispatch, router, searchParams]);

  // Check auth status on mount and when accessToken changes
  useEffect(() => {
    console.log('useEffect - accessToken changed, fetching user data');
    fetchUser();
  }, [fetchUser, accessToken]);

  // Handle token refresh
  const refreshToken = useCallback(async (): Promise<{ success: boolean; accessToken?: string; error?: string }> => {
    try {
      const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      if (!storedRefreshToken) {
        console.log('No refresh token available');
        return { success: false, error: 'No refresh token available' };
      }

      console.log('Attempting to refresh access token');
      const response = await refreshTokenApi();
      
      if (response?.success && response.accessToken) {
        console.log('Successfully refreshed access token');
        return { success: true, accessToken: response.accessToken };
      }
      
      console.error('Failed to refresh token:', response?.error || 'Unknown error');
      return { success: false, error: response?.error || 'Failed to refresh token' };
    } catch (error) {
      console.error('Error refreshing token:', error);
      return { success: false, error: 'Error refreshing token' };
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for tokens in localStorage
        const storedAccessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

        // If we have tokens in localStorage but not in Redux, update Redux
        if ((storedAccessToken || storedRefreshToken) && !accessToken) {
          // Only update if we have a valid access token
          if (storedAccessToken) {
            // Try to fetch user data with the stored token
            const userData = await fetchUser();
            if (!userData) {
              // If fetch fails, clear invalid tokens
              dispatch(clearAuth());
            }
          } else if (storedRefreshToken) {
            // If only refresh token exists, try to get a new access token
            try {
              const response = await refreshToken();
              if (response.success && response.accessToken) {
                // Update tokens in Redux and localStorage
                dispatch(updateAccessToken(response.accessToken));
                if (typeof window !== 'undefined') {
                  localStorage.setItem('accessToken', response.accessToken);
                }
                // Fetch user data with the new token
                await fetchUser();
              } else {
                // If refresh fails, clear auth state
                dispatch(clearAuth());
              }
            } catch (err) {
              console.error('Failed to refresh token:', err);
              dispatch(clearAuth());
            }
          }
        } else if (!storedAccessToken && !storedRefreshToken) {
          // No tokens available, ensure we're logged out
          dispatch(clearAuth());
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        dispatch(clearAuth());
      }
    };

    initializeAuth();
  }, [fetchUser, accessToken, dispatch, refreshToken]);

  // Debug log when auth state changes
  useEffect(() => {
    console.log('Auth state changed:', { 
      user, 
      accessToken,
      isAuthenticated: Boolean(accessToken && user?.user_id), 
      isLoading 
    });
  }, [user, accessToken, isLoading]);

  return {
    user,
    accessToken,
    isLoading,
    error,
    isAuthenticated: Boolean(accessToken && user?.user_id),
    login,
    logout,
    refreshUser: fetchUser,
  };
};

export default useAuth;
