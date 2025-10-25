/**
 * Calculates the distance between two coordinates using the Haversine formula
 * @param lat1 - Latitude of the first point
 * @param lon1 - Longitude of the first point
 * @param lat2 - Latitude of the second point
 * @param lon2 - Longitude of the second point
 * @returns Distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Checks if two positions are significantly different
 * @param pos1 - First position
 * @param pos2 - Second position
 * @param minDistance - Minimum distance in meters to be considered significant
 * @returns True if positions are significantly different
 */
export const isSignificantChange = (
  pos1: { latitude: number; longitude: number },
  pos2: { latitude: number; longitude: number },
  minDistance: number
): boolean => {
  if (!pos2) return true;
  const distance = calculateDistance(
    pos1.latitude,
    pos1.longitude,
    pos2.latitude,
    pos2.longitude
  );
  return distance >= minDistance;
};

/**
 * Validates if the given coordinates are valid
 * @param latitude - Latitude to validate
 * @param longitude - Longitude to validate
 * @returns True if coordinates are valid
 */
export const isValidCoordinate = (
  latitude: number,
  longitude: number
): boolean => {
  return (
    typeof latitude === 'number' &&
    !isNaN(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === 'number' &&
    !isNaN(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Formats a position into a string key for caching or comparison
 * @param latitude 
 * @param longitude 
 * @returns A string key
 */
export const getPositionKey = (latitude: number, longitude: number): string => {
  // Round to 6 decimal places (~11cm precision)
  return `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
};

/**
 * Throttles a function to be called at most once per specified interval
 * @param func - Function to throttle
 * @param limit - Time in milliseconds
 * @returns Throttled function
 */
export const throttle = <F extends (...args: any[]) => any>(
  func: F,
  limit: number
): ((...args: Parameters<F>) => void) => {
  let inThrottle = false;
  return function (this: any, ...args: Parameters<F>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Debounces a function to be called after a specified delay
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  delay: number
): ((...args: Parameters<F>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: Parameters<F>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};
