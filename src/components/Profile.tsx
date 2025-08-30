// src/components/Profile.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Round = "full" | "lg" | "md" | "sm";

export interface ProfileProps {
  userId: number | string;
  alt: string;
  size?: number;
  rounded?: Round;
  className?: string;
  /** 이미지가 없을 때 퍼블릭 폴백 */
  fallbackSrc?: string;
  /** API 베이스 (relativeApi=false일 때만 사용) */
  apiBaseUrl?: string;
  /** 프론트 프록시(/api/users/:id/profile) 사용 여부 */
  relativeApi?: boolean;
  /** next/image 최적화 비활성화 */
  unoptimized?: boolean;
  /** 이미지를 클릭해 업로드 가능하게 할지 */
  editable?: boolean;
  /** 업로드 성공 콜백 */
  onUploadSuccess?: (payload: { success: true; updatedAt?: string }) => void;
  /** 업로드 실패 콜백 */
  onUploadError?: (error: Error) => void;
}

const roundedClass: Record<Round, string> = {
  full: "rounded-full",
  lg: "rounded-2xl",
  md: "rounded-lg",
  sm: "rounded-sm",
};

export default function Profile({
  userId,
  alt,
  size = 48,
  rounded = "full",
  className = "",
  fallbackSrc = "/sample_profile.jpeg",
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  relativeApi = true,
  unoptimized = false,
  editable = false,
  onUploadSuccess,
  onUploadError,
}: ProfileProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ 기본 이미지 소스 결정 (프록시 또는 절대경로)
  const baseSrc = useMemo(() => {
    return relativeApi
      ? `/api/users/${userId}/profile`
      : `${apiBaseUrl}/api/users/${userId}/profile`;
  }, [relativeApi, apiBaseUrl, userId]);

  // 실제 렌더링 src (캐시 버스트 적용)
  const [src, setSrc] = useState<string>(baseSrc);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  useEffect(() => {
    setSrc(baseSrc);
    setIsFallback(false);
  }, [baseSrc]);

  // ✅ 이미지 로드 실패 시 퍼블릭 폴백 1회
  const handleError = () => {
    if (!isFallback) {
      setSrc(fallbackSrc);
      setIsFallback(true);
    }
  };

  // ✅ 파일 유효성 검사 (5MB, jpeg/png/webp)
  const validate = (file: File): { valid: boolean; reason?: string } => {
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(file.type)) {
      return {
        valid: false,
        reason: "jpeg/png/webp 형식만 업로드할 수 있습니다.",
      };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { valid: false, reason: "파일 크기는 5MB 이하여야 합니다." };
    }
    return { valid: true };
  };

  // ✅ 업로드 처리: multipart/form-data PUT
  const uploadFile = async (file: File): Promise<void> => {
    const { valid, reason } = validate(file);
    if (!valid) throw new Error(reason ?? "유효하지 않은 파일입니다.");

    const form = new FormData();
    // 백엔드가 기대하는 필드명에 맞추세요. (여기서는 'file')
    form.append("file", file);

    const endpoint = baseSrc; // same-origin 프록시
    const res = await fetch(endpoint, {
      method: "PUT",
      body: form,
      credentials: "include",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });

    if (!res.ok) {
      // 가능하면 서버가 내려주는 에러 메시지 사용
      let msg = "이미지 업로드에 실패했습니다.";
      try {
        const data = (await res.json()) as { error?: string; message?: string };
        msg = data?.error ?? data?.message ?? msg;
      } catch {
        // ignore
      }
      throw new Error(msg);
    }

    // ✅ 캐시 버스트로 즉시 새 이미지 노출
    setSrc(`${baseSrc}?v=${Date.now()}`);
    onUploadSuccess?.({ success: true, updatedAt: new Date().toISOString() });
  };

  // ✅ 투명 오버레이 input: 클릭 즉시 파일 선택
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 같은 파일 재선택 가능하도록 초기화
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    try {
      await uploadFile(file);
    } catch (err) {
      const ex = err as Error;
      onUploadError?.(ex);
      // 폴백으로 교체하지는 않음(기존 이미지 유지)
    }
  };

  return (
    <div
      className={cn("relative inline-block", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={cn(
          "h-full w-full object-cover bg-gray-100",
          roundedClass[rounded]
        )}
        onError={handleError}
        unoptimized={unoptimized}
        priority
      />

      {/* ✅ 클릭 업로드: 이미지 위를 투명 input이 가림 */}
      {editable && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          aria-label="프로필 이미지 업로드"
          className="absolute inset-0 z-20 cursor-pointer opacity-0"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={onFileChange}
        />
      )}
    </div>
  );
}
