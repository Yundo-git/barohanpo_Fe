import MyBookClient from "./MyBookClient";

type Params = { user_id: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  const { user_id } = await params;
  const userId = Number(user_id);

  return <MyBookClient userId={userId} />;
}
