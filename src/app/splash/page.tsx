"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { fetchNearbyPharmacies } from "@/store/pharmacySlice";
import { fetchFiveStarReviews } from "@/store/reviewSlice";
import { useMapHandlers } from "@/hooks/useMapHandlers";
import { useLocationPermission } from "@/hooks/useLocationPermission";

export default function SplashPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { pharmacies, isLoading, lastLocation } = useAppSelector(
    (s) => s.pharmacy
  );
  const { reviews } = useAppSelector((s) => s.review);

  const { getCurrentPosition } = useMapHandlers({
    createPharmacyMarkers: () => [],
    adjustMapBounds: () => {},
    handleMarkerClick: () => {},
    findNearbyPharmacies: async () => [],
  });
  const { requestLocationPermission } = useLocationPermission();

  useEffect(() => {
    const bootstrap = async () => {
      // 이미 약국 리스트와 전체 리뷰가 모두 있으면 스킵
      if (pharmacies.length > 0 && reviews.length > 0) {
        router.replace("/");
        return;
      }

      try {
        // 먼저 권한 요청 시도 (웹/네이티브 각각에서 안전하게 동작)
        await requestLocationPermission();

        // 약국 데이터 가져오기
        let pharmacyPromise;
        try {
          const position = await getCurrentPosition();
          const { latitude, longitude } = position.coords;
          pharmacyPromise = dispatch(
            fetchNearbyPharmacies({ lat: latitude, lng: longitude })
          );
        } catch {
          if (lastLocation) {
            pharmacyPromise = dispatch(
              fetchNearbyPharmacies({
                lat: lastLocation.lat,
                lng: lastLocation.lng,
              })
            );
          } else {
            pharmacyPromise = dispatch(
              fetchNearbyPharmacies({ lat: 37.5665, lng: 126.978 })
            );
          }
        }

        // 리뷰 데이터 가져오기
        const reviewPromise = dispatch(fetchFiveStarReviews());

        // 모든 데이터 로드가 완료될 때까지 기다림
        await Promise.all([pharmacyPromise, reviewPromise]);

        // 모든 데이터 로드 완료 후에만 메인 페이지로 이동
        router.replace("/");
      } catch (error) {
        console.error("Error during splash screen initialization:", error);
        // 에러가 발생해도 일정 시간 후에 메인 페이지로 이동 (무한 로딩 방지)
        setTimeout(() => router.replace("/"), 5000);
      }
    };

    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
        <p className="text-gray-600">서비스 준비 중...</p>
      </div>
    </div>
  );
}
