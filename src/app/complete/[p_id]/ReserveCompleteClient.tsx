// components/ReserveCompleteClient.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Props {
  p_id: string;
}

export default function ReserveCompleteClient({ p_id }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [reservationInfo, setReservationInfo] = useState<{
    date: string;
    time: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    const status = searchParams.get("status");

    if (date && time && status) {
      setReservationInfo({ date, time, status });
    }
  }, [searchParams]);

  if (!reservationInfo) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold text-red-600">예약 정보 없음</h1>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">예약이 완료되었습니다.</h1>
      <p>약국 ID: {p_id}</p>
      <p>예약 날짜: {reservationInfo.date}</p>
      <p>예약 시간: {reservationInfo.time}</p>
      <p className="text-green-600 font-semibold">
        예약 상태: {reservationInfo.status === "success" ? "성공" : "실패"}
      </p>
      <div className="flex w-full justify-center gap-2">
        <button
          onClick={() => router.push(`/`)}
          className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          홈으로 돌아가기
        </button>
        <button
          onClick={() => router.push(`/auth`)}
          className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          내 예약 확인하기
        </button>
      </div>
    </div>
  );
}
