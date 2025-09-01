'use client';

import { useEffect, useState, useCallback, Suspense, use } from 'react';
import BookList from "@/components/BookList";
import Tab from "@/components/Tab";
import CancelList from "@/components/CancelList";
import useGetBook from "@/hooks/useGetBook";
import useGetCancelList from "@/hooks/useGetCancelList";
import type { Reservation, CancelItem } from "@/types/reservation";

interface PageProps {
  params: {
    user_id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Loading component for Suspense fallback
function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-600">로딩 중입니다...</div>
    </div>
  );
}

// This is the main client component
function MyBookContent({ userId }: { userId: number }) {
  const { getBook, refresh: refreshBook } = useGetBook(userId);
  const { getCancelList, refresh: refreshCancelList } = useGetCancelList(userId);
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [cancelList, setCancelList] = useState<CancelItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const [bookData, cancelData] = await Promise.all([
        getBook(),
        getCancelList(),
      ]);
      
      setReservations(Array.isArray(bookData) ? bookData : []);
      setCancelList(Array.isArray(cancelData) ? cancelData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, getBook, getCancelList]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancelSuccess = useCallback(async () => {
    await Promise.all([refreshBook(), refreshCancelList()]);
    await fetchData();
  }, [refreshBook, refreshCancelList, fetchData]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto p-4">
      <Tab 
        items={[
          { 
            key: 'reservations', 
            label: '예약 내역',
            component: (
              <BookList 
                reservation={reservations} 
                onCancelSuccess={handleCancelSuccess} 
              />
            )
          },
          { 
            key: 'cancellations', 
            label: '취소 내역',
            component: <CancelList cancelList={cancelList} />
          }
        ]}
        defaultActiveKey="reservations"
        className="mb-6"
      />
    </div>
  );
}

// This is a separate client component that uses the userId
function MyBookClient({ params }: { params: { user_id: string } | Promise<{ user_id: string }> }) {
  // Unwrap the params promise if it is one
  const unwrappedParams = 'then' in params ? use(params) : params;
  const userId = parseInt(unwrappedParams.user_id, 10);
  
  return (
    <Suspense fallback={<Loading />}>
      <MyBookContent userId={userId} />
    </Suspense>
  );
}

// Main page component (server component)
export default function Page({ params }: PageProps) {
  return <MyBookClient params={params} />;
}
