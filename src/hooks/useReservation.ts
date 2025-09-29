// useReservation.ts

import { format } from "date-fns";
import { fetchReservations } from "@/store/bookingSlice";
import { useAppDispatch } from "@/store/store"; // 🚨 타입 에러 해결을 위해 useAppDispatch 사용

interface UseReservationOptions {
  onSuccess?: (date: string, time: string) => void;
}

export const useReservation = (
  p_id: string,
  options: UseReservationOptions = {}
) => {
  const { onSuccess } = options;
  const dispatch = useAppDispatch(); // 🚨 useAppDispatch 초기화

  const handleReservation = async (
    userId: number,
    selectedDate: Date | null,
    selectedTime: string | null,
    memo?: string
  ) => {
    if (!selectedDate || !selectedTime) return;
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const formattedTime = selectedTime;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            p_id: p_id,
            date: formattedDate,
            time: formattedTime,
            memo: memo || null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("예약에 실패했습니다.");
      }

      // 예약 성공 처리
      const result = await response.json();
      alert("예약이 완료되었습니다!");

      // 🚨 [핵심 수정] 예약 성공 후, 예약 목록을 다시 불러와 Redux 상태를 최신화합니다.
      await dispatch(fetchReservations({ userId }));

      if (onSuccess) {
        onSuccess(formattedDate, formattedTime);
      }
      return result;
    } catch (error) {
      console.error("예약 중 오류 발생:", error);
      alert("예약 중 오류가 발생했습니다. 다시 시도해주세요.");
      throw error;
    }
  };

  return { handleReservation };
};
