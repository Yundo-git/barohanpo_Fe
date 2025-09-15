// src/utils/favorites.ts

import { Pharmacy } from '@/types/pharmacy'; 

/**
 * 특정 사용자의 찜 목록 전체를 가져오는 함수
 * @param {number} userId - 사용자 ID
 * @returns {Promise<Pharmacy[]>} - 찜한 약국 목록 배열
 */
export const fetchAllFavorites = async (userId: number): Promise<Pharmacy[]> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/favorites?userId=${userId}`);
    if (!response.ok) {
        throw new Error('찜 목록을 불러오지 못했습니다.');
    }
    const data = await response.json();
    return data.data;
};