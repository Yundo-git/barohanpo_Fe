"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

//리덕스 스토어 에러 발생 중 해당 페이지 수정 필요
//user_id를 props로 받아와야 함
//예약 내역 조회 hook 필요
//예약 내역 조회 후 화면 구성 필요
//예약 내역 조회 후 예약 내역이 없을 경우 화면 구성 필요


export default function MyBook() {
  const user = useSelector((state: RootState) => state.user.user);
  return (
    <div>
      <h1>My Book</h1>
      <h2>{user?.name}의 예약 내역입니다.</h2>
      <h2>{user?.user_id}</h2>
    </div>
  );
}
