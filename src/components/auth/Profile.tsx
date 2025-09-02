// src/components/Profile.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type Round = "full" | "lg" | "md" | "sm";

/** 아주 단순한 class 병합 유틸 */
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface ProfileProps {
  /** 서버에서 이미지를 만드는 기준 */
  userId?: number;
  /** 이미지 대체 텍스트 */
  alt: string;
  /** 정사각형 크기(px) */
  size: number;
  /** 모서리 */
  rounded?: Round;
  /** 추가 클래스 */
  className?: string;
  /** 서버 이미지 실패 시 폴백 */
  fallbackSrc?: string;
  /** API 베이스 URL (userId를 사용할 때 조합) */
  apiBaseUrl?: string;
  /** 서버 이미지에 cache-busting 버전 파라미터 */
  version?: number;
  /** 직접 서버 이미지 URL 주입 (userId 대신) */
  imageUrl?: string;
  /** 최종적으로 이 src를 강제 사용 (imageUrl보다 우선) */
  src?: string;

  /** 파일 선택을 받으면 업로드는 부모가 처리 */
  onFileSelect?: (file: File) => void;
  /** 로딩 스피너 표시 여부 */
  isLoading?: boolean;
  /** next/image 최적화 해제 (외부/프리뷰 등) */
  unoptimized?: boolean;
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
  size,
  rounded = "full",
  className = "",
  fallbackSrc = "/sample_profile.svg",
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  version,
  imageUrl,
  src,
  onFileSelect,
  isLoading = false,
  unoptimized,
}: ProfileProps) {
  // 1) 서버 이미지 URL 계산
  const serverSrc = useMemo(() => {
    if (src) return src; // 최우선
    if (imageUrl) {
      return version
        ? `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}v=${version}`
        : imageUrl;
    }
    if (userId) {
      const root = `${apiBaseUrl}/api/profile/${userId}/photo`;
      return version ? `${root}?v=${version}` : root;
    }
    return fallbackSrc; // userId도 imageUrl도 없는 경우
  }, [src, imageUrl, version, userId, apiBaseUrl, fallbackSrc]);

  // 2) 미리보기 blob URL(State) — onFileSelect 사용 시만 생성
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const prevPreviewRef = useRef<string | null>(null);

  // 3) 서버 이미지 로드 실패 시 폴백 1회
  const [useFallback, setUseFallback] = useState(false);

  // serverSrc가 바뀌면 실패 상태 해제
  useEffect(() => {
    setUseFallback(false);
  }, [serverSrc]);

  // blob URL 정리(이전 값 revoke + 언마운트 시에도 revoke)
  useEffect(() => {
    if (prevPreviewRef.current && prevPreviewRef.current !== previewUrl) {
      URL.revokeObjectURL(prevPreviewRef.current);
    }
    prevPreviewRef.current = previewUrl;
    return () => {
      if (prevPreviewRef.current) {
        URL.revokeObjectURL(prevPreviewRef.current);
        prevPreviewRef.current = null;
      }
    };
  }, [previewUrl]);

  // 4) 실제 표시할 src 결정: 미리보기 우선 → 서버 → 폴백
  const effectiveSrc = previewUrl ?? (useFallback ? fallbackSrc : serverSrc);

  // 5) next/image에 넘길 최적화 여부
  const isPreview = Boolean(previewUrl);
  const imageUnoptimized = isPreview ? true : !!unoptimized;

  // 6) 파일 선택 → 미리보기 생성 + 상위 콜백 호출
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    // 같은 파일 재선택 허용
    e.currentTarget.value = "";
    if (!file) return;

    // 간단한 검증(형식/크기)
    const okTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!okTypes.has(file.type)) {
      console.error("JPEG/PNG/WebP만 업로드 가능합니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      console.error("이미지는 5MB 이하여야 합니다.");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onFileSelect?.(file);
  };

  return (
    <div
      className={cx("relative inline-block overflow-hidden", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={effectiveSrc}
        alt={alt}
        width={size}
        height={size}
        className={cx(
          "h-full w-full object-cover bg-gray-100",
          roundedClass[rounded]
        )}
        onError={() => {
          // 미리보기가 아닐 때만 폴백 전환
          if (!previewUrl) setUseFallback(true);
        }}
        unoptimized={imageUnoptimized}
        priority
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
        </div>
      )}

      {/* 파일 선택 지원 모드(표시 전용으로 쓰면 onFileSelect 안 넘기면 됨) */}
      {onFileSelect && (
        <label
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 transition hover:bg-black/20"
          style={{ borderRadius: rounded === "full" ? "9999px" : undefined }}
        >
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <span className="select-none text-sm font-medium text-white opacity-0 transition group-hover:opacity-100">
            변경
          </span>
        </label>
      )}
    </div>
  );
}
