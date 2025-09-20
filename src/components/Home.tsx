"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamically import components with no SSR
const DynamicBanner = dynamic(() => import("@/components/client/Banner"), {
  ssr: false,
});
const DynamicPharmacyList = dynamic(
  () => import("@/components/client/PharmacyList"),
  { ssr: false }
);
const DynamicAllReview = dynamic(
  () => import("@/components/client/AllReview"),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="flex flex-col pb-14 px-5 pt-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        }
      >
        <DynamicBanner />
        <DynamicPharmacyList />
        <DynamicAllReview />
      </Suspense>
    </div>
  );
}
