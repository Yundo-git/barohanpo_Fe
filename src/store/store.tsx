// src/store/store.ts
import { configureStore, Action, Middleware, UnknownAction } from "@reduxjs/toolkit";
import { persistStore, persistReducer, createTransform } from "redux-persist";
import { WebStorage } from 'redux-persist/es/types';
import { combineReducers } from "redux";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { ThunkAction } from "redux-thunk";
import pharmacyReducer from "./pharmacySlice";
import userReducer from "./userSlice";
import { PharmacyWithUser } from "@/types/pharmacy";

// Define the UserData interface
export interface UserData {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  [key: string]: unknown;
}

// Define the PharmacyState interface
export interface PharmacyState {
  pharmacies: PharmacyWithUser[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  lastLocation: { lat: number; lng: number } | null;
  lat?: number;
  lng?: number;
}

// Define the UserState interface
export interface UserState {
  user: UserData | null;
  accessToken: string | null;
  lastUpdated: number | null;
}

// Create a noop storage for server-side rendering
const createNoopStorage = (): WebStorage => ({
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
});

// Initialize storage with noop by default
let storage: WebStorage = createNoopStorage();

// In browser environment, try to use web storage
if (typeof window !== 'undefined') {
  import('redux-persist/lib/storage/createWebStorage')
    .then(({ default: createWebStorage }) => {
      storage = createWebStorage('local');
    })
    .catch(() => {
      console.warn('Using noop storage as fallback');
    });
}

// State interfaces are now defined at the top of the file

// 리듀서들을 결합
const rootReducer = combineReducers({
  pharmacy: pharmacyReducer,
  user: userReducer,
});

// Define the shape of the persisted state
interface PersistedRootState extends RootState {
  _persist: {
    version: number;
    rehydrated: boolean;
  };
}

// Persist configuration
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["user", "pharmacy"], // user와 pharmacy 상태 모두 유지
  version: 1,
  // 상태 재수화를 위한 리콘실리에이터
  stateReconciler: (inboundState: any, originalState: any) => {
    if (!inboundState) return originalState;
    
    // 상태가 존재하는 경우에만 병합
    const newState = { ...originalState };
    
    if (inboundState.user) {
      newState.user = {
        ...originalState.user,
        ...inboundState.user,
        // 중요한 필드가 누락되지 않도록 보장
        user: inboundState.user.user || originalState.user.user,
        accessToken: inboundState.user.accessToken || originalState.user.accessToken,
        lastUpdated: inboundState.user.lastUpdated || originalState.user.lastUpdated
      };
    }
    
    if (inboundState.pharmacy) {
      newState.pharmacy = {
        ...originalState.pharmacy,
        ...inboundState.pharmacy,
        // 중요한 필드 유지
        lastFetched: inboundState.pharmacy.lastFetched || originalState.pharmacy.lastFetched,
        lastLocation: inboundState.pharmacy.lastLocation || originalState.pharmacy.lastLocation
      };
    }
    
    return newState;
  },
  // 상태 마이그레이션 처리
  migrate: async (state: unknown): Promise<PersistedRootState> => {
    try {
      if (!state) return undefined as unknown as PersistedRootState;
      
      // 여기에 마이그레이션 로직 추가 (필요한 경우)
      // 예: 상태 구조가 변경된 경우 변환 로직 작성
      
      return state as PersistedRootState;
    } catch (err) {
      console.error('상태 마이그레이션 중 오류:', err);
      return undefined as unknown as PersistedRootState;
    }
  },
  debug: process.env.NODE_ENV === 'development',
  // 직렬화 검사 비활성화 (복잡한 객체를 다룰 때 유용)
  serialize: false,
  deserialize: false,
  // 쓰기 타임아웃 설정 (ms 단위)
  timeout: 5000,
  // 쓰기 큐 사이즈 제한
  writeFailHandler: (err: Error) => {
    console.error('상태 저장 실패:', err);
  }
};

// Create persisted reducer with proper typing
const persistedReducer = persistReducer<ReturnType<typeof rootReducer>>(persistConfig, rootReducer);

// Define root state type
export type RootState = ReturnType<typeof rootReducer>;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

// Custom middleware for logging
export const logger: Middleware = (store) => (next) => (action: unknown) => {
  if (process.env.NODE_ENV === "development") {
    const typedAction = action as UnknownAction;
    console.group(typedAction.type);
    console.info("dispatching", typedAction);
    const result = next(typedAction);
    console.log("next state", store.getState());
    console.groupEnd();
    return result;
  }
  return next(action as UnknownAction);
};

// 스토어 생성
export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(logger),
});

export const persistor = persistStore(store);

// 타입 정의
export type AppDispatch = typeof store.dispatch;

// 타입이 지정된 훅들
export const useAppDispatch = (): AppDispatch => {
  const dispatch = useDispatch<AppDispatch>();
  return dispatch;
};

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// store는 named export로 유지
