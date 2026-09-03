import type { FlutterwaveConfig } from "./flutterwave";

declare global {
  interface Window {
    FlutterwaveCheckout: (config: FlutterwaveConfig) => { close: () => void };
  }
}

export {};
