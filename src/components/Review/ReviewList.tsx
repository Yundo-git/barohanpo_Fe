"use client";

import { Review } from "@/types/review";
import { useState } from "react";
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
      // Call the onDelete callback to refresh the reviews list
      if (onDelete) {
        onDelete();
      }
      // Show success message after the list is refreshed
      alert('리뷰가 삭제되었습니다.');
    } catch (error) {
      console.error('리뷰 삭제 중 오류:', error);
      // Error is already handled in the hook, so we don't need to show another alert
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
    <div className="space-y-4">
      {reviewList.map((review, index) => {
        console.log(`Review ${index}:`, review);
        return (
          <div key={review.review_id || index}>
            {updateReviewModalOpen && selectedReview && (
              <UpdateReviewModal
                isOpen={updateReviewModalOpen}
                onClose={() => setUpdateReviewModalOpen(false)}
                review={selectedReview}
              />
            )}
            <p>
              {"★".repeat(review.score || 0)} {review.score || 0}
            </p>
            <p className="mt-2">{review.comment || "내용 없음"}</p>
            {review.photos && review.photos.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto py-2">
                {review.photos.map((photo, photoIndex) => {
                  try {
                    // Check if review_photo_blob is a Buffer
                    if (
                      photo.review_photo_blob &&
                      photo.review_photo_blob.data
                    ) {
                      const uint8Array = new Uint8Array(
                        photo.review_photo_blob.data
                      );
                      const base64String = btoa(
                        Array.from(uint8Array)
                          .map((byte) => String.fromCharCode(byte))
                          .join("")
                      );
                      return (
                        <div
                          key={photoIndex}
                          className="flex-shrink-0 w-24 h-24"
                        >
                          <img
                            src={`data:image/jpeg;base64,${base64String}`}
                            alt={`Review photo ${photoIndex + 1}`}
                            className="w-full h-full object-cover rounded"
                            onError={(e) => {
                              console.error("Error loading image:", e);
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      );
                    }
                  } catch (error) {
                    console.error("Error processing image:", error);
                  }
                  return null;
                })}
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {review.create_at
                ? new Date(review.create_at).toLocaleDateString()
                : "날짜 정보 없음"}
            </p>
            <div className="flex justify-start gap-4 mt-4 border-b pb-4">
              <button
                onClick={() => updateReview(review)}
                className="px-4 py-2 border border-gray-300 rounded"
              >
                수정
              </button>
              <button
                onClick={() => handleDeleteClick(review.review_id)}
                disabled={isDeleting}
                className={`px-4 py-2 border rounded ${
                  isDeleting
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'border-gray-300 hover:bg-gray-100'
                }`}
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        );
      })}

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="리뷰 삭제"
        message="정말로 이 리뷰를 삭제하시겠습니까?"
        confirmText={isDeleting ? '삭제 중...' : '삭제'}
        cancelText="취소"
      />
    </div>
  );
};

export default ReviewList;
