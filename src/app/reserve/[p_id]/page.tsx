"use client";

import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";

import "react-calendar/dist/Calendar.css";
import { Value } from "react-calendar/dist/shared/types.js";

interface Props {
  params: Promise<{ p_id: string }>;
}

export default function ReserveDetailPage({ params }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { p_id } = React.use(params);

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // 예약 가능한 날짜 가져오기
  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservation/${p_id}/available-dates`
        );
        const data = await res.json();
        setAvailableDates(data.dates); // 예: ["2025-07-14", "2025-07-15"]
      } catch (error) {
        console.error("예약 가능한 날짜를 불러오는 데 실패했습니다", error);
      }
    };
    fetchAvailableDates();
  }, [p_id]);

  // URL에서 date 쿼리 읽어서 초기값 설정
  useEffect(() => {
    const dateStr = searchParams.get("date");
    if (dateStr) {
      setSelectedDate(parseISO(dateStr));
    }
  }, [searchParams]);

  const handleDateChange = (value: Value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
      const formatted = format(value, "yyyy-MM-dd");
      router.replace(`/reserve/${p_id}?date=${formatted}`);
    }
  };
  if (!Array.isArray(availableDates) || availableDates.length === 0) {
    return <p className="p-4">예약 가능한 날짜를 불러오는 중...</p>;
  }
  return (
    <div className="p-4">
      <h1 className="text-lg font-bold">약국 예약 페이지</h1>
      <p className="mb-2">약국 ID: {p_id}</p>
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        minDate={new Date()}
        calendarType="gregory"
        locale="ko-KR"
        tileDisabled={({ date }) => {
          const dateStr = format(date, "yyyy-MM-dd");
          return !availableDates.includes(dateStr);
        }}
        tileClassName={({ date }) =>
          selectedDate?.toDateString() === date.toDateString()
            ? "bg-blue-600 text-white rounded-full"
            : undefined
        }
      />
    </div>
  );
}
