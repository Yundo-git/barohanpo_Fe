"use client";

import { useState } from "react";
import Image from "next/image";
import { StarIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { PhotoIcon } from "@heroicons/react/24/outline";
import useCreateReview from "@/hooks/useCreateReview";
import useImageUpload from "@/hooks/useImageUpload";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBookId: number;
  p_id: number;
  book_date: string;
  book_time: string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  selectedBookId,
  p_id,
  book_date,
  book_time,
}) => {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createReview } = useCreateReview();

  // 이미지 업로드 훅 (최대 3장)
  const {
    images,
    isUploading: isImageUploading,
    error: imageError,
    handleFileChange,
    removeImage,
  } = useImageUpload({ maxFiles: 3 });

  if (!isOpen) return null;

  // 리뷰 제출 처리 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createReview({
        bookId: selectedBookId,
        score,
        comment,
        p_id,
        book_date,
        book_time,
        images: images.map((img) => img.file),
      });

      // 폼 초기화
      setScore(5);
      setComment("");
      onClose();

      // 성공 알림 (추가적인 UI 피드백이 필요할 수 있음)
      alert("리뷰가 성공적으로 등록되었습니다.");
    } catch (error) {
      console.error("리뷰 제출 중 오류 발생:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "리뷰 등록 중 오류가 발생했습니다.";
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
          <h2 className="text-2xl font-bold mb-2 text-center">
            상담은 어떠셨나요?
          </h2>
          <div className="mb-4 text-center text-gray-600">
            <p>약국 ID: {p_id}</p>
            <p>예약 날짜: {book_date}</p>
            <p>예약 시간: {book_time}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setScore(star)}
                    className="p-1 focus:outline-none"
                  >
                    <StarIcon
                      className={`h-8 w-8 ${
                        star <= score ? "text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                리뷰 내용
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mb-3"
                placeholder="리뷰를 작성해주세요."
                required
              />

              {/* 이미지 업로드 영역 */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사진 첨부 (선택, 최대 3장)
                </label>
                <div className="space-y-3">
                  {/* 이미지 미리보기 그리드 */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((image, index) => (
                        <div key={image.id} className="relative group">
                          <div className="aspect-square overflow-hidden rounded-md bg-gray-100">
                            <div className="relative h-full w-full">
                              <Image
                                src={image.previewUrl}
                                alt={`미리보기 ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(image.id);
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              aria-label="이미지 제거"
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 파일 입력 */}
                  {images.length < 3 && (
                    <div>
                      <label className="inline-flex items-center justify-center cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <PhotoIcon className="w-4 h-4 mr-1" />
                        사진 추가 ({images.length}/3)
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={handleFileChange}
                          disabled={isSubmitting || isImageUploading}
                        />
                      </label>
                      <p className="mt-1 text-xs text-gray-500">
                        JPG, PNG, WebP (최대 5MB, 최대 3장)
                      </p>
                    </div>
                  )}

                  {imageError && (
                    <p className="text-sm text-red-600 mt-1">{imageError}</p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={!comment.trim() || isSubmitting}
            >
              {isSubmitting || isImageUploading ? "제출 중..." : "리뷰 등록"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
