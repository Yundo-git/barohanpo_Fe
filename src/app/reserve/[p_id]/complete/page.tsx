import ReserveCompleteClient from "./ReserveCompleteClient";

type PageProps = {
  params: { p_id: string };
};

export default function ReserveCompletePage({ params }: PageProps) {
  return <ReserveCompleteClient p_id={params.p_id} />;
}
