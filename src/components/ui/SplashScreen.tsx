// src/components/ui/SplashScreen.tsx (최종)
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useAppDispatch } from "@/store/store";
import { fetchFiveStarReviews } from "@/store/reviewSlice";
// 💡 [추가] setAppInitialized 액션을 임포트합니다.
import { fetchNearbyPharmacies, setAppInitialized } from "@/store/pharmacySlice"; 
import { store } from "@/store/store";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

// 💡 getCurrentPosition 함수 (속도 최적화 적용됨)
const getCurrentPosition = async (): Promise<{ latitude: number; longitude: number }> => {
  try {
    const options = {
      enableHighAccuracy: false, // 💡 속도 개선 (false)
      timeout: 5000,           // 💡 타임아웃 5초로 단축
      maximumAge: 60000,         // 💡 1분 이내 캐시 사용
    };

    if (Capacitor?.isNativePlatform?.()) {
      console.log("[SplashScreen] 📱 Capacitor Geolocation 사용 (앱)");
      const position = await Geolocation.getCurrentPosition(options);
      console.log("[SplashScreen] 위치 정보:", position.coords.latitude, position.coords.longitude);
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } else {
      console.log("[SplashScreen] 🌐 브라우저 Geolocation API 사용 (웹)");
      return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log("[SplashScreen] 위치 정보:", position.coords.latitude, position.coords.longitude);
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            reject,
            options // 웹 환경에도 동일 옵션 적용
          );
        } else {
          reject(new Error("Geolocation is not supported by this browser"));
        }
      });
    }
  } catch (error) {
    console.error("[SplashScreen] ❌ 위치 정보 가져오기 실패:", error);
    throw error;
  }
};

type SplashScreenProps = {
  onLoaded: () => void;
  minDurationMs?: number;
  maxWaitMs?: number;
};

export default function SplashScreen({
  onLoaded,
  minDurationMs = 800,
  maxWaitMs = 15000,
}: SplashScreenProps) {
  const dispatch = useAppDispatch();

  const [mounted, setMounted] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(true);
  const [isFading, setIsFading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const hasInitialized = useRef<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());
  const maxWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 앱 재개 시 권한 상태를 다시 확인하기 위한 useEffect (선택 사항)
  const loadDataRef = useRef(null as unknown as () => Promise<void>);
  
  useEffect(() => {
    if (Capacitor?.isNativePlatform?.()) {
      const checkStatus = async () => {
        const status = await Geolocation.checkPermissions();
        if (status.location === 'granted' && error) {
          // 권한이 허용되면 에러를 지우고 데이터 로드를 다시 시도
          hasInitialized.current = false;
          setError(null);
          setIsLoading(true);
          // loadData 함수를 직접 호출하는 대신, ref를 통해 호출
          void loadDataRef.current(); 
        }
      };
      
      // App.addListener('resume', checkStatus);
      
      // Capacitor App.addListener 대신, 컴포넌트 마운트 시 한 번만 등록하는 것이 일반적
      return () => {
        // App.removeAllListeners();
      };
    }
  }, [error]); // loadData 대신 error만 의존성에 넣고, loadDataRef를 사용합니다.


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
      console.log(`[SplashScreen] 최소 노출 시간 보장을 위해 ${remain}ms 대기`);
      await new Promise<void>((resolve) => setTimeout(resolve, remain));
    }
  }, [minDurationMs]);

  const finishSplash = useCallback(async () => {
    try {
      console.log("[SplashScreen] 스플래시 종료 시작");
      await waitMinDuration();

      if (!mounted) return;

      setIsFading(true);
      await new Promise<void>((resolve) => setTimeout(resolve, 300));

      if (!mounted) return;

      console.log("[SplashScreen] ✅ 스플래시 완전 종료");
      onLoaded();
      setVisible(false);
    } catch (error) {
      console.error("[SplashScreen] finishSplash에서 오류 발생:", error);
      onLoaded();
      setVisible(false);
    }
  }, [mounted, onLoaded, waitMinDuration]);

  const loadData = useCallback(async () => {
    if (!mounted || hasInitialized.current) return;
    hasInitialized.current = true;
    
    try {
      console.log("[SplashScreen] 📍 데이터 가져오기 시작...");
      setIsLoading(true);
      setError(null);

      // 💡 **위치 권한 확인 및 요청 로직**
      if (Capacitor?.isNativePlatform?.()) {
        console.log("[SplashScreen] 🚨 위치 권한 확인 중...");
        let status = await Geolocation.checkPermissions();

        if (status.location !== 'granted') {
          console.log("[SplashScreen] 🚨 권한 요청 팝업 표시...");
          status = await Geolocation.requestPermissions();
        }

        if (status.location !== 'granted') {
          console.error("[SplashScreen] ❌ 위치 권한이 최종 거부됨.");
          throw new Error("Geolocation denied: 앱 사용을 위해 위치 권한이 필수입니다. 설정에서 허용해주세요.");
        }
      }
      
      // 현재 위치 가져오기 (속도 개선된 getCurrentPosition 호출)
      console.log("[SplashScreen] 위치 정보 가져오는 중...");
      const position = await getCurrentPosition();
      const currentLat = position.latitude;
      const currentLng = position.longitude;
      console.log("[SplashScreen] 현재 위치:", currentLat, currentLng);

      // Redux 상태 확인 및 재요청 결정 로직
      const tolerance = 0.00005; 
      const state = store.getState();
      const hasReviews = (state.review.reviews?.length ?? 0) > 0;
      const hasPharmacies = (state.pharmacy.pharmacies?.length ?? 0) > 0;
      const lastLocation = state.pharmacy.lastLocation;
      let shouldRefetchPharmacies = false;
      
      // isAppInitialized가 true일 때는 이미 HomePage에서 Splash를 막았으므로,
      // 여기서의 로직은 최초 실행 (isAppInitialized: false) 시에만 의미가 있습니다.
      // 하지만, 혹시 모를 상황을 대비해 약국 데이터의 재요청 조건은 유지합니다.

      if (hasPharmacies && lastLocation) {
        const latDiff = Math.abs(currentLat - lastLocation.lat);
        const lngDiff = Math.abs(currentLng - lastLocation.lng);

        if (latDiff >= tolerance || lngDiff >= tolerance) {
          console.log("[SplashScreen] 위치 변경됨, 약국 데이터 다시 가져옴");
          shouldRefetchPharmacies = true;
        } else {
          console.log("[SplashScreen] 이전 위치와 동일, 약국 데이터 재요청 건너뜀");
        }
      } else if (!hasPharmacies) {
        console.log("[SplashScreen] 약국 데이터 없음, 새로 가져옴");
        shouldRefetchPharmacies = true;
      }

      // 데이터 병렬로 가져오기
      const fetches = [];
      if (!hasReviews) {
        console.log("[SplashScreen] 리뷰 데이터 가져오는 중...");
        fetches.push(dispatch(fetchFiveStarReviews()));
      }
      if (shouldRefetchPharmacies) {
        console.log("[SplashScreen] 약국 데이터 가져오는 중...");
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
      
      // 💡 [추가] 로딩 성공 시: setAppInitialized(true) 디스패치
      // HomePage에서 isAppInitialized를 false로 확인하고 이 Splash를 실행했으므로,
      // 성공 시에는 무조건 true로 설정하여 앱 초기화 상태를 저장합니다.
      console.log("[SplashScreen] 🚀 앱 초기화 상태를 True로 설정합니다.");
      dispatch(setAppInitialized(true));

      console.log("[SplashScreen] ✅ 모든 데이터 로드 완료");
      await finishSplash();
    } catch (error) {
      console.error("[SplashScreen] ❌ 데이터 로딩 중 오류 발생:", error);
      
      // ... (에러 메시지 처리 로직 유지)
      if (error instanceof Error) {
        if (error.message.includes('Geolocation denied')) {
          setError(error.message); 
        } else if (error.message.includes('location') || error.message.includes('denied')) {
          setError("위치 권한이 필요합니다. 설정에서 위치 권한을 허용해주세요.");
        } else {
          setError("데이터를 불러오는 중 오류가 발생했습니다.");
        }
      } else {
        setError("데이터를 불러오는 중 알 수 없는 오류가 발생했습니다.");
      }
      setIsLoading(false);
    }
  }, [dispatch, finishSplash, mounted]);

  // loadDataRef 업데이트
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);


  // 초기 데이터 로드
  useEffect(() => {
    if (!mounted) return;

    // 최대 대기 시간 설정
    const timeoutId = setTimeout(() => {
      console.log("[SplashScreen] ⏰ 최대 대기 시간 도달, 강제 종료");
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

  if (!mounted || !visible) return null;

  // 에러가 발생했고, 위치 권한 오류인 경우 '설정으로 이동' 버튼 추가
  const isLocationError = error?.includes('위치 권한이') || error?.includes('Geolocation denied');

  const handleGoToSettings = () => {
    if (Capacitor?.isNativePlatform?.()) {
      console.log("[SplashScreen] 앱 설정으로 이동 요청");
      if ((App as any).openAppSettings) {
        (App as any).openAppSettings();
      } else {
        alert("자동 설정 이동 기능이 지원되지 않아 직접 설정으로 이동해주세요.");
      }
    } else {
      alert("웹 환경에서는 설정 이동을 지원하지 않습니다. 브라우저 설정을 확인해주세요.");
    }
  };

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

   
      </div>
    </div>,
    document.body
  );
}