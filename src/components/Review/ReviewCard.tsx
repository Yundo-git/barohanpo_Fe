import React from "react";
import Image from "next/image";
import { Review, ReviewPhoto } from "@/types/review";
import { Star } from "lucide-react";
import Profile from "../auth/Profile";

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
  const formatRelativeTime = (dateString: string) => {
    const target = new Date(dateString);
    const now = new Date();

    const diffMs = Math.max(0, now.getTime() - target.getTime());
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // 7일 이상은 절대 날짜로 표시
    if (diffDays >= 7) {
      const y = target.getFullYear();
      const m = `${target.getMonth() + 1}`.padStart(2, "0");
      const d = `${target.getDate()}`.padStart(2, "0");
      return `${y}.${m}.${d}`;
    }

    // 같은 날이면 시간/분 단위로 표기
    const sameDay =
      target.getFullYear() === now.getFullYear() &&
      target.getMonth() === now.getMonth() &&
      target.getDate() === now.getDate();

    if (sameDay) {
      if (diffMinutes < 1) return "방금 전";
      if (diffMinutes < 60) return `${diffMinutes}분 전`;
      return `${diffHours}시간 전`;
    }

    // 1~6일 전
    return `${diffDays}일 전`;
  };

  // const { user } = useSelector((state: RootState) => state.user);
  // const isCurrentUser = user?.user_id === review.user_id;

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
    } else {
      // 3개 이상일 때는 3분의 1 너비
      photoWrapperClasses += " w-1/3";
    }

    return (
      // 'space-x-2'는 사진 사이에 여백 주기
      <div className=" flex space-x-2">
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
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
    <div className={`rounded-lg shadow ${className}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center p-4 bg-Light_color ">
          <Profile
            size={34}
            imageUrl={review.user_profile_photo_url || "/sample_profile.svg"}
            alt={review.nickname || "User"}
            rounded="full"
          />
          <div>
            <section className="flex space-x-2 items-center">
              <p className="B1_MD_15 text-mainText pl-[0.625rem]">
                {review.nickname || "익명"}
              </p>
              {/* 구분 점 */}
              <div className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></div>
              <p className="B1_RG_14 text-subText2">
                {formatRelativeTime(
                  review.created_at ||
                    review.updated_at ||
                    new Date().toISOString()
                )}
              </p>
            </section>
          </div>
        </div>
        {/* {isCurrentUser && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            내 리뷰
          </span>
        )} */}
      </div>
      <section className="p-4 space-y-3">
        {renderImages()}
        <div>{renderRating(review.score)}</div>

        {review.comment && (
          <p className="B1_RG_15 text-mainText">{review.comment}</p>
        )}
      </section>
      <section className="p-4">
        {showPharmacyName && review.name && (
          <div>
            <h1 className="B1_SB_15 text-mainText">{review.name}</h1>
            <h2 className="B1_RG_15 text-subText">{review.address}</h2>
          </div>
        )}
      </section>
    </div>
  );
};

export default ReviewCard;
