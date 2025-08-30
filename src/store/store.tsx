// src/store/store.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer, createTransform } from "redux-persist";
import storage from "redux-persist/lib/storage"; // 동기 import
import userReducer, { UserState } from "./userSlice";
import pharmacyReducer from "./pharmacySlice";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

const rootReducer = combineReducers({
  user: userReducer,
  pharmacy: pharmacyReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

// Transform function to exclude accessToken from being persisted
const userTransform = createTransform<UserState, Partial<UserState>>(
  // Transform state to be persisted
  (inboundState) => {
    const { accessToken, ...stateWithoutToken } = inboundState;
    void accessToken; // Explicitly mark as unused
    return stateWithoutToken;
  },
  // Transform state being rehydrated
  (persistedState) => {
    return {
      ...persistedState,
      accessToken: null, // Always set accessToken to null on rehydration
    } as UserState;
  },
  // Only apply to the user slice
  { whitelist: ["user"] }
);

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["user", "pharmacy"],
  transforms: [userTransform],
};

const persistedReducer = persistReducer<RootState>(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export type AppStore = typeof store;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
