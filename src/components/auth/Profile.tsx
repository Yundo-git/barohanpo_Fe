// src/components/auth/Profile.tsx
"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

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
  imageUrl?: string; // <--- imageUrl prop 추가
}

const roundedClass: Record<Round, string> = {
  full: "rounded-full",
  lg: "rounded-2xl",
  md: "rounded-lg",
  sm: "rounded-sm",
};

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function Profile({
  userId,
  alt,
  size = 96,
  rounded = "full",
  className = "",
  fallbackSrc = "/sample_profile.jpeg",
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  version,
  onFileSelect,
  isLoading,
  imageUrl, // <--- imageUrl prop 받아서 사용
}: ProfileProps) {
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // 로컬 미리보기 URL이 있으면 사용, 없으면 prop으로 받은 imageUrl 사용
  const currentImageUrl = useMemo(() => {
    return localPreviewUrl || imageUrl;
  }, [localPreviewUrl, imageUrl]);

  const src = useMemo(() => {
    if (isFallback) {
      return fallbackSrc;
    }
    return currentImageUrl || fallbackSrc;
  }, [currentImageUrl, isFallback, fallbackSrc]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = ""; // 동일 파일 재선택 가능하게
    if (!file) {
      return;
    }

    // 파일 유효성 검사
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`이미지 크기는 ${MAX_SIZE_MB}MB 이하로 업로드해주세요.`);
      return;
    }

    // 기존 URL 해제 및 새 미리보기 URL 생성
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);
    setIsFallback(false);

    // 부모 컴포넌트에 파일 전달
    onFileSelect?.(file);
  };

  const handleImageError = () => {
    setIsFallback(true);
  };

  const isBlobOrData = src.startsWith("blob:") || src.startsWith("data:");

  useEffect(() => {
    // 컴포넌트 언마운트 시 로컬 미리보기 URL 해제
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  return (
    <div
      className={cx("relative inline-block overflow-hidden", className)}
      style={{ width: size, height: size }}
    >
      <div className="relative w-full h-full">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${size}px`}
          className={cx(
            "object-cover bg-gray-100 transition-opacity",
            roundedClass[rounded],
            isLoading ? "opacity-50" : "opacity-100"
          )}
          onError={handleImageError}
          unoptimized={isBlobOrData}
          priority
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

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