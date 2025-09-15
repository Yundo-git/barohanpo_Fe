// src/types/review.ts

export interface Review {
  book_date: string;
  book_id: number;
  book_time: string;
  comment: string;
  created_at: string;
  p_id: number;
  review_id: number;
  score: number;
  user_id: number;
  
  // 백엔드에서 사용자 프로필 사진 URL을 가져올 때 사용되는 필드.
  // 이 필드가 실제로 백엔드에서 넘어오는지 확인하고, 만약 user_profile_photo_url로 온다면
  // ReviewCard.tsx의 props 정의와 맞춰주세요.
  user_profile_photo_url?: string; 
  
  // 기존 review_photo_id는 photos 배열에 포함되므로 제거
  // profileImageVersion은 필요에 따라 제거 가능
  
  photos: ReviewPhoto[];
}
export interface ReviewPhoto {
  review_photo_id: number;
  // 기존 review_photo_blob 필드 대신 URL을 받도록 수정
  review_photo_url: string; 
}