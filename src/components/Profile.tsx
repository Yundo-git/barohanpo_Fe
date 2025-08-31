// src/components/Profile.tsx
"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Round = "full" | "lg" | "md" | "sm";

/** 간단한 클래스 머지 유틸 (cn 대체) */
type ClassValue = string | undefined | null | false;
function cx(...classes: ClassValue[]): string {
  return classes
    .filter((c): c is string => typeof c === "string" && c.length > 0)
    .join(" ");
}

interface ImageFile extends File {
  preview: string;
}

export interface ProfileProps {
  userId: number | string;
  alt: string;
  size?: number;
  rounded?: Round;
  className?: string;
  fallbackSrc?: string;
  apiBaseUrl?: string;
  relativeApi?: boolean;
  unoptimized?: boolean;
  updatedAt?: string | number;
  onFileSelect?: (file: File) => void;
  isLoading?: boolean;
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
  relativeApi = true,
  unoptimized = false,
  updatedAt,
  onFileSelect,
  isLoading = false,
}: ProfileProps) {
  const baseSrc = useMemo<string>(() => {
    const root = relativeApi
      ? `/api/profile/${userId}/photo`
      : `${apiBaseUrl}/api/profile/${userId}/photo`;
    return updatedAt ? `${root}?v=${updatedAt}` : root;
  }, [relativeApi, apiBaseUrl, userId, updatedAt]);

  const [src, setSrc] = useState<string>(baseSrc);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  useEffect(() => {
    setSrc(baseSrc);
    setIsFallback(false);
  }, [baseSrc]);

  const handleError = () => {
    if (!isFallback) {
      setSrc(fallbackSrc);
      setIsFallback(true);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const imageUrl = URL.createObjectURL(file);
    setSrc(imageUrl);

    // Notify parent component
    onFileSelect?.(file);

    // Clean up the object URL when component unmounts
    return () => URL.revokeObjectURL(imageUrl);
  };

  return (
    <div
      className={cx("relative inline-block overflow-hidden", className)}
      style={{ width: size, height: size }}
    >
      <div className="relative w-full h-full">
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className={cx(
            "h-full w-full object-cover bg-gray-100 transition-opacity",
            roundedClass[rounded],
            isLoading ? "opacity-50" : "opacity-100"
          )}
          onError={handleError}
          unoptimized={unoptimized}
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
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all cursor-pointer"
          style={{ borderRadius: rounded === "full" ? "50%" : "0.5rem" }}
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

// Add cleanup for object URLs
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    // Clean up any remaining object URLs
    document.querySelectorAll('img[src^="blob:"]').forEach((img) => {
      URL.revokeObjectURL(img.getAttribute("src") || "");
    });
  });
}
