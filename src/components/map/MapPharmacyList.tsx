import React from "react";
import Bookbtn from "../reservation/Bookbtn";
import { Pharmacy, PharmacyUser } from "../../types/pharmacy";
import Image from "next/image";

interface MapPharmacyListProps {
  pharmacies: Pharmacy[];
  selectedPharmacy: Pharmacy | null;
  sheetView: "list" | "detail" | "reserve" | "complete";
  onPharmacySelect: (pharmacy: Pharmacy) => void;
  onReserve: (pharmacy: Pharmacy, date: string) => void;
  children?: React.ReactNode;
}

const MapPharmacyList: React.FC<MapPharmacyListProps> = ({
  pharmacies,
  selectedPharmacy,
  sheetView,
  onReserve,
  children,
}) => {
  if (sheetView === "reserve" && selectedPharmacy) {
    return <div className="max-h-[75vh] px-2">{children}</div>;
  }

  if (selectedPharmacy && sheetView === "detail") {
    return (
      <div className="space-y-2 max-h-full overflow-y-auto px-2">
        <div>
          <div
            className="flex gap-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/pharmacy/${selectedPharmacy?.p_id}`;
            }}
          >
            <div className="w-full">
              <p className="T2_SB_20 text-mainText">
                {selectedPharmacy.name || "이름 없음"}
              </p>
              <p className="B1_RG_15 text-subText2 mt-1">
                {selectedPharmacy.address || "주소 정보 없음"}
              </p>
              {typeof selectedPharmacy.distance === 'number' && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Image
                    src="/icon/Environment.svg"
                    alt="거리"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                  <span className="B2_RG_14 text-subText2">
                    {selectedPharmacy.distance < 1
                      ? `${Math.round(selectedPharmacy.distance * 1000)}m`
                      : `${selectedPharmacy.distance.toFixed(1)}km`} 거리
                  </span>
                </div>
              )}
              {(selectedPharmacy.user as PharmacyUser)?.number && (
                <p className="text-sm text-gray-700 mt-1">
                  {(selectedPharmacy.user as PharmacyUser)?.number}
                </p>
              )}
            </div>
            <div className="w-[40vw] h-[8.25rem] bg-main rounded-md flex flex-col justify-center items-center overflow-hidden">
              <Image
                src="/icon/logo2.svg"
                alt="약국 이미지"
                width={24}
                height={24}
                className="mb-1 drop-shadow-md"
              />
              <p className="text-xs text-white text-center leading-tight drop-shadow-md font-medium">
                이미지준비중
              </p>
            </div>
          </div>
          <div>
            <Bookbtn
              pharmacyId={Number(selectedPharmacy.p_id)}
              onReserve={(_, date) => onReserve(selectedPharmacy, date)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-[75vh] px-2">
      {pharmacies.map((pharmacy) => (
        <div key={pharmacy.p_id}>
          <div
            className="flex gap-2 cursor-pointer"
            onClick={() =>
              (window.location.href = `/pharmacy/${pharmacy.p_id}`)
            }
          >
            <div className="w-full">
              <p className="T2_SB_20 text-mainText">
                {pharmacy.name ? `${pharmacy.name}` : "이름 없음"}
              </p>
              <p className="B1_RG_15 text-subText2">
                {pharmacy.address || "주소 정보 없음"}
              </p>
              {(pharmacy.user as PharmacyUser)?.number && (
                <p className="B1_RG_15 text-subText">
                  {(pharmacy.user as PharmacyUser)?.number}
                </p>
              )}
              {typeof pharmacy.distance === "number" && (
                <div className="mt-1">
                  <span className="inline-flex items-center text-xs text-gray-500">
                    <Image
                      src="/icon/Environment.svg"
                      alt="거리"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                      priority
                    />
                    {pharmacy.distance < 1
                      ? `${Math.round(pharmacy.distance * 1000)}m`
                      : `${pharmacy.distance.toFixed(1)}km`}
                  </span>
                </div>
              )}
            </div>
            <div
              className="w-[40vw] h-[8.25rem] bg-main rounded-md flex flex-col justify-center items-center overflow-hidden"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Image
                src="/icon/logo2.svg"
                alt="약국 이미지"
                width={24}
                height={24}
                className="mb-1 drop-shadow-md"
              />
              <p className="text-xs text-white text-center leading-tight drop-shadow-md font-medium">
                이미지준비중
              </p>{" "}
            </div>
          </div>
          <div>
            <Bookbtn
              pharmacyId={Number(pharmacy.p_id)}
              onReserve={(_, date) => onReserve(pharmacy, date)}
            />
          </div>
          {/* 밑줄 */}
          <div>
            <div className="w-full h-[1px] mt-6 bg-gray-200"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MapPharmacyList;
