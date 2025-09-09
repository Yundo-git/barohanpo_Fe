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
          <div className="flex gap-2">
            <div className="w-[60vw]">
              <p className="text-base font-medium">
                {selectedPharmacy.name || "이름 없음"} &gt;
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
            <div
              className="w-[5rem] h-[5rem] rounded-md bg-gray-200 flex justify-center items-center"
              onClick={(e) => {
                e.stopPropagation();
                // Add any image click handler here if needed
              }}
            >
              이미지 영역
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
    <div className="space-y-2 max-h-[75vh] px-2">
      {pharmacies.map((pharmacy) => (
        <div key={pharmacy.p_id}>
          <div
            className="flex gap-2 cursor-pointer hover:bg-gray-50"
            onClick={() =>
              (window.location.href = `/pharmacy/${pharmacy.p_id}`)
            }
          >
            <div className="w-[60vw]">
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
              className="w-[5rem] h-[5rem] rounded-md bg-gray-200 flex justify-center items-center"
              onClick={(e) => {
                e.stopPropagation();
                // Add any image click handler here if needed
              }}
            >
              이미지 영역
            </div>
          </div>
          <div>
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
