"use client";

import type { CancelItem } from "@/types/reservation";

interface CancelListProps {
  cancelList: CancelItem[] | null | undefined;
}

const CancelList = ({ cancelList }: CancelListProps) => {
  if (!cancelList || cancelList.length === 0) {
    return <div className="text-center py-4">취소 내역이 없습니다.</div>;
  }

  return (
    <div>
      <ul>
        {cancelList.map((item: CancelItem) => (
          <li key={item.book_id} className="border-b border-gray-200 p-4">
            <p>날짜 : {item.book_date}</p>
            <p>시간 : {item.book_time}</p>
            <div className="flex justify-center w-full gap-2">
              {/* Add any action buttons or content here */}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

 
export default CancelList;
