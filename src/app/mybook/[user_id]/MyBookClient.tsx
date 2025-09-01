"use client";

import { Suspense, useState, useCallback, useEffect, ReactNode } from "react";
import BookList from "@/components/reservation/BookList";
import Tab from "@/components/Tab";
import CancelList from "@/components/reservation/CancelList";
import useGetBook from "@/hooks/useGetBook";
import useGetCancelList from "@/hooks/useGetCancelList";
import type { Reservation, CancelItem } from "@/types/reservation";

function Loading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-gray-600">로딩 중입니다...</div>
    </div>
  );
}

function MyBookContent({ userId }: { userId: number }) {
  const { getBook, refresh: refreshBook } = useGetBook(userId);
  const { getCancelList, refresh: refreshCancelList } =
    useGetCancelList(userId);

  const [activeTab, setActiveTab] = useState<"reservations" | "canceled">(
    "reservations"
  );
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [cancelList, setCancelList] = useState<CancelItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      if (activeTab === "reservations") {
        const data = await getBook();
        setReservations(data);
      } else {
        const data = await getCancelList();
        setCancelList(data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, getBook, getCancelList]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = () => {
    if (activeTab === "reservations") {
      refreshBook();
    } else {
      refreshCancelList();
    }
    void loadData();
  };

  const tabItems = [
    {
      key: "reservations",
      label: "예약 내역",
      component: isLoading ? (
        <div className="py-4 text-center text-gray-500">로딩 중...</div>
      ) : (
        <BookList reservation={reservations} onCancelSuccess={handleRefresh} userId={userId}/>
      ),
    },
    {
      key: "canceled",
      label: "취소 내역",
      component: isLoading ? (
        <div className="py-4 text-center text-gray-500">로딩 중...</div>
      ) : (
        <CancelList cancelList={cancelList} />
      ),
    },
  ] as const;

  return (
    <div className="container mx-auto">
      <Tab
        items={
          tabItems as unknown as Array<{
            key: string;
            label: string;
            component: ReactNode;
          }>
        }
        defaultActiveKey="reservations"
        className="mb-6"
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
