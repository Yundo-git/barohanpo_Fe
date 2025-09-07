"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

/** HTTP 메서드 타입 */
type HttpMethod = "POST" | "PUT" | "PATCH";

/** 서버 응답 JSON(느슨한 형태) */
type UploadJSON = {
  imageUrl?: string;
  url?: string;
  [key: string]: unknown;
};

/** 업로드 결과 타입 */
type UploadResultSuccess = {
  success: true;
  urls: string[];
  response: UploadJSON | UploadJSON[];
};

type UploadResultFail = {
  success: false;
  message: string;
};

type UploadResult = UploadResultSuccess | UploadResultFail;

/** fetch 업로드 옵션 */
export type UploadOptions = {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  /** 서버 필드명 (다중 파일이면 보통 images[] 형태) */
  fieldName?: string;
};

/** 훅 인자 */
type UseImageUploadArgs = {
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
  file: File;          // 리사이즈/압축된 파일(WebP 권장)
  previewUrl: string;  // blob: 또는 data:
  isExisting?: boolean; // 서버에 이미 존재하는 이미지라면 true
};

const DEFAULT_TYPES = ["image/jpeg", "image/png", "image/webp"];

const useImageUpload = ({
  maxFiles = 3,
  allowedTypes = DEFAULT_TYPES,
  maxSizeMB = 5,
  upload,
  onUploadSuccess,
  onUploadError,
}: UseImageUploadArgs = {}) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 파일 유효성 검사 */
  const validate = useCallback(
    (file: File) => {
      if (!allowedTypes.includes(file.type)) {
        throw new Error("JPEG/PNG/WebP 형식만 업로드할 수 있습니다.");
      }
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        throw new Error(`파일 크기는 최대 ${maxSizeMB}MB 까지만 허용됩니다.`);
      }
    },
    [allowedTypes, maxSizeMB]
  );

  /** 1080px 기준 리사이즈 후 WebP 변환 */
  const resizeToWebp = useCallback(async (file: File): Promise<File> => {
    const MAX_DIM = 1080;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("이미지 로딩 실패"));
      reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("이미지 디코드 실패"));
      image.src = dataUrl;
    });

    let { width, height } = img;
    if (width > MAX_DIM || height > MAX_DIM) {
      if (width > height) {
        height = Math.round((height * MAX_DIM) / width);
        width = MAX_DIM;
      } else {
        width = Math.round((width * MAX_DIM) / height);
        height = MAX_DIM;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("캔버스 컨텍스트 생성 실패");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", 0.9)
    );
    if (!blob) throw new Error("이미지 변환 실패");

    const webpFile = new File(
      [blob],
      file.name.replace(/\.[^/.]+$/, ".webp"),
      { type: "image/webp" }
    );
    return webpFile;
  }, []);

  /** input[type=file] onChange (다중 선택 지원) */
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      e.currentTarget.value = ""; // 같은 파일 재선택 허용
      if (!fileList || fileList.length === 0) return;

      const remain = Math.max(0, maxFiles - images.length);
      const files = Array.from(fileList).slice(0, remain);

      try {
        const processed: ImageItem[] = [];
        for (const raw of files) {
          validate(raw);
          const resized = await resizeToWebp(raw);
          const previewUrl = URL.createObjectURL(resized);
          processed.push({
            id:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`,
            file: resized,
            previewUrl,
            isExisting: false,
          });
        }
        setImages((prev) => [...prev, ...processed]);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "이미지 처리 중 오류가 발생했습니다.";
        setError(msg);
      }
    },
    [images.length, maxFiles, resizeToWebp, validate]
  );

  /** 단일 이미지 제거 */
  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  /** 전체 비우기 */
  const clearAll = useCallback(() => {
    setImages((prev) => {
      prev.forEach((i) => {
        if (i.previewUrl.startsWith("blob:")) URL.revokeObjectURL(i.previewUrl);
      });
      return [];
    });
  }, []);

  /** 현재 보관중인 이미지 배열을 그대로 반환(필요 시 필터 추가 가능) */
  const getValidImages = useCallback(() => images, [images]);

  /** (선택) 훅에서 직접 업로드 */
  const uploadAll = useCallback(
    async (custom?: Partial<UploadOptions>): Promise<UploadResult> => {
      if (!upload && !custom?.url) {
        return { success: false, message: "업로드 URL이 설정되지 않았습니다." };
      }
      if (images.length === 0) {
        return { success: false, message: "업로드할 파일이 없습니다." };
      }

      setIsUploading(true);
      try {
        const opt = { ...upload, ...custom } as UploadOptions;
        const fieldName = opt.fieldName ?? "images[]";
        const method = opt.method ?? "POST";

        const fd = new FormData();
        images.forEach((img) => fd.append(fieldName, img.file));

        const res = await fetch(opt.url, {
          method,
          headers: opt.headers,
          body: fd,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          const msg = `업로드 실패: ${res.status} ${res.statusText}${
            text ? ` - ${text}` : ""
          }`;
          throw new Error(msg);
        }

        const json = (await res
          .json()
          .catch((): UploadJSON | UploadJSON[] => ({}))) as
          | UploadJSON
          | UploadJSON[];

        // 단일/다중 응답 모두 대응
        const urls: string[] = Array.isArray(json)
          ? (json
              .map((o) => o.imageUrl || o.url)
              .filter(Boolean) as string[])
          : ([json.imageUrl || json.url].filter(Boolean) as string[]);

        onUploadSuccess?.(urls);
        return { success: true, urls, response: json };
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.";
        onUploadError?.(msg);
        return { success: false, message: msg };
      } finally {
        setIsUploading(false);
      }
    },
    [images, onUploadError, onUploadSuccess, upload]
  );

  /** 에러 토스트 자동 표시 */
  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error]);

  /** 언마운트 시 blob URL 정리 */
  useEffect(() => {
    return () => {
      images.forEach((i) => {
        if (i.previewUrl.startsWith("blob:")) URL.revokeObjectURL(i.previewUrl);
      });
    };
  }, [images]);

  return {
    // 상태
    images,            // [{ id, file, previewUrl, isExisting? }]
    isUploading,
    error,

    // 액션
    handleFileChange,  // input[type=file] onChange에 연결
    removeImage,
    clearAll,
    uploadAll,

    // 편의
    files: useMemo(() => images.map((i) => i.file), [images]),

    // 외부 제어/호환
    setImages,        // 기존 서버 이미지 세팅 등에서 사용
    getValidImages,   // 제출 전 필터링 등에서 사용
  };
};

export default useImageUpload;
