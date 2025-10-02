"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import ReviewList from "./ReviewList";
import { useEffect } from "react";
import { useAppSelector } from "@/store/store";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { fetchUserReviews } from "@/store/userReviewsSlice";

interface ReviewListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

const ReviewListModal: React.FC<ReviewListModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { reviews, isLoading } = useAppSelector((s) => s.userReviews);
  const refetch = useCallback(async () => {
    if (userId) await dispatch(fetchUserReviews({ userId }));
  }, [dispatch, userId]);

  useEffect(() => {
    if (isOpen && reviews.length === 0 && userId) {
      void dispatch(fetchUserReviews({ userId }));
    }
  }, [isOpen, reviews.length, userId, dispatch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label="Close modal"
      >
        <XMarkIcon className="h-8 w-8" />
      </button>

      <div className="container mx-auto p-4 pt-16">
        <h2 className="text-2xl font-bold mb-6">내 후기</h2>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-main"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            작성된 리뷰가 없습니다.
          </div>
        ) : (
          <ReviewList reviewList={reviews} onDelete={refetch} />
        )}
      </div>
    </div>
  );
};

export default ReviewListModal;
