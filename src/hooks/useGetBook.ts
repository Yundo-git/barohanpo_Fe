//예약 내역 불러오는 훅
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
const useGetBook = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const userId = user?.user_id;

  const getBook = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservation/${userId}/books`
    );
    const data = await res.json();
    console.log("예약 내역:", data);
    return data;
  };

  return { getBook };
};
export default useGetBook;
