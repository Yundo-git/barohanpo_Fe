// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import pharmacyReducer from "./pharmacySlice";
import userReducer from "./userSlice";

// 리듀서들을 결합
const rootReducer = combineReducers({
  pharmacy: pharmacyReducer,
  user: userReducer,
});

// persist 설정
const persistConfig = {
  key: "root", // 저장소에 저장될 때의 키 값
  storage, // 로컬 스토리지 사용
  whitelist: ["pharmacy", "user"], // 유지하고 싶은 리듀서만 명시
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
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

// 타입 정의
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 타입이 지정된 훅들
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// store는 named export로 유지
