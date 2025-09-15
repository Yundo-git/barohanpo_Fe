// src/hooks/useToggleFavorite.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { addFavorite, removeFavorite } from "@/store/favoritesSlice"; // Redux 액션 임포트

interface ToggleFavoriteResponse {
  success: boolean;
  message: string;
  action: 'added' | 'removed';
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

  return response.json();
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ userId, pharmacyId }: { userId: number; pharmacyId: number }) =>
      toggleFavorite(userId, pharmacyId),
      
    onSuccess: (data, variables) => {
      if (data.action === 'added') {
        dispatch(addFavorite(variables.pharmacyId));
        toast.success('찜 목록에 추가되었습니다.');
      } else {
        dispatch(removeFavorite(variables.pharmacyId));
        toast.success('찜 목록에서 제거되었습니다.');
      }

      // 찜 목록 캐시를 무효화 백엔드에서 다시불러옴
      queryClient.invalidateQueries({ queryKey: ['favorites', variables.userId] });
    },
    
    onError: (error: Error) => {
      toast.error(error.message || '찜 상태 변경 중 오류가 발생했습니다.');
    },
  });
};