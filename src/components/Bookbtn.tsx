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

  const handleClick = (date: string) => {
    router.push(`/reserve/${pharmacyId}?date=${date}`);
  };

  if (loading) return <p className="text-sm text-gray-500 px-2">로딩 중...</p>;
  if (error) return <p className="text-sm text-red-500 px-2">에러 발생</p>;
  if (!slots.length)
    return <p className="text-sm text-gray-400 px-2">예약 정보 없음</p>;

  return (
    <div className="overflow-x-auto scrollbar-hide px-2 pb-2">
      <div className="flex gap-2 min-w-max">
        {slots.map((slot) => {
          const isToday = slot.date === today;
          const label = isToday
            ? "오늘 예약 가능"
            : `${dayjs(slot.date).format("MM/DD")} 예약`;

          return (
            <button
              key={slot.date}
              disabled={!slot.is_available}
              onClick={() => handleClick(slot.date)}
              className={`whitespace-nowrap px-3 py-1 text-xs rounded-full border font-medium
                ${
                  slot.is_available
                    ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
                    : "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                }
              `}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
