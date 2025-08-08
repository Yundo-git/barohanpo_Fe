// src/store/store.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // ✅ 동기 import
import userReducer from "./userSlice";
import pharmacyReducer from "./pharmacySlice";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

const rootReducer = combineReducers({
  user: userReducer,
  pharmacy: pharmacyReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ReturnType<typeof store.dispatch>;

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["user", "pharmacy"],
  // 커스텀 stateReconciler는 가급적 제거(기본 merge로 충분). 꼭 필요하면 타입 안전하게 작성
};

const persistedReducer = persistReducer<RootState>(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== "production",
  middleware: (gDM) =>
    gDM({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

// typed hooks
export type AppStore = typeof store;
export type AppDispatchType = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatchType>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
