import { useRouter } from "next/navigation";

interface ReservationCompleteSheetProps {
  date: string | null;
  time: string | null;
  pharmacyName?: string;
}

export default function ReservationCompleteSheet({
  date,
  time,
  pharmacyName,
}: ReservationCompleteSheetProps) {
  const router = useRouter();
  // const user = useSelector((state: RootState) => state.user.user);

  if (!date || !time) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold text-red-600">예약 정보 없음</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full ">
      <div className="flex-1 overflow-y-auto p-4">
        <h1 className="text-xl font-bold mb-4">예약이 완료되었습니다.</h1>
        <div className="space-y-2 text-gray-700 mb-6">
          <p>
            약국 <b>{pharmacyName}</b>
          </p>
          <p>
            예약 일정{" "}
            <b>
              {date} {time}
            </b>
          </p>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => router.push(`/mybook`)}
            className="w-full px-4 py-3 bg-main text-white rounded-md  transition-colors"
          >
            예약 상세보기
          </button>
        </div>
      </div>
    </div>
  );
}
