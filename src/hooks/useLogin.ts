import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { setAuth } from "@/store/userSlice";
import { fetchReservations, fetchCancelList } from "@/store/bookingSlice";
import { fetchCompletedReviewIds } from "@/store/reviewCompletionSlice";
import { fetchUserReviews } from "@/store/userReviewsSlice";
import { login as loginApi } from "@/services/authService";
// import { User } from "@/types/user";

interface LoginParams {
  email: string;
  password: string;
}

// interface LoginResponseData {
//   user: User;
//   accessToken: string;
//   refreshToken: string;
// }

// interface LoginResponse {
//   success: boolean;
//   data?: LoginResponseData;
//   error?: string;
// }

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

  const login = useCallback<UseLoginReturn['login']>(
    async (loginData) => {
      console.log('useLogin - Login attempt with email:', loginData.email);
      
      try {
        if (!loginData?.email || !loginData?.password) {
          console.log('useLogin - Missing email or password');
          return { success: false, error: "이메일과 비밀번호를 입력해주세요." };
        }

        console.log('useLogin - Calling login API...');
        const result = await loginApi(loginData.email, loginData.password);
        console.log('useLogin - API response:', JSON.stringify(result, null, 2));

        if (result?.success && result.data) {
          // Extract user and tokens from the response
          const { user, tokens } = result.data;
          const accessToken = tokens?.accessToken;
          const refreshToken = tokens?.refreshToken;
          
          console.log('useLogin - Extracted auth data:', {
            hasAccessToken: !!accessToken,
            accessTokenLength: accessToken?.length || 0,
            hasRefreshToken: !!refreshToken,
            hasUser: !!user
          });
          
          if (!accessToken) {
            console.error('useLogin - No access token in response');
            return { success: false, error: '서버로부터 인증 토큰을 받지 못했습니다.' };
          }

          try {
            // Save user info and tokens to Redux
            dispatch(
              setAuth({
                user,
                accessToken,
                refreshToken: refreshToken || '',
                expiresIn: 3600 // 1 hour
              })
            );
            
            // Set the access token in localStorage for persistence
            if (typeof window !== 'undefined') {
              localStorage.setItem('accessToken', accessToken);
            }
            
            console.log('useLogin - Auth state updated in Redux', {
              userId: user?.user_id,
              accessTokenSet: !!accessToken,
              tokenLength: accessToken?.length
            });
            // 로그인 직후 예약/취소내역 선조회하여 Redux에 저장
            if (user?.user_id) {
              const uid = Number(user.user_id);
              await Promise.all([
                dispatch(fetchReservations({ userId: uid })),
                dispatch(fetchCancelList({ userId: uid })),
                dispatch(fetchCompletedReviewIds({ userId: uid })),
                dispatch(fetchUserReviews({ userId: uid })),
              ]);
            }

            console.log("Login successful, user:", user);
            return { success: true };
          } catch (dispatchError) {
            console.error("Error dispatching setAuth:", dispatchError);
            return {
              success: false,
              error: "로그인 상태를 저장하는 중 오류가 발생했습니다.",
            };
          }
        }

        return {
          success: false,
          error: result?.error || "로그인에 실패했습니다.",
        };
      } catch (error) {
        console.error("Login error:", error);
        return {
          success: false,
          error:
            (error as Error)?.message || "로그인 처리 중 오류가 발생했습니다.",
        };
      }
    },
    [dispatch]
  );

  return { login };
};

export default useLogin;
