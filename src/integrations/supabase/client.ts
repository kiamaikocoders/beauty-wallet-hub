import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined)?.trim() ?? "";
const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined)?.trim() ?? "";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    "[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Set them in .env (local) and Vercel project env (production), then redeploy.",
  );
}

/** Placeholder client when env is missing so SSR can still render a page instead of a hard 500. */
function createSafeClient(): SupabaseClient<Database> {
  if (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) {
    return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: typeof window !== "undefined",
        autoRefreshToken: typeof window !== "undefined",
      },
    });
  }
  return createClient<Database>("https://placeholder.supabase.co", "public-anon-key", {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const supabase = createSafeClient();
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
