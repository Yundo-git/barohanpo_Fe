"use client";

import { useSearchParams } from "next/navigation";
import React from "react";

interface Props {
  params: Promise<{ p_id: string }>;
}

export default function ReserveDetailPage({ params }: Props) {
  const searchParams = useSearchParams();
  const date = searchParams.get("date");

  const { p_id } = React.use(params); // ✅ params 언래핑

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold">약국 예약 페이지</h1>
      <p>약국 ID: {p_id}</p>
      <p>선택한 예약 날짜: {date}</p>
    </div>
  );
}
