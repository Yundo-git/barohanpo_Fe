import ReserveCompleteClient from "./ReserveCompleteClient";

interface PageProps {
  params: { p_id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function ReserveCompletePage({ params }: PageProps) {
  return <ReserveCompleteClient p_id={params.p_id} />;
}
