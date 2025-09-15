// src/api/favorites.ts

// API 응답 타입 정의
interface FavoriteStatusResponse {
    success: boolean;
    isFavorite?: boolean; // isFavorite 속성이 없을 수도 있으므로 ? 추가
  }
  
  export const getIsFavorite = async (userId: number, pharmacyId: number): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/favorites/status?userId=${userId}&pharmacyId=${pharmacyId}`);
      
      // HTTP 상태 코드가 200번대가 아니면 오류 처리
      if (!response.ok) {
        throw new Error("찜 상태 조회 API 호출 실패");
      }
  
      const data: FavoriteStatusResponse = await response.json();
  
      // 서버 응답에 isFavorite가 없거나 false인 경우를 처리
      return data.success && (data.isFavorite ?? false);
    } catch (error) {
      console.error("찜 상태 조회 중 오류 발생:", error);
      // 오류 발생 시 false 반환
      return false;
    }
  };