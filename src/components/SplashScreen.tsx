'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { fetchFiveStarReviews } from '@/store/reviewSlice';
import { fetchNearbyPharmacies } from '@/store/pharmacySlice';
import { RootState, store } from '@/store/store';

export default function SplashScreen({ onLoaded }: { onLoaded: () => void }) {
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const loadData = async () => {
      if (hasInitialized.current || !isMounted) return;
      hasInitialized.current = true;
      
      try {
        const currentState = store.getState();
        const hasReviews = currentState.review.reviews?.length > 0;
        const hasPharmacies = currentState.pharmacy.pharmacies?.length > 0;
        
        console.log('Initial data check - Reviews:', hasReviews, 'Pharmacies:', hasPharmacies);
        
        if (hasReviews && hasPharmacies) {
          console.log('✅ All data already loaded, transitioning');
          onLoaded();
          return;
        }
        
        const fetchPromises = [];
        if (!hasReviews) {
          console.log('🔄 Fetching reviews...');
          fetchPromises.push(dispatch(fetchFiveStarReviews()).unwrap());
        }

        console.log('Starting data loading...');
        setIsLoading(true);
        setError(null);
        
        console.log('Initial data status - Reviews:', hasReviews, 'Pharmacies:', hasPharmacies);

        console.log('Initial data status - Reviews:', hasReviews, 'Pharmacies:', hasPharmacies);

        // We'll fetch any missing data below

        // Get user's current location
        console.log('Requesting geolocation...');
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!isMounted) return;
              console.log('Got geolocation:', pos.coords);
              resolve(pos);
            },
            (err) => {
              if (!isMounted) return;
              console.error('Geolocation error:', err);
              // Default to Seoul coordinates if geolocation fails
              console.log('Using default coordinates (Seoul)');
              // Create a mock position that fully implements GeolocationPosition
              const mockCoords: GeolocationCoordinates = {
                latitude: 37.5665,
                longitude: 126.9780,
                accuracy: 1,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
                toJSON: () => ({
                  latitude: 37.5665,
                  longitude: 126.9780,
                  accuracy: 1,
                  altitude: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null,
                }),
              };

              // Create a mock position that fully implements GeolocationPosition
              const mockPosition: GeolocationPosition = {
                coords: mockCoords,
                timestamp: Date.now(),
                toJSON: () => ({
                  coords: {
                    latitude: mockCoords.latitude,
                    longitude: mockCoords.longitude,
                    altitude: mockCoords.altitude,
                    accuracy: mockCoords.accuracy,
                    altitudeAccuracy: mockCoords.altitudeAccuracy,
                    heading: mockCoords.heading,
                    speed: mockCoords.speed,
                  },
                  timestamp: Date.now(),
                }),
              };

              resolve(mockPosition);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
          );
        });
        
        // Only fetch pharmacies if we don't have them
        if (!hasPharmacies) {
          console.log('Fetching pharmacies...');
          fetchPromises.push(
            dispatch(fetchNearbyPharmacies({ 
              lat: position.coords.latitude, 
              lng: position.coords.longitude 
            })).unwrap()
          );
        }

        // Wait for all necessary fetches to complete
        if (fetchPromises.length > 0) {
          console.log('Waiting for data to load...');
          await Promise.all(fetchPromises);
          
          // Double check all data is loaded before transitioning
          const updatedState = store.getState();
          const allDataLoaded = 
            updatedState.review.reviews?.length > 0 && 
            updatedState.pharmacy.pharmacies?.length > 0;
            
          if (allDataLoaded) {
            console.log('All data verified and loaded, transitioning');
            onLoaded();
          } else {
            console.log('Data loading incomplete, not transitioning');
          }
        } else {
          // If no fetches were needed, check if we have all data
          const currentState = store.getState();
          const hasAllData = 
            currentState.review.reviews?.length > 0 && 
            currentState.pharmacy.pharmacies?.length > 0;
            
          if (hasAllData) {
            console.log('All data already available, transitioning');
            onLoaded();
          } else {
            console.log('Incomplete data, not transitioning');
          }
        }
      } catch (err) {
        console.error('Error in loadData:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        console.log('Finished loading, setting isLoading to false');
        setIsLoading(false);
      }
    };

    loadData();
    
    // Cleanup function
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [dispatch, onLoaded]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white p-4 z-50">
      <div className="text-center space-y-6">
        <div className="animate-pulse">
          <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800">바로한포</h1>
        <p className="text-gray-600">주변 약국을 찾고 있습니다...</p>
        
        {isLoading && (
          <div className="pt-4">
            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md">
            {error}
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm transition-colors"
            >
              다시 시도하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
