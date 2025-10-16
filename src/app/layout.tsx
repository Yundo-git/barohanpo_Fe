import { Metadata } from "next";
import "./globals.css";
import MobileNavBar from "@/components/ui/MobileNavBar";
import Header from "@/components/ui/Header";
import Providers from "@/store/Provider";
import LocalPermission from "@/components/map/LocalPermission";
import { QueryClientProvider } from "@/providers/QueryClientProvider";
import AuthBootstrap from "@/components/auth/AuthBootstrap";

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
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
      <body className="min-h-screen flex flex-col bg-white">
        <Providers>
          <QueryClientProvider>
            <AuthBootstrap />
            <LocalPermission />
            
            {/* White Status Bar Background */}
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: 'var(--sat, 0px)',
                backgroundColor: 'white',
                zIndex: 1000
              }} 
            />
            
            {/* Header - Fixed below status bar */}
            <div className="fixed left-0 right-0 z-50 bg-white" 
                 style={{ top: 'var(--sat, 0px)' }}>
              <Header />
            </div>
            
            {/* Main Content - Padded below header */}
            <main 
              className="flex-1 overflow-y-auto"
              style={{ 
                paddingTop: '56px',
                paddingBottom: 'var(--sab, 0px)',
                minHeight: 'calc(100vh - 56px - var(--sab, 0px))'
              }} 
            >
              <div className="h-full">{children}</div>
            </main>
            
            {/* Bottom Navigation */}
            <div 
              className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
              style={{ 
                paddingBottom: 'var(--sab, 0px)'
              }}
            >
              <MobileNavBar />
            </div>
          </QueryClientProvider>
        </Providers>
      </body>
    </html>
  );
}