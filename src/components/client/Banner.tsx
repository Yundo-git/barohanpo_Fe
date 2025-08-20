"use client";

import { useRouter } from "next/navigation";

export default function Banner() {
  const router = useRouter();
  return (
    <div className="flex flex-col m-4 relative">
      <div className="flex flex-col items-center justify-center h-[40vh] rounded-lg w-auto bg-gray-200 relative">
        <h1>배너영역</h1>
        <div className="absolute bottom-4 left-4 right-4">
          <button
            className="w-full bg-white hover:bg-gray-50 transition-colors px-4 py-3 rounded-md border border-gray-300 shadow-sm text-center"
            onClick={() => {
              router.push("/map");
            }}
          >
            방문예약 하러가기
          </button>
        </div>
      </div>
    </div>
  );
}
