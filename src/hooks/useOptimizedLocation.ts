import { useCallback, useEffect, useRef, useState } from 'react';
import { Geolocation as CapGeolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import type { GeolocationPosition, GeolocationPositionError } from '../types/geolocation.d';

interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
  toJSON(): {
    coords: Omit<Position, 'toJSON' | 'timestamp'>;
    timestamp: number;
  };
}

interface UseOptimizedLocationProps {
  onLocationChange?: (position: Position) => void;
  onError?: (error: Error) => void;
  minDistance: number; // meters
  updateInterval: number; // milliseconds
  enableHighAccuracy?: boolean;
}

export const useOptimizedLocation = ({
  onLocationChange,
  onError,
  minDistance = 50, // Default minimum distance in meters to trigger update
  updateInterval = 10000, // Default update interval in milliseconds
  enableHighAccuracy = true,
}: UseOptimizedLocationProps) => {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const watchId = useRef<string | number | null>(null);
  const lastPositionRef = useRef<Position | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const isMounted = useRef(true);

  // Check if the current position has changed significantly
  const hasSignificantChange = useCallback((newPos: Position, lastPos: Position | null) => {
    if (!lastPos) return true;
    
    // Calculate distance between two points using Haversine formula
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (newPos.latitude * Math.PI) / 180;
    const φ2 = (lastPos.latitude * Math.PI) / 180;
    const Δφ = ((newPos.latitude - lastPos.latitude) * Math.PI) / 180;
    const Δλ = ((newPos.longitude - lastPos.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Check if enough time has passed or significant movement occurred
    const timeElapsed = Date.now() - lastUpdateRef.current;
    return distance >= minDistance || timeElapsed >= updateInterval;
  }, [minDistance, updateInterval]);

  // Convert GeolocationPosition to our Position type
  const convertToPosition = useCallback((pos: GeolocationPosition): Position => {
    const position: Position = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude ?? null,
      altitudeAccuracy: pos.coords.altitudeAccuracy ?? null,
      heading: pos.coords.heading ?? null,
      speed: pos.coords.speed ?? null,
      timestamp: pos.timestamp,
      toJSON() {
        const { toJSON: _, timestamp, ...coords } = this;
        return {
          coords,
          timestamp: this.timestamp,
        };
      },
    };
    
    return position;
  }, []);

  // Handle position updates
  const handlePositionUpdate = useCallback((pos: GeolocationPosition) => {
    if (!isMounted.current) return;
    
    // Ensure all required properties are present
    const positionWithDefaults: GeolocationPosition = {
      coords: {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude ?? null,
        altitudeAccuracy: pos.coords.altitudeAccuracy ?? null,
        heading: pos.coords.heading ?? null,
        speed: pos.coords.speed ?? null,
      },
      timestamp: pos.timestamp || Date.now(),
    };
    
    const newPosition = convertToPosition(positionWithDefaults);

    // Check if significant change occurred
    if (hasSignificantChange(newPosition, lastPositionRef.current)) {
      setPosition(newPosition);
      lastPositionRef.current = newPosition;
      lastUpdateRef.current = Date.now();
      
      if (onLocationChange) {
        onLocationChange(newPosition);
      }
    }
  }, [hasSignificantChange, onLocationChange]);

  // Handle errors
  const handleError = useCallback((error: GeolocationPositionError) => {
    if (!isMounted.current) return;
    
    const errorMessage = `Geolocation error (${error.code}): ${error.message}`;
    console.error(errorMessage);
    setError(errorMessage);
    
    if (onError) {
      onError(new Error(errorMessage));
    }
  }, [onError]);

  // Start watching position
  const startWatching = useCallback(async () => {
    if (!isMounted.current) return;
    
    try {
      // Check permissions first
      if (Capacitor.isNativePlatform()) {
        const permission = await CapGeolocation.checkPermissions();
        if (permission.location !== 'granted') {
          const request = await CapGeolocation.requestPermissions();
          if (request.location !== 'granted') {
            throw new Error('Location permission not granted');
          }
        }
      }

      // Clear any existing watch
      if (watchId.current !== null) {
        if (typeof watchId.current === 'string') {
          await CapGeolocation.clearWatch({ id: watchId.current });
        } else {
          navigator.geolocation.clearWatch(watchId.current);
        }
        watchId.current = null;
      }

      // Start watching position
      if (Capacitor.isNativePlatform()) {
        const callbackId = await CapGeolocation.watchPosition(
          {
            enableHighAccuracy,
            timeout: 10000,
            maximumAge: 0,
          },
          (position, err) => {
            if (err) {
              handleError(err);
            } else if (position) {
              handlePositionUpdate({
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  altitude: position.coords.altitude ?? null,
                  altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
                  heading: position.coords.heading ?? null,
                  speed: position.coords.speed ?? null,
                },
                timestamp: position.timestamp,
              });
            }
          }
        );
        watchId.current = callbackId;
      } else if (navigator.geolocation) {
        watchId.current = navigator.geolocation.watchPosition(
          handlePositionUpdate,
          handleError,
          {
            enableHighAccuracy,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        throw new Error('Geolocation is not supported by this browser');
      }

      setIsWatching(true);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      handleError({
        code: 0,
        message: error.message,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
    }
  }, [enableHighAccuracy, handlePositionUpdate, handleError]);

  // Stop watching position
  const stopWatching = useCallback(async () => {
    if (!isMounted.current) return;
    
    if (watchId.current !== null) {
      try {
        if (typeof watchId.current === 'string') {
          await CapGeolocation.clearWatch({ id: watchId.current });
        } else {
          navigator.geolocation.clearWatch(watchId.current);
        }
      } catch (err) {
        console.error('Error clearing watch:', err);
      } finally {
        watchId.current = null;
        setIsWatching(false);
      }
    }
  }, []);

  // Get current position once
  const getCurrentPosition = useCallback(async (): Promise<Position> => {
    try {
      if (Capacitor.isNativePlatform()) {
        const permission = await CapGeolocation.checkPermissions();
        if (permission.location !== 'granted') {
          const request = await CapGeolocation.requestPermissions();
          if (request.location !== 'granted') {
            throw new Error('Location permission not granted');
          }
        }
        
        const position = await CapGeolocation.getCurrentPosition({
          enableHighAccuracy,
          timeout: 10000,
        });
        
        // Create a properly typed position object with all required properties
        const positionWithDefaults: GeolocationPosition = {
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? null,
            altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
            heading: position.coords.heading ?? null,
            speed: position.coords.speed ?? null,
          },
          timestamp: position.timestamp || Date.now(),
        };
        
        const newPosition = convertToPosition(positionWithDefaults);
        setPosition(newPosition);
        lastPositionRef.current = newPosition;
        lastUpdateRef.current = Date.now();
        
        return newPosition;
      } else if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const positionWithDefaults: GeolocationPosition = {
                coords: {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy,
                  altitude: pos.coords.altitude ?? null,
                  altitudeAccuracy: pos.coords.altitudeAccuracy ?? null,
                  heading: pos.coords.heading ?? null,
                  speed: pos.coords.speed ?? null,
                },
                timestamp: pos.timestamp || Date.now(),
              };
              resolve(positionWithDefaults);
            },
            (error) => {
              reject(new Error(`Geolocation error (${error.code}): ${error.message}`));
            },
            {
              enableHighAccuracy,
              timeout: 10000,
              maximumAge: 0,
            }
          );
        });
        
        const newPosition = convertToPosition(position);
        setPosition(newPosition);
        lastPositionRef.current = newPosition;
        lastUpdateRef.current = Date.now();
        
        return newPosition;
      } else {
        throw new Error('Geolocation is not supported by this browser');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      handleError({
        code: 0,
        message: error.message,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
      throw error;
    }
  }, [enableHighAccuracy, handleError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (watchId.current !== null) {
        stopWatching().catch(err => {
          console.error('Error during cleanup:', err);
        });
      }
    };
  }, [stopWatching]);

  return {
    position,
    error,
    isWatching,
    startWatching,
    stopWatching,
    getCurrentPosition,
  };
};

export default useOptimizedLocation;
