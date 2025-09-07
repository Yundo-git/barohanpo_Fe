"use client";

import { useEffect, useState } from "react";
import { useLocationPermission } from "@/hooks/useLocationPermission";

export default function LocalPermission() {
  const [retryCount, setRetryCount] = useState(0);
  const { requestLocationPermission } = useLocationPermission();

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const requestPermission = async () => {
      try {
        console.log("Requesting location permission...");
        const hasPermission = await requestLocationPermission();
        
        if (isMounted) {
          if (hasPermission) {
            console.log("위치 권한이 허용되었습니다.");
          } else if (retryCount < 2) {
            // Retry after 1 second if permission not granted
            console.log(`위치 권한 재요청 중... (${retryCount + 1}/2)`);
            timeoutId = setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 1000);
          } else {
            console.log("위치 권한을 가져오지 못했습니다.");
          }
        }
      } catch (error) {
        console.error("위치 권한 요청 중 오류 발생:", error);
        if (isMounted && retryCount < 2) {
          // Retry on error
          timeoutId = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000);
        }
      }
    };

    requestPermission();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [requestLocationPermission, retryCount]);

  return null;
}
