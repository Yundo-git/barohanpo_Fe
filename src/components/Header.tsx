"use client";

import { usePathname } from "next/navigation";
import BackButton from "./BackButton";

export default function Header() {
  const pathname = usePathname();
  const showBackButton = !["/", "/map", "/mypage", "/mybook"].includes(pathname);

  // 페이지별 제목 설정
  const getPageTitle = () => {
    if (pathname === "/") return "바로한포";
    if (pathname === "/map") return "약국";
    if (pathname.startsWith("/mybook")) return "예약내역";
    if (pathname === "/mypage") return "마이페이지";
    return "바로한포"; // 기본값
  };

  return (
    <header className="flex fixed top-0 left-0 right-0 z-50 h-14 border-b items-center px-4 py-2 bg-white/95 w-full backdrop-blur-lg shadow-[0_-1px_4px_rgba(0,0,0,0.08)] md:hidden">
      {showBackButton ? (
        <div className="absolute left-4">
          <BackButton />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="로고" className="w-8 h-8" />
          <h1 className="font-bold">{getPageTitle()}</h1>
        </div>
      )}
    </header>
  );
}
