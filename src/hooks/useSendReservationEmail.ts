// src/hooks/useSendReservationEmail.ts

import { useCallback } from "react";

/**
 * 예약 완료 메일을 발송하는 훅
 * (백엔드에 '메일 발송' 요청을 보냅니다)
 */
export const useSendReservationEmail = () => {
  /**
   * @param username 예약자 닉네임
   * @param pharmacyName 예약한 약국 이름
   * @param date 예약 날짜 (YYYY년 MM월 DD일)
   * @param time 예약 시간 (HH:mm)
   * @param memo 상담 메모 (선택 사항)
   */
  const sendEmail = useCallback(
    async (
      username: string,
      pharmacyName: string,
      date: string,
      time: string,
      memo?: string
    ): Promise<void> => {
      // 🚨 백엔드에서 메일 발송을 처리할 엔드포인트 URL로 변경해야 합니다.
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservation/send-email`;
      console.log("username", username);
      console.log("pharmacyName", pharmacyName);
      console.log("date", date);
      console.log("time", time);
      console.log("memo", memo);
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            pharmacyname: pharmacyName,
            reservationdate: date,
            reservationtime: time,
            memo: memo,
          }),
        });

        if (!response.ok) {
          // 메일 발송은 사용자 예약 자체를 실패시키지 않도록 경고만 합니다.
          console.warn(`이메일 발송 실패: ${response.statusText}`);
        } else {
          console.log("예약 확인 메일 발송 성공!");
        }
      } catch (error) {
        console.error("이메일 발송 API 호출 중 오류 발생:", error);
        // 메일 발송 실패는 주요 예약 흐름을 막지 않아야 합니다.
      }
    },
    []
  );

  return { sendEmail };
};
