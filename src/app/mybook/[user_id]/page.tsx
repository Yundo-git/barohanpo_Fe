"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

export default function MyBook() {
  const user = useSelector((state: RootState) => state.user.user);
  return (
    <div>
      <h1>My Book</h1>
      <h2>{user?.name}의 예약 내역입니다.</h2>
    </div>
  );
}
