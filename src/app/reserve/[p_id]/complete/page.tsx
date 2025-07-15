
import ReserveCompleteClient from "./ReserveCompleteClient";

interface Props {
  params: { p_id: string };
}

export default function ReserveCompletePage({ params }: Props) {
  return <ReserveCompleteClient p_id={params.p_id} />;
}
