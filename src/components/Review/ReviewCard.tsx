import React from "react";
import Image from "next/image";
import { Review } from "@/types/review";
import { Star } from "lucide-react";
import Profile from "../auth/Profile";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

interface ReviewCardProps {
  review: Review & {
    user_name?: string;
    user_profile_image?: string;
    pharmacy_name?: string;
    updated_at?: string;
    reply?: string;
  };
  className?: string;
  showPharmacyName?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  className = "",
  showPharmacyName = true,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const { user } = useSelector((state: RootState) => state.user);
  const isCurrentUser = user?.user_id === review.user_id;

  const renderRating = (score: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= score ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const renderImages = () => {
    if (!review.photos || review.photos.length === 0) return null;

    return (
      <div className="mt-2 flex space-x-2 overflow-x-auto">
        {review.photos.map((photo, index) => {
          if (!photo.review_photo_blob?.data) return null;

          // 숫자 배열을 Uint8Array로 변환
          const bytes = new Uint8Array(photo.review_photo_blob.data);
          // 바이너리 문자열로 변환
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          // base64로 인코딩
          const base64String = btoa(binary);

          return (
            <div
              key={`${photo.review_photo_id}-${index}`}
              className="relative h-32 w-full flex-shrink-0"
            >
              <Image
                src={`data:image/jpeg;base64,${base64String}`}
                alt={`Review image ${index + 1}`}
                fill
                className="rounded object-cover"
                unoptimized={true}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <Profile
            size={40}
            imageUrl={review.user_profile_image || "/sample_profile.svg"}
            alt={review.user_name || "User"}
            rounded="full"
          />
          <div>
            <div className="font-medium">{review.user_name || "익명"}</div>
            <div className="text-sm text-gray-500">
              {formatDate(
                review.create_at ||
                  review.updated_at ||
                  new Date().toISOString()
              )}
            </div>
          </div>
        </div>
        {isCurrentUser && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            내 리뷰
          </span>
        )}
      </div>

      {showPharmacyName && review.pharmacy_name && (
        <div className="mt-2 text-sm font-medium">{review.pharmacy_name}</div>
      )}

      <div className="mt-2">{renderRating(review.score)}</div>

      {review.comment && (
        <p className="mt-2 text-gray-700 whitespace-pre-line">
          {review.comment}
        </p>
      )}

      {renderImages()}

      {review.reply && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="font-medium text-sm text-gray-700">사장님 댓글</div>
            <div className="text-xs text-gray-500">
              {formatDate(
                review.updated_at ||
                  review.create_at ||
                  new Date().toISOString()
              )}
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-600">{review.reply}</p>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
