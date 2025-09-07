"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  HomeIcon,
  BuildingStorefrontIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

interface NavItem {
  href: string;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export default function MobileNavBar() {
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.user.user);
  const isLoggedIn = Boolean(user);

  const navItems = (isLoggedIn: boolean): NavItem[] => [
    { href: "/", label: "홈", Icon: HomeIcon },
    { href: "/map", label: "약국", Icon: BuildingStorefrontIcon },
    {
      href: isLoggedIn ? "/mybook/" + user?.user_id : "/auth?from=reservation",
      label: "예약",
      Icon: UserIcon,
    },
    { 
      href: isLoggedIn ? "/mypage" : "/auth?from=my", 
      label: "마이", 
      Icon: UserIcon 
    },
  ];
  return (
    <nav
      style={{ bottom: 0 }}
      className="fixed z-50 h-14 bg-white/95 w-full backdrop-blur-lg shadow-[0_-1px_4px_rgba(0,0,0,0.08)] md:hidden"
    >
      <ul className="flex h-full divide-x divide-gray-100">
        {navItems(isLoggedIn).map(({ href, label, Icon }) => {
          const active = pathname === href;
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
                <Icon className="h-6 w-6" />
                <span className="text-xs">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}