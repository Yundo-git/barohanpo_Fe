// useReservation.ts

import { format } from "date-fns";
import { fetchReservations } from "@/store/bookingSlice";
import { useAppDispatch } from "@/store/store";
import { useSendReservationEmail } from "@/hooks/useSendReservationEmail";

interface UseReservationOptions {
  onSuccess?: (date: string, time: string) => void;
  username?: string;
  pharmacyName?: string;
}

export const useReservation = (
  p_id: string,
  options: UseReservationOptions = {}
) => {
  const dispatch = useAppDispatch();
  const { onSuccess, pharmacyName, username } = options; // 🚨 옵션에서 값 분해

  const { sendEmail } = useSendReservationEmail();

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
      console.log(result);
      console.log(formattedDate);
      console.log(formattedTime);
      // 예약 성공 후, 예약 목록을 다시 불러와 Redux 상태를 최신화 .
      await dispatch(fetchReservations({ userId }));

      // 예약 성공 후, 메일 발송을 시도.
      await sendEmail(
        username || "", // 1st: 사용자 닉네임
        pharmacyName || "", // 2nd: 약국 이름
        formattedDate, // 3rd: 예약 날짜
        formattedTime, // 4th: 예약 시간
        memo || "" // 5th: 상담 메모
      );

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
