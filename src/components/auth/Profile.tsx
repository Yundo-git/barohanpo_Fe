// src/components/auth/Profile.tsx
"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

// Helper function to concatenate class names
type ClassValue = string | undefined | null | false;
function cx(...classes: ClassValue[]): string {
  return classes
    .filter((c): c is string => typeof c === "string" && c.length > 0)
    .join(" ");
}

type Round = "full" | "lg" | "md" | "sm";

export interface ProfileProps {
  alt: string;
  size?: number;
  rounded?: Round;
  className?: string;
  fallbackSrc?: string;
  onFileSelect?: (file: File) => void;
  isLoading?: boolean;
  version?: number;
  imageUrl?: string;
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
  alt,
  size = 96,
  rounded = "full",
  className = "",
  fallbackSrc = "/sample_profile.svg",
  version,
  onFileSelect,
  isLoading,
  imageUrl,
}: ProfileProps) {
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // imageUrl prop이 변경되면 로컬 미리보기 URL을 초기화합니다.
  useEffect(() => {
    setLocalPreviewUrl(null);
  }, [imageUrl]);

  const currentImageUrl = useMemo(() => {
    return localPreviewUrl || imageUrl;
  }, [localPreviewUrl, imageUrl]);

  const src = useMemo(() => {
    if (isFallback) {
      return fallbackSrc;
    }
    const url = currentImageUrl || fallbackSrc;
    // Add cache buster if version is provided
    if (version !== undefined && url === imageUrl) {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}v=${version}`;
    }
    return url;
  }, [currentImageUrl, isFallback, fallbackSrc, imageUrl, version]);

  const isBlobOrData = src.startsWith("blob:") || src.startsWith("data:");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = ""; // Allow re-selecting the same file
    if (!file) {
      return;
    }

    // File validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`이미지 크기는 ${MAX_SIZE_MB}MB 이하로 업로드해주세요.`);
      return;
    }

    // Create a local preview URL
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);
    setIsFallback(false);

    // Pass the file to the parent component
    onFileSelect?.(file);
  };

  const handleImageError = () => {
    setIsFallback(true);
  };

  useEffect(() => {
    // Revoke the local URL on component unmount
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main"></div>
          </div>
        )}
      </div>

      {onFileSelect && (
        <label
          className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-all cursor-pointer"
          style={{
            borderRadius: rounded === "full" ? "50%" : "0.5rem",
            pointerEvents: isLoading ? "none" : "auto",
          }}
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
