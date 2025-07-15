import { Metadata } from "next";
import "./globals.css";
import MobileNavBar from "@/components/MobileNavBar";
import Header from "@/components/Header";
import { UserProvider } from "@/app/auth/user-signin/UserContext";
import Providers from "@/store/Provider";

export const metadata: Metadata = {
  title: "바로한포~",
  description: "당신만의 건강 루틴, 지금 시작해보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" className="h-full w-full">
      <body className="bg-white min-h-screen w-full flex flex-col">
        <UserProvider>
          <Providers>
            <Header />
            <div className="pb-26">{children}</div>
            <MobileNavBar />
          </Providers>
        </UserProvider>
      </body>
    </html>
  );
}
