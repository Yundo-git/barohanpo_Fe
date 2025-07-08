const GetPharmacy = async () => {
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const res = await fetch(`${API_URL}/api/pharmacy/`, {
    cache: "no-store",
  });
  const data = await res.json();

  console.log(data);
  if (!res.ok) {
    throw new Error("Failed to fetch pharmacy");
  }
  return data; // Pharmacy[]
};

export default GetPharmacy;
