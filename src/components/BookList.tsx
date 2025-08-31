"use client";
import useBookCencel from "@/hooks/useBookCancel";
import { useState } from "react";
import CancelModal from "./CancelModal";
interface ReservationItem {
  p_id: number;
  book_date: string;
  book_id: number;
  book_time: string;
  // Add other properties as needed
}

interface BookListProps {
  reservation?: ReservationItem[] | null;
  onCancelSuccess?: () => void;
}

const BookList: React.FC<BookListProps> = ({
  reservation,
  onCancelSuccess
}) => {
  // Ensure reservation is always an array
  const reservationList = Array.isArray(reservation) ? reservation : [];

  // Check if the reservation time has passed
  const isReservationPassed = (dateStr: string, timeStr: string): boolean => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    const reservationTime = new Date(year, month - 1, day, hours, minutes);
    const currentTime = new Date();
    
    return currentTime > reservationTime;
  };

  // Handle review button click
  const handleReviewClick = (bookId: number) => {
    console.log('Review for bookId:', bookId);
    // Add your review logic here
  };

  if (reservationList.length === 0) {
    return <div className="text-center py-4">예약 내역이 없습니다.</div>;
  }
  const { bookCancel } = useBookCencel();
  const [cencelModal, setCencelModal] = useState(false);
  const [bookId, setBookId] = useState<number>(0);
  const handleBookCancel = async (bookId: number) => {
    try {
      await bookCancel(bookId);
      setCencelModal(false);
      if (onCancelSuccess) {
        onCancelSuccess();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };
  const openCencelModal = (book_id: number) => {
    setCencelModal(true);
    console.log(book_id);
    setBookId(book_id);
  };

  return (
    <div>
      <ul>
        {reservationList.map((list) => (
          <li key={list.book_id} className="border-b border-gray-200 p-4">
            <p>날짜 : {list.book_date}</p>
            <p>시간 : {list.book_time}</p>
            <div >
             
              {isReservationPassed(list.book_date, list.book_time) ? (
                <button
                  onClick={() => handleReviewClick(list.book_id)}
                  className="w-full rounded-md bg-blue-500 text-white px-4 py-2 hover:bg-blue-600 transition-colors"
                >
                  리뷰작성
                </button>
              ) : (
                <button
                  onClick={() => openCencelModal(list.book_id)}
                  className="w-full rounded-md bg-red-500 text-white px-4 py-2 hover:bg-red-600 transition-colors"
                >
                  예약취소
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <CancelModal
        open={cencelModal}
        onClose={() => setCencelModal(false)}
        title="예약 취소"
        content={
          <div>
            <p>예약을 취소하시겠습니까?</p>
            <div className="flex justify-center w-full gap-2">
              <button
                onClick={() => setCencelModal(false)}
                className="w-full rounded-md border border-gray-300 px-4 py-2"
              >
                취소
              </button>
              <button
                onClick={() => handleBookCancel(bookId)}
                className="w-full rounded-md border border-gray-300 px-4 py-2"
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
