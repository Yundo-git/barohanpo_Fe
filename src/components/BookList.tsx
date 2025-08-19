"use client";

import { User } from "@/types/user";

interface Props {
  user: User | null;
  reservation: Array<{
    p_id: number;
    book_date: string;
    book_id: number;
    book_time: string;
  }>;
}
const BookList = ({ user, reservation }: Props) => {
  console.log(reservation);
  return (
    <div>
      <ul>
        {reservation.map((list) => (
          <li key={list.book_id} className="border-b border-gray-200 p-4">
            <p>날짜 : {list.book_date}</p>
            <p>시간 : {list.book_time}</p>
            <div className="flex justify-center w-full gap-2">
              <button className="w-full rounded-md border border-gray-300 px-4 py-2">
                영수증 인증
              </button>
              <button className="w-full rounded-md border border-gray-300 px-4 py-2">
                예약 취소
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BookList;
