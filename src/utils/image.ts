import { SupportedMime } from '@/types/photo';

/**
 * 지원하는 이미지 MIME 타입 목록
 */
const SUPPORTED_MIME_TYPES: SupportedMime[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
];

/**
 * 최대 파일 크기 (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * 이미지 파일 유효성 검사
 * @param file - 검사할 파일 객체
 * @returns 유효성 검사 결과
 */
export function validateImage(file: File): { valid: boolean; reason?: string } {
  // 파일 크기 검증
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      reason: `파일 크기는 ${MAX_FILE_SIZE / (1024 * 1024)}MB를 초과할 수 없습니다.`,
    };
  }

  // MIME 타입 검증
  if (!SUPPORTED_MIME_TYPES.includes(file.type as SupportedMime)) {
    return {
      valid: false,
      reason: `지원하지 않는 파일 형식입니다. (${SUPPORTED_MIME_TYPES.join(
        ', '
      )}만 지원)`,
    };
  }

  return { valid: true };
}

/**
 * 파일로부터 미리보기 URL 생성
 * @param file - 미리보기를 생성할 파일
 * @returns 미리보기 URL (revokeObjectURL으로 해제 필요)
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * 미리보기 URL 해제
 * @param url - 해제할 미리보기 URL
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * 파일 확장자로부터 MIME 타입 추론
 * @param filename - 파일명 또는 확장자
 * @returns 추론된 MIME 타입 또는 undefined
 */
export function getMimeTypeFromFilename(filename: string): SupportedMime | undefined {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    default:
      return undefined;
  }
}
