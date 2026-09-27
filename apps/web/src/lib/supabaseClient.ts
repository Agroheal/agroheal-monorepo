import { createClient } from "@supabase/supabase-js";
import { supabaseURL, supabaseANON } from "../config/Index";

if (!supabaseURL || !supabaseANON) {
  console.error(
    "Supabase configuration missing! Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables."
  );
}

const supabaseUrl = supabaseURL || "https://placeholder.supabase.co";
const supabaseAnonKey = supabaseANON || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Custom lock pass-through to completely bypass buggy navigator.locks in mobile/tab suspension
    lock: async (_name, _acquireTimeout, fn) => {
      return await fn();
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

