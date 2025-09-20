"use client";

import { useEffect } from "react"; // useEffect 임포트
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import BackButton from "./BackButton";
import Image from "next/image";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useToggleFavorite } from "@/hooks/useToggleFavorite";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { fetchAllFavorites } from "@/utils/favorites";
import { setFavoriteIds } from "@/store/favoritesSlice";
import { Pharmacy } from "@/types/pharmacy"; // 실제 파일 경로로 수정

export default function Header() {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();

  const pathSegments = pathname.split("/");
  const p_id: number | null =
    pathSegments.length === 3 ? Number(pathSegments[2]) : null;
  const isPharmacyPage = pathname.startsWith("/pharmacy/") && !!p_id;

  const userId = useSelector((state: RootState) => state.user.user?.user_id);
  const favoriteIds = useSelector(
    (state: RootState) => state.favorites.favoriteIds
  );

  const { data: favorites } = useQuery<Pharmacy[]>({
    queryKey: ["favorites", userId],
    queryFn: () => {
      if (userId === null || userId === undefined) {
        return Promise.resolve([]);
      }
      return fetchAllFavorites(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // useEffect를 사용하여 favorites 데이터가 변경될 때 Redux를 업데이트
  useEffect(() => {
    if (favorites) {
      const ids = favorites.map((fav) => Number(fav.p_id));
      dispatch(setFavoriteIds(ids));
    }
  }, [favorites, dispatch]);

  const isFavorite = !!p_id && favoriteIds.includes(p_id);
  const { mutate: toggleFavorite, isPending: isToggling } = useToggleFavorite();

  const showBackButton = ![
    "/",
    "/map",
    "/mypage",
    "/mybook",
    "/pharmacy/",
  ].includes(pathname);

  const getPageTitle = () => {
    if (pathname === "/") return "바로한포";
    if (pathname === "/map") return "약국";
    if (pathname.startsWith("/mybook")) return "예약내역";
    if (pathname === "/mypage") return "마이페이지";
    return "바로한포";
  };

  if (isPharmacyPage) {
    const Icon = isFavorite ? HeartSolid : HeartOutline;
    const iconColor = isFavorite ? "text-red-500" : "text-gray-400";

    return (
      <header className="flex fixed top-0 left-0 right-0 z-50 h-14 border-b items-center px-5 py-4 bg-white/95 w-full backdrop-blur-lg shadow-[0_-1px_4px_rgba(0,0,0,0.08)] md:hidden">
        <div className="absolute left-4">
          <BackButton />
        </div>
        <div className="absolute right-4">
          <button
            onClick={() => {
              if (userId !== null && p_id !== null) {
                toggleFavorite({ userId: userId!, pharmacyId: p_id });
              }
            }}
            disabled={isToggling}
            className={`p-2 -m-2 ${iconColor}`}
            aria-label={isFavorite ? "찜 취소" : "찜하기"}
          >
            <Icon className="h-6 w-6" />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="flex fixed top-0 left-0 right-0 z-50 h-14 border-b items-center px-5 py-4 bg-white/95 w-full backdrop-blur-lg shadow-[0_-1px_4px_rgba(0,0,0,0.08)] md:hidden">
      {showBackButton ? (
        <div className="absolute left-4">
          <BackButton />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Image
            src="/favicon.svg"
            priority
            alt="로고"
            width={32}
            height={32}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <h1 className="H3_SB_20 text-mainText">{getPageTitle()}</h1>
        </div>
      )}
    </header>
  );
}
