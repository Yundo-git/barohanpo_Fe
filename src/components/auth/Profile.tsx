// src/components/auth/Profile.tsx
"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Round = "full" | "lg" | "md" | "sm";

type ClassValue = string | undefined | null | false;
function cx(...classes: ClassValue[]): string {
  return classes
    .filter((c): c is string => typeof c === "string" && c.length > 0)
    .join(" ");
}

export interface ProfileProps {
  userId?: number;
  alt: string;
  size: number;
  rounded?: Round;
  className?: string;
  fallbackSrc?: string;
  apiBaseUrl?: string;
  onFileSelect?: (file: File) => void;
  isLoading?: boolean;
  version?: number;
  imageUrl?: string; // 외부에서 직접 URL 내려줄 때
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
  size = 96,
  rounded = "full",
  className = "",
  fallbackSrc = "/sample_profile.jpeg",
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  version,
  imageUrl,
  onFileSelect,
  isLoading = false,
}: ProfileProps) {
  const baseSrc = useMemo<string>(() => {
    if (imageUrl) {
      return version ? `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}v=${version}` : imageUrl;
    }
    if (!userId) return fallbackSrc || "";
    const root = `${apiBaseUrl}/api/profile/${userId}/photo`;
    return version ? `${root}?v=${version}` : root;
  }, [apiBaseUrl, userId, version, imageUrl, fallbackSrc]);

  const [src, setSrc] = useState<string>(baseSrc);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  useEffect(() => {
    setSrc(baseSrc);
    setIsFallback(false);
  }, [baseSrc]);

  const isBlobOrData = src.startsWith("blob:") || src.startsWith("data:");

  const handleError = () => {
    if (isFallback) return;
    setIsFallback(true);
    setSrc(fallbackSrc);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setSrc(objectUrl); // 미리보기
    setIsFallback(false);
    onFileSelect?.(file);

    // input 재선택 가능하도록 리셋
    e.currentTarget.value = "";
  };

  // 언마운트 시 blob URL 정리
  useEffect(() => {
    return () => {
      if (src.startsWith("blob:")) URL.revokeObjectURL(src);
    };
  }, [src]);

  return (
    <div
      className={cx("relative inline-block overflow-hidden", className)}
      style={{ width: size, height: size }}
    >
      <div className="relative w-full h-full">
        <Image
          src={src || fallbackSrc}
          alt={alt}
          fill
          sizes={`${size}px`}
          className={cx(
            "object-cover bg-gray-100 transition-opacity",
            roundedClass[rounded],
            isLoading ? "opacity-50" : "opacity-100"
          )}
          onError={handleError}
          // blob/data URL, 미리보기, 또는 외부 도메인에서 최적화 안 하고 싶을 때
          unoptimized={isBlobOrData}
          // 외부 도메인은 next.config.js remotePatterns에 등록 필요
          priority
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* 클릭해서 파일 선택 */}
      {onFileSelect && (
        <label
          className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-all cursor-pointer"
          style={{ borderRadius: rounded === "full" ? "50%" : "0.5rem", pointerEvents: isLoading ? "none" : "auto" }}
        >
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <span className="text-white opacity-0 hover:opacity-100 transition-opacity text-sm font-medium">
            변경
          </span>
        </label>
      )}
    </div>
  );
}
