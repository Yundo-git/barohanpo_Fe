"use client";

import { useEffect } from "react";
import { useLocationPermission } from "@/hooks/useLocationPermission";

export default function LocalPermission() {
  const { requestLocationPermission } = useLocationPermission();

  useEffect(() => {
    // 앱 로드 시 위치 권한 요청
    requestLocationPermission().then((hasPermission) => {
      if (hasPermission) {
        console.log("위치 권한이 허용되었습니다.");
      }
    });
  }, [requestLocationPermission]);
  return null;
}
