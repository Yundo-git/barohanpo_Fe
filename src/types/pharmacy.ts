export interface Pharmacy {
  id?: string;
  name?: string;
  address?: string;
  phone?: string;
  lat?: number | string;
  lng?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  [key: string]: any;
}

export interface KakaoMapRefs {
  map: any;
  markers: any[];
  userMarker: any;
}
