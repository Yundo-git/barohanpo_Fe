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
  userId?: number;
  alt: string;
  size: number;
  rounded?: Round;
  className?: string;
  fallbackSrc?: string;
  apiBaseUrl?: string;
  relativeApi?: boolean;
  unoptimized?: boolean;
  onFileSelect?: (file: File) => void;
  isLoading?: boolean;
  version?: number; // For cache busting
  imageUrl?: string; // Direct image URL if available
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
  fallbackSrc = "/sample_profile.svg",
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "",

  version,
  imageUrl,
  onFileSelect,
  isLoading = false,
}: ProfileProps) {
  const baseSrc = useMemo<string>(() => {
    // If direct image URL is provided, use it with version for cache busting
    if (imageUrl) {
      return version
        ? `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}v=${version}`
        : imageUrl;
    }

    // Fallback to default URL construction if no imageUrl is provided
    if (!userId) return fallbackSrc || "";

    const root = `${apiBaseUrl}/api/profile/${userId}/photo`;
    // Add cache-busting query parameter if version is provided
    return version ? `${root}?v=${version}` : root;
  }, [apiBaseUrl, userId, version, imageUrl, fallbackSrc]);

  const [src, setSrc] = useState<string>(baseSrc);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [hasCorsError, setHasCorsError] = useState<boolean>(false);

  useEffect(() => {
    // Reset states when baseSrc changes
    setSrc(baseSrc);
    setIsFallback(false);
    setHasCorsError(false);
  }, [baseSrc]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;

    // If we already tried the fallback, don't do anything
    if (isFallback) return;

    // If this is a CORS error or the image failed to load
    if (target.src !== fallbackSrc) {
      // Check if this is a CORS error by trying to load the image with fetch
      fetch(target.src, {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-store",
      })
        .then(() => {
          // If we get here, it's likely a CORS issue
          setHasCorsError(true);
          setSrc(fallbackSrc);
        })
        .catch(() => {
          // If fetch fails, it's likely a 404 or other error
          setSrc(fallbackSrc);
        });
    }

    setIsFallback(true);
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
        {hasCorsError ? (
          // If we have a CORS error, use an img tag with crossOrigin="anonymous"
          <img
            src={`${baseSrc}${
              baseSrc.includes("?") ? "&" : "?"
            }_=${Date.now()}`}
            alt={alt}
            width={size}
            height={size}
            crossOrigin="anonymous"
            className={cx(
              "h-full w-full object-cover bg-gray-100 transition-opacity",
              roundedClass[rounded],
              "opacity-100"
            )}
            onError={handleError}
          />
        ) : (
          // Otherwise, use the normal image loading flow
          <img
            src={src}
            alt={alt}
            width={size}
            height={size}
            crossOrigin={src.startsWith("http") ? "anonymous" : undefined}
            className={cx(
              "h-full w-full object-cover bg-gray-100 transition-opacity",
              roundedClass[rounded],
              isLoading ? "opacity-50" : "opacity-100"
            )}
            onError={handleError}
          />
        )}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
      {onFileSelect && (
        <label
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all cursor-pointer"
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

// Add cleanup for object URLs
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    // Clean up any remaining object URLs
    document.querySelectorAll('img[src^="blob:"]').forEach((img) => {
      URL.revokeObjectURL(img.getAttribute("src") || "");
    });
  });
}
