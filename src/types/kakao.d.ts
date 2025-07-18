declare namespace kakao {
  namespace maps {
    function load(callback: () => void): void;

    interface MapOptions {
      center: LatLng;
      level?: number;
    }

    interface MarkerOptions {
      position: LatLng;
      map?: Map;
      title?: string;
      image?: MarkerImage;
      zIndex?: number;
      clickable?: boolean;
    }

    interface MarkerImageOptions {
      offset?: Point;
    }

    class LatLng {
      constructor(lat: number, lng: number);
    }

    class LatLngBounds {
      extend(latlng: LatLng): void;
      isEmpty(): boolean;
    }

    class Map {
      constructor(container: HTMLElement, options: MapOptions);
      setCenter(latlng: LatLng): void;
      setBounds(bounds: LatLngBounds): void;
      setZoom(level: number): void; // 추가된 부분
      getZoom(): number; // 추가: 필요할 수 있으니 함께 추가
      getLevel(): number;
      setLevel(level: number): void;
      relayout(): void;
    }

    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(position: LatLng): void;
      getPosition(): LatLng;
    }

    class MarkerImage {
      constructor(src: string, size: Size, options?: MarkerImageOptions);
    }

    class Size {
      constructor(width: number, height: number);
    }

    class Point {
      constructor(x: number, y: number);
    }

    namespace event {
      function addListener<T extends object>(
        target: T,
        type: string,
        handler: (event?: unknown) => void
      ): void;
      
      function removeListener(
        target: object,
        type: string,
        handler: (event?: unknown) => void
      ): void;
      
      function removeListener(target: object): void;
    }
  }
}

declare global {
  interface Window {
    kakao: typeof kakao;
  }
}
