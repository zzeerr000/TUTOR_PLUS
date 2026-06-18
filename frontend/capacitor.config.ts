import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tutorplus.app",
  appName: "Tutor+",
  webDir: "build",
  server: {
    androidScheme: "https",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
