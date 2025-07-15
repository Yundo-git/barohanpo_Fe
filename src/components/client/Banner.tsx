"use client";

import { useRouter } from "next/navigation";

export default function Banner() {
    const router = useRouter();
    return (
        <div className="flex flex-col m-4">
  <div className="flex top-14 items-center justify-center h-[40vh]  rounded-lg w-auto bg-gray-200">
    <h1>배너영역</h1>
  </div>
  <div className="flex justify-end mt-2">
    <button className="px-4" onClick={() => {router.push('/map')}}>
      방문예약 하러가기
    </button>
  </div>
</div>
    );
}