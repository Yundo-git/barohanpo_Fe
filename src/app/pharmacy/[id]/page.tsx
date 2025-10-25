"use client";

import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import type { Pharmacy } from "@/types/pharmacy";
import Tabs from "@/components/ui/Tab";
import type { RootState } from "@/store/store";
import ReviewCard from "@/components/Review/ReviewCard";
import useGetPharmaciesReview from "@/hooks/useGetPharmaciesReview";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import BottomSheet from "@/components/ui/BottomSheet";
import { format } from "date-fns";
import Image from "next/image";
import PharmacyDetailHeader from "@/components/pharmacy/PharmacyDetailHeader";
import PharmacyTabs from "@/components/pharmacy/PharmacyTabs";

// Dynamically import the reservation sheet to handle SSR
const ReservationSheetContent = dynamic(
  () => import("@/components/reservation/ReservationSheetContent"),
  { ssr: false }
);

// Dynamic import for a lightweight static location map
const StaticLocationMap = dynamic(
  () => import("@/components/map/StaticLocationMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-48 rounded-lg border border-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-main"></div>
      </div>
    ),
  }
);

export default function PharmacyDetail() {
  const params = useParams();
  const pharmacyId = Number(params.id);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(true);
  const [initialDate, setInitialDate] = useState<Date>(new Date());

  const pharmacies = useSelector(
    (state: RootState) => state.pharmacy.pharmacies
  );
  const pharmacy = pharmacies.find(
    (p: Pharmacy) => Number(p.p_id) === pharmacyId
  );

  console.log("pharmacy in detail", pharmacy);
  // Derive robust numeric coordinates (handle lat/lng or latitude/longitude, string values)
  const derivedLat = pharmacy
    ? Number(
        typeof pharmacy.lat !== "undefined" ? pharmacy.lat : pharmacy.latitude
      )
    : undefined;
  const derivedLng = pharmacy
    ? Number(
        typeof pharmacy.lng !== "undefined" ? pharmacy.lng : pharmacy.longitude
      )
    : undefined;

  const { reviews, isLoading, error, fetchReviews } =
    useGetPharmaciesReview(pharmacyId);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  // Initial page loading UX (like MapLoader)
  useEffect(() => {
    // End loading when pharmacy data is available or after a short delay as a fallback
    const timer = setTimeout(() => setIsDetailLoading(false), 600);
    if (pharmacy) {
      setIsDetailLoading(false);
    }
    return () => clearTimeout(timer);
  }, [pharmacy]);

  const openReservation = () => {
    setInitialDate(new Date());
    setIsReservationOpen(true);
  };

  const closeReservation = () => {
    setIsReservationOpen(false);
    void fetchReviews();
  };

  if (isDetailLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-main mb-3"></div>
          <p className="text-subText">페이지를 로드하는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] pb-16">
      {/* 중앙 정렬 컨테이너 */}
      <div className="mx-auto w-full max-w-3xl">
        {/* 상단 이미지/기본 정보 */}
        {pharmacy && <PharmacyDetailHeader pharmacy={pharmacy} />}

        {/* 탭 영역 */}
        <PharmacyTabs
          pharmacy={pharmacy}
          derivedLat={derivedLat}
          derivedLng={derivedLng}
          reviews={reviews}
          isLoading={isLoading}
          error={error}
        />

        <div className="mt-3 px-5">
          <button
            onClick={openReservation}
            className="w-full bg-main hover:bg-main/80 text-white py-3 px-5 rounded-lg B1_SB_15 transition-colors"
          >
            방문 예약하기
          </button>
        </div>

        {isReservationOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
            onClick={closeReservation}
          />
        )}

        {isReservationOpen && pharmacy && (
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <BottomSheet
              isOpen={isReservationOpen}
              onClose={closeReservation}
              maxHeightVh={80}
              ariaLabel={`${pharmacy.name} 예약하기`}
            >
              <ReservationSheetContent
                pharmacyId={pharmacyId}
                pharmacyName={pharmacy.name}
                initialDate={format(initialDate, "yyyy-MM-dd")}
                onClose={closeReservation}
              />
            </BottomSheet>
          </div>
        )}
      </div>
    </div>
    // </div>
  );
}
