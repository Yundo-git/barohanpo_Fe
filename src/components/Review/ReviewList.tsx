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
          >
            <p> {"★".repeat(review.score || 0)} {review.score || 0}</p>
            <p className="mt-2">{review.comment || "내용 없음"}</p>
            <p className="text-sm text-gray-500 mt-1">
              {review.create_at
                ? new Date(review.create_at).toLocaleDateString()
                : "날짜 정보 없음"}
            </p>
            <div className="flex justify-start gap-4 mt-4 border-b pb-4">
              <button className="px-4 py-2 border border-gray-300 rounded">수정</button>
              <button className="px-4 py-2 border border-gray-300 rounded">삭제</button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReviewList;
