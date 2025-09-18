// src/hooks/useImageUpload.tsx

"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  UploadOptions,
  UploadResult,
  UseImageUploadArgs,
  ImageItem,
  UploadJSON,
} from "../types/upload";

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

    const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
      type: "image/webp",
    });
    return webpFile;
  }, []);

  /** 파일 선택 핸들러 */
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      try {
        setError(null);
        const fileArray = Array.from(files);

        if (images.length + fileArray.length > maxFiles) {
          throw new Error(`최대 ${maxFiles}장까지 업로드할 수 있습니다.`);
        }

        const newImages: ImageItem[] = [];

        for (const file of fileArray) {
          validate(file);

          const webpFile = await resizeToWebp(file);
          const previewUrl = URL.createObjectURL(webpFile);

          newImages.push({
            id: `new-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 9)}`,
            file: webpFile,
            previewUrl,
          });
        }
        setImages((prev) => [...prev, ...newImages]);
        e.target.value = "";
      } catch (err) {
        console.error("이미지 처리 중 오류:", err);
        setError(
          err instanceof Error
            ? err.message
            : "이미지 처리 중 오류가 발생했습니다."
        );
      }
    },
    [images, maxFiles, validate, resizeToWebp]
  );

  /** 단일 이미지 제거 */
  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (
        target &&
        !target.isExisting &&
        target.previewUrl.startsWith("blob:")
      ) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  /** 전체 비우기 */
  const clearAll = useCallback(() => {
    setImages((prev) => {
      prev.forEach((i) => {
        if (!i.isExisting && i.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(i.previewUrl);
        }
      });
      return [];
    });
  }, []);

  /** 제출 시 사용될 유효한 파일 목록을 반환 */
  const getFilesForUpload = useCallback(() => {
    return images
      .filter((img) => !img.isExisting)
      .map((img) => img.file)
      .filter(Boolean) as File[];
  }, [images]);

  const uploadAll = useCallback(
    async (custom?: Partial<UploadOptions>): Promise<UploadResult> => {
      if (!upload && !custom?.url) {
        return { success: false, message: "업로드 URL이 설정되지 않았습니다." };
      }
      const filesToUpload = getFilesForUpload();
      if (filesToUpload.length === 0) {
        return { success: false, message: "업로드할 파일이 없습니다." };
      }

      setIsUploading(true);
      try {
        const opt = { ...upload, ...custom } as UploadOptions;
        const fieldName = opt.fieldName ?? "images[]";
        const method = opt.method ?? "POST";

        const fd = new FormData();
        filesToUpload.forEach((file) => fd.append(fieldName, file));

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

        const json = (await res.json().catch((): unknown => ({}))) as
          | UploadJSON
          | UploadJSON[];

        const urls: string[] = Array.isArray(json)
          ? (json.map((o) => o.imageUrl || o.url).filter(Boolean) as string[])
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
    [upload, getFilesForUpload, onUploadError, onUploadSuccess]
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
        if (!i.isExisting && i.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(i.previewUrl);
        }
      });
    };
  }, [images]);

  return {
    images,
    isUploading,
    error,
    handleFileChange,
    removeImage,
    clearAll,
    uploadAll,
    setImages,
  };
};

export default useImageUpload;
