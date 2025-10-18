// src/app/page.tsx 또는 src/components/HomePage.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/store/store";
import { shallowEqual } from "react-redux";
import { fetchFiveStarReviews } from "@/store/reviewSlice";
import dynamic from "next/dynamic";

// Dynamically import components to ensure they're only loaded on the client side
const SplashScreen = dynamic(() => import("@/components/ui/SplashScreen"), {
  ssr: false,
});

const Home = dynamic(() => import("@/components/Home"), {
  ssr: false,
});

export default function HomePage() {
  const dispatch = useAppDispatch();

  // 앱 초기화 상태 확인
  const { isAppInitialized } = useAppSelector((state) => ({
    isAppInitialized: state.pharmacy.isAppInitialized || false,
  }), shallowEqual);

  // 리뷰 상태 확인 및 관리
  const { reviews, isLoading: reviewLoading } = useAppSelector((state) => ({
    reviews: state.review.reviews,
    isLoading: state.review.isLoading
  }), shallowEqual);

  // 스플레시 화면 상태 관리
  const [showSplash, setShowSplash] = useState(!isAppInitialized);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const hasDataLoaded = useRef(false);

  // 리뷰 데이터가 없거나 로딩 중이 아닐 때 자동으로 리뷰 데이터 로드
  useEffect(() => {
    let retryTimer: NodeJS.Timeout;
    const RETRY_DELAY = 5000; // 5초 후 재시도

    const fetchReviews = () => {
      // 앱이 초기화되었고 리뷰 데이터가 없으며 로딩 중이 아닐 때만 호출
      if (isAppInitialized && reviews.length === 0 && !reviewLoading) {
        console.log("[HomePage] 5점 리뷰를 가져오는 중...");
        dispatch(fetchFiveStarReviews())
          .then((result) => {
            // 액션이 성공적으로 완료되었지만 리뷰가 없는 경우
            if (result.meta.requestStatus === 'fulfilled' && reviews.length === 0) {
              console.log("[HomePage] 5점 리뷰가 없어서 다시 시도합니다.");
              retryTimer = setTimeout(fetchReviews, RETRY_DELAY);
            }
          });
      }
    };

    fetchReviews();

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [isAppInitialized, reviews.length, reviewLoading, dispatch]);

  // 스플레시 화면 종료 처리
  const handleSplashComplete = useCallback(() => {
    if (hasDataLoaded.current) return;
    hasDataLoaded.current = true;

    console.log("Starting splash screen transition...");
    setIsTransitioning(true);

    // Short delay for smooth transition
    setTimeout(() => {
      console.log("Hiding splash screen");
      setShowSplash(false);
      setIsTransitioning(false);
    }, 300);
  }, []);

  // isAppInitialized가 true로 변경되었을 때 스플레시를 종료하는 로직
  useEffect(() => {
    if (isAppInitialized && showSplash) {
      console.log("App initialized via Redux, completing splash");
      handleSplashComplete();
    }
  }, [isAppInitialized, showSplash, handleSplashComplete]);

  return (
    <main className="min-h-screen relative">
      {/* Splash Screen은 showSplash가 true일 때만 렌더링됩니다. */}
      {showSplash && (
        <div
          className={`fixed inset-0 z-50 transition-opacity duration-300 bg-white ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* isAppInitialized가 false일 때만 SplashScreen 컴포넌트를 마운트하여 데이터 로딩을 시작합니다. */}
          {!isAppInitialized && <SplashScreen onLoaded={handleSplashComplete} />}
        </div>
      )}

      {/* Main Content */}
      <div
        className={`transition-opacity duration-300 ${
          !showSplash && !isTransitioning
            ? "opacity-100"
            : "opacity-0 pointer-events-none absolute w-full h-full"
        }`}
      >
        <Home />
      </div>
    </main>
  );
}

HomePage.displayName = "HomePage";