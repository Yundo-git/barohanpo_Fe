"use client";

import { useEffect, useState } from "react";
import useGetBook from "@/hooks/useGetBook";
import BookList from "@/components/BookList";
import Tab from "@/components/Tab";
import useGetCancelList from "@/hooks/useGetCancelList";
import CencelList from "@/components/CancelList";

//리덕스 스토어 에러 발생 중 해당 페이지 수정 필요
//user_id를 props로 받아와야 함
//예약 내역 조회 hook 필요
//예약 내역 조회 후 화면 구성 필요
//예약 내역 조회 후 예약 내역이 없을 경우 화면 구성 필요

export default function MyBook() {
  const { getBook } = useGetBook();
  const { getCancelList } = useGetCancelList();
  const [reservation, setReservation] = useState<any[]>([]);
  const [cancelList, setCancelList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getBook();
        const cancelData = await getCancelList();
        setReservation(data);
        setCancelList(cancelData);
      } catch (err) {
        console.error("예약 불러오기 실패:", err);
        setError("예약 내역을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [getBook, getCancelList]);

  if (isLoading) {
    return <div className="p-4 text-center">로딩 중...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500 text-center">{error}</div>;
  }

  if (!reservation || reservation.length === 0) {
    return <div className="p-4 text-center">예약 내역이 없습니다.</div>;
  }

  return (
    
<Tab
  items={[
    {
      key: "bookList",
      label: "예약내역",
      component:       <BookList reservation={reservation} />,
    },
    {
      key: "cancel",
      label: "예약 취소",
      component: <CencelList cancelList={cancelList} />,
    },
  ]}
/>
    
  );
}
