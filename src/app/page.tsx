'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppSelector } from '@/store/store';
import { shallowEqual } from 'react-redux';
import dynamic from 'next/dynamic';

// Dynamically import components to ensure they're only loaded on the client side
const SplashScreen = dynamic(() => import('@/components/SplashScreen'), { 
  ssr: false 
});

const Home = dynamic(() => import('@/components/Home'), { 
  ssr: false 
});

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const hasDataLoaded = useRef(false);
  
  // Get the current state once when component mounts
  const { hasData } = useAppSelector((state) => {
    const hasReviews = state.review.reviews?.length > 0;
    const hasPharmacies = state.pharmacy.pharmacies?.length > 0;
    return {
      hasData: hasReviews && hasPharmacies,
    };
  }, shallowEqual);
  
  // Handle splash screen completion
  const handleSplashComplete = useCallback(() => {
    if (hasDataLoaded.current) return;
    hasDataLoaded.current = true;
    
    console.log('Starting splash screen transition...');
    setIsTransitioning(true);
    
    // Short delay for smooth transition
    setTimeout(() => {
      console.log('Hiding splash screen');
      setShowSplash(false);
      setIsTransitioning(false);
    }, 300);
  }, []);
  
  // Auto-close splash screen if data is already loaded
  useEffect(() => {
    if (hasData && showSplash) {
      console.log('Data already loaded, completing splash');
      handleSplashComplete();
    }
  }, [hasData, showSplash, handleSplashComplete]);

  return (
    <main className="min-h-screen relative">
      {/* Splash Screen */}
      <div 
        className={`fixed inset-0 z-50 transition-opacity duration-300 bg-white ${
          showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <SplashScreen onLoaded={handleSplashComplete} />
      </div>
      
      {/* Main Content */}
      <div 
        className={`transition-opacity duration-300 ${
          !showSplash && !isTransitioning ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
        }`}
      >
        <Home />
      </div>
    </main>
  );
}

// Add display name for debugging
HomePage.displayName = 'HomePage';
