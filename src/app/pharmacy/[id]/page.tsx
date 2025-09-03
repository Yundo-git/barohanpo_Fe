"use client";
import { useParams } from "next/navigation";
import Tabs from "@/components/Tab";
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
    <div className="flex flex-col m-4 overflow-y-auto h-full">
      <div className="flex flex-col flex-shrink-0">
        <div className="flex justify-center items-center">
          <div className="w-[90vw] h-[50vh] bg-gray-200 rounded-lg flex justify-center items-center">
            이미지영역
          </div>
        </div>
        {pharmacy && (
          <div className="mt-4">
            <h1 className="text-2xl font-bold">{pharmacy.name}</h1>
            <p className="text-gray-600">{pharmacy.address}</p>
            <p className="text-gray-600">영업시간 영역</p>
            <p className="text-gray-600">전화 : {pharmacy.user?.number}</p>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <Tabs
          items={[
            {
              key: "info",
              label: "약국 정보",
              component: (
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">약국 정보</h3>
                  <p>약국 소개 내용이 들어갑니다.</p>
                  {/* 여기에 추가적인 약국 정보를 표시하세요 */}
                </div>
              ),
            },
            {
              key: "reviews",
              label: `후기${pharmacy?.review_count ? ` (${pharmacy.review_count})` : ''}`,
              component: (
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">후기</h3>
                  <p>후기 내용이 표시됩니다.</p>
                  {/* 여기에 후기 목록을 표시하세요 */}
                </div>
              ),
              badge: pharmacy?.review_count ? Number(pharmacy.review_count) : 0,
            },
          ]}
          defaultActiveKey="info"
          className="h-full"
          onChange={(key) => {
            console.log(`Tab changed to: ${key}`);
          }}
        />
      </div>
      
      <div className="flex-shrink-0 mt-4">
        <button
          onClick={() => alert("기능개발중입니다.")}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
        >
          예약하기
        </button>
      </div>
    </div>
  );
}
