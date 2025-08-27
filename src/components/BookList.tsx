"use client";
import useBookCencel from "@/hooks/useBookCancel";
import { useState } from "react";
import CencelModal from "./CancelModal";
import CancelModal from "./CancelModal";
interface ReservationItem {
  p_id: number;
  book_date: string;
  book_id: number;
  book_time: string;
  // Add other properties as needed
}

const BookList = ({ reservation }: { reservation?: ReservationItem[] | null }) => {
  // Ensure reservation is always an array
  const reservationList = Array.isArray(reservation) ? reservation : [];
  
  if (reservationList.length === 0) {
    return <div className="text-center py-4">예약 내역이 없습니다.</div>;
  }
  const { bookCancel } = useBookCencel();
  const [cencelModal, setCencelModal] = useState(false);
  const [bookId, setBookId] = useState<number>(0);
  const handleBookCancel = async (bookId: number) => {

    console.log('bookId>>>>',bookId);
    await bookCancel(bookId);
    setCencelModal(false);
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
            <div className="flex justify-center w-full gap-2">
              <button className="w-full rounded-md border border-gray-300 px-4 py-2">
                영수증 인증
              </button>
              <button onClick={() => {openCencelModal(list.book_id)}} 
              className="w-full rounded-md border border-gray-300 px-4 py-2">
                예약 취소
              </button>
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
