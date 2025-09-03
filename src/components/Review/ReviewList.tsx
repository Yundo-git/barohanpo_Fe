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
      alert("리뷰가 삭제되었습니다.");
    } catch (error) {
      console.error("리뷰 삭제 중 오류:", error);
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
    <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
      {reviewList.map((review, index) => (
        <div key={review.review_id || index} className=" mb-4">
          {updateReviewModalOpen && selectedReview && (
            <UpdateReviewModal
              isOpen={updateReviewModalOpen}
              onClose={() => setUpdateReviewModalOpen(false)}
              review={selectedReview}
            />
          )}

          {/* 리뷰헤더 */}
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
                {review.create_at
                  ? new Date(review.create_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "날짜 정보 없음"}
              </p>
            </div>
          </div>

          {/* Review Content */}
          <p className="mt-3 text-gray-800 whitespace-pre-line">
            {review.comment || "내용 없음"}
          </p>

          {/* Review Images */}
          {review.photos && review.photos.length > 0 && (
            <div className="mt-3">
              <div className="flex gap-3 overflow-x-auto py-2 pb-3 -mx-1 px-1 scrollbar-hide">
                {review.photos.map((photo, photoIndex) => {
                  if (!photo.review_photo_blob?.data) return null;

                  try {
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
                        key={`${review.review_id}-${photoIndex}`}
                        className="relative flex-shrink-0 w-24 h-24 group"
                      >
                        <img
                          src={`data:image/jpeg;base64,${base64String}`}
                          alt={`리뷰 사진 ${photoIndex + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newWindow = window.open("", "_blank");
                            if (newWindow) {
                              newWindow.document.write(`
                                <!DOCTYPE html>
                                <html>
                                  <head>
                                    <title>리뷰 사진</title>
                                    <style>
                                      body { 
                                        margin: 0; 
                                        display: flex; 
                                        justify-content: center; 
                                        align-items: center; 
                                        height: 100vh; 
                                        background-color: #f5f5f5;
                                      }
                                      img { 
                                        max-width: 90vw; 
                                        max-height: 90vh; 
                                        object-fit: contain; 
                                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                        border-radius: 0.5rem;
                                      }
                                    </style>
                                  </head>
                                  <body>
                                    <img src="data:image/jpeg;base64,${base64String}" alt="리뷰 사진" />
                                  </body>
                                </html>
                              `);
                              newWindow.document.close();
                            }
                          }}
                          onError={(e) => {
                            console.error("Error loading image:", e);
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        {review.photos.length > 1 && (
                          <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
                            {photoIndex + 1}/{review.photos.length}
                          </div>
                        )}
                      </div>
                    );
                  } catch (error) {
                    console.error("Error processing image:", error);
                    return null;
                  }
                })}
              </div>

              {review.photos.length > 3 && (
                <p className="text-xs text-gray-500 mt-1">
                  좌우로 스크롤하여 {review.photos.length}장의 사진을 모두
                  확인하세요
                </p>
              )}
            </div>
          )}
          {/* 수정/삭제버튼*/}
          <div className="flex space-x-2">
            <button onClick={() => updateReview(review)}>수정</button>
            <button
              onClick={() => handleDeleteClick(review.review_id)}
              disabled={isDeleting}
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
