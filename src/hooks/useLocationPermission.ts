import { Geolocation, PermissionStatus } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import { useState, useCallback, useEffect } from "react";

type PermissionState = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale';

export const useLocationPermission = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');

  const checkPermission = useCallback(async () => {
    try {
      if (Capacitor?.isNativePlatform?.()) {
        const permission = await Geolocation.checkPermissions();
        const locationPermission = permission.location as PermissionState;
        setPermissionStatus(locationPermission || 'prompt');
        return locationPermission === 'granted';
      }
      return true; // 웹에서는 항상 true 반환 (브라우저에서 처리)
    } catch (error) {
      console.error('권한 확인 중 오류 발생:', error);
      return false;
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    console.log('[useLocationPermission] 위치 권한 요청 시작');
    try {
      // 앱 시작 시 권한 상태 확인
      const hasPermission = await checkPermission();
      if (hasPermission) {
        console.log('[useLocationPermission] 이미 위치 권한이 허용됨');
        return true;
      }

      // 권한 요청
      console.log('[useLocationPermission] 위치 권한 요청 중...');
      const result = await Geolocation.requestPermissions();
      console.log('[useLocationPermission] 위치 권한 요청 결과:', result);
      
      const granted = result.location === "granted";
      setPermissionStatus(granted ? 'granted' : 'denied');
      
      if (!granted) {
        console.warn('[useLocationPermission] 위치 권한이 거부됨');
      }
      
      return granted;
    } catch (error) {
      console.error('[useLocationPermission] 위치 권한 요청 중 오류 발생:', error);
      setPermissionStatus('denied');
      return false;
    }
  }, [checkPermission]);

  // 앱 시작 시 권한 상태 확인
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return { 
    requestLocationPermission, 
    permissionStatus,
    checkPermission
  };
};
