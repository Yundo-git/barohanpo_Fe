// src/app/map/page.tsx
"use client";

import MapLoader from "@/components/map/MapLoader";
import { useAppSelector } from "@/store/store";

export default function MapPage() {
  const pharmacies = useAppSelector((s) => s.pharmacy.pharmacies);

  return (
    <div className="w-full h-full">
      <MapLoader initialPharmacies={pharmacies} />
    </div>
  );
}
