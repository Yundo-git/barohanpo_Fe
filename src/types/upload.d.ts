// src/hooks/upload.d.ts

/** HTTP 메서드 타입 */
export type HttpMethod = "POST" | "PUT" | "PATCH";

/** 서버 응답 JSON(느슨한 형태) */
export type UploadJSON = {
  imageUrl?: string;
  url?: string;
  [key: string]: unknown;
};

/** 업로드 결과 타입 */
export type UploadResultSuccess = {
  success: true;
  urls: string[];
  response: UploadJSON | UploadJSON[];
};

export type UploadResultFail = {
  success: false;
  message: string;
};

export type UploadResult = UploadResultSuccess | UploadResultFail;

/** fetch 업로드 옵션 */
export type UploadOptions = {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  /** 서버 필드명 (다중 파일이면 보통 images[] 형태) */
  fieldName?: string;
};

/** 훅 인자 */
export type UseImageUploadArgs = {
  /** 최대 파일 개수 */
  maxFiles?: number;
  /** 허용 MIME 타입 */
  allowedTypes?: string[];
  /** 개별 파일 최대 크기(MB) */
  maxSizeMB?: number;
  /** 훅에서 직접 업로드할 때 사용할 옵션(선택) */
  upload?: UploadOptions;
  onUploadSuccess?: (urls: string[]) => void;
  onUploadError?: (message: string) => void;
};

/** 이미지 아이템(기존/신규 구분을 위해 isExisting 추가) */
export type ImageItem = {
  id: string;
  file?: File; // 새 파일인 경우에만 존재
  previewUrl: string; // blob: 또는 http:
  isExisting?: boolean; // 서버에 이미 존재하는 이미지라면 true
};