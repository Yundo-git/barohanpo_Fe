import { Metadata } from "next";
import "./globals.css";
import MobileNavBar from "@/components/MobileNavBar";
import Header from "@/components/Header";
import { UserProvider } from "@/app/auth/user-signin/UserContext";
import Providers from "@/store/Provider";

export const metadata: Metadata = {
  title: "바로한포",
  description: "당신만의 건강 루틴, 지금 시작해보세요.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full w-full">
      <body className="bg-white min-h-screen h-full w-full">
        <UserProvider>
          <Providers>
            <Header />
            <main className="min-h-[calc(100vh-14rem)] h-full min-h-screen absolute flex-grow top-14 left-0 right-0 ">
              {children}
            </main>
            <MobileNavBar />
          </Providers>
        </UserProvider>
      </body>
    </html>
  );
}
