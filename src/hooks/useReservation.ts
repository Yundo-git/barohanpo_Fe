import { format } from "date-fns";

type ReservationSuccessCallback = (date: string, time: string) => void;

export const useReservation = (p_id: string, onSuccess?: ReservationSuccessCallback) => {
  const handleReservation = async (
    userId: number,
    selectedDate: Date | null,
    selectedTime: string | null,
    memo?: string
  ) => {
    if (!selectedDate || !selectedTime) return;
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const formattedTime = selectedTime; // already 'HH:mm' 형식이라고 가정
    console.log(userId, formattedDate, formattedTime, p_id);
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

      const result = await response.json();
      alert("예약이 완료되었습니다!");
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
