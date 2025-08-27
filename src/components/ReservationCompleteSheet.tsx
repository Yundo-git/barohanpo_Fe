import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

interface ReservationCompleteSheetProps {
  p_id: string;
  date: string | null;
  time: string | null;
  status: string | null;
  onClose: () => void;
}

export default function ReservationCompleteSheet({
  p_id,
  date,
  time,
  status,
  onClose,
}: ReservationCompleteSheetProps) {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user.user);

  if (!date || !time || !status) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold text-red-600">예약 정보 없음</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <h1 className="text-xl font-bold mb-4">예약이 완료되었습니다.</h1>
        <div className="space-y-2 text-gray-700 mb-6">
          <p>예약 번호: {p_id}</p>
          <p>예약 날짜: {date}</p>
          <p>예약 시간: {time}</p>
          <p className="text-green-600 font-semibold">
            예약 상태: {status === "success" ? "성공" : "실패"}
          </p>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => router.push(`/mybook/${user?.user_id}`)}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            내 예약 확인하기
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
