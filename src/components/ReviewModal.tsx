"use client";

import { useState } from "react";
import { StarIcon, XMarkIcon } from "@heroicons/react/24/solid";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  bookId: number;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bookId,
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;
  //리뷰제출 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(rating, comment);
      // Reset form on successful submission
      setRating(5);
      setComment("");
      onClose();
    } catch (error) {
      console.error("리뷰 제출 중 오류 발생:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label="Close modal"
      >
        <XMarkIcon className="h-8 w-8" />
      </button>

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">
            상담은 어떠셨나요?
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none"
                  >
                    <StarIcon
                      className={`h-8 w-8 ${
                        star <= rating ? "text-yellow-400" : "text-gray-300"
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
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="리뷰를 작성해주세요."
                required
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={!comment.trim() || isSubmitting}
            >
              {isSubmitting ? "제출 중..." : "리뷰 등록"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
