"use client";

import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import {
  CameraOff,
  CheckCircle2,
  Clock,
  Loader2,
  QrCode,
  ScanLine,
  SwitchCamera,
  X,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ValidYear } from "@/constants/config";
import { cn } from "@/lib/helpers/utils";
import { checkInRegistration } from "@/modules/admin/qr-check-ins/actions";
import { formatIdNumber } from "@/modules/admin/qr-check-ins/lib/format";
import { TestModeBanner } from "./TestModeBanner";

// How long each result stays on screen before scanning auto-resumes, tuned to its
// reading length: a short welcome is brief, a rejection (reason + next step) lingers.
// All are kept below SAME_CODE_COOLDOWN_MS so a badge isn't re-scanned the moment its
// result clears.
const RESULT_DURATION_MS = { success: 3500, warning: 4000, error: 5000 } as const;
/**
 * Keep the "Checking in…" popup on screen at least this long so a scan always reads as a
 * deliberate detected → complete sequence, even when the server answers near-instantly.
 */
const MIN_DETECTED_MS = 550;
/** Ignore a re-read of the same payload within this window (a badge lingering in front of the lens). */
const SAME_CODE_COOLDOWN_MS = 6000;
/**
 * Decode QR only (skip the ~10 other symbologies ZXing tries per frame by default) and poll frames
 * every ~100ms instead of the library's sluggish 500ms default. Together these make detection feel
 * near-instant and cut CPU/battery on phones.
 */
const QR_ONLY_HINTS = new Map<DecodeHintType, unknown>([
  [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]],
]);
const SCAN_ATTEMPT_INTERVAL_MS = 100;

type Status = "starting" | "scanning" | "detected" | "result";
type FacingMode = "environment" | "user";
type ResultKind = keyof typeof RESULT_DURATION_MS;

type ScanResult = {
  kind: ResultKind;
  headline: string;
  name?: string;
  idNumber?: number | null;
  detail?: string;
  hint?: string;
};

const RESULT_VISUALS: Record<
  ResultKind,
  { Icon: typeof CheckCircle2; accent: string; iconBox: string; glow: string }
> = {
  success: {
    Icon: CheckCircle2,
    accent: "text-primary",
    iconBox: "bg-primary/15 ring-primary/25 text-primary",
    glow: "var(--primary-30)",
  },
  warning: {
    Icon: Clock,
    accent: "text-amber-400",
    iconBox: "bg-amber-500/15 ring-amber-500/25 text-amber-400",
    glow: "rgba(245, 158, 11, 0.22)",
  },
  error: {
    Icon: XCircle,
    accent: "text-red-400",
    iconBox: "bg-red-500/15 ring-red-500/25 text-red-400",
    glow: "rgba(239, 68, 68, 0.20)",
  },
};

const VIEWFINDER_CORNERS = [
  "left-3 top-3 rounded-tl-xl border-l-[3px] border-t-[3px]",
  "right-3 top-3 rounded-tr-xl border-r-[3px] border-t-[3px]",
  "bottom-3 left-3 rounded-bl-xl border-b-[3px] border-l-[3px]",
  "bottom-3 right-3 rounded-br-xl border-b-[3px] border-r-[3px]",
];

function describeCameraError(error: unknown): string {
  if (typeof navigator !== "undefined" && !navigator.mediaDevices?.getUserMedia) {
    return "This browser can't reach the camera here. Use Chrome or Safari over HTTPS.";
  }
  const name = error instanceof Error ? error.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera access was blocked. Allow the camera permission, then tap Try again.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera was found on this device.";
    case "NotReadableError":
      return "The camera is being used by another app. Close it, then tap Try again.";
    default:
      return "Camera unavailable. Check permissions, then tap Try again.";
  }
}

export function ScannerTab({
  year,
  closeHref,
  testMode,
  recipients,
}: {
  year: ValidYear;
  closeHref: string;
  testMode: boolean;
  recipients: string[];
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lockRef = useRef(false);
  const lastScanRef = useRef<{ text: string; at: number } | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<Status>("starting");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    router.push(closeHref);
  }, [router, closeHref]);

  // Submit a scanned payload, surface the outcome, then auto-resume after a beat. The "Checking in…"
  // loading popup (status "detected", no result yet) covers the request; it holds for at least
  // MIN_DETECTED_MS so the detected → complete hand-off always reads as a deliberate sequence.
  const processPayload = useCallback(
    async (text: string) => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      lockRef.current = true;
      setResult(null);
      const startedAt = Date.now();

      let next: ScanResult;
      try {
        const response = await checkInRegistration({ year, qrPayload: text.trim() });
        if (!response.ok) {
          next = {
            kind: "error",
            headline: "Unable to check in",
            detail: response.error,
            hint: "Please see the registration desk.",
          };
        } else if (response.status === "already-checked-in") {
          next = {
            kind: "warning",
            headline: "Already checked in",
            name: response.registration.name,
            idNumber: response.registration.idNumber,
            hint: `You're all set for MOBISEC ${year}.`,
          };
        } else {
          next = {
            kind: "success",
            headline: `Welcome to MOBISEC ${year}`,
            name: response.registration.name,
            idNumber: response.registration.idNumber,
            hint: "You're checked in.",
          };
        }
      } catch (error) {
        console.error("Check-in request failed", error);
        next = {
          kind: "error",
          headline: "Something went wrong",
          detail: "Couldn't reach the server.",
          hint: "Please try again.",
        };
      }

      // Hold the loading popup for a minimum beat so the detected → complete hand-off is always
      // perceptible, then bail if the scanner was closed while we waited.
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_DETECTED_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_DETECTED_MS - elapsed));
      }
      if (!mountedRef.current) return;
      setResult(next);
      setStatus("result");
      resumeTimerRef.current = setTimeout(() => {
        setResult(null);
        setStatus("scanning");
        lockRef.current = false;
      }, RESULT_DURATION_MS[next.kind]);
    },
    [year],
  );

  // Continuous camera decode loop that never stops between scans; gated by lockRef.
  // Waits for `mounted` so the portal's <video> is in the DOM before initializing.
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    const attempt = retryKey;
    const reader = new BrowserMultiFormatReader(QR_ONLY_HINTS, {
      delayBetweenScanAttempts: SCAN_ATTEMPT_INTERVAL_MS,
      delayBetweenScanSuccess: SCAN_ATTEMPT_INTERVAL_MS,
    });
    setStatus("starting");
    setCameraError(null);

    async function start() {
      const video = videoRef.current;
      if (!video) return;
      if (typeof window !== "undefined" && !window.isSecureContext) {
        setCameraError(
          "Camera needs a secure connection. Open this page over HTTPS or on localhost.",
        );
        return;
      }
      try {
        const controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: facingMode },
              // A sharper frame reads small/angled codes on the first pass (fewer retries). QR-only
              // hints keep the larger frame fast to decode.
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          video,
          (scanResult) => {
            if (!scanResult || lockRef.current) return;
            const text = scanResult.getText();
            const now = Date.now();
            const last = lastScanRef.current;
            if (last && last.text === text && now - last.at < SAME_CODE_COOLDOWN_MS) return;
            lastScanRef.current = { text, at: now };
            // A code is in view: lock, flip to the "detected" animation, and submit immediately — the
            // animation covers the request latency instead of a fixed hold stacked before it.
            lockRef.current = true;
            setStatus("detected");
            void processPayload(text);
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStatus((current) => (current === "starting" ? "scanning" : current));
      } catch (error) {
        console.error(`Failed to start QR scanner (attempt ${attempt})`, error);
        if (!cancelled) setCameraError(describeCameraError(error));
      }
    }

    void start();
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [mounted, facingMode, retryKey, processPayload]);

  // Lock page scroll behind the overlay and wire Escape to close.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close]);

  // Track mount state (guards async setState) and clear pending timers on unmount.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="QR check-in scanner"
      className="fixed inset-0 z-100 flex flex-col overflow-hidden bg-black text-white"
    >
      {/* Test-mode frame: an inset amber ring + a compact banner, so the scanner is
          unmistakably not production. Overlays only — no effect on the scanner layout. */}
      {testMode ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 z-50 ring-4 ring-inset ring-amber-500"
            aria-hidden="true"
          />
          <TestModeBanner
            recipients={recipients}
            compact
            className="absolute left-1/2 top-[max(0.5rem,env(safe-area-inset-top))] z-50 -translate-x-1/2 rounded-full shadow-lg"
          />
        </>
      ) : null}

      {/* Themed gradient backdrop: graphite halo (theme's dark surfaces) behind the logo,
          fading to near-black. Pinned to dark-palette hex so it stays correct in either theme. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(115% 90% at 50% -10%, #2c2c2c 0%, #121212 48%, #050506 100%)",
        }}
      />

      {/* Corner controls */}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => setFacingMode((mode) => (mode === "environment" ? "user" : "environment"))}
        aria-label="Switch camera"
        className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-40 rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
      >
        <SwitchCamera className="size-5" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={close}
        aria-label="Close scanner"
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-40 rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
      >
        <X className="size-5" />
      </Button>

      {/* Scanning stage */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-20 py-[max(1.5rem,env(safe-area-inset-top))]">
        {/* Branded header above the camera */}
        <div className="flex flex-col items-center gap-4 text-center">
          <Image
            src="/assets/logo/ebision-logo-nobg.png"
            alt="MOBISEC"
            width={200}
            height={200}
            priority
            className="h-20 w-auto drop-shadow-lg sm:h-24"
          />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Conference Check-In
            </h1>
            <p className="text-sm text-white/60">MOBISEC {year}</p>
          </div>
        </div>

        <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-3xl bg-black shadow-2xl ring-1 ring-white/15">
          <video
            ref={videoRef}
            className={cn(
              "absolute inset-0 size-full object-cover",
              // Mirror the front (selfie) camera so the preview tracks the user's
              // movement like a mirror. The rear camera is left as-is. This is a
              // display-only flip — ZXing decodes the raw stream, so QR reading
              // is unaffected, and the viewfinder overlay stays unmirrored.
              facingMode === "user" && "-scale-x-100",
            )}
            muted
            playsInline
            autoPlay
          />
          <div className="pointer-events-none absolute inset-0">
            {/* A primary ring that pulses while the camera is live and scanning — reinforces the
                frame as "active" beyond the moving scan-line. */}
            {status === "scanning" ? (
              <span className="animate-qr-live-pulse absolute inset-0 rounded-3xl ring-2 ring-inset ring-primary/45" />
            ) : null}
            {VIEWFINDER_CORNERS.map((corner) => (
              <span
                key={corner}
                className={cn(
                  "absolute size-8 transition-colors duration-200",
                  corner,
                  status === "detected"
                    ? "border-primary"
                    : status === "scanning"
                      ? "animate-qr-live-pulse border-primary"
                      : "border-white/70",
                )}
              />
            ))}
            {status === "scanning" || status === "detected" ? (
              <span className="animate-qr-scanline absolute inset-x-6 h-0.5 rounded-full bg-primary shadow-[0_0_14px_3px] shadow-primary/60" />
            ) : null}
            {/* Center target: a QR glyph with expanding radar rings, plus an in-frame prompt —
                tells the user at a glance to present their code here and hold still. */}
            {status === "scanning" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <span className="relative flex size-24 items-center justify-center">
                  <span className="animate-qr-target-ping absolute size-24 rounded-2xl border-2 border-primary/70" />
                  <span className="animate-qr-target-ping absolute size-24 rounded-2xl border-2 border-primary/50 [animation-delay:1.05s]" />
                  <span className="animate-qr-target-breathe flex size-16 items-center justify-center rounded-2xl bg-black/45 ring-1 ring-primary/40 backdrop-blur-sm">
                    <QrCode className="size-9 text-primary drop-shadow-[0_0_10px_rgba(0,0,0,0.6)]" />
                  </span>
                </span>
                <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-sm">
                  Show your QR code &amp; hold still
                </span>
              </div>
            ) : null}
          </div>
          {status === "starting" ? (
            <div className="absolute inset-0 grid place-items-center bg-black/60">
              <Loader2 className="size-8 animate-spin text-white/80" />
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "flex items-center gap-2.5 rounded-full px-5 py-2.5 ring-1 transition-colors",
            status === "detected"
              ? "bg-primary/15 ring-primary/40"
              : status === "scanning"
                ? "bg-primary/10 ring-primary/30"
                : "bg-white/5 ring-white/10",
          )}
        >
          {status === "starting" ? (
            <>
              <Loader2 className="size-4 shrink-0 animate-spin text-white/70" />
              <p className="text-sm font-medium text-white/85">Starting camera…</p>
            </>
          ) : status === "detected" ? (
            <>
              <ScanLine className="size-4 shrink-0 text-primary" />
              <p className="text-sm font-semibold text-primary">QR code detected…</p>
            </>
          ) : (
            <>
              {/* Live pulsing dot — an unmistakable "scanning is running" signal. */}
              <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
              </span>
              <p className="text-sm font-semibold tracking-wide text-white">Scanning…</p>
            </>
          )}
        </div>
      </main>

      {/* Loading overlay — shown while the check-in request is in flight, mirroring the result
          overlay's design so the transition into the outcome is seamless. */}
      {status === "detected" && !result ? (
        <div
          role="alertdialog"
          aria-live="polite"
          aria-label="Checking in"
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-8 bg-black/95 px-6 pb-16 pt-24 text-center backdrop-blur-md animate-in fade-in"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 38%, var(--primary-30), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
            <span className="flex size-28 items-center justify-center rounded-full bg-primary/15 text-primary ring-8 ring-primary/25">
              <Loader2 className="size-16 animate-spin" />
            </span>
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Checking in…
              </p>
              <p className="text-sm text-white/50">Please wait a moment</p>
            </div>
          </div>
          <div className="relative h-1 w-40 overflow-hidden rounded-full bg-white/10">
            <div className="animate-qr-indeterminate h-full w-1/3 rounded-full bg-white/50" />
          </div>
        </div>
      ) : null}

      {/* Result overlay (acceptance / already-in / rejection) */}
      {result
        ? (() => {
            const visual = RESULT_VISUALS[result.kind];
            return (
              <div
                role="alertdialog"
                aria-live="assertive"
                aria-label={`${result.headline}${
                  result.idNumber != null ? `, ID ${formatIdNumber(result.idNumber)}` : ""
                }${result.name ? `, ${result.name}` : ""}`}
                // No backdrop fade-in: the result always follows the identical loading backdrop, so
                // the outcome's icon/text zooms in over a steady dark surface with no camera flash.
                className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-8 bg-black/95 px-6 pb-16 pt-24 text-center backdrop-blur-md"
              >
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `radial-gradient(ellipse 70% 50% at 50% 38%, ${visual.glow}, transparent 70%)`,
                  }}
                />
                <div className="relative flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
                  <span
                    className={cn(
                      "flex size-28 items-center justify-center rounded-full ring-8",
                      visual.iconBox,
                    )}
                  >
                    <visual.Icon className="size-16" />
                  </span>
                  <div className="space-y-2">
                    <p
                      className={cn(
                        "text-sm font-semibold uppercase tracking-[0.2em]",
                        visual.accent,
                      )}
                    >
                      {result.headline}
                    </p>
                    {result.idNumber != null ? (
                      <div className="flex flex-col items-center gap-1 py-1">
                        <span
                          className={cn(
                            "text-[0.7rem] font-semibold uppercase tracking-[0.3em] opacity-80",
                            visual.accent,
                          )}
                        >
                          ID
                        </span>
                        <span className="text-7xl font-bold leading-none tabular-nums sm:text-8xl">
                          {formatIdNumber(result.idNumber)}
                        </span>
                      </div>
                    ) : null}
                    {result.name ? (
                      <p className="text-3xl font-bold sm:text-4xl">{result.name}</p>
                    ) : null}
                    {result.detail ? (
                      <p className="text-base text-white/70">{result.detail}</p>
                    ) : null}
                    {result.hint ? <p className="text-sm text-white/50">{result.hint}</p> : null}
                  </div>
                </div>
                <div className="relative h-1 w-40 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="animate-qr-progress h-full bg-white/50"
                    style={{ animationDuration: `${RESULT_DURATION_MS[result.kind]}ms` }}
                  />
                </div>
              </div>
            );
          })()
        : null}

      {/* Camera error overlay */}
      {cameraError ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-black/90 px-6 text-center">
          <CameraOff className="size-12 text-white/70" />
          <p className="max-w-xs text-sm text-white/80">{cameraError}</p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={() => setRetryKey((key) => key + 1)}>
              Try again
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={close}
              className="text-white hover:bg-white/10 hover:text-white"
            >
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
