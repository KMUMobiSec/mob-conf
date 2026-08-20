"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import {
  type LngLat,
  segmentPoints,
  type WayfinderConfig,
  type WayfinderPin,
} from "@/constants/wayfinder";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Classic Mapbox "marching ants" dash sequence for the animated route line.
const DASH_SEQUENCE: number[][] = [
  [0, 4, 3],
  [0.5, 4, 2.5],
  [1, 4, 2],
  [1.5, 4, 1.5],
  [2, 4, 1],
  [2.5, 4, 0.5],
  [3, 4, 0],
  [0, 0.5, 3, 3.5],
  [0, 1, 3, 3],
  [0, 1.5, 3, 2.5],
  [0, 2, 3, 2],
  [0, 2.5, 3, 1.5],
  [0, 3, 3, 1],
  [0, 3.5, 3, 0.5],
];

interface WayfinderMapProps {
  config: WayfinderConfig;
  activeIndex: number;
  onSelectPin: (pinId: string) => void;
}

function lineFeature(coords: LngLat[]): GeoJSON.Feature<GeoJSON.LineString> {
  return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } };
}

function multiLineFeature(lines: LngLat[][]): GeoJSON.Feature<GeoJSON.MultiLineString> {
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "MultiLineString", coordinates: lines },
  };
}

/** Trunk + every spoke leg (each leg prefixed with the hub point so it isn't a visual gap), for the always-visible preview. */
function previewLines(config: WayfinderConfig): LngLat[][] {
  const hub = config.route[config.route.length - 1];
  const legs = config.steps.flatMap((step) => (step.leg ? [[hub, ...step.leg]] : []));
  return [config.route, ...legs];
}

function prefersReducedMotion(): boolean {
  const mq =
    typeof window !== "undefined" ? window.matchMedia?.("(prefers-reduced-motion: reduce)") : null;
  return mq ? mq.matches : false;
}

const PULSE_KEYFRAMES_ID = "wf-pulse-keyframes";

/** Injects the pulse ring's @keyframes once per document (no-op if already present). */
function ensurePulseKeyframes(): void {
  if (document.getElementById(PULSE_KEYFRAMES_ID)) return;
  const style = document.createElement("style");
  style.id = PULSE_KEYFRAMES_ID;
  style.textContent =
    "@keyframes wf-pulse { 0% { transform: scale(1); opacity: .55; } 100% { transform: scale(2.4); opacity: 0; } }";
  document.head.appendChild(style);
}

/** Adds a looping "you are here" pulse ring behind a marker element (skipped under reduced-motion). */
function addPulseRing(el: HTMLButtonElement): void {
  if (prefersReducedMotion()) return;
  ensurePulseKeyframes();
  const ring = document.createElement("span");
  Object.assign(ring.style, {
    position: "absolute",
    inset: "0",
    borderRadius: "9999px",
    background: "#e0642e",
    animation: "wf-pulse 1.8s ease-out infinite",
    pointerEvents: "none",
  } satisfies Partial<CSSStyleDeclaration>);
  el.style.position = "relative";
  el.insertBefore(ring, el.firstChild);
}

const DEFAULT_MARKER_COLOR = "#1f2937";

function buildMarkerElement(stop: number, ariaLabel: string, color: string): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", ariaLabel);
  Object.assign(el.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "9999px",
    border: "2px solid #ffffff",
    background: color,
    color: "#ffffff",
    fontFamily: "inherit",
    fontWeight: "700",
    fontSize: "13px",
    lineHeight: "1",
    padding: "0",
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
    transition: "transform .15s ease, background .15s ease",
  } satisfies Partial<CSSStyleDeclaration>);
  const label = document.createElement("span");
  label.textContent = String(stop);
  label.style.position = "relative";
  el.appendChild(label);
  return el;
}

// A Popup's `anchor` is the edge of the popup box touching the marker, which is the
// opposite side from where the box visually appears — invert `labelPosition` to get it.
const LABEL_POSITION_TO_ANCHOR: Record<
  NonNullable<WayfinderPin["labelPosition"]>,
  mapboxgl.Anchor
> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

/** Permanent (non-interactive) building-name label shown next to every marker. */
function buildNameLabel(text: string, position?: WayfinderPin["labelPosition"]): mapboxgl.Popup {
  return new mapboxgl.Popup({
    offset: 20,
    closeButton: false,
    closeOnClick: false,
    closeOnMove: false,
    ...(position ? { anchor: LABEL_POSITION_TO_ANCHOR[position] } : {}),
  }).setText(text);
}

/**
 * Interactive Mapbox map: real streets/3D-buildings basemap with a marching-ants
 * walking route and numbered stop markers. The camera stays fixed (all locations
 * framed); advancing a step highlights that stop's marker and reveals its leg of
 * the route.
 */
export default function WayfinderMap({ config, activeIndex, onSelectPin }: WayfinderMapProps) {
  const t = useTranslations("Wayfinder");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef(new globalThis.Map<string, mapboxgl.Marker>());
  const loadedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  // Keep a fresh reference so the map's (once-only) load handler calls the latest.
  const applyActiveRef = useRef<() => void>(() => {});
  const onSelectPinRef = useRef(onSelectPin);
  onSelectPinRef.current = onSelectPin;

  applyActiveRef.current = () => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const step = config.steps[activeIndex] ?? config.steps[0];
    const pin = config.pins.find((p) => p.id === step.focusPinId) ?? config.pins[0];

    // The camera stays fixed (all locations always framed). Advancing a step
    // only reveals that leg of the route and highlights its marker — the view
    // never moves. A step with fewer than 2 points (e.g. the gate, which has
    // no revealed path) draws nothing rather than a degenerate 1-point line.
    const points = segmentPoints(config, step);
    const activeSource = map.getSource("wf-route-active") as mapboxgl.GeoJSONSource | undefined;
    activeSource?.setData(lineFeature(points.length >= 2 ? points : []));

    // Each marker keeps its building color (matching the venue illustration);
    // the active step is emphasized by scaling it up with a stronger ring/shadow.
    for (const [id, marker] of markersRef.current) {
      const el = marker.getElement();
      const isActive = id === pin.id;
      el.style.transform = isActive ? "scale(1.3)" : "scale(1)";
      el.style.zIndex = isActive ? "2" : "1";
      el.style.boxShadow = isActive
        ? "0 0 0 3px rgba(255,255,255,0.95), 0 2px 10px rgba(0,0,0,0.5)"
        : "0 1px 4px rgba(0,0,0,0.4)";
      el.setAttribute("aria-pressed", String(isActive));
    }
  };

  // Initialize the map once.
  // biome-ignore lint/correctness/useExhaustiveDependencies: map is created once; live values are read via refs.
  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: config.map.styleUrl,
      center: config.map.center,
      zoom: config.map.zoom,
      minZoom: config.map.minZoom,
      maxZoom: config.map.maxZoom,
      pitch: 0,
      cooperativeGestures: true,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      loadedRef.current = true;

      map.addSource("wf-route", { type: "geojson", data: multiLineFeature(previewLines(config)) });
      map.addLayer({
        id: "wf-route-base",
        type: "line",
        source: "wf-route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#e0642e", "line-width": 5, "line-opacity": 0.22 },
      });

      map.addSource("wf-route-active", { type: "geojson", data: lineFeature([]) });
      map.addLayer({
        id: "wf-route-active",
        type: "line",
        source: "wf-route-active",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#e0642e", "line-width": 5, "line-dasharray": [0, 4, 3] },
      });

      for (const pin of config.pins) {
        const el = buildMarkerElement(
          pin.stop,
          t("pinAriaLabel", { role: t(`roles.${pin.id}`), stop: pin.stop }),
          pin.color ?? DEFAULT_MARKER_COLOR,
        );
        el.addEventListener("click", () => onSelectPinRef.current(pin.id));
        if (pin.kind === "gate") addPulseRing(el);
        const marker = new mapboxgl.Marker({ element: el }).setLngLat(pin.lngLat).addTo(map);
        markersRef.current.set(pin.id, marker);
        // Building-name label: always shown, not a click-triggered popover.
        buildNameLabel(pin.officialName, pin.labelPosition).setLngLat(pin.lngLat).addTo(map);
      }

      // Frame ALL locations (trunk + every spoke leg + every pin) once; this stays fixed.
      const bounds = new mapboxgl.LngLatBounds();
      for (const line of previewLines(config)) {
        for (const coord of line) bounds.extend(coord);
      }
      for (const pin of config.pins) bounds.extend(pin.lngLat);
      map.fitBounds(bounds, { padding: 56, duration: 0, maxZoom: 16.5 });

      applyActiveRef.current();

      // Marching-ants animation (skipped under reduced-motion).
      if (!prefersReducedMotion() && typeof requestAnimationFrame !== "undefined") {
        let lastIndex = -1;
        const march = (timestamp: number) => {
          const index = Math.floor((timestamp / 55) % DASH_SEQUENCE.length);
          if (index !== lastIndex && map.getLayer("wf-route-active")) {
            map.setPaintProperty("wf-route-active", "line-dasharray", DASH_SEQUENCE[index]);
            lastIndex = index;
          }
          rafRef.current = requestAnimationFrame(march);
        };
        rafRef.current = requestAnimationFrame(march);
      }
    });

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      loadedRef.current = false;
    };
  }, []);

  // React to step changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: applyActive is read via ref.
  useEffect(() => {
    applyActiveRef.current();
  }, [activeIndex]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-[380px] w-full items-center justify-center rounded-lg border border-border bg-muted sm:h-[460px]">
        <p className="body text-muted-foreground">{t("mapUnavailable")}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={t("title")}
      className="h-[380px] w-full overflow-hidden rounded-lg border border-border sm:h-[460px]"
    />
  );
}
