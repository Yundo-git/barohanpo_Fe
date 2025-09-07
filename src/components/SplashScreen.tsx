"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useAppDispatch } from "@/store/store";
import { fetchFiveStarReviews } from "@/store/reviewSlice";
import { fetchNearbyPharmacies } from "@/store/pharmacySlice";
import { store } from "@/store/store";

type SplashScreenProps = {
  onLoaded: () => void;
  /** 스플래시 최소 노출 시간(ms). 기본 800ms */
  minDurationMs?: number;
  /** 로딩 최대 대기 시간(ms). 기본 15000ms */
  maxWaitMs?: number;
};

export default function SplashScreen({
  onLoaded,
  minDurationMs = 800,
  maxWaitMs = 15000,
}: SplashScreenProps) {
  const dispatch = useAppDispatch();

  const [mounted, setMounted] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(true); // false면 컴포넌트 자체 언마운트
  const [isFading, setIsFading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const hasInitialized = useRef<boolean>(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const maxWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    startTimeRef.current = Date.now();
    return () => {
      if (maxWaitTimerRef.current) clearTimeout(maxWaitTimerRef.current);
    };
  }, []);

  const waitMinDuration = useCallback(async () => {
    const elapsed = Date.now() - startTimeRef.current;
    const remain = Math.max(0, minDurationMs - elapsed);
    if (remain > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, remain));
    }
  }, [minDurationMs]);

  const finishSplash = useCallback(async () => {
    try {
      // 최소 노출시간 보장
      await waitMinDuration();

      if (!mounted) return;

      // 페이드아웃
      setIsFading(true);
      await new Promise<void>((resolve) => setTimeout(resolve, 300));

      if (!mounted) return;

      // 부모 콜백 호출
      onLoaded();

      // 자체 언마운트
      setVisible(false);
    } catch (error) {
      console.error("Error in finishSplash:", error);
      // 에러 발생 시에도 최대한 정리
      onLoaded();
      setVisible(false);
    }
  }, [mounted, onLoaded, waitMinDuration]);

  // Effect to check Redux state and close when data is loaded
  useEffect(() => {
    if (!mounted) return;

    const checkDataLoaded = () => {
      const state = store.getState();
      const hasReviews = (state.review.reviews?.length ?? 0) > 0;
      const hasPharmacies = (state.pharmacy.pharmacies?.length ?? 0) > 0;

      if (hasReviews && hasPharmacies) {
        console.log("Data loaded in Redux, finishing splash");
        void finishSplash();
      }
    };

    // Check immediately in case data is already loaded
    checkDataLoaded();

    // Subscribe to store changes
    // Store the unsubscribe function in the ref
    unsubscribeRef.current = store.subscribe(checkDataLoaded);

    // Set a timeout to force close after maxWaitMs
    const timeoutId = setTimeout(() => {
      console.warn("Forcing splash screen to close after timeout");
      void finishSplash();
    }, maxWaitMs);

    return () => {
      clearTimeout(timeoutId);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [mounted, finishSplash, maxWaitMs]);

  useEffect(() => {
    let isMountedFlag = true;
    let maxWaitTimer: NodeJS.Timeout | null = null;

    const loadData = async () => {
      if (hasInitialized.current || !isMountedFlag) return;
      hasInitialized.current = true;

      // 최대 대기 타이머 설정 (안전장치)
      maxWaitTimer = setTimeout(() => {
        if (isMountedFlag) {
          console.warn("Splash screen timeout - forcing close");
          onLoaded();
          setVisible(false);
        }
      }, maxWaitMs); // Use the prop value for timeout

      try {
        const currentState = store.getState();
        const hasReviews = (currentState.review.reviews?.length ?? 0) > 0;
        const hasPharmacies =
          (currentState.pharmacy.pharmacies?.length ?? 0) > 0;

        // 이미 모두 있으면 바로 종료
        if (hasReviews && hasPharmacies) {
          await finishSplash();
          return;
        }

        const fetches: Array<Promise<unknown>> = [];
        if (!hasReviews) {
          fetches.push(dispatch(fetchFiveStarReviews()).unwrap());
        }

        setError(null);
        setIsLoading(true);

        // 위치 가져오기 (실패 시 서울 좌표)
        const position = await new Promise<GeolocationPosition>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => (isMountedFlag ? resolve(pos) : undefined),
            () => {
              const mock: GeolocationPosition = {
                coords: {
                  latitude: 37.5665,
                  longitude: 126.978,
                  accuracy: 1,
                  altitude: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null,
                  toJSON: () => ({}),
                },
                timestamp: Date.now(),
                toJSON: () => ({}),
              };
              resolve(mock);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        });

        if (!hasPharmacies) {
          fetches.push(
            dispatch(
              fetchNearbyPharmacies({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              })
            ).unwrap()
          );
        }

        // 최대 대기 타이머 (망 연결 이슈 등으로 무한대기 방지)
        maxWaitTimerRef.current = setTimeout(() => {
          // 너무 오래 걸리면 안전하게 종료 시도
          void finishSplash();
        }, maxWaitMs);

        if (fetches.length > 0) {
          await Promise.all(fetches);
        }

        // 상태 재확인
        const updated = store.getState();
        const allLoaded =
          (updated.review.reviews?.length ?? 0) > 0 &&
          (updated.pharmacy.pharmacies?.length ?? 0) > 0;

        if (!isMountedFlag) return;

        if (allLoaded) {
          await finishSplash();
        } else {
          // 일부라도 실패 시 에러 표시는 하되, 너무 오래 머물지 않도록 maxWait에 의해 종료됨
          setError("일부 데이터를 불러오지 못했습니다.");
          setIsLoading(false);
        }
      } catch {
        if (!isMountedFlag) return;
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
        setIsLoading(false);
      }
    };

    void loadData();

    return () => {
      isMountedFlag = false;
      if (maxWaitTimer) clearTimeout(maxWaitTimer);
      if (maxWaitTimerRef.current) clearTimeout(maxWaitTimerRef.current);
    };
  }, [dispatch, maxWaitMs, onLoaded, finishSplash]);

  // 포털 렌더 전, 또는 이미 종료한 경우
  if (!mounted || !visible) return null;

  // If not visible, don't render anything
  if (!visible) return null;

  return createPortal(
    <div
      className={[
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4",
        "transition-opacity duration-300",
        isFading ? "opacity-0" : "opacity-100",
        "bg-[#00bfa5]",
      ].join(" ")}
      aria-busy={isLoading}
      role="status"
      key="splash-screen"
    >
      <div className="text-center space-y-6">
        <div className="animate-pulse">
          <div className="w-24 h-24 mx-auto">
            <div className="relative w-[24vh] h-[24vh]">
              <Image
                src="/logo.svg"
                alt="바로한포 로고"
                fill
                className="object-contain"
                priority
                sizes="24vh"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md">
            {error}
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm transition-colors"
            >
              다시 시도하기
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
