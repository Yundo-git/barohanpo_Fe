import { useState, useCallback } from "react";

const useImageUpload = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 이미지 파일 유효성 검사
   * @param {File} file - 검사할 이미지 파일
   * @throws {Error} 유효성 검사 실패 시 에러 발생
   */
  const validateImageFile = useCallback(
    async (file: File): Promise<{ width: number; height: number }> => {
      // MIME 타입 검사
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("JPEG, PNG, GIF 형식의 이미지만 업로드 가능합니다.");
      }

      // 파일 크기 검사 (5MB 이하)
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        throw new Error("이미지 크기는 5MB를 초과할 수 없습니다.");
      }

      // 이미지 해상도 검사
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const { width, height } = img;
          const MAX_DIMENSION = 1080;

          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            reject(
              new Error(
                `이미지 해상도는 가로/세로 ${MAX_DIMENSION}px을 초과할 수 없습니다.`
              )
            );
            return;
          }
          resolve({ width, height });
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
   * @returns {Promise<string>} 업로드된 이미지 URL
   * @throws {Error} 업로드 실패 시 에러 발생
   */
  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      if (!file) {
        throw new Error("업로드할 파일을 선택해주세요.");
      }

      setIsLoading(true);
      setError(null);

      try {
        // 이미지 유효성 검사
        await validateImageFile(file);

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/image/`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "이미지 업로드에 실패했습니다.");
        }

        const data: { url: string } = await response.json();
        return data.url;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [validateImageFile]
  );

  return { uploadImage, isLoading, error };
};

export default useImageUpload;
