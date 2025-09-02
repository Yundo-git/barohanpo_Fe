import { Suspense } from "react";
import PharmacyList from "@/components/client/PharmacyList";
import Banner from "@/components/client/Banner";
import AllReview from "@/components/client/AllReview";

export default function Home() {
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
