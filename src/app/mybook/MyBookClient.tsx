"use client";

import { Suspense, useState, useCallback, useEffect, ReactNode } from "react";
import BookList from "@/components/reservation/BookList";
import Tab from "@/components/Tab";
import CancelList from "@/components/reservation/CancelList";
import { useAppSelector } from "@/store/store";
import type { Reservation, CancelItem } from "@/types/reservation";

function Loading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-gray-600">로딩 중입니다...</div>
    </div>
  );
}

function MyBookContent({ userId }: { userId: number }) {
  const { reservations: bookingReservations, cancelList: bookingCancelList } =
    useAppSelector((s) => s.booking);

  const [activeTab, setActiveTab] = useState<"reservations" | "canceled">(
    "reservations"
  );
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [cancelListState, setCancelListState] = useState<CancelItem[]>([]);
  const [loadingState, setLoadingState] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    setLoadingState(true);
    if (activeTab === "reservations") {
      setReservations(bookingReservations);
    } else {
      setCancelListState(bookingCancelList);
    }
    setLoadingState(false);
  }, [activeTab, bookingReservations, bookingCancelList]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = () => {
    void loadData();
  };
  console.log('reservations', reservations);
  const tabItems = [
    {
      key: "reservations",
      label: "예약 내역",
      component: loadingState ? (
        <div className="py-4 text-center h-full text-gray-500">로딩 중...</div>
      ) : (
        <BookList
          reservation={reservations}
          onCancelSuccess={handleRefresh}
          userId={userId}
        />
      ),
    },
    {
      key: "canceled",
      label: "취소 내역",
      component: loadingState ? (
        <div className="py-4 text-center text-gray-500">로딩 중...</div>
      ) : (
        <CancelList cancelList={cancelListState} />
      ),
    },
  ] as const;

  return (
    <div className="container mx-auto h-full flex flex-col">
      <Tab
        items={
          tabItems as unknown as Array<{
            key: string;
            label: string;
            component: ReactNode;
          }>
        }
        defaultActiveKey="reservations"
        className="flex-1 flex flex-col min-h-0"
        onChange={(key: string) =>
          setActiveTab(key as "reservations" | "canceled")
        }
      />
    </div>
  );
}

export default function MyBookClient({ userId }: { userId: number }) {
  return (
    <Suspense fallback={<Loading />}>
      <MyBookContent userId={userId} />
    </Suspense>
  );
}
