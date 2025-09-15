import React from "react";
import Image from "next/image";
import { Review, ReviewPhoto } from "@/types/review";
import { Star } from "lucide-react";
import Profile from "../auth/Profile";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

interface ReviewCardProps {
  review: Review & {
    nickname?: string;
    // user_profile_photo_url: 백엔드에서 넘어오는 필드 이름으로 변경
    user_profile_photo_url?: string; 
    name?: string;
    address?: string;
    updated_at?: string;
    reply?: string;
    // photos: ReviewPhoto 배열로 타입 명시
    photos: ReviewPhoto[]; 
  };
  className?: string;
  showPharmacyName?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  className = "",
  showPharmacyName = true,
}) => {
  // console.log('review',review);
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
  
    // 사진 개수에 따라 Flexbox 클래스 동적 할당
    const numPhotos = review.photos.length;
    let photoWrapperClasses = "relative h-32 flex-shrink-0";
  
    if (numPhotos === 1) {
      photoWrapperClasses += " w-full"; // 1개일 때는 전체 너비
    } else if (numPhotos === 2) {
      photoWrapperClasses += " w-1/2"; // 2개일 때는 절반 너비
    } else { // 3개 이상일 때는 3분의 1 너비
      photoWrapperClasses += " w-1/3";
    }
  
    return (
      // 'space-x-2'는 사진 사이에 여백을 줘서 더 자연스럽게 보이게 합니다.
      <div className="mt-2 flex space-x-2"> 
        {review.photos.map((photo, index) => {
          if (!photo.review_photo_url) return null;
  
          return (
            <div
              key={`${photo.review_photo_id}-${index}`}
              className={photoWrapperClasses}
            >
              <Image
                src={photo.review_photo_url}
                alt={`Review image ${index + 1}`}
                fill
                className="rounded object-cover"
                // unoptimized 속성 제거 (URL을 사용하므로 최적화 기능 활용)
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
            imageUrl={review.user_profile_photo_url || "/sample_profile.svg"}
            alt={review.nickname || "User"}
            rounded="full"
          />
          <div>
            <div className="font-medium">{review.nickname || "익명"}</div>
            <div className="text-sm text-gray-500">
              {formatDate(
                review.created_at ||
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

      <div className="mt-2">{renderRating(review.score)}</div>

      {review.comment && (
        <p className="mt-2 text-gray-700 whitespace-pre-line">
          {review.comment}
        </p>
      )}

      {renderImages()}

      {showPharmacyName && review.name && (
        <div>
          <h1 className="mt-2 text-sm font-medium">{review.name}</h1>
          <h2>{review.address}</h2>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
