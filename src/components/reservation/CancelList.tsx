"use client";

import { useMemo, useState, useEffect } from "react";
import type { CancelItem } from "@/types/reservation";
import Image from "next/image";
import ConfirmModal from "@/components/ui/ConfirmModal";
import useDelCancelList from "@/hooks/useDelCancelList";
import { toast } from "react-toastify";

interface CancelListProps {
  cancelList: CancelItem[] | null | undefined;
}

const CancelList = ({ cancelList }: CancelListProps) => {
  const [itemToDelete, setItemToDelete] = useState<CancelItem | null>(null);
  const { deleteCanceledReservation, isLoading: isDeleting, error } = useDelCancelList();
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
  console.log("sortedCancelList", sortedCancelList);

  return (
    <div>
      <ul>
        {/* 정렬된 목록을 렌더링해서 출력. */}
        {sortedCancelList.map((item: CancelItem) => (
          <li key={item.book_id} className="border-b border-gray-200 px-5 py-6">
            <div className="flex items-center justify-between">
              <p className="T3_SB_18 text-mainText">{item.pharmacy_name}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setItemToDelete(item);
                }}
                className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-full p-0.5"
                disabled={isDeleting}
              >
                <Image
                  src="/icon/Close.svg"
                  alt="삭제"
                  width={20}
                  height={20}
                  className="w-4 h-4"
                />
              </button>
            </div>
            <span className="pt-6 flex gap-4">
              <p className="B2_RG_14 text_subText2">날짜</p>
              <p className="B1_MD_15 text_mainText line-through ">
                {item.book_date}
              </p>
            </span>
            <span className="pt-2 flex gap-4">
              <p className="B2_RG_14 text_subText2">시간</p>
              <p className="B1_MD_15 text_mainText line-through">
                {item.book_time}
              </p>
            </span>
            <div className="flex justify-center w-full gap-2"></div>
          </li>
        ))}
      </ul>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (!itemToDelete) return;
          
          deleteCanceledReservation({
            bookId: itemToDelete.book_id,
            pharmacyId: itemToDelete.p_id
          }, {
            onSuccess: () => {
              toast.success("예약이 대기 상태로 변경되었습니다.");
              setItemToDelete(null);
            },
            onError: (error) => {
              console.error("Failed to update reservation status:", error);
              toast.error(error.message || "예약 상태 변경에 실패했습니다.");
            }
          });
        }}
        title="취소 내역 삭제"
        message={`${
          itemToDelete?.pharmacy_name || "이 약국"
        }의 취소 내역을 삭제하시겠습니까?`}
        confirmText={isDeleting ? "삭제 중..." : "삭제"}
        cancelText="취소"
        isConfirming={isDeleting}
      />
    </div>
  );
};

export default CancelList;
