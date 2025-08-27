// src/components/Bookbtn.tsx
"use client";

import React, { useMemo } from "react";
import dayjs from "dayjs";
import { useReservationSlots } from "../hooks/useReservationSlots";

type DayAvailability = { date: string; is_available: number };

interface BookbtnProps {
  pharmacyId: number;
  /** 부모(KakaoMap)에서 바텀시트 내용을 예약 뷰로 전환 */
  onReserve: (pharmacyId: number, date: string) => void;
  className?: string;
  label?: string;
}

export default function Bookbtn({
  pharmacyId,
  onReserve,
  className,
  label,
}: BookbtnProps) {
  const { slots, loading, error } = useReservationSlots(pharmacyId);
  const today = dayjs().format("YYYY-MM-DD");

  const typedSlots = useMemo<DayAvailability[]>(
    () =>
      slots.map((slot) => ({
        date: slot.date,
        is_available: slot.is_available ? 1 : 0,
      })),
    [slots]
  );

  const isTodayAvailable = useMemo(
    () =>
      typedSlots.some((slot) => slot.date === today && slot.is_available === 1),
    [typedSlots, today]
  );

  const handleClick = () => {
    // '오늘'이 불가해도 바텀시트로 들어가 다른 날짜 선택 가능해야 하므로 항상 호출
    console.log("클릭!");
    onReserve(pharmacyId, today);
  };

  if (loading) return <p className="text-sm text-gray-500 px-2">로딩 중...</p>;
  if (error) return <p className="text-sm text-red-500 px-2">에러 발생</p>;
  if (!typedSlots.length)
    return <p className="text-sm text-gray-400 px-2">예약 정보 없음</p>;

  return (
    <div className={["px-2 pb-2", className ?? ""].join(" ")}>
      <button
        onClick={handleClick}
        className=" rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        {label ?? (isTodayAvailable ? "예약" : "예약 가능일 확인")}
      </button>
    </div>
  );
}
