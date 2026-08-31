// env exports into index.ts in config folder
export const supabaseURL = import.meta.env.VITE_SUPABASE_URL as string;
export const supabaseANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Canonical production domain — used for links (referrals, etc.) that are
// meant to be shared with other people, so they still resolve correctly
// even when generated from a dev server or a preview deployment.
export const SITE_URL = "https://www.agroheal.solutions";

// importing Payment secret keys
export const PAYSTACK_KEY =
  import.meta.env.VITE_PAYSTACK_PUBLIC_KEYS ||
  import.meta.env.VITE_PAYSTACK_KEYS;
export const FLUTTERWAVE_KEYS = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;

