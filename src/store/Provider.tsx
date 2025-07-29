// src/store/Provider.tsx
"use client";
import { Provider } from "react-redux";
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from "./store";
import { ReactNode } from 'react';
import useAuth from "@/hooks/useAuth";

// AuthProvider 컴포넌트는 인증 상태를 관리합니다.
const AuthProvider = ({ children }: { children: ReactNode }) => {
  // useAuth 훅을 사용하여 인증 상태 및 토큰 갱신 로직을 초기화
  useAuth();
  
  return <>{children}</>;
};

interface ProvidersProps {
  children: ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </PersistGate>
    </Provider>
  );
};

export default Providers;
