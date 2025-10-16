// capacitor.config.ts
import type { CapacitorConfig } from "@capacitor/cli";
import * as dotenv from "dotenv";

dotenv.config();
const config: CapacitorConfig = {
  appId: "com.barohanpo.app",
  appName: "바로한포",
  webDir: ".next",
  server: {
    url: `${process.env.APP_LOCAL_IP}:3000`,
    cleartext: true,
  },
  plugins: {
    StatusBar: {
      style: "LIGHT",
      overlaysWebView: false,
      backgroundColor: "#00000000" // Transparent background
  },
  },
};

export default config;