"use client";

import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import "react-calendar/dist/Calendar.css";
import { Value } from "react-calendar/dist/shared/types.js";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { useReservation } from "@/hooks/useReservation";
import type { Pharmacy } from "@/types/pharmacy";

interface Props {
  p_id: string;
}

type AvailableDate = {
  is_availabl?: string;
  is_available?: boolean;
  [key: string]: any;
};
export default function ReserveDetailPage({ p_id }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [availableSlots, setAvailableSlots] = useState<
    Record<string, string[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Redux에서 약국 목록 가져오기
  const pharmacies = useSelector(
    (state: RootState) => state.pharmacy.pharmacies
  );
  const currentPharmacy = pharmacies.find((pha: Pharmacy) => pha.p_id === p_id);

  // 로그인된 유저 정보 가져오기 (세션에서)
  const userData = localStorage.getItem("test_user");
  const user = userData ? JSON.parse(userData) : null;
  const userId = user?.user_id;
  console.log(userId);

  const { handleReservation } = useReservation(p_id);

  // 예약 가능한 날짜/시간 가져오기
  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservation/${p_id}/available-dates`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`API 요청 실패: ${res.status}`);

        const data = await res.json();
        const slots: Record<string, string[]> = {};
        const rawData = Array.isArray(data) ? data : data?.dates || [];
        console.log("type", rawData);
        const availableItems = rawData.filter(
          (item: AvailableDate) =>
            item.is_availabl === "1" || item.is_available === true
        );

        availableItems.forEach((item: AvailableDate) => {
          slots[item.date] = item.times || [];
        });

        setAvailableSlots(slots);
      } catch (error) {
        console.error("예약 가능한 날짜를 불러오는 데 실패했습니다", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableDates();
  }, [p_id]);

  const availableTimes = selectedDate
    ? availableSlots[format(selectedDate, "yyyy-MM-dd")] || []
    : [];

  useEffect(() => {
    const dateStr = searchParams.get("date");
    if (dateStr) setSelectedDate(parseISO(dateStr));
  }, [searchParams]);

  const handleDateChange = (value: Value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
      const formatted = format(value, "yyyy-MM-dd");
      router.replace(`/reserve/${p_id}?date=${formatted}`);
    }
  };

  if (isLoading)
    return <p className="p-4">예약 가능한 날짜를 불러오는 중...</p>;
  if (Object.keys(availableSlots).length === 0)
    return <p className="p-4">예약 가능한 날짜가 없습니다.</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">
        {currentPharmacy?.name || "약국 정보"}
      </h2>

      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        minDate={new Date()}
        calendarType="gregory"
        locale="ko-KR"
        tileDisabled={({ date }) => {
          const dateStr = format(date, "yyyy-MM-dd");
          return !Object.keys(availableSlots).includes(dateStr);
        }}
        tileClassName={({ date }) =>
          selectedDate?.toDateString() === date.toDateString()
            ? "bg-blue-600 text-white rounded-full"
            : undefined
        }
      />

      {selectedDate && (
        <div className="mt-6">
          <h3 className="text-md font-medium mb-3">예약 시간 선택</h3>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {["09:00", "10:00", "11:00", "14:00", "15:00"].map((time) => {
              const isAvailable = availableTimes.includes(time);
              const isSelected = selectedTime === time;

              return (
                <button
                  key={time}
                  onClick={() =>
                    isAvailable && setSelectedTime(isSelected ? null : time)
                  }
                  disabled={!isAvailable}
                  className={`py-2 px-4 rounded-md text-center transition-colors ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : isAvailable
                      ? "bg-gray-100 hover:bg-gray-200 text-gray-800"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              if (!userId) {
                alert("로그인이 필요합니다.");
                return;
              }
              handleReservation(userId, selectedDate, selectedTime);
            }}
            disabled={!selectedTime}
            className={`w-full py-3 px-4 rounded-lg font-medium ${
              selectedTime
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            } transition-colors`}
          >
            {selectedTime
              ? `${format(
                  selectedDate,
                  "yyyy년 MM월 dd일"
                )} ${selectedTime} 예약하기`
              : "시간을 선택해주세요"}
          </button>
        </div>
      )}
    </div>
  );
}
