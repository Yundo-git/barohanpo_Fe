import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    'http://10.0.2.2:3000', // ← Android 에뮬레이터에서 접근하는 주소
  ],
};

export default nextConfig;
