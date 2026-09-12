import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.katoshi.snapchef",
  appName: "SnapChef",
  webDir: "dist-mobile",
  server: { androidScheme: "https" },
};

export default config;
