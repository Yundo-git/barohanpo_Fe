import { useState, useCallback, ChangeEvent, useMemo, useEffect } from "react";

export interface ImageFile {
  id: string;
  file: File & { isExisting?: boolean };
  previewUrl: string;
  error?: string;
  isExisting?: boolean;
}

interface UseImageUploadOptions {
  /** 최대 업로드 가능한 이미지 수 (기본값: 1) */
  maxFiles?: number;
  /** 초기 이미지 URL 배열 (선택사항) */
  initialImages?: string[];
  /** 단일 이미지 모드 여부 (기본값: false) */
  singleImage?: boolean;
  /** 허용되는 MIME 타입 (기본값: ['image/jpeg', 'image/png', 'image/webp']) */
  accept?: string[];
  /** 최대 파일 크기 (MB 단위, 기본값: 5MB) */
  maxSizeMB?: number;
}

export default function useImageUpload({
  maxFiles = 1,
  initialImages = [],
  singleImage = false,
  accept = ["image/jpeg", "image/png", "image/webp"],
  maxSizeMB = 5,
}: UseImageUploadOptions = {}) {
  const [images, setImages] = useState<ImageFile[]>(() => {
    // 초기 이미지가 제공되면 미리보기용 객체 생성
    if (initialImages.length > 0) {
      return initialImages.map((url, index) => {
        // Create a dummy file object with minimal data
        const dummyFile = new File([], `image-${index}`, { type: "image/*" });
        // Mark it as existing so we can handle it differently in the upload
        Object.defineProperty(dummyFile, "isExisting", { value: true });

        return {
          id: `existing-${Date.now()}-${index}`,
          file: dummyFile,
          previewUrl: url,
          isExisting: true, // Add a flag to identify existing images
        };
      });
    }
    return [];
  });

  // Remove unused state setter since it's not used in the component
  const [isUploading, _setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 허용된 파일 타입을 문자열로 변환 (input의 accept 속성용)
  const acceptString = useMemo(() => accept.join(","), [accept]);

  // 이미지 파일 검증
  const validateImage = useCallback(
    (file: File): { isValid: boolean; error?: string } => {
      // Skip validation for existing files
      if ("isExisting" in file) return { isValid: true };

      // 파일 타입 검사
      if (!accept.includes(file.type)) {
        return {
          isValid: false,
          error: `${file.name}: 지원하지 않는 파일 형식입니다.`,
        };
      }

      // 파일 크기 검사
      if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(
          `${file.name}: 이미지 크기는 ${maxSizeMB}MB를 초과할 수 없습니다.`
        );
      }

      return { isValid: true };
    },
    [accept, maxSizeMB]
  );

  // 파일 선택 핸들러
  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const newImages: ImageFile[] = [];
      let hasError = false;

      // Convert FileList to array and process each file
      Array.from(files).forEach((file) => {
        if (hasError) return;

        try {
          validateImage(file);
          const imageFile: ImageFile = {
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            previewUrl: URL.createObjectURL(file),
          };
          newImages.push(imageFile);
        } catch (err: unknown) {
          console.error("이미지 처리 중 오류 발생:", err);
          const errorMessage =
            err instanceof Error
              ? err.message
              : "알 수 없는 오류가 발생했습니다.";
          setError(errorMessage);
          hasError = true;
        }
      });

      // 단일 이미지 모드인 경우 기존 이미지 제거
      if (newImages.length > 0) {
        if (singleImage) {
          // 기존 이미지의 URL 해제
          setImages((prev) => {
            prev.forEach((img) => {
              if (img.previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(img.previewUrl);
              }
            });
            return newImages.slice(0, 1);
          });
        } else {
          setImages((prev) => {
            const updated = [...prev, ...newImages].slice(0, maxFiles);
            // 초과된 이미지의 URL 해제
            if (prev.length + newImages.length > maxFiles) {
              const excessCount = prev.length + newImages.length - maxFiles;
              const excessImages = prev.slice(-excessCount);
              excessImages.forEach((img) => {
                if (img.previewUrl.startsWith("blob:")) {
                  URL.revokeObjectURL(img.previewUrl);
                }
              });
            }
            return updated;
          });
        }
      }

      // 입력 필드 초기화 (동일한 파일을 다시 선택할 수 있도록)
      e.target.value = "";
    },
    [maxFiles, singleImage, validateImage]
  );

  // 특정 이미지 제거
  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  // Filter out any existing images that don't have a file
  const getValidImages = useCallback((): ImageFile[] => {
    return images.filter((img) => {
      // Keep existing images or images with actual file data
      return img.isExisting || img.file.size > 0;
    });
  }, [images]);

  // 모든 이미지 제거
  const resetImages = useCallback(() => {
    setImages([]);
    setError(null);
  }, []);

  // 단일 이미지 모드를 위한 호환성 유지
  const singleImageProps = singleImage
    ? {
        file: images[0]?.file,
        previewUrl: images[0]?.previewUrl || "",
        resetImage: resetImages,
      }
    : undefined;

  // 컴포넌트 언마운트 시 또는 maxFiles 변경 시 정리
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 모든 Blob URL 정리
      images.forEach((img) => {
        if (img.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, [images]);

  return {
    images,
    isUploading,
    error,
    getValidImages,
    handleFileChange,
    removeImage,
    resetImages,
    setImages,
    accept: acceptString,
    maxFiles,
    remainingSlots: maxFiles - images.length,
    ...(singleImage ? singleImageProps : {}),
  } as const;
}
