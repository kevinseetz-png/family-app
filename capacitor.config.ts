import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.family.app',
  appName: 'Family App',
  webDir: '.next',
  server: {
    url: 'https://family-app-beryl.vercel.app',
    cleartext: false,
  },
  android: {
    backgroundColor: '#059669',
  },
};

export default config;
