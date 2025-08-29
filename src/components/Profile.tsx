"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Round = "full" | "lg" | "md" | "sm";

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
  onClick?: () => void;
}

const roundedClasses: Record<Round, string> = {
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
  relativeApi = false,
  unoptimized = false,
  onClick,
}: ProfileProps) {
  const [src, setSrc] = useState<string>(
    relativeApi
      ? `${apiBaseUrl}/api/users/${userId}/profile`
      : `${apiBaseUrl}/api/users/${userId}/profile`
  );
  const [isFallback, setIsFallback] = useState<boolean>(false);

  useEffect(() => {
    const next = relativeApi
      ? `${apiBaseUrl}/api/users/${userId}/profile`
      : `${apiBaseUrl}/api/users/${userId}/profile`;
    setSrc(next);
    setIsFallback(false);
  }, [userId, apiBaseUrl, relativeApi]);

  // 이미지 로드 실패 시 폴백 이미지로 전환
  const handleError = () => {
    if (!isFallback && fallbackSrc) {
      setSrc(fallbackSrc);
      setIsFallback(true);
    }
  };

  return (
    <div
      className={cn("relative", className, {
        "cursor-pointer": onClick,
      })}
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={cn("object-cover bg-gray-100 w-full h-full", {
          "rounded-full": rounded === "full",
          "rounded-2xl": rounded === "lg",
          "rounded-lg": rounded === "md",
          "rounded-sm": rounded === "sm",
        })}
        onError={handleError}
        unoptimized={unoptimized}
      />
    </div>
  );
}
