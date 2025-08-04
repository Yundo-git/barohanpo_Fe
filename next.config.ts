import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // output: "export",

  allowedDevOrigins: [
    "http://10.0.2.2:3000", // ← Android 에뮬레이터에서 접근하는 주소
    "http://192.168.0.21:3000", // ← iOS 에뮬레이터에서 접근하는 주소
  ],
};

export default nextConfig;
