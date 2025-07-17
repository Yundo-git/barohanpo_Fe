// src/hooks/useKakaoMap.ts
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

interface UseKakaoMapOptions {
  initialPharmacies?: any[];
  isReady?: boolean;
}

export const useKakaoMap = (
  onMapLoad: (map: kakao.maps.Map, initialPharmacies?: any[]) => void,
  options: boolean | UseKakaoMapOptions = { isReady: true }
) => {
  const { isReady = true, initialPharmacies } = 
    typeof options === 'boolean' ? { isReady: options } : options;
  const initAttempted = useRef(false);

  useEffect(() => {
    if (!isReady || initAttempted.current) {
      console.log("useKakaoMap: 초기화를 건너뜁니다.");
      return;
    }

    initAttempted.current = true;
    const scriptId = "kakao-map-script";
    let map: kakao.maps.Map | null = null;
    let mapInitializationAttempts = 0;
    const MAX_ATTEMPTS = 10;
    const RETRY_DELAY = 100; // ms

    console.log("useKakaoMap: 맵 초기화 시작");

    // src/hooks/useKakaoMap.ts
    const waitForContainer = (callback: () => void, attempt = 0) => {
      const container = document.getElementById("map");
      if (container && container.offsetParent !== null) {
        // 컨테이너가 실제로 보이는지도 확인
        console.log("useKakaoMap: 지도 컨테이너를 찾았습니다.", container);
        callback();
      } else if (attempt < MAX_ATTEMPTS) {
        console.log(
          `useKakaoMap: 지도 컨테이너를 찾는 중... (시도 ${
            attempt + 1
          }/${MAX_ATTEMPTS})`
        );
        setTimeout(() => waitForContainer(callback, attempt + 1), RETRY_DELAY);
      } else {
        console.error(
          "useKakaoMap: 최대 재시도 횟수를 초과했습니다. 지도 컨테이너를 찾을 수 없습니다."
        );
        // DOM에 직접 로그 출력 (디버깅용)
        const debugDiv = document.createElement("div");
        debugDiv.style.position = "fixed";
        debugDiv.style.top = "10px";
        debugDiv.style.left = "10px";
        debugDiv.style.backgroundColor = "white";
        debugDiv.style.padding = "10px";
        debugDiv.style.border = "1px solid red";
        debugDiv.style.zIndex = "9999";
        debugDiv.innerHTML = `
      <h3>지도 컨테이너 디버그 정보:</h3>
      <p>컨테이너 찾음: ${!!container}</p>
      ${
        container
          ? `
        <p>offsetParent: ${container.offsetParent ? "있음" : "없음"}</p>
        <p>display: ${window.getComputedStyle(container).display}</p>
        <p>visibility: ${window.getComputedStyle(container).visibility}</p>
        <p>width: ${container.offsetWidth}px</p>
        <p>height: ${container.offsetHeight}px</p>
      `
          : ""
      }
    `;
        document.body.appendChild(debugDiv);
      }
    };

    const createMap = () => {
      console.log("useKakaoMap: 지도 생성 시작");
      const container = document.getElementById("map");
      if (!container) {
        console.error("useKakaoMap: 지도 컨테이너를 찾을 수 없습니다.");
        return;
      }

      try {
        console.log("useKakaoMap: 지도 인스턴스 생성 중...");
        const center = new window.kakao.maps.LatLng(37.5665, 126.978);
        const newMap = new window.kakao.maps.Map(container, {
          center,
          level: 3,
        });

        console.log("useKakaoMap: 지도 인스턴스 생성 완료", newMap);
        map = newMap; // map 변수에 할당
        onMapLoad(newMap, initialPharmacies); // initialPharmacies와 함께 콜백 호출
      } catch (error) {
        console.error("useKakaoMap: 지도 생성 중 오류 발생:", error);
      }
    };

    const initMap = () => {
      // 이미 카카오맵이 로드된 경우
      if (window.kakao?.maps) {
        console.log("useKakaoMap: 이미 카카오맵이 로드되어 있습니다.");
        waitForContainer(createMap);
        return;
      }

      // 스크립트가 이미 로드 중인 경우
      if (document.getElementById(scriptId)) {
        console.log(
          "useKakaoMap: 이미 스크립트가 로드 중입니다. 대기합니다..."
        );
        const checkMap = setInterval(() => {
          if (window.kakao?.maps) {
            console.log("useKakaoMap: 대기 중인 스크립트 로드 완료");
            clearInterval(checkMap);
            waitForContainer(createMap);
          }
        }, 100);
        return;
      }

      // 스크립트 로드
      console.log("useKakaoMap: 카카오맵 스크립트 로드 시작");
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAPS_KEY}&autoload=false&libraries=services`;
      script.async = true;

      script.onload = () => {
        console.log("useKakaoMap: 카카오맵 스크립트 로드 완료");
        if (!window.kakao?.maps) {
          console.error(
            "useKakaoMap: window.kakao.maps가 아직 로드되지 않았습니다."
          );
          return;
        }
        window.kakao.maps.load(() => {
          console.log("useKakaoMap: 카카오맵 SDK 로드 완료");
          waitForContainer(createMap);
        });
      };

      script.onerror = (error) => {
        console.error("useKakaoMap: 카카오맵 스크립트 로드 실패:", error);
      };

      document.head.appendChild(script);
    };

    initMap();

    // 클린업
    return () => {
      console.log("useKakaoMap: 클린업 실행");
      const script = document.getElementById(scriptId);
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (map && window.kakao?.maps?.event) {
        try {
          // Clear all event listeners from the map instance
          window.kakao.maps.event.removeListener(map);
          console.log("useKakaoMap: 지도 이벤트 리스너 정리 완료");
        } catch (error) {
          console.error("useKakaoMap: 이벤트 리스너 제거 중 오류:", error);
        }
      }
      initAttempted.current = false;
    };
  }, [onMapLoad, isReady]);
};
