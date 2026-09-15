import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gymbro.app',
  appName: 'GymBro',
  webDir: 'dist',
  android: {
    backgroundColor: '#0b0f14',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
