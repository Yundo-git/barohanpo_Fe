export interface Pharmacy {
  p_id: string;
  name?: string;
  address?: string;
  phone?: string;
  number?: string;
  lat?: number | string;
  lng?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  [key: string]: unknown;
}

export interface PharmacyUser {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  number?: string;
  pharmacyId?: string;
  [key: string]: unknown;
}

export interface PharmacyWithUser extends Pharmacy {
  user?: PharmacyUser | null;
}

export interface KakaoMapRefs {
  map: kakao.maps.Map | null;
  userMarker: kakao.maps.Marker | null;
  markers: kakao.maps.Marker[];
}
