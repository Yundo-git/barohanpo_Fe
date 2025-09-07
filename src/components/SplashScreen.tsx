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

    // Store the timeout ID in the ref for cleanup
    maxWaitTimerRef.current = timeoutId;

    return () => {
      clearTimeout(timeoutId);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [mounted, finishSplash, maxWaitMs]);

  const loadData = useCallback(async () => {
    if (hasInitialized.current || !mounted) return;
    hasInitialized.current = true;

    try {
      const currentState = store.getState();
      const hasReviews = (currentState.review.reviews?.length ?? 0) > 0;
      const hasPharmacies = (currentState.pharmacy.pharmacies?.length ?? 0) > 0;

      // If we already have data, finish immediately
      if (hasReviews && hasPharmacies) {
        await finishSplash();
        return;
      }

      // Set loading state
      setError(null);
      setIsLoading(true);

      // Get user's location
      const position = await new Promise<GeolocationPosition>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          () => {
            // Fallback to Seoul coordinates if geolocation fails
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

      // Fetch data in parallel
      const fetches: Array<Promise<unknown>> = [];
      
      if (!hasReviews) {
        fetches.push(dispatch(fetchFiveStarReviews()).unwrap());
      }
      
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

      // Set a timeout to force close if data loading takes too long
      const timeoutId = setTimeout(() => {
        console.warn("Data loading timeout - forcing splash to close");
        void finishSplash();
      }, maxWaitMs);

      // Store the timeout ID in the ref for cleanup
      maxWaitTimerRef.current = timeoutId;

      try {
        if (fetches.length > 0) {
          await Promise.all(fetches);
        }

        // Verify data was loaded
        const updated = store.getState();
        const allLoaded =
          (updated.review.reviews?.length ?? 0) > 0 &&
          (updated.pharmacy.pharmacies?.length ?? 0) > 0;

        if (allLoaded) {
          clearTimeout(timeoutId);
          await finishSplash();
        } else {
          setError("일부 데이터를 불러오지 못했습니다.");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error("Error in loadData:", error);
      setError("초기화 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  }, [dispatch, finishSplash, maxWaitMs, mounted]);

  // Call loadData in useEffect with proper cleanup
  useEffect(() => {
    if (!mounted) return;

    // Start loading data
    void loadData();

    // Set a safety timeout to close splash screen if something goes wrong
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn("Safety timeout - forcing splash to close");
        void finishSplash();
      }
    }, maxWaitMs);

    return () => {
      clearTimeout(safetyTimeout);
    };
  }, [loadData, maxWaitMs, mounted, finishSplash]);

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
            <div className="mt-2">
              <button
                onClick={() => {
                  hasInitialized.current = false;
                  setError(null);
                  setIsLoading(true);
                  void loadData();
                }}
                className="px-4 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm transition-colors"
              >
                다시 시도하기
              </button>
              <button
                onClick={() => {
                  // Continue without the data
                  void finishSplash();
                }}
                className="ml-2 px-4 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors"
              >
                계속하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
