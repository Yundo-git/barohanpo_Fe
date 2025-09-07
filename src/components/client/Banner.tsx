"use client";

import { useRouter } from "next/navigation";
import BannerCarousel from "./BannerCarousel";

export default function Banner() {
  const router = useRouter();

  return (
    <div className="flex flex-col m-4 relative">
      <BannerCarousel />
    </div>
  );
}
