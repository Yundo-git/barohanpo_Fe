//리뷰까지 완료된 예약 건 조회하는 훅(리뷰아이디 조회)

// hooks/useCompletedReview.ts
import { useCallback, useEffect, useState } from "react";

export interface UseCompletedReviewReturn {
  completedReviews: number[];
  isLoading: boolean;
  error: Error | null;
  fetchReviews: () => Promise<void>;
}

// 런타임 정규화: unknown -> number[]
function normalizeToIds(input: unknown): number[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((v) => {
      if (typeof v === "number") return v;
      if (
        v &&
        typeof v === "object" &&
        "book_id" in (v as Record<string, unknown>)
      ) {
        const id = (v as { book_id: number | string }).book_id;
        return typeof id === "string" ? Number(id) : id;
      }
      return NaN;
    })
    .filter((n) => Number.isFinite(n)) as number[];
}

const useCompletedReview = (userId: number): UseCompletedReviewReturn => {
  const [completedReviews, setCompletedReviews] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!userId) {
      setCompletedReviews([]);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reviews/${userId}/id`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch reviews: ${res.statusText}`);
      }

      // 응답 예시 1) { data: [45,46] }
      // 응답 예시 2) { data: [{book_id:45},{book_id:46}] }
      const json: unknown = await res.json();
      const raw = (json as { data?: unknown })?.data ?? json; // data 필드가 없을 때도 방어
      const ids = normalizeToIds(raw);

      setCompletedReviews(ids);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch reviews")
      );
      setCompletedReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 최초/유저 변경 시 자동 실행
  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  // 디버깅용
  // useEffect(() => {
  //   console.log("completedReviews:", completedReviews);
  // }, [completedReviews]);

  return { completedReviews, isLoading, error, fetchReviews };
};

export default useCompletedReview;
