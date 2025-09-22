"use client";

import { useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface UseChangeNickReturn {
  usenickname: (nickname: string, accessToken: string) => Promise<{ nickname: string } | null>;
}

const useChangeNick = (): UseChangeNickReturn => {
  const userId = useSelector((state: RootState) => state.user.user?.user_id);

  const usenickname = useCallback(
    async (nickname: string, accessToken: string) => {
      if (!userId) return null;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/${userId}/nickname`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              nickname,
              user_id: userId,
            }),
          }
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Error updating nickname:", error);
        throw error;
      }
    },
    [userId]
  );

  return {
    usenickname,
  };
};

export default useChangeNick;
