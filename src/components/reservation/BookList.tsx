"use client";
import useBookCencel from "@/hooks/useBookCancel";
import { useState, useEffect, useMemo } from "react";
import CancelModal from "./CancelModal";
import ReviewModal from "../Review/ReviewModal";
import { useAppSelector } from "@/store/store";
import type { Reservation } from "@/types/reservation";

interface BookListProps {
  reservation: Reservation[] | null | undefined;
  onCancelSuccess?: () => void | Promise<void>;
  userId: number;
}

type ReservationItem = Reservation;
const BookList: React.FC<BookListProps> = ({
  reservation,
  onCancelSuccess,
}) => {
  const { bookCancel } = useBookCencel();
  const completedReviews = useAppSelector(
    (s) => s.reviewCompletion.completedIds
  );
  console.log("reservation", reservation);

  const [cencelModal, setCencelModal] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationItem | null>(null);

  // reservation prop을 직접 사용하고, 정렬된 목록을 useMemo로 계산.
  const sortedReservationList = useMemo(() => {
    if (!reservation) return [];

    //  원본 배열을 복사하여 정렬. (prop을 직접 수정하지 않음)
    const list = [...reservation];

    // 날짜와 시간을 조합하여 최신순으로 정렬
    list.sort((a, b) => {
      // 'YYYY-MM-DD HH:mm' 형태의 문자열로 만들어 비교
      const dateTimeA = `${a.book_date} ${a.book_time}`;
      const dateTimeB = `${b.book_date} ${b.book_time}`;

      // 최신순 (내림차순) 정렬: B가 A보다 최신이면 양수 반환
      if (dateTimeA > dateTimeB) return -1;
      if (dateTimeA < dateTimeB) return 1;
      return 0; // 날짜와 시간이 같으면 순서 유지
    });

    return list;
  }, [reservation]);

  // 예약시간이 지났는지 판단 (로컬타임 기준)
  const isReservationPassed = (dateStr: string, timeStr: string): boolean => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hours, minutes] = timeStr.split(":").map(Number);
    // JS의 Date 객체는 YYYY, MM(0-11), DD, HH, MM 순서입니다.
    const reservationTime = new Date(year, month - 1, day, hours, minutes);
    return new Date() > reservationTime;
  };

  // 리뷰 완료된 book_id들을 Set으로
  const completedSet = useMemo<Set<number>>(
    () => new Set(completedReviews),
    [completedReviews]
  );

  const openCencelModal = (r: ReservationItem) => {
    setCencelModal(true);
    setSelectedReservation(r);
  };
  const openReviewModal = (r: ReservationItem) => {
    setReviewModalOpen(true);
    setSelectedReservation(r);
  };

  const handleBookCancel = async (bookId: number) => {
    try {
      await bookCancel(bookId);
      setCencelModal(false);
      // 부모 컴포넌트에서 예약 목록을 갱신하도록 요청
      if (onCancelSuccess) await onCancelSuccess();
    } catch (error) {
      console.error("Error cancelling booking:", error);
    }
  };

  // 액션 버튼 결정
  const renderActionButton = (item: ReservationItem) => {
    const reviewed = completedSet.has(Number(item.book_id));
    const passed = isReservationPassed(item.book_date, item.book_time);

    if (reviewed) {
      return (
        <button
          type="button"
          disabled
          aria-disabled
          className="w-full rounded-md bg-gray-200 text-gray-600 px-4 py-2 cursor-not-allowed"
          title="이미 리뷰를 작성했습니다."
        >
          완료
        </button>
      );
    }

    if (!passed) {
      return (
        <button
          onClick={() => openCencelModal(item)}
          className="w-full rounded-md bg-red-500 text-white px-4 py-2 hover:bg-red-600 transition-colors"
        >
          예약취소
        </button>
      );
    }

    return (
      <button
        onClick={() => openReviewModal(item)}
        className="w-full rounded-md bg-main text-white px-4 py-2 hover:bg-blue-600 transition-colors"
      >
        리뷰작성
      </button>
    );
  };

  if (!sortedReservationList.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        예약 내역이 없습니다.
      </div>
    );
  }

  return (
    <div className="h-full">
      <ul className="divide-y divide-gray-200">
        {/* 정렬된 목록을 렌더링해서 출력. */}
        {sortedReservationList.map((list) => (
          <li key={list.book_id} className="p-4 hover:bg-gray-50">
            <p>약국 : {list.pharmacy_name}</p>
            <p>날짜 : {list.book_date}</p>
            <p>시간 : {list.book_time}</p>
            <div className="mt-2">{renderActionButton(list)}</div>
          </li>
        ))}
      </ul>

      {selectedReservation && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          selectedBookId={selectedReservation.book_id}
          p_id={selectedReservation.p_id}
          book_date={selectedReservation.book_date}
          book_time={selectedReservation.book_time}
        />
      )}

      <CancelModal
        open={cencelModal}
        onClose={() => setCencelModal(false)}
        title="예약 취소"
        content={
          <div>
            <p>예약을 취소하시겠십니까?</p>
            <div className="flex justify-center w-full gap-2 mt-3">
              <button
                onClick={() => setCencelModal(false)}
                className="w-full rounded-md border border-gray-300 px-4 py-2"
              >
                취소
              </button>
              <button
                onClick={() =>
                  selectedReservation &&
                  handleBookCancel(selectedReservation.book_id)
                }
                className="w-full rounded-md bg-red-500 text-white px-4 py-2 hover:bg-red-600 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default BookList;
