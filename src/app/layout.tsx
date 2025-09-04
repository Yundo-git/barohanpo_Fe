import { Metadata } from "next";
import "./globals.css";
import MobileNavBar from "@/components/MobileNavBar";
import Header from "@/components/Header";
import Providers from "@/store/Provider";
import LocalPermission from "@/components/map/LocalPermission";
import { QueryClientProvider } from "@/providers/QueryClientProvider";

export const metadata: Metadata = {
  title: "바로한포",
  description: "당신만의 건강 루틴, 지금 시작해보세요.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-white h-screen flex flex-col overflow-hidden">
        {/* <UserProvider> */}
        <Providers>
          <QueryClientProvider>
            <LocalPermission />
            <div className="fixed top-0 left-0 right-0 z-50">
              <Header />
            </div>
            <main className="flex-1 pt-14 pb-14 overflow-y-auto">
              <div className="h-full">{children}</div>
            </main>
            <div className="fixed bottom-0 left-0 right-0 z-50">
              <MobileNavBar />
            </div>
          </QueryClientProvider>
        </Providers>
        {/* </UserProvider> */}
      </body>
    </html>
  );
}
