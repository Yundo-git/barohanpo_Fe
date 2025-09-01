export interface Reservation {
  p_id: number;
  book_date: string;
  book_id: number;
  book_time: string;
  // Add other properties from the API response as needed
}

export interface CancelItem {
  p_id: number;
  book_date: string;
  book_id: number;
  book_time: string;
  // Add other properties from the API response as needed
}
