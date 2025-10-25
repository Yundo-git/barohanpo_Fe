import { useEffect, useCallback } from 'react';
import useOptimizedLocation from '@/hooks/useOptimizedLocation';

interface LocationTrackerProps {
  onLocationUpdate: (position: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }) => void;
  onError?: (error: Error) => void;
  minDistance?: number; // meters
  updateInterval?: number; // milliseconds
  autoStart?: boolean;
}

export const LocationTracker = ({
  onLocationUpdate,
  onError,
  minDistance = 50, // 50 meters
  updateInterval = 10000, // 10 seconds
  autoStart = true,
}: LocationTrackerProps) => {
  // Initialize the optimized location hook
  const {
    position,
    error,
    isWatching,
    startWatching,
    stopWatching,
    getCurrentPosition,
  } = useOptimizedLocation({
    onLocationChange: (pos) => {
      onLocationUpdate({
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: pos.accuracy,
      });
    },
    onError: (err) => {
      console.error('Location tracking error:', err);
      if (onError) {
        onError(err);
      }
    },
    minDistance,
    updateInterval,
    enableHighAccuracy: true,
  });

  // Handle auto-start
  useEffect(() => {
    if (autoStart && !isWatching) {
      startWatching().catch(err => {
        console.error('Failed to start location tracking:', err);
        if (onError) {
          onError(err instanceof Error ? err : new Error(String(err)));
        }
      });
    }

    return () => {
      if (isWatching) {
        stopWatching().catch(err => {
          console.error('Error stopping location tracking:', err);
        });
      }
    };
  }, [autoStart, isWatching, onError, startWatching, stopWatching]);

  // Get current position on demand
  const refreshLocation = useCallback(async () => {
    try {
      const pos = await getCurrentPosition();
      onLocationUpdate({
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: pos.accuracy,
      });
      return pos;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Error getting current position:', error);
      if (onError) {
        onError(error);
      }
      throw error;
    }
  }, [getCurrentPosition, onLocationUpdate, onError]);

  // Return the current state and controls
  return {
    position,
    error,
    isWatching,
    startWatching,
    stopWatching,
    refreshLocation,
  };
};

export default LocationTracker;
