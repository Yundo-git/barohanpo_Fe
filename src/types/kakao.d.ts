// src/types/kakao.d.ts

declare namespace kakao {
  namespace maps {
    function load(callback: () => void): void;

    class LatLng {
      constructor(lat: number, lng: number);
    }

    class LatLngBounds {
      extend(latlng: LatLng): void;
      isEmpty(): boolean;
    }

    class Map {
      constructor(container: HTMLElement, options: any);
      setCenter(latlng: LatLng): void;
      setBounds(bounds: LatLngBounds): void;
    }

    class Marker {
      constructor(options: any);
      setMap(map: Map | null): void;
      setPosition(position: LatLng): void;
      getPosition(): LatLng;
    }

    class MarkerImage {
      constructor(src: string, size: Size, options?: any);
    }

    class Size {
      constructor(width: number, height: number);
    }

    class Point {
      constructor(x: number, y: number);
    }

    namespace event {
      function addListener<T = any>(
        target: T,
        type: string,
        handler: (event?: any) => void
      ): void;
    }
  }
}

declare global {
  interface Window {
    kakao: typeof kakao;
  }
}
