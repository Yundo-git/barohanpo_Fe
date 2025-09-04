"use client";

import { Suspense, useEffect } from "react";
import PharmacyList from "@/components/client/PharmacyList";
import Banner from "@/components/client/Banner";
import AllReview from "@/components/client/AllReview";
import { useAppSelector } from "@/store/store";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const pharmacies = useAppSelector((s) => s.pharmacy.pharmacies);
  const reviews = useAppSelector((s) => s.review.reviews);

  useEffect(() => {
    if (pharmacies.length === 0 || reviews.length === 0) {
      router.replace("/splash");
    }
  }, [pharmacies.length, reviews.length, router]);
  return (
    <div className="flex flex-col pb-14">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            로딩 중...
          </div>
        }
      >
        <Banner />
        <PharmacyList />
        <AllReview />
      </Suspense>
    </div>
  );
}
