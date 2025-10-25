// LocationButton.tsx
import React, { useState } from 'react';

interface LocationButtonProps {
  onClick: () => Promise<void>; // 비동기 함수를 받을 수 있도록 수정
  className?: string;
}

const LocationButton: React.FC<LocationButtonProps> = ({ 
  onClick, 
  className = '' 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await onClick(); // 부모 컴포넌트의 onClick 핸들러 실행
    } catch (error) {
      console.error('위치 정보를 가져오는 중 오류 발생:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        fixed bottom-24 right-4 bg-white rounded-full p-3 shadow-lg z-10 
        hover:bg-gray-50 transition-colors
        ${isLoading ? 'opacity-70 cursor-wait' : ''}
        ${className}
      `}
      aria-label="현재 위치로 이동"
    >
      {isLoading ? (
        <div className="animate-spin h-6 w-6 border-2 border-main border-t-transparent rounded-full" />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-main"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      )}
    </button>
  );
};

export default LocationButton;