import ReserveDetailPage from "./ReserveDetailClient";

interface Props {
  params: { p_id: string };
}

export default async function Page({ params }: Props) {
  // params를 비동기적으로 사용
  const { p_id } = await params;
  return <div className="overflow-y-auto"> <ReserveDetailPage p_id={p_id} /> </div>;
}
