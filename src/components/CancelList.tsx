"use client";

interface ReservationItem {
  p_id: number;
  book_date: string;
  book_id: number;
  book_time: string;
  // Add other properties as needed
}

interface CancelListProps {
  cancelList?: ReservationItem[] | { data: ReservationItem[] } | ReservationItem | null;
}

const CancelList = ({ cancelList }: CancelListProps) => {
  // Handle various possible data formats
  const getSafeCancelList = (): ReservationItem[] => {
    if (!cancelList) return [];
    if (Array.isArray(cancelList)) return cancelList;
    if (cancelList && 'data' in cancelList && Array.isArray(cancelList.data)) {
      return cancelList.data;
    }
    return [cancelList as ReservationItem].filter(Boolean);
  };

  const safeCancelList = getSafeCancelList();
  
  console.log('Raw cancelList:', cancelList);
  console.log('Processed safeCancelList:', safeCancelList);

  if (safeCancelList.length === 0) {
    return <div className="text-center py-4">취소 내역이 없습니다.</div>;
  }

  return (
    <div>
      <ul>
        {safeCancelList.map((list: ReservationItem) => (
          <li key={list.book_id} className="border-b border-gray-200 p-4">
            <p>날짜 : {list.book_date}</p>
            <p>시간 : {list.book_time}</p>
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
