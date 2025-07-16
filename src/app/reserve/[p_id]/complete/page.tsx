// src/app/reserve/[p_id]/complete/page.tsx

import ReserveCompleteClient from "./ReserveCompleteClient";

export default function ReserveCompletePage({
  params,
}: {
  params: { p_id: string };
}) {
  return <ReserveCompleteClient p_id={params.p_id} />;
}
