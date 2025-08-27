// src/components/reservation/ReservationSheetContent.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format, parseISO } from "date-fns";
import type { Value } from "react-calendar/dist/shared/types.js";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { useReservation } from "@/hooks/useReservation";

interface Props {
  pharmacyId: number;
  pharmacyName?: string;
  /** 'YYYY-MM-DD' 형태 */
  initialDate: string;
  /** 닫기 또는 뒤로가기 동작 */
  onClose: () => void;
  onComplete: (date: string, time: string) => void;
}

type AvailableDate = {
  is_available?: number; // 1: 가능, 0: 불가
  date: string;
  times: string[];
};

export default function ReservationSheetContent({
  pharmacyId,
  pharmacyName,
  initialDate,
  onClose,
  onComplete,
}: Props) {
  const [availableSlots, setAvailableSlots] = useState<
    Record<string, string[]>
  >({});
  const [unavailableSlots, setUnavailableSlots] = useState<
    Record<string, string[]>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialDate ? new Date(initialDate) : null
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // 로그인 유저
  const userId = useSelector((state: RootState) => state.user.user?.user_id);
  const { handleReservation } = useReservation(String(pharmacyId));

  // 초기 날짜 적용
  useEffect(() => {
    if (initialDate) {
      try {
        setSelectedDate(parseISO(initialDate));
      } catch (error) {
        console.error("Failed to parse initial date:", error);
      }
    }
  }, [initialDate]);

  // 예약 가능한 날짜/시간 로드
  useEffect(() => {
    const fetchAndProcessDates = async () => {
      const defaultTimes = ["09:00", "10:00", "11:00", "14:00", "15:00"];

      try {
        setIsLoading(true);
        const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservation/${pharmacyId}/available-dates`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`API 요청 실패: ${res.status}`);
        const data = await res.json();

        const slots: Record<string, string[]> = {};
        const rawData: AvailableDate[] = Array.isArray(data)
          ? data
          : data?.dates ?? [];

        const newUnavailable: Record<string, string[]> = {};

        // 오늘~30일까지 기본 슬롯 초기화
        const currentDate = new Date();
        const next30 = new Date();
        next30.setDate(currentDate.getDate() + 30);

        for (
          let d = new Date(currentDate);
          d <= next30;
          d.setDate(d.getDate() + 1)
        ) {
          const dateStr = format(d, "yyyy-MM-dd");
          slots[dateStr] = [...defaultTimes];
        }

        // 응답 기반 가공
        rawData.forEach((item) => {
          const dateStr = item.date;
          if (item.is_available === 1) {
            if (item.times?.length) {
              slots[dateStr] = item.times;
            } else if (!slots[dateStr]) {
              slots[dateStr] = [...defaultTimes];
            }
          } else {
            if (item.times?.length) {
              if (!newUnavailable[dateStr]) newUnavailable[dateStr] = [];
              newUnavailable[dateStr].push(...item.times);
            }
          }
        });

        setAvailableSlots(slots);
        setUnavailableSlots(newUnavailable);
      } catch (e) {
        console.error("예약 가능 날짜 로드 실패:", e);
        setAvailableSlots({});
        setUnavailableSlots({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessDates();
  }, [pharmacyId]);

  const availableTimes = useMemo(
    () =>
      selectedDate
        ? availableSlots[format(selectedDate, "yyyy-MM-dd")] ?? []
        : [],
    [selectedDate, availableSlots]
  );

  const onDateChange = (v: Value) => {
    if (v instanceof Date) {
      setSelectedDate(v);
      setSelectedTime(null); // 날짜 바뀌면 시간 리셋
    }
  };

  if (isLoading)
    return (
      <div className="p-4 text-center">예약 가능한 날짜를 불러오는 중...</div>
    );
  if (Object.keys(availableSlots).length === 0)
    return (
      <div className="p-4">
        <header className="mb-3">
          <h2 className="text-base font-semibold">
            {pharmacyName ?? "약국"} 예약
          </h2>
        </header>
        <p>예약 가능한 날짜가 없습니다.</p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            닫기
          </button>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Calendar Section */}
        <div className="flex-shrink-0 bg-white ">
          <div className="border-b border-gray-100">
            <Calendar
              onChange={onDateChange}
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
                  ? "bg-red-600 text-white rounded-full"
                  : "hover:bg-gray-50 rounded-full"
              }
              formatShortWeekday={(_, date) =>
                ["일", "월", "화", "수", "목", "금", "토"][date.getDay()]
              }
              formatDay={(_, date) => date.getDate().toString()}
            />
          </div>
        </div>

        {/* Time Selection Section */}
        {selectedDate && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-2">
                {availableTimes.length > 0 ? (
                  availableTimes.map((time) => {
                    const currentDateStr = format(selectedDate, "yyyy-MM-dd");
                    const explicitlyUnavailable =
                      Array.isArray(unavailableSlots[currentDateStr]) &&
                      unavailableSlots[currentDateStr].includes(time);

                    const isAvailable =
                      Array.isArray(availableSlots[currentDateStr]) &&
                      availableSlots[currentDateStr].includes(time) &&
                      !explicitlyUnavailable;

                    const selected = selectedTime === time;

                    return (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(selected ? null : time)}
                        disabled={!isAvailable}
                        className={[
                          "py-2 px-4 rounded-md text-center transition-colors",
                          selected
                            ? "bg-blue-600 text-white"
                            : isAvailable
                            ? "bg-gray-100 hover:bg-gray-200 text-gray-800"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed",
                        ].join(" ")}
                      >
                        {time}
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-3 text-center py-4">
                    <p className="text-gray-500">
                      예약 가능한 시간이 없습니다.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className=" bottom-0 bg-white  p-4">
              <div className="flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  뒤로
                </button>
                <button
                  onClick={() => {
                    if (!userId) {
                      alert("로그인이 필요합니다.");
                      return;
                    }
                    if (!selectedDate || !selectedTime) return;
                    handleReservation(userId, selectedDate, selectedTime);
                  }}
                  disabled={!selectedTime}
                  className={[
                    "rounded-md px-4 py-2 text-sm font-medium",
                    selectedTime
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed",
                  ].join(" ")}
                >
                  {selectedTime
                    ? `${format(
                        selectedDate,
                        "yyyy년 MM월 dd일"
                      )} ${selectedTime} 예약하기`
                    : "시간을 선택해주세요"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
