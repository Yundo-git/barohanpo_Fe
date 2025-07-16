"use client";

import { usePathname } from "next/navigation";
import BackButton from "./BackButton";

export default function Header() {
  const pathname = usePathname();
  const showBackButton = !["/", "/map", "/mypage"].includes(pathname);

  return (
    <header className="flex fixed top-0 left-0 right-0 z-50 h-14 border-b items-center px-4 py-2 bg-white/95 w-full backdrop-blur-lg shadow-[0_-1px_4px_rgba(0,0,0,0.08)] md:hidden">
      {showBackButton ? (
        <>
          <div className="flex-1">
            <BackButton />
          </div>
          <h1 className="flex-1  font-bold">바로한포~</h1>
        </>
      ) : (
        <h1 className="flex-1  font-bold">바로한포~</h1>
      )}
    </header>
  );
}
