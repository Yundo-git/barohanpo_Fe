export interface Review {
  book_date: string;
  book_id: number;
  book_time: string;
  comment: string;
  create_at: string;
  p_id: number;
  review_id: number;
  review_photo_id: number;
  score: number;
  user_id: number;
  photos: ReviewPhoto[];
}

export interface ReviewPhoto {
  review_photo_id: number;
  review_id: number;
  review_photo_blob: ReviewPhotoBlob;
}

export interface ReviewPhotoBlob {
  data: number[];
}
