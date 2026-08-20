import { describe, expect, it } from "vitest";
import { getSupabaseBrowserConfig } from "@/lib/supabase/client";

describe("Supabase browser client config", () => {
  it("uses only public Supabase environment variables", () => {
    const config = getSupabaseBrowserConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    });

    expect(config).toEqual({
      url: "https://project.supabase.co",
      anonKey: "public-anon-key",
    });
    expect(Object.values(config)).not.toContain("service-role-key");
  });

  it("throws a clear error when public realtime env is missing", () => {
    expect(() =>
      getSupabaseBrowserConfig({ NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co" }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY is required for Supabase browser realtime");
  });
});
