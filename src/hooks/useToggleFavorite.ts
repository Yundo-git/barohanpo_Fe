// src/hooks/useToggleFavorite.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// 1. 백엔드 API 응답 타입을 정의합니다.
interface ToggleFavoriteResponse {
  success: boolean;
  message: string;
  action: 'added' | 'removed'; // 'added' 또는 'removed'만 허용
}

const toggleFavorite = async (userId: number, pharmacyId: number): Promise<ToggleFavoriteResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/favorites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId, pharmacy_id: pharmacyId }),
  });

  if (!response.ok) {
    throw new Error('찜 상태 변경 실패');
  }

  // Promise<ToggleFavoriteResponse>로 타입 캐스팅
  return response.json();
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, pharmacyId }: { userId: number; pharmacyId: number }) =>
      toggleFavorite(userId, pharmacyId),
      
    // 2. onSuccess의 data 타입을 명시합니다.
    onSuccess: (data: ToggleFavoriteResponse) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-detail'] });
      
      const message = data.action === 'added' ? '찜 목록에 추가되었습니다.' : '찜 목록에서 제거되었습니다.';
      toast.success(message);
    },
    
    // 3. onError의 error 타입을 명시합니다.
    onError: (error: Error) => {
      toast.error(error.message || '찜 상태 변경 중 오류가 발생했습니다.');
    },
  });
};