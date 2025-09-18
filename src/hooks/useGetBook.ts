//예약 내역 불러오는 훅
import { useCallback, useState } from "react";

interface Reservation {
  p_id: number;
  book_date: string;
  book_id: number;
  book_time: string;
}

const useGetBook = (userId?: number) => {
  const [, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getBook = useCallback(async (): Promise<Reservation[]> => {
    if (!userId) return [];

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservation/${userId}/books`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to fetch reservations");

      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error("Failed to fetch reservations");
      setError(err);
      console.error("Error fetching reservations:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return {
    getBook,
    refresh,
    isLoading,
    error,
  };
};

export default useGetBook;
