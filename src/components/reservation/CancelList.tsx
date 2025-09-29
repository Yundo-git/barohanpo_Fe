"use client";

import { useMemo } from "react";
import type { CancelItem } from "@/types/reservation";

interface CancelListProps {
  cancelList: CancelItem[] | null | undefined;
}

const CancelList = ({ cancelList }: CancelListProps) => {
  // cancelList prop을 사용하여 정렬된 목록을 useMemo로 계산.
  const sortedCancelList = useMemo(() => {
    if (!cancelList) return [];

    // 원본 배열을 복사하여 정렬합니다.
    const list = [...cancelList];

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
  }, [cancelList]);

  if (!sortedCancelList || sortedCancelList.length === 0) {
    return <div className="text-center py-4">취소 내역이 없습니다.</div>;
  }

  return (
    <div>
      <ul>
        {/* 정렬된 목록을 렌더링해서 출력. */}
        {sortedCancelList.map((item: CancelItem) => (
          <li key={item.book_id} className="border-b border-gray-200 p-4">
            <p>날짜 : {item.book_date}</p>
            <p>시간 : {item.book_time}</p>
            <div className="flex justify-center w-full gap-2"></div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CancelList;
