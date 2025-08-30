// src/components/Profile.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Round = "full" | "lg" | "md" | "sm";

/** 간단한 클래스 머지 유틸 (cn 대체) */
type ClassValue = string | undefined | null | false;
function cx(...classes: ClassValue[]): string {
  return classes
    .filter((c): c is string => typeof c === "string" && c.length > 0)
    .join(" ");
}

export interface ProfileProps {
  userId: number | string;
  alt: string;
  size?: number;
  rounded?: Round;
  className?: string;
  fallbackSrc?: string;
  apiBaseUrl?: string; // relativeApi=false일 때만 사용
  relativeApi?: boolean; // 기본: true (프론트 프록시 사용)
  unoptimized?: boolean;
  /** 서버에서 이미지 갱신 시 캐시버스트용 쿼리 파라미터로 사용 */
  updatedAt?: string | number;
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
}: ProfileProps) {
  const baseSrc = useMemo<string>(() => {
    const root = relativeApi
      ? `/api/users/${userId}/profile`
      : `${apiBaseUrl}/api/users/${userId}/profile`;
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

  return (
    <div
      className={cx("relative inline-block", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={cx(
          "h-full w-full object-cover bg-gray-100",
          roundedClass[rounded]
        )}
        onError={handleError}
        unoptimized={unoptimized}
        priority
      />
    </div>
  );
}
