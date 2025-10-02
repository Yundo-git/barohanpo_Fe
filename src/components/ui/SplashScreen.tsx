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
  /** 스플래시 최소 노출 시간(밀리초). 기본값 800ms */
  minDurationMs?: number;
  /** 로딩 최대 대기 시간(밀리초). 기본값 15000ms */
  maxWaitMs?: number;
};

export default function SplashScreen({
  onLoaded,
  minDurationMs = 800,
  maxWaitMs = 15000,
}: SplashScreenProps) {
  const dispatch = useAppDispatch();

  const [mounted, setMounted] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(true); // false이면 컴포넌트가 언마운트됨
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
      // 최소 노출 시간 보장
      await waitMinDuration();

      if (!mounted) return;

      // 페이드아웃 효과 적용
      setIsFading(true);
      await new Promise<void>((resolve) => setTimeout(resolve, 300));

      if (!mounted) return;

      // 부모 컴포넌트의 콜백 함수 호출
      onLoaded();

      // 컴포넌트 언마운트
      setVisible(false);
    } catch (error) {
      console.error("finishSplash에서 오류 발생:", error);
      // 오류가 발생해도 정리 작업 수행
      onLoaded();
      setVisible(false);
    }
  }, [mounted, onLoaded, waitMinDuration]);

  // Redux 상태를 확인하고 데이터가 로드되면 닫는 효과
  useEffect(() => {
    if (!mounted) return;

    const checkDataLoaded = () => {
      const state = store.getState();
      const hasReviews = (state.review.reviews?.length ?? 0) > 0;
      const hasPharmacies = (state.pharmacy.pharmacies?.length ?? 0) > 0;

      if (hasReviews && hasPharmacies) {
        console.log("Data loaded in Redux, finishing splash");
        // NOTE: loadData에서 이미 위치 비교 후 판단하므로,
        // 여기서는 데이터가 채워지기만 하면 바로 종료해도 무방합니다.
        void finishSplash();
      }
    };

    // 이미 데이터가 로드된 경우 즉시 확인
    checkDataLoaded();

    // 스토어 변경 사항 구독
    // 구독 해제 함수를 ref에 저장
    unsubscribeRef.current = store.subscribe(checkDataLoaded);

    // 최대 대기 시간 후 강제로 닫기 위한 타임아웃 설정
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

      // Redux에서 마지막 검색 위치를 가져옵니다.
      const lastLocation = currentState.pharmacy.lastLocation;

      // 로딩 상태 설정
      setError(null);
      setIsLoading(true);

      // 사용자 위치 정보 가져오기
      const position = await new Promise<GeolocationPosition>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          () => {
            // 위치 정보를 가져오지 못한 경우 서울 좌표로 기본값 설정
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

      const currentLat = position.coords.latitude;
      const currentLng = position.coords.longitude;

      // 약국 재호출 필요성 판단 로직
      let shouldRefetchPharmacies = true;
      const tolerance = 0.00005; // 위치 오차 허용 범위 (약 5m)

      if (hasPharmacies && lastLocation) {
        const latDiff = Math.abs(currentLat - lastLocation.lat);
        const lngDiff = Math.abs(currentLng - lastLocation.lng);

        if (latDiff < tolerance && lngDiff < tolerance) {
          console.log(
            "✅ Current location is same as last fetched. Skipping pharmacy refetch."
          );
          shouldRefetchPharmacies = false;
        } else {
          console.log(
            "⚠️ Location changed or outside tolerance. Refetching pharmacies."
          );
        }
      } else if (hasPharmacies && !lastLocation) {
        // 데이터는 있지만, 위치 기록이 없으면 재호출 (안전 장치)
        console.log("⚠️ Has data but no last location. Refetching for safety.");
        shouldRefetchPharmacies = true;
      } else if (!hasPharmacies) {
        // 데이터가 아예 없는 경우는 무조건 호출
        console.log("⚠️ No pharmacy data available. Fetching.");
        shouldRefetchPharmacies = true;
      }

      // 모든 데이터가 있고, 위치도 같다면 바로 종료
      if (hasReviews && hasPharmacies && !shouldRefetchPharmacies) {
        console.log(
          "Data is fresh and location is same, finishing splash early."
        );
        await finishSplash();
        return;
      }

      // 데이터 병렬로 가져오기
      const fetches: Array<Promise<unknown>> = [];

      if (!hasReviews) {
        fetches.push(dispatch(fetchFiveStarReviews()).unwrap());
      }

      // 재호출 필요시 약국 리스트 호출
      if (shouldRefetchPharmacies) {
        fetches.push(
          dispatch(
            fetchNearbyPharmacies({
              lat: currentLat,
              lng: currentLng,
            })
          ).unwrap()
        );
      }

      // 데이터 로딩이 너무 오래 걸리는 경우 강제 종료를 위한 타임아웃 설정
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

        // 데이터 로드 확인 (Redux 구독이 처리할 것이지만, 안전을 위해 다시 확인)
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
        "fixed inset-0 z-[9999] flex items-center justify-center p-4",
        "transition-opacity duration-300",
        isFading ? "opacity-0" : "opacity-100",
        "bg-[#00bfa5]",
      ].join(" ")}
      aria-busy={isLoading}
      role="status"
      key="splash-screen"
    >
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="animate-pulse z-10">
          <div
            className="mx-auto"
            style={{
              width: "10vh",
              height: "10vh",
              minWidth: "3rem",
              minHeight: "3rem",
              maxWidth: "6rem",
              maxHeight: "6rem",
              position: "relative",
            }}
          >
            <Image
              src="/logo.svg"
              alt="바로한포 로고"
              width={0}
              height={0}
              sizes="100vw"
              className="w-full h-auto object-contain"
              priority
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 z-50 bg-red-50 text-red-600 rounded-md">
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
