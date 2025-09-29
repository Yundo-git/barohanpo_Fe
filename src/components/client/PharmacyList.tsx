// PharmacyList.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePharmacies } from "@/hooks/usePharmacies";
import { useLocationPermission } from "@/hooks/useLocationPermission";
import { Geolocation } from "@capacitor/geolocation";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import type { PharmacyWithUser } from "@/types/pharmacy";
import Image from "next/image";

interface PharmacyData {
  id: string;
  name: string;
  address: string;
  tel?: string;
  distance?: number;
  imageUrl?: string;
}

interface PharmacyListProps {
  searchParams?: {
    date?: string;
    time?: string;
  };
  onLocationLoaded?: () => void;
}

// Permission Modal Component
const PermissionModal = ({ 
  onConfirm, 
  onClose 
}: { 
  onConfirm: () => void; 
  onClose: () => void 
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
      <h3 className="text-lg font-bold mb-4">위치 권한 필요</h3>
      <p className="mb-6">
        약국 검색을 위해 위치 정보 접근 권한이 필요합니다. 
        설정에서 위치 권한을 허용해주세요.
      </p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
        >
          닫기
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          권한 허용
        </button>
      </div>
    </div>
  </div>
);

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Error Message Component
const ErrorMessage = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="p-4 text-center">
    <p className="text-red-500 mb-4">{message}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      다시 시도
    </button>
  </div>
);

// Empty State Component
const EmptyState = () => (
  <div className="text-center p-6">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <span className="text-2xl">🏥</span>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-1">주변에 약국이 없어요</h3>
    <p className="text-gray-500 text-sm">
      현재 위치에서 가까운 약국을 찾을 수 없습니다.
      다른 위치에서 시도해보시거나, 검색 범위를 넓혀보세요.
    </p>
  </div>
);

// Extract city and district from address
const extractCityDistrict = (address?: string): string => {
  if (!address) return "주소 정보 없음";
  const parts = address.split(" ");
  return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : address;
};

export default function PharmacyList({ onLocationLoaded }: PharmacyListProps) {
  const router = useRouter();
  const { pharmacies, isLoading, error, findNearbyPharmacies } = usePharmacies();
  const { requestLocationPermission, permissionStatus, checkPermission } = useLocationPermission();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const loadPharmacies = useCallback(async () => {
    console.log('[PharmacyList] 약국 로드 시작');
    setLocationError(null);
    setIsRefreshing(true);
    setIsLocating(true);
    
    try {
      // 1. Check location permission
      console.log('[PharmacyList] 위치 권한 확인 중...');
      const hasPermission = await checkPermission();
      
      if (!hasPermission) {
        console.log('[PharmacyList] 위치 권한이 없어 요청 대기 중...');
        // 권한이 없으면 모달 표시
        setShowPermissionModal(true);
        // 스플래시 화면은 아직 유지
        return;
      }
      
      // 권한이 있는 경우에만 스플래시 화면 닫기
      if (onLocationLoaded) {
        onLocationLoaded();
      }

      // 2. Get current position
      console.log('[PharmacyList] 현재 위치 정보 가져오는 중...');
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      
      console.log('[PharmacyList] 위치 정보 수신 성공:', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toISOString()
      });

      // 3. Find nearby pharmacies
      console.log('[PharmacyList] 근처 약국 검색 중...', {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      
      await findNearbyPharmacies(
        position.coords.latitude,
        position.coords.longitude
      );
      
      // 위치 로드 완료 시 콜백 호출
      if (onLocationLoaded) {
        onLocationLoaded();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[PharmacyList] 위치 기반 약국 검색 오류:', {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      });
      setLocationError('위치 정보를 가져오는 중 오류가 발생했습니다.');
    } finally {
      console.log('[PharmacyList] 로드 완료');
      setIsRefreshing(false);
      setIsLocating(false);
    }
  }, [checkPermission, findNearbyPharmacies, onLocationLoaded]);

  // 권한 모달에서 확인 버튼 클릭 시
  const handlePermissionConfirm = useCallback(async () => {
    const granted = await requestLocationPermission();
    setShowPermissionModal(false);
    
    if (granted) {
      // 권한이 허용된 경우에만 약국 로드
      await loadPharmacies();
      // 스플래시 화면 닫기
      if (onLocationLoaded) {
        onLocationLoaded();
      }
    } else if (Capacitor?.isNativePlatform?.()) {
      // 네이티브 앱에서 권한 거부 시 앱 종료
      App.exitApp();
    } else {
      // 웹에서 권한 거부 시 에러 메시지 표시 및 스플래시 화면 닫기
      setLocationError('위치 권한이 필요합니다. 브라우저 설정에서 위치 권한을 허용해주세요.');
      if (onLocationLoaded) {
        onLocationLoaded();
      }
    }
  }, [loadPharmacies, requestLocationPermission]);

  // 권한 모달에서 닫기 버튼 클릭 시
  const handlePermissionClose = useCallback(() => {
    setShowPermissionModal(false);
    if (Capacitor?.isNativePlatform?.()) {
      // 네이티브 앱에서는 권한 없이 진행 불가
      App.exitApp();
    }
  }, []);

  // 초기 로드 및 권한 상태 변경 감지
  useEffect(() => {
    // 권한 상태가 변경될 때마다 체크
    if (permissionStatus === 'granted') {
      loadPharmacies();
    } else if (permissionStatus === 'denied' || permissionStatus === 'prompt-with-rationale') {
      setShowPermissionModal(true);
      // 권한이 거부되었을 때만 스플래시 화면 닫기
      if (permissionStatus === 'denied' && onLocationLoaded) {
        onLocationLoaded();
      }
    }
  }, [loadPharmacies]);

  // 권한 상태가 변경될 때마다 확인
  useEffect(() => {
    if (permissionStatus === 'granted') {
      loadPharmacies();
    }
  }, [permissionStatus, loadPharmacies]);

  // Helper function to ensure consistent pharmacy data structure
  const getPharmacyData = (pharmacy: PharmacyWithUser): PharmacyData => {
    // Safely access properties with type assertions
    const id = (pharmacy as any).p_id || (pharmacy as any).hpid || `pharmacy-${Math.random().toString(36).substr(2, 9)}`;
    const name = (pharmacy as any).name || (pharmacy as any).yadmNm || '이름 없는 약국';
    const address = (pharmacy as any).addr || (pharmacy as any).address || '';
    const tel = (pharmacy as any).tel || '';
    const distance = typeof (pharmacy as any).distance === 'number' ? (pharmacy as any).distance : undefined;
    const imageUrl = (pharmacy as any).imageUrl || '';

    return {
      id,
      name,
      address,
      tel: tel || undefined,
      distance,
      imageUrl: imageUrl || undefined
    };
  };

  // Handle refresh
  const handleRefresh = () => {
    loadPharmacies();
  };

  // 로딩 중일 때
  if ((isLoading || isRefreshing || isLocating) && pharmacies.length === 0) {
    return <LoadingSpinner />;
  }

  // Error state
  if (error || locationError) {
    const errorMessage = error || locationError;
    return <ErrorMessage 
      message={`약국 정보를 불러오는데 실패했습니다. (${errorMessage})`} 
      onRetry={loadPharmacies} 
    />;
  }

  // 약국이 없을 때
  if (pharmacies.length === 0) {
    return <EmptyState />;
  }

  // 권한 요청 모달
  if (showPermissionModal) {
    return (
      <PermissionModal 
        onConfirm={handlePermissionConfirm} 
        onClose={handlePermissionClose} 
      />
    );
  }

  return (
    <div className="flex-1 px-4 py-6">
      <div className="flex justify-between items-center mb-4 px-1">
        <h2 className="text-xl font-bold text-gray-900">내 주변 약국</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isLocating}
          className="text-sm text-main hover:text-main/80 flex items-center gap-1"
        >
          <svg 
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          {isRefreshing ? '새로고침 중...' : '새로고침'}
        </button>
      </div>
      
      <div className="space-y-4">
        {pharmacies.map((pharmacy) => {
          const pharmData = getPharmacyData(pharmacy as PharmacyWithUser);
          const { address, name, id, tel, distance } = pharmData;
          
          return (
            <div 
              key={id}
              className="flex cursor-pointer w-full"
              onClick={() => router.push(`/pharmacy/${id}`)}
            >
              <div className="w-[30%] h-[8.25rem] bg-main rounded-md flex flex-col justify-center items-center overflow-hidden">
                <Image
                  src="/icon/logo2.svg"
                  alt="약국 이미지"
                  width={32}
                  height={32}
                  className="mb-2 drop-shadow-md"
                />
                <p className="text-xs text-white text-center leading-tight drop-shadow-md font-medium">
                  이미지준비중
                </p>
              </div>
              <div className="w-[70%] min-w-0 pl-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{name}</h3>
                <p className="text-sm text-gray-600 mt-1">{extractCityDistrict(address)}</p>
                
                <div className="mt-2 flex flex-wrap gap-2">
                  {tel && (
                    <a 
                      href={`tel:${tel}`}
                      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {tel}
                    </a>
                  )}
                  
                  {distance !== undefined && (
                    <span className="inline-flex items-center text-xs text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {distance < 1 
                        ? `${Math.round(distance * 1000)}m` 
                        : `${distance.toFixed(1)}km`} 거리
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {isLoading && (
        <div className="mt-4">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
}