// // src/types/kakaoMap.ts
// declare namespace kakao.maps {
//   class Map {
//     constructor(container: HTMLElement, options: MapOptions);
//     setCenter(latLng: LatLng): void;
//     setLevel(level: number, options?: { animate?: boolean }): void;
//     getBounds(): LatLngBounds;
//     relayout(): void;
//   }

//   class LatLng {
//     constructor(lat: number, lng: number);
//     getLat(): number;
//     getLng(): number;
//   }

//   class LatLngBounds {
//     extend(latLng: LatLng): void;
//     getSouthWest(): LatLng;
//     getNorthEast(): LatLng;
//   }

//   class Marker {
//     constructor(options: MarkerOptions);
//     setMap(map: Map | null): void;
//     setPosition(latLng: LatLng): void;
//     getPosition(): LatLng;
//   }

//   class MarkerImage {
//     constructor(
//       src: string,
//       size: Size,
//       options?: {
//         offset?: Point;
//         alt?: string;
//         coords?: string;
//       }
//     );
//   }

//   interface MapOptions {
//     center: LatLng;
//     level: number;
//   }

//   interface MarkerOptions {
//     position: LatLng;
//     map?: Map;
//     image?: MarkerImage;
//     zIndex?: number;
//   }

//   class Point {
//     constructor(x: number, y: number);
//   }

//   class Size {
//     constructor(width: number, height: number);
//   }
// }

// export interface KakaoMap extends kakao.maps.Map {}
// export interface KakaoMarker extends kakao.maps.Marker {}
// export interface KakaoLatLng extends kakao.maps.LatLng {}
// export interface KakaoLatLngBounds extends kakao.maps.LatLngBounds {}
// export interface KakaoMarkerImage extends kakao.maps.MarkerImage {}
// export interface KakaoPoint extends kakao.maps.Point {}
// export interface KakaoSize extends kakao.maps.Size {}
