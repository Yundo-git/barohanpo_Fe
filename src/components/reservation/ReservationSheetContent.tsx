// src/components/reservation/ReservationSheetContent.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format, parseISO } from "date-fns";
import ReservationCompleteSheet from "./ReservationCompleteSheet";
import type { Value } from "react-calendar/dist/shared/types.js";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { useReservation } from "@/hooks/useReservation";

interface Props {
  pharmacyId: number;
  pharmacyName?: string;
  /** 'YYYY-MM-DD' 형태 */
  initialDate?: string;
  onClose: () => void;
}

/** API: { date: "2025-09-08", time: "15:00:00", is_available: 1 } */
type ApiSlot = {
  date: string;
  time: string; // "HH:mm:ss"
  is_available: number; // 1 가능, 0 불가
};

/** date -> time(HH:mm) -> available */
type SlotMap = Record<string, Record<string, boolean>>;

// 간단한 슬롯 캐시 (pharmacyId + 조회 범위 기준)
type SlotCacheItem = {
  slots: SlotMap;
  rangeStart: string; // yyyy-MM-dd
  rangeEnd: string; // yyyy-MM-dd
  fetchedAt: number; // ms
};
const slotCache: Map<number, SlotCacheItem> = new Map();

export default function ReservationSheetContent({
  pharmacyId,
  pharmacyName,
  initialDate,
  onClose,
}: Props) {
  const [availableSlots, setAvailableSlots] = useState<SlotMap>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isReservationComplete, setIsReservationComplete] =
    useState<boolean>(false);
  // 고정 노출 슬롯
  const fixedTimeSlots: string[] = [
    "09:00",
    "10:00",
    "11:00",
    "14:00",
    "15:00",
    "16:00",
  ];

  // 로그인 유저
  const userId = useSelector((state: RootState) => state.user.user?.user_id);
  const { handleReservation } = useReservation(String(pharmacyId), {
    onSuccess: () => {
      setIsReservationComplete(true);
    },
  });

  // 오늘 ~ 7일(포함) 범위 계산
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const maxSelectableDate = new Date(todayStart);
  maxSelectableDate.setDate(maxSelectableDate.getDate() + 6); // 오늘 포함 7일 간

  // 현재 시간(분) & 오늘 문자열
  const nowHM: number = today.getHours() * 60 + today.getMinutes();
  const todayStr: string = format(todayStart, "yyyy-MM-dd");

  // HH:mm -> 총 분으로 변환
  const toHM = (t: string): number => {
    const [h, m] = t.split(":").map((n) => Number(n));
    return h * 60 + m;
  };

  // 해당 슬롯이 "미래"인지 판정 (오늘만 시간 비교, 그 외 날짜는 모두 미래로 간주)
  const isFutureSlot = (dateStr: string, hhmm: string): boolean => {
    if (dateStr !== todayStr) return true;
    return toHM(hhmm) > nowHM;
  };

  // 초기 날짜 적용
  useEffect(() => {
    if (!initialDate) return;
    try {
      setSelectedDate(parseISO(initialDate));
    } catch {
      // ignore
    }
  }, [initialDate]);

  // 데이터 로드 (캐시 사용)
  useEffect(() => {
    const fetchAndProcessDates = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const rangeStart = format(todayStart, "yyyy-MM-dd");
        const rangeEnd = format(maxSelectableDate, "yyyy-MM-dd");
        const cached = slotCache.get(pharmacyId);
        if (
          cached &&
          cached.rangeStart === rangeStart &&
          cached.rangeEnd === rangeEnd
        ) {
          setAvailableSlots(cached.slots);
          setIsLoading(false);
          return;
        }

        const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservation/${pharmacyId}/available-dates`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`API 요청 실패: ${res.status}`);
        const data: ApiSlot[] = await res.json();

        const slots: SlotMap = {};
        data.forEach(({ date, time, is_available }) => {
          const hhmm = time.slice(0, 5); // "15:00:00" -> "15:00"
          if (!slots[date]) slots[date] = {};
          // 고정 슬롯만 관리(혹시 API가 다른 시간 내려줘도 필터)
          if (fixedTimeSlots.includes(hhmm)) {
            slots[date][hhmm] = is_available === 1;
          }
        });

        setAvailableSlots(slots);
        slotCache.set(pharmacyId, {
          slots,
          rangeStart,
          rangeEnd,
          fetchedAt: Date.now(),
        });
      } catch (e) {
        console.error("예약 가능 날짜 로드 실패:", e);
        setAvailableSlots({});
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAndProcessDates();
  }, [
    pharmacyId,
    fixedTimeSlots.join(","),
    todayStart.getTime(),
    maxSelectableDate.getTime(),
  ]);

  // 선택 가능한 날짜(오늘~7일) 중에서 "미래 기준으로 true 슬롯이 하나라도 있는 날짜"만 허용
  const enabledDateSet = useMemo((): Set<string> => {
    const set = new Set<string>();
    const minTs = todayStart.getTime();
    const maxTs = maxSelectableDate.getTime();

    for (const [dateStr, timesMap] of Object.entries(availableSlots)) {
      const d = new Date(`${dateStr}T00:00:00`);
      const ts = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      if (ts < minTs || ts > maxTs) continue;

      const hasAnyAvailable = Object.entries(timesMap ?? {}).some(
        ([t, ok]) => ok && isFutureSlot(dateStr, t)
      );
      if (hasAnyAvailable) set.add(dateStr);
    }
    return set;
  }, [
    availableSlots,
    todayStr,
    nowHM,
    todayStart.getTime(),
    maxSelectableDate.getTime(),
  ]);

  // 선택된 날짜의 시간 리스트(오늘이면 과거 시간 제거)
  const availableTimes = useMemo((): Array<{
    time: string;
    isAvailable: boolean;
  }> => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    // 선택된 날짜가 아예 비활성(주차 외/가용 없음)이면 빈 배열
    if (!enabledDateSet.has(dateStr)) return [];
    return fixedTimeSlots.map((t) => {
      const ok = availableSlots[dateStr]?.[t] ?? false;
      const future = isFutureSlot(dateStr, t);
      return { time: t, isAvailable: ok && future };
    });
  }, [
    selectedDate,
    availableSlots,
    enabledDateSet,
    nowHM,
    fixedTimeSlots.join(","),
  ]);

  // 날짜 변경
  const onDateChange = (v: Value): void => {
    if (v instanceof Date) {
      setSelectedDate(v);
      setSelectedTime(null);
    }
  };

  // 시간이 지나 선택된 슬롯이 과거가 되면 자동 해제
  useEffect(() => {
    if (!selectedDate || !selectedTime) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    if (!isFutureSlot(dateStr, selectedTime)) {
      setSelectedTime(null);
    }
  }, [selectedDate, selectedTime, nowHM]);

  if (isLoading) {
    return (
      <div className="p-4 text-center">예약 가능한 날짜를 불러오는 중...</div>
    );
  }

  if (isReservationComplete && selectedDate && selectedTime) {
    return (
      <ReservationCompleteSheet
        date={format(selectedDate, "yyyy년 MM월 dd일")}
        time={selectedTime}
        pharmacyName={pharmacyName}
      />
    );
  }

  if (enabledDateSet.size === 0) {
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
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Calendar */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100">
          <Calendar
            onChange={onDateChange}
            value={selectedDate}
            minDate={todayStart}
            maxDate={maxSelectableDate}
            calendarType="gregory"
            locale="ko-KR"
            /** is_available=0(=그 날짜 내에 미래 true 슬롯이 하나도 없음) 이거나 7일 범위 밖이면 비활성화 */
            tileDisabled={({ date }) => {
              const dateStr = format(date, "yyyy-MM-dd");
              return !enabledDateSet.has(dateStr);
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

        {/* Time Buttons */}
        {selectedDate && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3 p-2">
                {availableTimes.map(({ time, isAvailable }) => {
                  const selected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(selected ? null : time)}
                      disabled={!isAvailable}
                      className={[
                        "py-2 px-4 rounded-md text-center transition-colors font-medium",
                        selected
                          ? "bg-blue-600 text-white"
                          : !isAvailable
                          ? "bg-gray-50 text-gray-300 border border-gray-200 cursor-not-allowed"
                          : "bg-white hover:bg-gray-50 text-gray-800 border border-gray-200",
                      ].join(" ")}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action */}
            <div className="bg-white p-4">
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

                    const dateStr = format(selectedDate, "yyyy-MM-dd");
                    if (!isFutureSlot(dateStr, selectedTime)) {
                      alert(
                        "이미 지난 시간대입니다. 다른 시간을 선택해주세요."
                      );
                      setSelectedTime(null);
                      return;
                    }

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
