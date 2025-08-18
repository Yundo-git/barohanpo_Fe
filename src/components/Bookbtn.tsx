"use client";

import React from "react";
import { useReservationSlots } from "../hooks/useReservationSlots";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

interface BookbtnProps {
  pharmacyId: number;
}

export default function Bookbtn({ pharmacyId }: BookbtnProps) {
  const { slots, loading, error } = useReservationSlots(pharmacyId);
  const router = useRouter();
  const today = dayjs().format("YYYY-MM-DD");

  const handleReserveClick = () => {
    router.push(`/reserve/${pharmacyId}?date=${today}`);
  };

  if (loading) return <p className="text-sm text-gray-500 px-2">로딩 중...</p>;
  if (error) return <p className="text-sm text-red-500 px-2">에러 발생</p>;
  if (!slots.length)
    return <p className="text-sm text-gray-400 px-2">예약 정보 없음</p>;

  // Check if today is available for reservation
  const isTodayAvailable = slots.some(
    (slot) => slot.date === today && Number(slot.is_available) === 1
  );

  return (
    <div className="px-2 pb-2">
      <button
        onClick={handleReserveClick}
        disabled={!isTodayAvailable}
        className={`py-2 px-4 rounded-md font-medium text-sm ${
          isTodayAvailable
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {isTodayAvailable ? "예약" : "오늘 예약 불가"}
      </button>
    </div>
  );
}
