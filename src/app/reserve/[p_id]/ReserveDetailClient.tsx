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
  is_available?: number; // 1 for available, 0 for unavailable
  date: string;
  times: string[];
};
export default function ReserveDetailPage({ p_id }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [availableSlots, setAvailableSlots] = useState<
    Record<string, string[]>
  >({});
  const [unavailableSlots, setUnavailableSlots] = useState<
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

  // 로그인된 유저 정보 가져오기 (리덕스에서)
  const user = useSelector((state: RootState) => state.user.user);
  console.log(user);
  const userId = user?.user_id;
  console.log(userId);
  console.log(user?.user_id);

  const { handleReservation } = useReservation(p_id);

  // 예약 가능한 날짜/시간 가져오기
  useEffect(() => {
    const fetchAvailableDates = async () => {
      // 기본 시간대 설정 (API에서 제공되지 않는 경우 사용)
      const defaultTimes = ["09:00", "10:00", "11:00", "14:00", "15:00"];
      console.log('Fetching available dates...');

      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservation/${p_id}/available-dates`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`API 요청 실패: ${res.status}`);

        const data = await res.json();
        console.log("API 응답 데이터:", data);

        const slots: Record<string, string[]> = {}
        const rawData = Array.isArray(data) ? data : data?.dates || [];
        console.log("처리된 데이터:", rawData);
        
        // Track both available and unavailable slots
        const unavailableSlots: Record<string, string[]> = {};
        
        console.log('Available Slots (before processing):', JSON.stringify(availableSlots, null, 2));
        console.log('New Unavailable Slots (before processing):', JSON.stringify(unavailableSlots, null, 2));

        // First, initialize all default times as available
        const currentDate = new Date();
        const next30Days = new Date();
        next30Days.setDate(currentDate.getDate() + 30);
        
        // Initialize all dates with default times
        for (let d = new Date(currentDate); d <= next30Days; d.setDate(d.getDate() + 1)) {
          const dateStr = format(d, 'yyyy-MM-dd');
          slots[dateStr] = [...defaultTimes];
        }

        // Process API response to mark unavailable times
        rawData.forEach((item: AvailableDate) => {
          const dateStr = item.date;
          
          if (item.is_available === 1) {
            // If the date is marked as available, ensure we have the times
            if (item.times?.length) {
              slots[dateStr] = item.times;
            } else if (!slots[dateStr]) {
              slots[dateStr] = [...defaultTimes];
            }
          } else {
            // Mark times as unavailable
            if (item.times?.length) {
              if (!unavailableSlots[dateStr]) {
                unavailableSlots[dateStr] = [];
              }
              // Add the unavailable times to our tracking
              item.times.forEach(time => {
                if (!unavailableSlots[dateStr].includes(time)) {
                  unavailableSlots[dateStr].push(time);
                }
                // Remove from available slots if present
                if (slots[dateStr]?.includes(time)) {
                  slots[dateStr] = slots[dateStr].filter(t => t !== time);
                }
              });
            }
          }
        });

        console.log('Final Available Slots:', JSON.stringify(slots, null, 2));
        console.log('Final Unavailable Slots:', JSON.stringify(unavailableSlots, null, 2));
        
        // Update both states at once to prevent multiple re-renders
        setAvailableSlots(slots);
        setUnavailableSlots(unavailableSlots);
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
            {availableTimes.length > 0 ? (
              availableTimes.map((time) => {
                const isSelected = selectedTime === time;
                const currentDate = selectedDate
                  ? format(selectedDate, "yyyy-MM-dd")
                  : "";
                
                console.log('--- Time Slot Debug ---');
                console.log('Current Date:', currentDate);
                console.log('Time:', time);
                console.log('Available Slots for this date:', availableSlots[currentDate]);
                console.log('Unavailable Slots for this date:', unavailableSlots[currentDate]);
                
                // Check if the time is explicitly marked as unavailable
                const isUnavailable = currentDate && 
                  Array.isArray(unavailableSlots[currentDate]) && 
                  unavailableSlots[currentDate].includes(time);
                  
                // A time is available if it's in availableTimes and not in unavailableSlots
                const isAvailable = currentDate && 
                  Array.isArray(availableSlots[currentDate]) && 
                  availableSlots[currentDate].includes(time);
                  
                console.log('isUnavailable:', isUnavailable);
                console.log('isAvailable:', isAvailable);

                return (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(isSelected ? null : time)}
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
              })
            ) : (
              <p className="col-span-3 text-center text-gray-500 py-4">
                예약 가능한 시간이 없습니다.
              </p>
            )}
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
