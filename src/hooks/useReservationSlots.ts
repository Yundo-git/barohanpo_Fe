import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

// 타입 정의
interface ReservationSlot {
  date: string; // YYYY-MM-DD
  is_available: boolean;
}
const ongoingRequests = new Set<number>();

export function useReservationSlots(pharmacyId: number) {
  const [slots, setSlots] = useState<ReservationSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pharmacyId) {
      setSlots([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchSlots = async () => {
      setLoading(true);
      setError(null);
      ongoingRequests.add(pharmacyId); // 중복 방지

      const today = dayjs();
      const from = today.format("YYYY-MM-DD");
      const to = today.add(6, "day").format("YYYY-MM-DD");

      try {
        const response = await axios.get<ReservationSlot[]>(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservation/${pharmacyId}`,
          {
            params: { from, to },
            signal,
          }
        );

        setSlots(response.data);
      } catch (err: any) {
        if (!axios.isCancel(err)) {
          console.error("예약 정보 오류:", err);
          setError("예약 정보를 불러오지 못했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();

    return () => {
      controller.abort(); // 컴포넌트 언마운트 시 요청 중단
    };
  }, [pharmacyId]);

  return { slots, loading, error };
}
