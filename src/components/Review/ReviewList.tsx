"use client";

import { Review } from "@/types/review";

interface ReviewListProps {
  reviewList: Review[];
}

const ReviewList: React.FC<ReviewListProps> = ({ reviewList }) => {
  console.log("ReviewList received:", reviewList);

  if (reviewList.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">리뷰가 없습니다.</div>
    );
  }

  return (
    <div className="space-y-4">
      {reviewList.map((review, index) => {
        console.log(`Review ${index}:`, review);
        return (
          <div
            key={review.review_id || index}
            className="p-4 border rounded-lg"
          >
            <p className="font-semibold">리뷰 #{index + 1}</p>
            <p>평점: {"★".repeat(review.score || 0)}</p>
            <p className="mt-2">{review.comment || "내용 없음"}</p>
            <p className="text-sm text-gray-500 mt-1">
              {review.create_at
                ? new Date(review.create_at).toLocaleDateString()
                : "날짜 정보 없음"}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default ReviewList;
