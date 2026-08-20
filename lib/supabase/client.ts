"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type BrowserEnv = Record<string, string | undefined>;

export interface SupabaseBrowserConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseBrowserConfig(env: BrowserEnv = process.env): SupabaseBrowserConfig {
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
