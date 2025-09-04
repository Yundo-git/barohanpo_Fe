"use client";

import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import type { Pharmacy } from "@/types/pharmacy";
import Tabs from "@/components/Tab";
import type { RootState } from "@/store/store";
import ReviewCard from "@/components/Review/ReviewCard";
import useGetPharmaciesReview from "@/hooks/useGetPharmaciesReview";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import BottomSheet from "@/components/BottomSheet";
import { format } from "date-fns";

// Dynamically import the reservation sheet to handle SSR
const ReservationSheetContent = dynamic(
  () => import("@/components/reservation/ReservationSheetContent"),
  { ssr: false }
);

export default function PharmacyDetail() {
  const params = useParams();
  const pharmacyId = Number(params.id);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [initialDate, setInitialDate] = useState<Date>(new Date());

  const pharmacies = useSelector(
    (state: RootState) => state.pharmacy.pharmacies
  );
  const pharmacy = pharmacies.find(
    (p: Pharmacy) => Number(p.p_id) === pharmacyId
  );

  const { reviews, isLoading, error, fetchReviews } =
    useGetPharmaciesReview(pharmacyId);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const openReservation = () => {
    setInitialDate(new Date());
    setIsReservationOpen(true);
  };

  const closeReservation = () => {
    setIsReservationOpen(false);
    void fetchReviews();
  };

  return (
    <div className="min-h-[100dvh] pb-16">
      {/* 페이지 여백 */}
      <div className="p-4">
        {/* 중앙 정렬 컨테이너 */}
        <div className="mx-auto w-full max-w-3xl">
          {/* 상단 이미지/기본 정보 */}
          <div className="flex flex-col">
            <div className="flex justify-center items-center">
              <div className="w-full h-64 sm:h-80 md:h-96 bg-gray-200 rounded-lg flex justify-center items-center">
                이미지영역
              </div>
            </div>

            {pharmacy && (
              <div className="mt-4">
                <h1 className="text-2xl font-bold">{pharmacy.name}</h1>
                <p className="text-gray-600">{pharmacy.address}</p>
                <p className="text-gray-600">영업시간 영역</p>
                <p className="text-gray-600">전화 : {pharmacy.user?.number}</p>
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
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2">약국 정보</h3>
                      <p>약국 소개 내용이 들어갑니다.</p>
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
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                        <div>
                          {/* 아이콘 넣어야함 */}
                          <h1>아직 등록된 리뷰가 없어요.</h1>
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

          <div className="mt-8 pt-4">
            <button
              onClick={openReservation}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              예약하기
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
    </div>
  );
}
