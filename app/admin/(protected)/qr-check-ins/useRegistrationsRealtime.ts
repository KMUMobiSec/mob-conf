"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Coalesce a burst of change events into one refetch. Several scans can land within a second, so
 * without this each event would trigger its own full-page `router.refresh()`. 400ms is short enough
 * to feel live, long enough to collapse a burst into a single server round-trip.
 */
const REFRESH_DEBOUNCE_MS = 400;

/**
 * Fallback poll interval. Postgres-changes pushes instantly when the socket is healthy; this only
 * matters if the socket is down/blocked, and it caps the worst-case staleness. Kept tight because it
 * carries the whole load when realtime can't connect. Only fires while the tab is visible.
 */
const POLL_INTERVAL_MS = 3_000;

/**
 * Subscribe an admin view to live registration updates for one conference year.
 *
 * Primary path is Supabase Postgres changes: any insert/update on `registrations` for this year —
 * a scan setting `checked_in_at`, a new registration, an edit, an undo — is delivered by the DB's
 * replication stream (no server-side "send" step that can fail), and schedules a debounced
 * `router.refresh()` that refetches through the authenticated session. A visible-tab poll bounds the
 * worst case if the socket can't connect, and focus/visibility regain triggers a catch-up. The poll
 * lives outside the realtime try/catch so updates keep flowing even if realtime is unavailable.
 * `label` names the channel (and tags console warnings).
 */
export function useRegistrationsRealtime(year: number, label: string): void {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks whether the socket is actually delivering updates. Starts "unhealthy" so the poll
  // covers the connection-in-progress window, then flips once SUBSCRIBED — at which point the
  // poll goes idle instead of calling router.refresh() on a timer regardless of socket health.
  const connectedRef = useRef(false);

  const scheduleRefresh = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => router.refresh(), REFRESH_DEBOUNCE_MS);
  }, [router]);

  useEffect(() => {
    connectedRef.current = false;
    let removeChannel: (() => void) | undefined;
    try {
      const supabase = createSupabaseBrowserClient();
      const channel = supabase
        .channel(`${label}-${year}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "registrations", filter: `year=eq.${year}` },
          scheduleRefresh,
        )
        .subscribe((status, error) => {
          connectedRef.current = status === "SUBSCRIBED";
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            console.warn(`${label} realtime status: ${status}`, error ?? "");
          }
        });
      removeChannel = () => void supabase.removeChannel(channel);
    } catch (error) {
      console.warn(`Supabase realtime disabled for ${label} — polling only`, error);
    }

    // Catch up on anything missed while the tab was backgrounded or the socket was down.
    function onFocusOrVisible() {
      if (document.visibilityState === "visible") scheduleRefresh();
    }
    document.addEventListener("visibilitychange", onFocusOrVisible);
    window.addEventListener("focus", onFocusOrVisible);

    // Reliable fallback, independent of the socket: poll while visible so a dead socket can't leave
    // the dashboard stale for more than POLL_INTERVAL_MS. Skipped once the socket reports healthy,
    // so a working connection doesn't also pay for a redundant full-page refresh every few seconds.
    const pollTimer = setInterval(() => {
      if (!connectedRef.current && document.visibilityState === "visible") scheduleRefresh();
    }, POLL_INTERVAL_MS);

    return () => {
      document.removeEventListener("visibilitychange", onFocusOrVisible);
      window.removeEventListener("focus", onFocusOrVisible);
      clearInterval(pollTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
      removeChannel?.();
    };
  }, [year, label, scheduleRefresh]);
}
