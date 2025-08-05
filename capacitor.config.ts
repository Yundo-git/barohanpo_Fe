import type { CapacitorConfig } from "@capacitor/cli";
import * as dotenv from "dotenv";

dotenv.config();
const config: CapacitorConfig = {
  appId: "com.barohanpo.app",
  appName: "barohanpo",
  webDir: ".next",
  server: {
    url: `${process.env.APP_LOCAL_IP}:3000`,
    cleartext: true,
  },
};

export default config;
