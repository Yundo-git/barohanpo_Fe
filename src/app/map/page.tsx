"use client";

import { useEffect, useState, useMemo } from "react";
import PharmacyApi from "../api/Pharmacy/PharmacyApi";
import KakaoMap from "../../components/KakaoMap";

export default function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    PharmacyApi()
      .then((data) => {
        if (Array.isArray(data)) {
          setPharmacies(data);
        } else if (data) {
          setPharmacies([data]);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  // 상태가 업데이트된 뒤 확인용 로그 > 나중에 로딩 부분으로 바꾸기
  useEffect(() => {
    if (pharmacies.length) {
      console.log("pharmacies state →", pharmacies);
    }
  }, [pharmacies]);

  return (
    <main className="w-full h-full">
      {/* Kakao Map Area */}
      <KakaoMap />
      {/* <p className="text-2xl font-bold mb-4">약국 목록</p> */}
      {/* {error && <p className="text-red-500">{error}</p>}
      {!error && (
        <div className="mb-8 list-disc list-inside space-y-1">
          {(pharmacies[0]?.data ?? []).map((p: any, idx: number) => (
            <p key={p.id ?? idx}>{p.name}</p>
          ))}
        </div>
      )} */}
    </main>
  );
}
