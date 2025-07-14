// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import pharmacyReducer from "./pharmacySlice";

// 리듀서들을 결합
const rootReducer = combineReducers({
  pharmacy: pharmacyReducer,
});

// persist 설정
const persistConfig = {
  key: 'root', // 저장소에 저장될 때의 키 값
  storage, // 로컬 스토리지 사용
  whitelist: ['pharmacy'], // 유지하고 싶은 리듀서만 명시
};

// 영속화된 리듀서 생성
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 스토어 생성
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // redux-persist의 액션 타입을 직렬화 검사에서 제외
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// store는 named export로 유지
