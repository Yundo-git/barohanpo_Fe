import React, { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react';
import { calculateDistance, isValidCoordinate } from '@/utils/locationUtils';
import useOptimizedLocation from '@/hooks/useOptimizedLocation';

interface LocationContextType {
  position: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  } | null;
  error: string | null;
  isTracking: boolean;
  lastUpdated: number | null;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  refreshLocation: () => Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
  }>;
  getDistanceTo: (lat: number, lng: number) => number | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
  minDistance?: number; // meters
  updateInterval?: number; // milliseconds
  autoStart?: boolean;
  onLocationUpdate?: (position: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }) => void;
  onError?: (error: Error) => void;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({
  children,
  minDistance = 50,
  updateInterval = 10000,
  autoStart = true,
  onLocationUpdate,
  onError,
}) => {
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  
  const handleLocationChange = useCallback((position: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  }) => {
    setLastUpdated(Date.now());
    if (onLocationUpdate) {
      onLocationUpdate(position);
    }
  }, [onLocationUpdate]);

  const handleError = useCallback((error: Error) => {
    console.error('Location tracking error:', error);
    if (onError) {
      onError(error);
    }
  }, [onError]);

  const {
    position,
    error,
    isWatching,
    startWatching,
    stopWatching,
    getCurrentPosition,
  } = useOptimizedLocation({
    onLocationChange: handleLocationChange,
    onError: handleError,
    minDistance,
    updateInterval,
    enableHighAccuracy: true,
  });

  // Update tracking state when watch status changes
  useEffect(() => {
    setIsTracking(isWatching);
  }, [isWatching]);

  // Auto-start tracking if enabled
  useEffect(() => {
    if (autoStart && !isTracking) {
      startTracking().catch(err => {
        console.error('Failed to start location tracking:', err);
      });
    }

    return () => {
      if (isTracking) {
        stopTracking().catch(err => {
          console.error('Error stopping location tracking:', err);
        });
      }
    };
  }, [autoStart, isTracking]);

  const startTracking = useCallback(async () => {
    try {
      await startWatching();
      setIsTracking(true);
    } catch (err) {
      console.error('Failed to start tracking:', err);
      throw err;
    }
  }, [startWatching]);

  const stopTracking = useCallback(async () => {
    try {
      await stopWatching();
      setIsTracking(false);
    } catch (err) {
      console.error('Failed to stop tracking:', err);
      throw err;
    }
  }, [stopWatching]);

  const refreshLocation = useCallback(async () => {
    try {
      const pos = await getCurrentPosition();
      return {
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: pos.accuracy,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Error refreshing location:', error);
      throw error;
    }
  }, [getCurrentPosition]);

  const getDistanceTo = useCallback((lat: number, lng: number): number | null => {
    if (!position || !isValidCoordinate(lat, lng)) return null;
    return calculateDistance(
      position.latitude,
      position.longitude,
      lat,
      lng
    );
  }, [position]);

  const value = {
    position,
    error,
    isTracking,
    lastUpdated,
    startTracking,
    stopTracking,
    refreshLocation,
    getDistanceTo,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export default LocationContext;
