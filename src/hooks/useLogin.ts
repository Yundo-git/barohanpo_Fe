import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { setAuth } from '@/store/userSlice';
import { login as loginApi } from '@/services/authService';

interface LoginParams {
  email: string;
  password: string;
}

interface UseLoginReturn {
  login: (credentials: LoginParams) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

/**
 * 로그인 기능을 처리하는 커스텀 훅
 * - 로그인 성공 시 Redux 스토어에 사용자 정보와 토큰을 저장
 * - 로그인 실패 시 에러 메시지 반환
 */
const useLogin = (): UseLoginReturn => {
  const dispatch = useDispatch<AppDispatch>();

  const login = useCallback(
    async (loginData: LoginParams) => {
      try {
        if (!loginData?.email || !loginData?.password) {
          return { success: false, error: '이메일과 비밀번호를 입력해주세요.' };
        }

        const result = await loginApi(loginData.email, loginData.password);
        
        if (result?.success && result?.data) {
          const { user, accessToken, refreshToken, expiresIn } = result.data;
          
          try {
            // Redux에 사용자 정보와 토큰 저장
            dispatch(
              setAuth({
                user,
                accessToken,
                refreshToken,
                expiresIn,
              })
            );
            
            console.log('Login successful, user:', user);
            return { success: true };
          } catch (dispatchError) {
            console.error('Error dispatching setAuth:', dispatchError);
            return { 
              success: false, 
              error: '로그인 상태를 저장하는 중 오류가 발생했습니다.' 
            };
          }
        }
        
        return { 
          success: false, 
          error: result?.error || '로그인에 실패했습니다.' 
        };
      } catch (error) {
        console.error('Login error:', error);
        return { 
          success: false, 
          error: (error as Error)?.message || '로그인 처리 중 오류가 발생했습니다.' 
        };
      };
    }
  , [dispatch]);

  return { login };
};

export default useLogin;
