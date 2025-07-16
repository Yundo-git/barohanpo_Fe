// src/app/reserve/[p_id]/page.tsx

import ReserveDetailPage from "./ReserveDetailClient";

type PageParams = Promise<{ p_id: string }>;

const Page = async ({ params }: { params: PageParams }) => {
  const { p_id } = await params;

  return <ReserveDetailPage p_id={p_id} />;
};

export default Page;
