import { Geolocation } from "@capacitor/geolocation";

export const useLocationPermission = () => {
  const requestLocationPermission = async () => {
    try {
      // 위치 권한 상태 확인
      const permission = await Geolocation.checkPermissions();

      if (permission.location === "granted") {
        return true;
      }

      // 권한 요청
      const result = await Geolocation.requestPermissions();

      if (result.location === "granted") {
        return true;
      }

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
