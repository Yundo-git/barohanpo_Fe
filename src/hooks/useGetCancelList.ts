import { useCallback, useState } from "react";

export interface CancelItem {
  p_id: number;
  book_date: string;
  book_id: number;
  book_time: string;
  // Add other properties as needed
}

interface CancelListResponse {
  data?: CancelItem[];
  message?: string;
  [key: string]: unknown;
}

const useGetCancelList = (userId?: number) => {
  const [, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getCancelList = useCallback(async (): Promise<CancelItem[]> => {
    if (!userId) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservation/${userId}/books/cancel/list`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch cancel list: ${response.status}`);
      }

      const result: CancelListResponse = await response.json();

      // Handle different response formats
      if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.data)) {
        return result.data;
      }
      
      return [];
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch cancel list');
      setError(err);
      console.error('Error fetching cancel list:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return { 
    getCancelList, 
    refresh, 
    isLoading, 
    error 
  };
};

export default useGetCancelList;