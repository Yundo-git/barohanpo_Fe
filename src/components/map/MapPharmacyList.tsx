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

  // When a pharmacy is selected, show only that pharmacy
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
              <p className="text-base font-medium">
                {selectedPharmacy.name || "이름 없음"}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {selectedPharmacy.address || "주소 정보 없음"}
              </p>
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
              <p>{pharmacy.name ? `${pharmacy.name}` : "이름 없음"}</p>
              <p className="text-xs text-gray-600">
                {pharmacy.address || "주소 정보 없음"}
              </p>
              {(pharmacy.user as PharmacyUser)?.number && (
                <p className="text-xs">
                  {(pharmacy.user as PharmacyUser)?.number}
                </p>
              )}
            </div>
            <div
              className="w-[40vw] h-[8.25rem] bg-main rounded-md flex flex-col justify-center items-center overflow-hidden"
              onClick={(e) => {
                e.stopPropagation();
                // Add any image click handler here if needed
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
