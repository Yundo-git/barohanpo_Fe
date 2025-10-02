"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useAppDispatch } from "@/store/store";
import { fetchFiveStarReviews } from "@/store/reviewSlice";
import { fetchNearbyPharmacies } from "@/store/pharmacySlice";
import { store } from "@/store/store";
import { Geolocation } from "@capacitor/geolocation";

// Helper function to get current position with TypeScript types
const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    } else {
      reject(new Error("Geolocation is not supported by this browser"));
    }
  });
};

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

    const state = store.getState();
    const hasReviews = (state.review.reviews?.length ?? 0) > 0;
    const hasPharmacies = (state.pharmacy.pharmacies?.length ?? 0) > 0;

    if (hasReviews && hasPharmacies) {
      console.log("기존 데이터 확인 중...");
      // NOTE: loadData에서 이미 위치 비교,
      // 여기서는 데이터가 채워지기만 하면 바로 종료!!
      void finishSplash();
    }
  }, [mounted, finishSplash]);

  // 위치 기반 데이터 로드
  const loadData = useCallback(async () => {
    if (!mounted || hasInitialized.current) return;
    hasInitialized.current = true;
    
    try {
      console.log("데이터 가져오는 중...");
      setIsLoading(true);
      setError(null);

      // 현재 위치 가져오기
      const position = await getCurrentPosition();
      const currentLat = position.coords.latitude;
      const currentLng = position.coords.longitude;
      const tolerance = 0.00005; // 위치 오차 허용 범위 (약 5m)

      // Redux 상태 확인
      const state = store.getState();
      const hasReviews = (state.review.reviews?.length ?? 0) > 0;
      const hasPharmacies = (state.pharmacy.pharmacies?.length ?? 0) > 0;
      const lastLocation = state.pharmacy.lastLocation;
      let shouldRefetchPharmacies = false;

      // 위치 비교 로직
      if (hasPharmacies && lastLocation) {
        const latDiff = Math.abs(currentLat - lastLocation.lat);
        const lngDiff = Math.abs(currentLng - lastLocation.lng);

        if (latDiff < tolerance && lngDiff < tolerance) {
          console.log("이전에 조회한 위치와 동일합니다. 약국 데이터 재요청을 건너뜁니다.");
          shouldRefetchPharmacies = false;
        } else {
          console.log("위치가 변경되었거나 허용 범위를 벗어났습니다. 약국 데이터를 다시 가져옵니다.");
          shouldRefetchPharmacies = true;
        }
      } else if (hasPharmacies && !lastLocation) {
        console.log("데이터는 있지만 이전 위치 정보가 없습니다. 안전을 위해 다시 가져옵니다.");
        shouldRefetchPharmacies = true;
      } else if (!hasPharmacies) {
        console.log("약국 데이터가 없습니다. 데이터를 가져옵니다.");
        shouldRefetchPharmacies = true;
      }

      // 모든 데이터가 있고, 위치도 같다면 바로 종료
      if (hasReviews && hasPharmacies && !shouldRefetchPharmacies) {
        console.log("데이터가 최신 상태이고 위치가 동일하여 스플래시를 조기 종료합니다.");
        await finishSplash();
        return;
      }

      // 데이터 병렬로 가져오기
      const fetches = [];
      if (!hasReviews) {
        fetches.push(dispatch(fetchFiveStarReviews()));
      }
      if (shouldRefetchPharmacies) {
        fetches.push(
          dispatch(
            fetchNearbyPharmacies({
              lat: currentLat,
              lng: currentLng,
            })
          )
        );
      }

      if (fetches.length > 0) {
        await Promise.all(fetches);
      }

      console.log("모든 데이터 로드 완료");
      await finishSplash();
    } catch (error) {
      console.error("데이터 로딩 중 오류 발생:", error);
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  }, [dispatch, finishSplash, mounted]);

  // 초기 데이터 로드
  useEffect(() => {
    if (!mounted) return;

    // 최대 대기 시간 설정
    const timeoutId = setTimeout(() => {
      console.log("최대 대기 시간 도달, 스플래시 종료");
      void finishSplash();
    }, maxWaitMs);

    maxWaitTimerRef.current = timeoutId;

    // 초기 데이터 로드
    void loadData();

    return () => {
      if (maxWaitTimerRef.current) {
        clearTimeout(maxWaitTimerRef.current);
      }
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
