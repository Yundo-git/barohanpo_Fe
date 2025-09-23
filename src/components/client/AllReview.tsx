"use client";

import { useAppSelector } from "@/store/store";
import ReviewCard from "@/components/Review/ReviewCard";

export default function AllReview() {
  const { reviews, isLoading, error } = useAppSelector((s) => s.review);
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-80">
              <div className="h-full p-4 border rounded-lg space-y-2 bg-white">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  //리뷰불러오다 에러난거
  if (error) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-red-600">
          리뷰를 불러오는 중 오류가 발생했습니다: {error}
        </div>
      </div>
    );
  }
  //리뷰가 없을때
  return (
    <div className=" max-w-full">
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          리뷰가 아직 없습니다.
        </div>
      ) : (
        <div className="relative">
          <h1 className="H3_SB_20 text-mainText px-5">사용자 후기</h1>
          <div
            className="flex overflow-x-auto pb-6 scrollbar-hide px-5"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <div className="flex space-x-4 w-full">
              {reviews.map((review) => (
                <div
                  key={review.review_id}
                  className="flex-shrink-0 w-80 "
                  style={{ scrollSnapAlign: "center" }}
                >
                  <ReviewCard
                    review={review}
                    showPharmacyName={true}
                    className="h-full w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
