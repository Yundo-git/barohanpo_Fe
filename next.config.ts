import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // output: "export",

  allowedDevOrigins: [
    "http://10.0.2.2:3000", // ← Android 에뮬레이터에서 접근하는 주소
    "http://192.168.0.21:3000", // ← iOS 에뮬레이터에서 접근하는 주소
  ],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/api/**", // Allow all API routes
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],

 
    // 또는 간단히:
    // domains: ["localhost"], // (포트 지정은 안 되지만 host만 검사—간단한 케이스면 충분)
  },
};

export default nextConfig;
