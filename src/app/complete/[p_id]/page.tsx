// // src/app/reserve/[p_id]/page.tsx

// import ReserveCompleteClient from "./ReserveCompleteClient";

// interface Props {
//   params: {
//     p_id: string;
//   };
// }

// export default function Page({ params }: Props) {
//   return <ReserveCompleteClient p_id={params.p_id} />;
// }

import ReserveCompleteClient from "./ReserveCompleteClient";
type PageParams = Promise<{ p_id: string }>;

const Page = async ({ params }: { params: PageParams }) => {
  const { p_id } = await params;

  return <ReserveCompleteClient p_id={p_id} />;
};

export default Page;
