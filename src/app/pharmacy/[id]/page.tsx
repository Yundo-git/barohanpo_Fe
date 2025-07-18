"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Pharmacy } from "@/types/pharmacy";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

// interface PharmacyResponse {
//   data: Pharmacy;
// }

export default function PharmacyDetail() {
  const params = useParams();
  const pharmacyId = Number(params.id); // 여기서 id를 가져옴
  console.log(typeof pharmacyId);
  // const [pharmacy, setPharmacy] = useState<PharmacyResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "reviews">("info");
  const pharmacies = useSelector(
    (state: RootState) => state.pharmacy.pharmacies
  );

  console.log(pharmacies);
  const pharmacy = pharmacies.find(
    (pharmacy: Pharmacy) => Number(pharmacy.p_id) === pharmacyId
  );

  console.log(pharmacy);

  // useEffect(() => {
  //   const fetchPharmacy = async () => {
  //     if (!pharmacyId) return;
  //     try {
  //       const response = await fetch(
  //         `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacy/${pharmacyId}`
  //       );

  //       if (!response.ok) {
  //         throw new Error("약국 정보를 불러오는데 실패했습니다.");
  //       }
  //       const data = await response.json();
  //       setPharmacy(data);
  //       console.log(data);
  //     } catch (err) {
  //       console.error("Error fetching pharmacy:", err);
  //     }
  //   };
  //   fetchPharmacy();
  // }, [pharmacyId]);

  return (
    <div className="flex flex-col m-4 overflow-y-auto">
      <div className="flex justify-center items-center">
        <div className="w-[90vw] h-[50vh] bg-gray-200 rounded-lg flex justify-center items-center">
          이미지영역
        </div>
      </div>
      {pharmacy && (
        <div>
          <h1 className="text-2xl font-bold mt-4">{pharmacy.name}</h1>
          <p>{pharmacy.address}</p>
          <p>영업시간 영역</p>
          <p>{pharmacy.user?.number}</p>
        </div>
      )}

      {/* 탭 메뉴 */}
      <div className="flex border-b mt-4 w-full">
        <button
          onClick={() => setActiveTab("info")}
          className={`py-2 px-4 w-[50vw] font-medium ${
            activeTab === "info"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          약국 정보
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`py-2 px-4 w-[50vw] font-medium ${
            activeTab === "reviews"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          후기
        </button>
      </div>

      {/* 탭 내용 */}
      <div className="mt-4 overflow-y-auto h-[calc(100vh-3.5rem)]">
        {activeTab === "info" ? (
          <div>
            <h3 className="text-lg  font-semibold mb-2">약국 정보</h3>
            <p>약국 소개 내용이 들어갑니다.</p>
            {/* 여기에 추가적인 약국 정보를 표시하세요 */}
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold mb-2">후기</h3>
            <p>후기 내용이 표시됩니다.</p>
            {/* 여기에 후기 목록을 표시하세요 */}
          </div>
        )}
      </div>
    </div>
  );
}
