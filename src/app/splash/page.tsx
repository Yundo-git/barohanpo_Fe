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
        let fetched = false;
        try {
          const position = await getCurrentPosition();
          const { latitude, longitude } = position.coords;
          await dispatch(
            fetchNearbyPharmacies({ lat: latitude, lng: longitude })
          );
          fetched = true;
        } catch {
          if (lastLocation) {
            await dispatch(
              fetchNearbyPharmacies({
                lat: lastLocation.lat,
                lng: lastLocation.lng,
              })
            );
            fetched = true;
          }
        }

        if (!fetched) {
          await dispatch(fetchNearbyPharmacies({ lat: 37.5665, lng: 126.978 }));
        }

        await dispatch(fetchFiveStarReviews());
      } finally {
        router.replace("/");
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
