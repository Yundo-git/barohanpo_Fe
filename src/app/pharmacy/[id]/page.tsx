"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone?: string;
  lat?: number;
  lng?: number;
}

export default function PharmacyDetail() {
  const { p_id } = useParams();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPharmacy = async () => {
      if (!p_id) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacy/${p_id}`
        );
        if (!response.ok) {
          throw new Error("약국 정보를 불러오는데 실패했습니다.");
        }
        const data = await response.json();
        setPharmacy(data);
      } catch (err) {
        console.error("Error fetching pharmacy:", err);
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacy();
  }, [p_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !pharmacy) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-red-500">
            {error || "약국 정보를 불러오는 데 실패했습니다."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{pharmacy.name}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h2 className="font-semibold">주소</h2>
          <p className="text-gray-700">{pharmacy.address}</p>
        </div>
        {pharmacy.phone && (
          <div className="mb-4">
            <h2 className="font-semibold">전화번호</h2>
            <p className="text-blue-600">{pharmacy.phone}</p>
          </div>
        )}
        {pharmacy.lat && pharmacy.lng && (
          <div className="h-64 bg-gray-200 rounded-lg">
            {/* Map will be added here */}
            <div className="flex items-center justify-center h-full text-gray-500">
              지도 영역
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
