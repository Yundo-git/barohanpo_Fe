import React from "react";
import Bookbtn from "../reservation/Bookbtn";
import { Pharmacy, PharmacyUser } from "../../types/pharmacy";

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
  onPharmacySelect,
  onReserve,
  children,
}) => {
  if (sheetView === "reserve" && selectedPharmacy) {
    return <div className="max-h-[75vh] px-2">{children}</div>;
  }

  // When a pharmacy is selected, show only that pharmacy
  if (selectedPharmacy && sheetView === "detail") {
    return (
      <div className="space-y-2 max-h-[50vh] overflow-y-auto px-2">
        <div className="border border-gray-200 rounded-md">
          <div className="flex gap-2 p-2">
            <div className="w-[60vw]">
              <a
                href={`pharmacy/${selectedPharmacy.p_id}`}
                className="text-base font-medium hover:underline"
              >
                {selectedPharmacy.name || "이름 없음"} &gt;
              </a>
              <p className="text-sm text-gray-600 mt-1">
                {selectedPharmacy.address || "주소 정보 없음"}
              </p>
              {(selectedPharmacy.user as PharmacyUser)?.number && (
                <p className="text-sm text-gray-700 mt-1">
                  {(selectedPharmacy.user as PharmacyUser)?.number}
                </p>
              )}
            </div>
            <div className="w-[5rem] h-[5rem] rounded-md bg-gray-200 flex justify-center items-center">
              이미지 영역
            </div>
          </div>
          <div className="p-2">
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
    <div className="space-y-2 max-h-[75vh] px-2">
      {pharmacies.map((pharmacy) => (
        <div key={pharmacy.p_id} className="border border-gray-200 rounded-md">
          <div className="flex gap-2 p-2">
            <div
              className="hover:bg-gray-50 w-[60vw]"
              onClick={() => onPharmacySelect(pharmacy)}
            >
              <a href={`pharmacy/${pharmacy.p_id}`}>
                {`${pharmacy.name} >` || "이름 없음"}
              </a>
              <p className="text-xs text-gray-600">
                {pharmacy.address || "주소 정보 없음"}
              </p>
              {(pharmacy.user as PharmacyUser)?.number && (
                <p className="text-xs">
                  {(pharmacy.user as PharmacyUser)?.number}
                </p>
              )}
            </div>
            <div className="w-[5rem] h-[5rem] rounded-md bg-gray-200 flex justify-center items-center">
              이미지 영역
            </div>
          </div>
          <div className="p-2">
            <Bookbtn
              pharmacyId={Number(pharmacy.p_id)}
              onReserve={(_, date) => onReserve(pharmacy, date)}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MapPharmacyList;
