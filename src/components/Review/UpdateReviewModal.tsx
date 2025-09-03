"use client";

import { useState, useEffect } from "react";
import { StarIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { PhotoIcon } from "@heroicons/react/24/outline";
import useUpdateReview from "@/hooks/useUpdateReview";
import useImageUpload, { type ImageFile } from "@/hooks/useImageUpload";
import { Review, ReviewPhoto } from "@/types/review";

interface UpdateReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
}

const UpdateReviewModal: React.FC<UpdateReviewModalProps> = ({
  isOpen,
  onClose,
  review,
}) => {
  const [score, setScore] = useState(review?.score || 5);
  const [comment, setComment] = useState(review?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateReview } = useUpdateReview();

  // 이미지 업로드 훅 (최대 3장)
  const {
    images,
    isUploading: isImageUploading,
    error: imageError,
    handleFileChange,
    removeImage,
    resetImages,
    setImages,
  } = useImageUpload({ maxFiles: 3 });

  // 리뷰 데이터가 변경되면 폼 초기화
  useEffect(() => {
    if (review) {
      setScore(review.score || 5);
      setComment(review.comment || "");

      // 기존 이미지가 있으면 미리보기 설정
      if (review.photos && review.photos.length > 0) {
        // Note: 실제 구현에서는 서버에서 이미지 URL을 가져와서 설정해야 함
        // 여기서는 예시로 빈 배열로 설정
        setImages([]);
      } else {
        setImages([]);
      }
    }
  }, [review, setImages]);

  if (!isOpen) return null;

  // 리뷰 수정 제출 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateReview({
        reviewId: review.review_id,
        score,
        comment,
        images: images.map((img) => img.file),
      });

      // 성공 알림
      alert("리뷰가 성공적으로 수정되었습니다.");
      onClose();
    } catch (error) {
      console.error("리뷰 수정 중 오류 발생:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "리뷰 수정 중 오류가 발생했습니다.";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label="Close modal"
      >
        <XMarkIcon className="h-8 w-8" />
      </button>

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold mb-2 text-center">리뷰 수정하기</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 별점 선택 */}
            <div className="flex justify-center space-x-1 my-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`${
                    value <= score ? "text-yellow-400" : "text-gray-300"
                  } text-3xl`}
                  onClick={() => setScore(value)}
                >
                  <StarIcon className="w-10 h-10" />
                </button>
              ))}
            </div>

            {/* 리뷰 내용 */}
            <div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="리뷰를 작성해주세요."
                className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            {/* 이미지 업로드 */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <label className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                  <PhotoIcon className="h-5 w-5 mr-2" />
                  사진 추가
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    disabled={isSubmitting || images.length >= 3}
                  />
                </label>
                <span className="text-sm text-gray-500">
                  {images.length}/3 (최대 3장)
                </span>
              </div>

              {/* 이미지 미리보기 */}
              {images.length > 0 && (
                <div className="flex space-x-2 overflow-x-auto py-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.previewUrl}
                        alt={`미리보기 ${index + 1}`}
                        className="h-20 w-20 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        disabled={isSubmitting}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {imageError && (
                <p className="mt-1 text-sm text-red-600">{imageError}</p>
              )}
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isSubmitting || isImageUploading}
              className={`w-full py-3 px-4 rounded-lg font-medium ${
                isSubmitting || isImageUploading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "처리 중..." : "리뷰 수정하기"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateReviewModal;
