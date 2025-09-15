// src/components/FavoriteButton.tsx

"use client";

import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useToggleFavorite } from "@/hooks/useToggleFavorite";

interface FavoriteButtonProps {
  userId: number;
  pharmacyId: number;
  isFavorite: boolean; // 찜 상태를 prop로
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ userId, pharmacyId, isFavorite }) => {
  const { mutate, isPending } = useToggleFavorite();

  const handleToggleFavorite = () => {
    if (isPending) return;
    mutate({ userId, pharmacyId });
  };

  const Icon = isFavorite ? HeartSolid : HeartOutline;
  const iconColor = isFavorite ? "text-red-500" : "text-gray-400";

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isPending}
      className={`p-2 rounded-full transition-colors ${iconColor}`}
      aria-label={isFavorite ? "찜 취소" : "찜하기"}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
};

export default FavoriteButton;