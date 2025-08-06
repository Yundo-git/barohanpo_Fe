// src/store/Provider.tsx
"use client";
import { Provider, useDispatch } from "react-redux";
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor, useAppDispatch } from "./store";
import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// 로딩 컴포넌트
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// 인증 상태를 처리하는 컴포넌트
const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // useAuth 훅의 로직을 직접 구현
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    setIsClient(true);
    
    // 인증 상태 확인 함수
    const checkAuth = async () => {
      try {
        // 여기에 인증 확인 로직 구현 (예: localStorage에서 토큰 확인)
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        if (token) {
          // 토큰이 있으면 유저 정보 가져오기
          // 예: await dispatch(fetchUserProfile());
        }
      } catch (error) {
        console.error('인증 확인 중 오류 발생:', error);
      }
    };
    
    // 라우트 변경 감지
    const handleRouteChange = () => {
      console.log('Route changed');
    };
    
    // 초기 로드 시 인증 확인
    checkAuth();
    
    // 클린업 함수
    return () => {
      // 필요한 클린업 로직
    };
  }, [dispatch]);
  
  // 서버 사이드 렌더링 시에는 아무것도 렌더링하지 않음
  if (!isClient) return null;
  
  return <>{children}</>;
};

interface ProvidersProps {
  children: ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // 컴포넌트가 마운트된 후에만 상태를 업데이트
    setMounted(true);
    
    // Redux 상태 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      const unsubscribe = store.subscribe(() => {
        console.log('Redux 상태 업데이트:', store.getState());
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, []);
  
  // 컴포넌트가 마운트될 때까지 로딩 표시
  if (!mounted) return <Loading />;
  
  return (
    <Provider store={store}>
      <PersistGate 
        loading={<Loading />}
        persistor={persistor}
        onBeforeLift={() => {
          // 재수화가 완료된 후 실행
          console.log('Redux 상태가 재수화되었습니다.');
        }}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </PersistGate>
    </Provider>
  );
};

export default Providers;
