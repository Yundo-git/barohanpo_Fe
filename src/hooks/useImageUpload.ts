import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";

interface ImageDimensions {
  width: number;
  height: number;
}

interface UploadOptions {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  fieldName?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

interface UploadResult {
  success: boolean;
  message?: string;
  imageUrl?: string;
}

interface UseImageUploadProps {
  initialImageUrl?: string | null;
  uploadUrl?: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  fieldName?: string;
  onUploadSuccess?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
  autoUpload?: boolean; // Add autoUpload option
}

const useImageUpload = ({
  initialImageUrl = null,
  uploadUrl = '',
  method = 'POST',
  fieldName = 'image',
  onUploadSuccess,
  onUploadError,
  autoUpload = false, // Default to false for manual upload
}: UseImageUploadProps = {}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  /**
   * 이미지 파일 유효성 검사 및 리사이즈
   * @param {File} file - 검사할 이미지 파일
   * @returns {Promise<File>} 리사이즈된 이미지 파일
   * @throws {Error} 유효성 검사 실패 시 에러 발생
   */
  const validateAndResizeImage = useCallback(
    async (file: File): Promise<File> => {
      // MIME 타입 검사
      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("JPEG, PNG 형식의 이미지만 업로드 가능합니다.");
      }

      // 파일 크기 검사 (5MB 이하)
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        throw new Error("이미지 크기는 5MB를 초과할 수 없습니다.");
      }

      // 이미지 리사이즈
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const MAX_DIMENSION = 1080;
          let { width, height } = img;

          // 이미지 크기 조정 (비율 유지)
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            } else {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          // 캔버스 생성 및 리사이즈
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error("이미지 처리에 실패했습니다."));
            return;
          }

          // 캔버스에 이미지 그리기 (안티앨리어싱 적용)
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // WebP 형식으로 변환 (용량 절약)
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("이미지 변환에 실패했습니다."));
                return;
              }
              // 새로운 파일 객체 생성
              const resizedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, '.webp'),
                { type: 'image/webp' }
              );
              resolve(resizedFile);
            },
            'image/webp',
            0.9 // 품질 (0.0 ~ 1.0)
          );
        };
        
        img.onerror = () => {
          reject(new Error("이미지를 로드하는 데 실패했습니다."));
        };
        
        img.src = URL.createObjectURL(file);
      });
    },
    []
  );

  /**
   * 이미지 업로드 함수
   * @param {File} file - 업로드할 이미지 파일
   * @param {UploadOptions} options - 업로드 옵션
   * @returns {Promise<UploadResult>} 업로드 결과
   */
  const uploadImage = useCallback(
    async (file: File, customOptions?: Partial<UploadOptions>) => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Starting image upload...', {
          file: file.name,
          size: file.size,
          type: file.type,
          options: customOptions
        });

        // 이미지 유효성 검사 및 리사이즈
        const processedFile = await validateAndResizeImage(file);
        console.log('Image processed:', {
          originalSize: file.size,
          processedSize: processedFile.size,
          type: processedFile.type
        });

        const formData = new FormData();
        const field = customOptions?.fieldName || fieldName;
        formData.append(field, processedFile);

        const url = customOptions?.url || uploadUrl;
        if (!url) {
          const errorMsg = '업로드 URL이 제공되지 않았습니다.';
          console.error(errorMsg);
          throw new Error(errorMsg);
        }

        console.log('Sending request to:', url);
        const startTime = Date.now();
        
        const response = await fetch(url, {
          method: customOptions?.method || method,
          headers: customOptions?.headers,
          body: formData,
        });

        const responseTime = Date.now() - startTime;
        console.log(`Request completed in ${responseTime}ms`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload failed with response:', errorText);
          throw new Error(`이미지 업로드에 실패했습니다: ${response.status} ${response.statusText}`);
        }

        const result = await response.json().catch(e => {
          console.error('Failed to parse JSON response:', e);
          return {};
        });
        
        console.log('Upload successful:', result);
        
        const imageUrl = result.imageUrl || result.url || URL.createObjectURL(processedFile);
        console.log('Image URL:', imageUrl);
        
        setPreviewUrl(imageUrl);
        setUploadedImageUrl(imageUrl);
        
        if (onUploadSuccess) {
          onUploadSuccess(imageUrl);
        }
        
        return { success: true, imageUrl, response: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다.';
        setError(errorMessage);
        if (onUploadError) {
          onUploadError(errorMessage);
        }
        return { success: false, message: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [validateAndResizeImage, uploadUrl, method, fieldName, onUploadSuccess, onUploadError]
  );

  /**
   * 파일 입력 변경 핸들러
   * @param e 파일 입력 이벤트
   * @param customOptions 업로드 옵션 (선택사항, 기본값 대체용)
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        console.log('No file selected');
        return;
      }
      
      console.log('File selected for preview:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      console.log('Created preview URL');
      
      // Set the preview and store the file for later upload
      setPreviewUrl(previewUrl);
      setPendingFile(file);
      
      // Reset input field (to allow selecting the same file again)
      e.target.value = '';
      
      return { file, previewUrl };
    },
    []
  );
  
  const uploadPendingFile = useCallback(
    async (customOptions?: Partial<UploadOptions>) => {
      if (!pendingFile) {
        console.log('No file to upload');
        return { success: false, message: '업로드할 파일이 없습니다.' };
      }
      
      try {
        console.log('Starting file upload...');
        const result = await uploadImage(pendingFile, customOptions);
        
        if (result.success) {
          console.log('File upload successful');
          setPendingFile(null); // Clear the pending file on success
          return result;
        } else {
          console.error('File upload failed:', result.message);
          toast.error(`업로드 실패: ${result.message}`);
          return result;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
        console.error('Error uploading file:', error);
        toast.error(`파일 업로드 중 오류: ${errorMessage}`);
        throw error;
      }
    },
    [pendingFile, uploadImage]
  );
  
  const clearPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPendingFile(null);
  }, [previewUrl]);

  // Show toast on error
  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null); // Clear error after showing
    }
  }, [error]);

  return {
    // Core functions
    handleFileChange,
    uploadPendingFile,
    clearPreview,
    
    // State values
    previewUrl,
    pendingFile,
    isLoading,
    error,
    uploadedImageUrl,
    
    // Legacy/advanced usage
    uploadImage, // Exposed for advanced usage
    setPreviewUrl, // Exposed for advanced usage
  };
};

export default useImageUpload;
