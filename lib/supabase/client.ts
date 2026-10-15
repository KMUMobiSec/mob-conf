"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type BrowserEnv = Record<string, string | undefined>;

export interface SupabaseBrowserConfig {
  url: string;
  anonKey: string;
}

// Next.js only inlines NEXT_PUBLIC_* values into the client bundle when they appear as a literal
// `process.env.NEXT_PUBLIC_X` expression. Passing the whole `process.env` object through a variable
// (as the old default parameter did) defeats that static replacement, so the browser always saw
// these as undefined — which silently disabled realtime and forced qr-check-ins onto a perpetual
// polling fallback instead of a live socket.
const BROWSER_ENV: BrowserEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export function getSupabaseBrowserConfig(env: BrowserEnv = BROWSER_ENV): SupabaseBrowserConfig {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for Supabase browser realtime");
  }

  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required for Supabase browser realtime");
  }

  return { url, anonKey };
}

let browserClient: SupabaseClient | undefined;

/**
 * One Supabase client per browser session. Realtime opens a WebSocket per client, so returning a
 * memoized singleton keeps repeated mounts (e.g. switching between the Registrations and Logs tabs)
 * on a single connection instead of leaking a fresh socket each time. The config is env-derived and
 * stable for the life of the tab, so the memo never needs to be invalidated.
 */
export function createSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const { url, anonKey } = getSupabaseBrowserConfig();
  browserClient = createClient(url, anonKey);
  return browserClient;
}
