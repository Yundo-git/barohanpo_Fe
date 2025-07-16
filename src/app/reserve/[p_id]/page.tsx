import ReserveDetailPage from "./ReserveDetailClient";

interface Props {
  params: { p_id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params }: Props) {
  return (
    <div className="overflow-y-auto">
      <ReserveDetailPage p_id={params.p_id} />
    </div>
  );
}
