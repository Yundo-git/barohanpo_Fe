"use client";

import { usePathname, useRouter } from 'next/navigation';
import BackButton from './BackButton';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const showBackButton = !['/', '/map', '/mypage'].includes(pathname);

  return (
    <header className="flex items-center px-4 py-2 border-b">
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
