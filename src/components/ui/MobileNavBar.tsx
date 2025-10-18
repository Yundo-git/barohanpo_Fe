"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import Image from "next/image";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  activeIcon: string;
}

export default function MobileNavBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useSelector((state: RootState) => state.user.user);
  const isLoggedIn = Boolean(user);

  const navItems = (isLoggedIn: boolean): NavItem[] => [
    {
      href: "/",
      label: "홈",
      icon: "/icon/home.svg",
      activeIcon: "/icon/home_fill.svg",
    },
    {
      href: "/map",
      label: "약국",
      icon: "/icon/Location.svg",
      activeIcon: "/icon/Location_fill.svg",
    },
    {
      href: isLoggedIn ? "/mybook" : "/auth?from=reservation",
      label: "예약내역",
      icon: "/icon/calendar.svg",
      activeIcon: "/icon/calendar_fill.svg",
    },
    {
      href: isLoggedIn ? "/mypage" : "/auth?from=my",
      label: "마이",
      icon: "/icon/Person.svg",
      activeIcon: "/icon/Person_fill.svg",
    },
  ];

  return (
    <nav
      style={{ bottom: 0 }}
      className="fixed z-50 h-14 bg-white/95 w-full backdrop-blur-lg shadow-[0_-1px_4px_rgba(0,0,0,0.08)] md:hidden"
    >
      <ul className="flex h-full ">
        {navItems(isLoggedIn).map(({ href, label, icon, activeIcon }) => {
          const [path, query] = href.split("?");
          const navItemParams = new URLSearchParams(query || "");
          const navItemFrom = navItemParams.get("from");

          let active = false;

          // 1. 쿼리 파라미터가 있는 경로의 활성화 (예: /auth?from=...)
          if (navItemFrom) {
            const currentFrom = searchParams.get("from");
            if (pathname === path && currentFrom === navItemFrom) {
              active = true;
            }
          }
          // 2. 쿼리 파라미터가 없는 일반 경로의 활성화 (예: /, /map)
          else if (pathname === path) {
            active = true;
          }
          // 3. 동적 경로의 활성화 (예: /mybook/123)
          else if (path !== "/" && pathname.startsWith(path)) {
            active = true;
          }

          const iconPath = active ? activeIcon : icon;

          return (
            <li
              key={`${href}-${label}`}
              className="flex flex-1 flex-col items-center justify-center"
            >
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 text-xs ${
                  active ? "text-primary" : "text-gray-500"
                }`}
              >
                <div className="relative h-6 w-6">
                  <Image
                    src={iconPath}
                    alt={label}
                    width={24}
                    height={24}
                    priority
                  />
                </div>
                <span className="text-xs">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
