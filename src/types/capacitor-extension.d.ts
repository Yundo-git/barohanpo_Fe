

import '@capacitor/status-bar';

declare module '@capacitor/status-bar' {
  /**
   * 프로젝트의 타입 정의 파일에 누락되었을 수 있는 속성을 추가하여
   * StatusBarInfo 인터페이스를 확장합니다.
   */
  export interface StatusBarInfo {
    /** 상단 안전 영역의 높이(픽셀). (statusBarHeight 대신 사용) */
    safeAreaTop?: number;
    /** 하단 안전 영역의 높이(픽셀). (iPhone X/11/12 등의 하단 바 영역) */
    safeAreaBottom?: number;
  }

  /**
   * capacitor.config.ts에서 TypeScript 오류를 방지하기 위해 
   * StatusBarPluginConfig 인터페이스를 확장합니다.
   */
  export interface StatusBarPluginConfig {
      overlay?: boolean;
  }
}