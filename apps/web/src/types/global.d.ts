import type { FlutterwaveConfig } from "./flutterwave";

declare global {
  const __APP_BUILD_TIME__: string;
  interface Window {
    FlutterwaveCheckout: (config: FlutterwaveConfig) => { close: () => void };
  }
}

export {};
