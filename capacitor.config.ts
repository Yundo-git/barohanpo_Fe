import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.barohanpo.app',
  appName: 'Barohanpo',
  webDir: 'public',
  server: {
    url: 'https://barohanpo.xyz',
    cleartext: false,
  },
};

export default config;
