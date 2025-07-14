// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import pharmacyReducer from "./pharmacySlice"; // 너가 만든 슬라이스

export const store = configureStore({
  reducer: {
    pharmacy: pharmacyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
