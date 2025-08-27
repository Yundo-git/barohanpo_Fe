"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import the BottomSheet component with no SSR
const BottomSheet = dynamic(
  () => import("@/components/BottomSheet"),
  { ssr: false }
);

// Dynamically import the ReservationCompleteSheet component with no SSR
const ReservationCompleteSheet = dynamic(
  () => import("@/components/ReservationCompleteSheet"),
  { ssr: false }
);

interface Props {
  p_id: string;
}

export default function ReserveCompleteClient({ p_id }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [reservationInfo, setReservationInfo] = useState<{
    date: string | null;
    time: string | null;
    status: string | null;
  }>({ date: null, time: null, status: null });

  useEffect(() => {
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    const status = searchParams.get("status");

    if (date && time && status) {
      setReservationInfo({ date, time, status });
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);
    router.push("/");
  };

  if (!isOpen) {
    return null;
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose}>
      <ReservationCompleteSheet
        p_id={p_id}
        date={reservationInfo.date}
        time={reservationInfo.time}
        status={reservationInfo.status}
        onClose={handleClose}
      />
    </BottomSheet>
  );
}
