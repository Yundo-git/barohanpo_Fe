/**
 * 지원하는 이미지 MIME 타입
 * - jpg, jpeg, png, webp, heic(후순위) 지원
 */
export type SupportedMime = 
  | 'image/jpeg' 
  | 'image/png' 
  | 'image/webp' 
  | 'image/heic';

/**
 * 이미지 업로드 성공 응답 타입
 * @property {boolean} ok - 요청 성공 여부
 * @property {string} updatedAt - 업데이트된 시간 (ISO 문자열)
 * @property {string} [etag] - 캐시 무효화를 위한 ETag (선택적)
 */
export interface PhotoUploadResult {
  ok: true;
  updatedAt: string;
  etag?: string;
}

/**
 * 이미지 업로드 실패 응답 타입
 * @property {boolean} ok - 요청 실패 여부
 * @property {string} error - 에러 메시지
 */
export interface PhotoUploadError {
  ok: false;
  error: string;
}

/**
 * 이미지 업로드 응답 타입 (성공/실패 공통)
 */
export type PhotoUploadResponse = PhotoUploadResult | PhotoUploadError;
