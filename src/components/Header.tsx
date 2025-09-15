"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import BackButton from "./BackButton";
import Image from "next/image";

import { useToggleFavorite } from "@/hooks/useToggleFavorite";
import { getIsFavorite } from "@/utils/favorites";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function Header() {
  const pathname = usePathname();
  
  const pathSegments = pathname.split("/");
  const p_id = pathSegments.length === 3 ? Number(pathSegments[2]) : null;
  const isPharmacyPage = pathname.startsWith("/pharmacy/") && !!p_id;

  const userId = useSelector((state: RootState) => state.user.user?.user_id);

  // Favorite 상태를 가져오는 쿼리
  const { data: isFavorite = false, isLoading: isFavoriteLoading } = useQuery({
    queryKey: ["pharmacy-favorites", userId, p_id],
    queryFn: () => {
      if (!userId || !p_id) return Promise.resolve(false);
      return getIsFavorite(userId, p_id);
    },
    enabled: isPharmacyPage && !!userId && !!p_id,
    initialData: false,
    staleTime: 5 * 60 * 1000, // 5분 동안은 캐시 유지
  });

  const { mutate: toggleFavorite, isPending: isToggling } = useToggleFavorite();

  const showBackButton = !["/", "/map", "/mypage", "/mybook", "/pharmacy/"].includes(pathname);

  const getPageTitle = () => {
    if (pathname === "/") return "바로한포";
    if (pathname === "/map") return "약국";
    if (pathname.startsWith("/mybook")) return "예약내역";
    if (pathname === "/mypage") return "마이페이지";
    return "바로한포";
  };
  
  if (isPharmacyPage) {
    // 찜 상태에 따라 다른 SVG 아이콘 경로를 지정합니다.
    const favoriteIconSrc = isFavorite ? "/icon/Favorite-filled.svg" : "/icon/Favorite.svg";
    
    return (
      <header className="flex fixed top-0 left-0 right-0 z-50 h-14 border-b items-center px-4 py-2 bg-white/95 w-full backdrop-blur-lg shadow-[0_-1px_4px_rgba(0,0,0,0.08)] md:hidden">
        <div className="absolute left-4">
          <BackButton />
        </div>
        <div className="absolute right-4">
          <button
            onClick={() => {
              if (!userId || !p_id) return;
              toggleFavorite({ userId, pharmacyId: p_id });
            }}
            disabled={isToggling || isFavoriteLoading}
            className="p-2 -m-2"
            aria-label={isFavorite ? "찜 취소" : "찜하기"}
          >
            {/* Image 컴포넌트로 SVG 아이콘을 렌더링합니다. */}
            <Image
              src={favoriteIconSrc}
              alt={isFavorite ? "찜 취소" : "찜하기"}
              width={24}
              height={24}
            />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="flex fixed top-0 left-0 right-0 z-50 h-14 border-b items-center px-4 py-2 bg-white/95 w-full backdrop-blur-lg shadow-[0_-1px_4px_rgba(0,0,0,0.08)] md:hidden">
      {showBackButton ? (
        <div className="absolute left-4">
          <BackButton />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Image src="/favicon.svg" alt="로고" width={32} height={32} />
          <h1 className="font-bold">{getPageTitle()}</h1>
        </div>
      )}
    </header>
  );
}