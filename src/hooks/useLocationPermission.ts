import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";

export const useLocationPermission = () => {
  const requestLocationPermission = async () => {
    try {
      // Capacitor 환경(모바일 앱)과 웹을 구분
      const isCapacitor = Capacitor?.isNativePlatform?.() ?? false;

      if (isCapacitor) {
        // 네이티브: Capacitor 권한 API 사용
        const permission = await Geolocation.checkPermissions();
        if (permission.location === "granted") return true;
        const result = await Geolocation.requestPermissions();
        return result.location === "granted";
      }

      // 웹: 기존 동작과 동일하게, 실제 위치 요청으로 프롬프트를 트리거하고 결과를 반환
      return new Promise<boolean>((resolve) => {
        if (!navigator.geolocation) return resolve(false);
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });

      // 권한 거부됨
      console.log("위치 권한이 거부되었습니다.");
      return false;
    } catch (error) {
      console.error("위치 권한 요청 중 오류 발생:", error);
      return false;
    }
  };

  return { requestLocationPermission };
};
