"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import useGetBook from "@/hooks/useGetBook";
import { useEffect, useState } from "react";
import BookList from "@/components/BookList";

//리덕스 스토어 에러 발생 중 해당 페이지 수정 필요
//user_id를 props로 받아와야 함
//예약 내역 조회 hook 필요
//예약 내역 조회 후 화면 구성 필요
//예약 내역 조회 후 예약 내역이 없을 경우 화면 구성 필요

export default function MyBook() {
  const user = useSelector((state: RootState) => state.user.user);
  const { getBook } = useGetBook();
  const [reservation, setReservation] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getBook();
        setReservation(data); // 여기서 상태에 저장
      } catch (err) {
        console.error("예약 불러오기 실패:", err);
      }
    };

    fetchData();
  }, []);
  return (
    <div>
      <BookList user={user} reservation={reservation} />
    </div>
  );
}
