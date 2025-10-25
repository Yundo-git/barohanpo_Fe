import { useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

interface UseGeolocationResult {
  getCurrentLocation: () => Promise<{ latitude: number; longitude: number }>;
}

export function useGeolocation(): UseGeolocationResult {
  const getCurrentLocation = useCallback(async () => {
    // 💡 **Capacitor 환경 확인 및 사용 (앱)**
    if (Capacitor?.isNativePlatform?.()) {
      console.log("[useGeolocation] 📱 Capacitor Geolocation 사용");
      
      // 권한 확인 및 요청
      let status = await Geolocation.checkPermissions();
      if (status.location !== 'granted') {
        console.log("[useGeolocation] 권한 요청 팝업 표시");
        status = await Geolocation.requestPermissions();
      }

      if (status.location !== 'granted') {
        throw new Error("위치 권한이 거부되었습니다. 앱 설정에서 허용해주세요.");
      }
      
      // 위치 정보 가져오기
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000,
      });
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
    } 
    // 🌐 **웹 환경 확인 및 사용**
    else if (navigator.geolocation) {
      console.log("[useGeolocation] 🌐 브라우저 Geolocation API 사용");

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
    } else {
      throw new Error("이 환경에서는 위치 서비스를 지원하지 않습니다.");
    }
  }, []);

  return {
    getCurrentLocation
  };
}
