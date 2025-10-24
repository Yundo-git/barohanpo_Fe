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
import BusinessHours from "@/components/pharmacy/BusinessHours";

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
        <div className="flex flex-col">
          <div className="w-full aspect-[5/4] bg-main flex flex-col justify-center items-center overflow-hidden">
            <Image
              src="/logo.svg"
              alt="약국 로고"
              width={80}
              height={80}
              className="mb-4"
              priority
            />
            <p className="T1_SB_20 text-white text-center leading-tight drop-shadow-md font-medium">
              해당약국 이미지준비중입니다
            </p>
          </div>

          {pharmacy && (
            <div className="py-6 px-5">
              <h1 className="T2_SB_20">{pharmacy.name}</h1>
              <div className="space-y-2 mt-4">
                <div className="flex gap-1.5 B2_RG_14 text-subText2 items-center">
                  <Image
                    src="/icon/Environment.svg"
                    alt="주소"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                    priority
                  />
                  <span>{pharmacy.address}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {typeof pharmacy.distance === "number" && (
                    <div className="flex gap-1.5 B2_RG_14 text-subText2 items-center">
                      <Image
                        src="/icon/Environment.svg"
                        alt="거리"
                        width={16}
                        height={16}
                        className="w-4 h-4"
                        priority
                      />
                      <span>
                        {pharmacy.distance < 1
                          ? `${Math.round(pharmacy.distance * 1000)}m`
                          : `${pharmacy.distance.toFixed(1)}km`}{" "}
                        거리
                      </span>
                    </div>
                  )}

                  {/* 영업시간 요약 (오늘) */}
                  {pharmacy.business_hours_json && (
                    <BusinessHours businessHours={pharmacy.business_hours_json} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 탭 영역 */}
        <div className="mt-6">
          <Tabs
            items={[
              {
                key: "info",
                label: "약국 정보",
                component: (
                  <div className="p-5">
                    {pharmacy ? (
                      <>
                        {/*약국정보(etc)이 있는 경우에만 표시 */}
                        {pharmacy.etc?.trim() && (
                          <div>
                            <h3 className="T3_SB_18 pb-6 pt-1">약국정보</h3>
                            <div>
                              <p className="B1_RG_15 pb-6">{pharmacy.etc}</p>
                            </div>
                          </div>
                        )}

                        <h3 className="T3_SB_18 py-4">약국 위치</h3>

                        <span className="B1_RG_15 text-subText">
                          {pharmacy.address}
                        </span>
                        <div className="mt-6">
                          {Number.isFinite(derivedLat) &&
                          Number.isFinite(derivedLng) ? (
                            <StaticLocationMap
                              lat={derivedLat as number}
                              lng={derivedLng as number}
                              className="h-48 rounded-lg"
                            />
                          ) : (
                            <div className="h-48 rounded-lg bg-gray-100 flex items-center justify-center text-subText">
                              위치 좌표를 불러오는 중입니다.
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="B1_RG_15 text-subText">
                        주소 정보를 불러오는 중입니다.
                      </p>
                    )}
                  </div>
                ),
              },
              {
                key: "reviews",
                label: "후기",
                component: (
                  <div className="p-4">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main"></div>
                      </div>
                    ) : error ? (
                      <div className="text-red-500 text-center py-4">
                        후기를 불러오는 중 오류가 발생했습니다.
                      </div>
                    ) : reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <ReviewCard
                            key={review.review_id}
                            review={review}
                            showPharmacyName={false}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[50dvh]">
                        {/* 아이콘 넣어야함 */}
                        <Image
                          src="/icon/Paper.svg"
                          alt="리뷰 없음"
                          width={70}
                          height={70}
                          priority
                        />
                        <h1 className="T3_MD_18 text-subText2">
                          아직 등록된 리뷰가 없어요.
                        </h1>
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
            defaultActiveKey="info"
            onChange={(key: string) => {
              // 탭바뀜!
              console.log(`Tab changed to: ${key}`);
            }}
          />
        </div>

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
