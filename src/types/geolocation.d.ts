export interface GeolocationCoordinates {
  readonly latitude: number;
  readonly longitude: number;
  readonly altitude: number | null;
  readonly accuracy: number;
  readonly altitudeAccuracy: number | null;
  readonly heading: number | null;
  readonly speed: number | null;
  toJSON?(): any;
}

export interface GeolocationPosition {
  readonly coords: GeolocationCoordinates;
  readonly timestamp: number;
}

export interface GeolocationPositionError {
  readonly code: number;
  readonly message: string;
  readonly PERMISSION_DENIED: number;
  readonly POSITION_UNAVAILABLE: number;
  readonly TIMEOUT: number;
}

export interface Geolocation {
  getCurrentPosition(
    successCallback: PositionCallback,
    errorCallback?: PositionErrorCallback | null,
    options?: PositionOptions
  ): void;
  
  watchPosition(
    successCallback: PositionCallback,
    errorCallback?: PositionErrorCallback | null,
    options?: PositionOptions
  ): number;
  
  clearWatch(id: number): void;
}

declare global {
  interface Navigator {
    geolocation: Geolocation;
  }
}

export type PositionCallback = (position: GeolocationPosition) => void;
export type PositionErrorCallback = (error: GeolocationPositionError) => void;

export interface PositionOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}
