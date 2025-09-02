import React from "react";
import { Review } from "@/types/review";
import { Star } from "lucide-react";

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

      {review.comment && (
        <p className="text-gray-700 text-sm leading-relaxed">
          {review.comment}
        </p>
      )}
      <span className="ml-2 text-sm text-gray-500">
        {formatDate(review.create_at)}
      </span>
    </div>
  );
};

export default ReviewCard;
