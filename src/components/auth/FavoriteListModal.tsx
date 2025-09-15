"use client";

import { useQuery } from '@tanstack/react-query';
import { XMarkIcon } from "@heroicons/react/24/solid";
import type { Pharmacy } from "@/types/pharmacy";

// 찜 목록 데이터를 가져오는 함수
const fetchFavorites = async (userId: number) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/favorites?userId=${userId}`);
    if (!response.ok) {
        throw new Error('찜 목록을 불러오지 못했습니다.');
    }
    const data = await response.json();
    console.log('찜목록 data',data);
    return data.data; // 서버 응답의 data 필드
};

export default function FavoriteListModal({
    isOpen,
    onClose,
    userId,
}: {
    isOpen: boolean;
    onClose: () => void;
    userId: number;
}) {

    const { data: favorites, isLoading, error } = useQuery({
        queryKey: ["favorites", userId],
        queryFn: () => fetchFavorites(userId),
        enabled: isOpen && !!userId, // 모달이 열려있고 userId가 있을 때만 쿼리 실행
    });

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
            </button>
            <div className="p-4 pt-16">
                <h1 className="text-2xl font-bold mb-4">찜 목록</h1>

                {isLoading && <p>찜 목록을 불러오는 중입니다...</p>}
                {error && <p className="text-red-500">오류가 발생했습니다: {error.message}</p>}
                {!isLoading && favorites && favorites.length === 0 && <p className="text-gray-500">찜한 약국이 없습니다.</p>}

                {favorites && (
                    <ul className="space-y-4">
                        {favorites.map((pharmacy: Pharmacy) => (
                            <li key={pharmacy.p_id} className="p-4 border rounded-lg shadow-sm">
                                <h2 className="font-bold text-lg">{pharmacy.name}</h2>
                                <p className="text-sm text-gray-600">{pharmacy.address}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}