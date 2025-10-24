"use client";

import {
  Suspense,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import BookList from "@/components/reservation/BookList";
import Tab from "@/components/ui/Tab";
import CancelList from "@/components/reservation/CancelList";
import { useAppSelector, useAppDispatch } from "@/store/store";
import { fetchReservations, fetchCancelList } from "@/store/bookingSlice";
import type { Reservation, CancelItem } from "@/types/reservation";

function Loading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-gray-600">로딩 중입니다...</div>
    </div>
  );
}

function MyBookContent({ userId }: { userId: number }) {
  // Redux Store에서 데이터와 로딩 상태를 가져옵니다.
  const {
    reservations: bookingReservations,
    cancelList: bookingCancelList,
    isLoading: isBookingLoading,
  } = useAppSelector((s) => s.booking);

  const dispatch = useAppDispatch(); //useAppDispatch 초기화

  const [activeTab, setActiveTab] = useState<"reservations" | "canceled">(
    "reservations"
  );
  // Redux 데이터를 반영할 로컬 state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [cancelListState, setCancelListState] = useState<CancelItem[]>([]);

  //  컴포넌트 마운트 시 초기 데이터 로드 (Thunk 디스패치)
  useEffect(() => {
    if (userId) {
      void dispatch(fetchReservations({ userId }));
      void dispatch(fetchCancelList({ userId }));
    }
  }, [dispatch, userId]);

  // Redux 데이터가 변경될 때마다 로컬 state 갱신 (자동 갱신)
  useEffect(() => {
    setReservations(bookingReservations);
    setCancelListState(bookingCancelList);
  }, [bookingReservations, bookingCancelList]);

  // 취소 성공 시 목록 갱신 (Thunk 재실행)
  const handleRefresh = useCallback(() => {
    if (userId) {
      // 예약 취소 후 예약 목록과 취소 목록을 모두 새로고침
      void dispatch(fetchReservations({ userId }));
      void dispatch(fetchCancelList({ userId }));
    }
  }, [dispatch, userId]);

  const loading = isBookingLoading;

  // Tab 컴포넌트에 전달할 최종 아이템 목록을 useMemo로 정의. (Tab 에러 해결)
  const tabItems = useMemo(() => {
    const loadingComponent = (
      <div className="py-4 text-center h-full text-gray-500">로딩 중...</div>
    );

    return [
      {
        key: "reservations",
        label: "예약 내역",
        // 탭 콘텐츠를 items 배열 내부의 component 필드에 할당
        component: loading ? (
          loadingComponent
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
        // 탭 콘텐츠를 items 배열 내부의 component 필드에 할당
        component: loading ? (
          loadingComponent
        ) : (
          <CancelList cancelList={cancelListState} />
        ),
      },
    ];
  }, [loading, reservations, cancelListState, userId, handleRefresh]);

  return (
    <div className="container mx-auto h-full flex flex-col pb-20">
      <Tab
        // items prop을 통해 탭 내용물을 전달합니다. children은 사용하지 않습니다.
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
