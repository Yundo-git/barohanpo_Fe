import MyBookClient from "./MyBookClient";

type Params = { user_id: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  const { user_id } = await params; // ✅ Next 15: params는 Promise
  const userId = Number(user_id);

  return <MyBookClient userId={userId} />;
}
