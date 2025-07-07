async function loadPharmacies() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacies`,
    { cache: "no-store" }
  );
  return res.json();
}

export default async function MapApiTest() {
  const pharmacies = await loadPharmacies();
  console.log(pharmacies);
}
