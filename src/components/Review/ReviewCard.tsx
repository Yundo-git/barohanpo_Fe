import React from "react";
import { Review } from "@/types/review";
import { Star } from "lucide-react";
import Profile from "../auth/Profile";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

interface ReviewCardProps {
  review: Review;
  showPharmacyName?: boolean;
  className?: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  showPharmacyName = false,
  className = "",
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };
  console.log("review", review);
  const user = useSelector((state: RootState) => state.user.user);
  return (
    <div
      className={`bg-white rounded-lg p-4 shadow-sm border border-gray-100 ${className}`}
    >
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < (review.score || 0) ? "fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
      {review.photos.length > 0 && (
        <div className="flex gap-2 mt-2 overflow-x-auto py-2">
          {review.photos.map((photo, photoIndex) => {
            try {
              // Check if review_photo_blob is a Buffer
              if (photo.review_photo_blob && photo.review_photo_blob.data) {
                const uint8Array = new Uint8Array(photo.review_photo_blob.data);
                const base64String = btoa(
                  Array.from(uint8Array)
                    .map((byte) => String.fromCharCode(byte))
                    .join("")
                );
                return (
                  <div key={photoIndex} className="flex-shrink-0 w-24 h-24">
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

      {review.comment && (
        <p className="text-gray-700 text-sm leading-relaxed">
          {review.comment}
        </p>
      )}
      <section className=" flex  items-center gap-2 text-sm text-gray-500">
        <Profile
          userId={review.user_id || 0}
          version={review?.profileImageVersion}
          alt="사용자 프로필"
          size={24}
          rounded="full"
          className="w-[4.5rem] h-[4.5rem]"
        />
        <p>{user?.nickname}</p>
        {formatDate(review.create_at)}
      </section>
    </div>
  );
};

export default ReviewCard;
