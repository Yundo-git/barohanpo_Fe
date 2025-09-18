"use client";

import { Review } from "@/types/review";
import { useState } from "react";
import Image from "next/image";
import UpdateReviewModal from "./UpdateReviewModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import useDelReview from "@/hooks/useDelReview";

interface ReviewListProps {
  reviewList: Review[];
  onDelete?: () => void;
}

const ReviewList: React.FC<ReviewListProps> = ({ reviewList, onDelete }) => {
  console.log("ReviewList received:", reviewList);
  const [updateReviewModalOpen, setUpdateReviewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const { delReview, isLoading: isDeleting } = useDelReview();

  const updateReview = (review: Review) => {
    setSelectedReview(review);
    setUpdateReviewModalOpen(true);
  };

  const handleDeleteClick = (reviewId: number) => {
    setReviewToDelete(reviewId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!reviewToDelete) return;

    try {
      await delReview(reviewToDelete);
      // 리뷰 목록을 새로고침하기 위해 onDelete 콜백 호출
      if (onDelete) {
        onDelete();
      }
      // 목록이 새로고침된 후 성공 메시지 표시
      alert("리뷰가 삭제되었습니다.");
    } catch (error) {
      console.error("리뷰 삭제 중 오류:", error);
      // 오류는 이미 훅에서 처리되었으므로 별도의 알림을 표시할 필요 없음
    } finally {
      setReviewToDelete(null);
    }
  };

  if (reviewList.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">리뷰가 없습니다.</div>
    );
  }

  return (
    <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
      {reviewList.map((review, index) => (
        <div
          key={review.review_id || index}
          className=" mb-4 border-b border-gray-200 py-4"
        >
          {updateReviewModalOpen && selectedReview && (
            <UpdateReviewModal
              isOpen={updateReviewModalOpen}
              onClose={() => setUpdateReviewModalOpen(false)}
              review={selectedReview}
            />
          )}

          {/* 리뷰 헤더 */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <span className="text-yellow-400 text-lg">
                  {"★".repeat(review.score || 0)}
                </span>
                <span className="ml-1 text-gray-700">
                  {review.score || 0}.0
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                {review.created_at
                  ? new Date(review.created_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "날짜 정보 없음"}
              </p>
            </div>
          </div>

          {/* 리뷰 내용 영역 */}
          <p className="mt-3 text-gray-800 whitespace-pre-line">
            {review.comment || "내용 없음"}
          </p>

          {/* 리뷰 사진 영역*/}
          {review.photos && review.photos.length > 0 && (
            <div className="mt-3">
              <div className="flex gap-3 overflow-x-auto py-2 pb-3 -mx-1 px-1 scrollbar-hide">
                {review.photos.map((photo, photoIndex) => {
                  if (!photo.review_photo_url) return null;

                  const numPhotos = review.photos.length;
                  let photoWrapperClasses = "relative flex-shrink-0";

                  if (numPhotos === 1) {
                    photoWrapperClasses += " w-full";
                  } else if (numPhotos === 2) {
                    photoWrapperClasses += " w-1/2";
                  } else {
                    photoWrapperClasses += " w-1/3";
                  }

                  return (
                    <div
                      key={`${review.review_id}-${photoIndex}`}
                      className={photoWrapperClasses}
                    >
                      <div className="relative w-full h-24">
                        <Image
                          src={photo.review_photo_url}
                          alt={`리뷰 사진 ${photoIndex + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover rounded-lg border border-gray-200 cursor-pointer"
                          // sizes="96px" 속성 제거
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* 수정/삭제버튼*/}
          <div className="flex space-x-2 ">
            <button
              onClick={() => updateReview(review)}
              className="border border-gray-300 rounded-md px-4 py-2"
            >
              수정
            </button>
            <button
              onClick={() => handleDeleteClick(review.review_id)}
              disabled={isDeleting}
              className="border border-gray-300 rounded-md px-4 py-2"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>
      ))}

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="리뷰 삭제"
        message="정말로 이 리뷰를 삭제하시겠습니까?"
        confirmText={isDeleting ? "삭제 중..." : "삭제"}
        cancelText="취소"
      />
    </div>
  );
};

export default ReviewList;
