"use client";

import { MapPin } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { clampStep, stepIndexForPin, type WayfinderConfig } from "@/constants/wayfinder";
import { cn } from "@/lib/utils";
import WayfinderMap from "./WayfinderMap";
import WayfinderSteps from "./WayfinderSteps";

interface WayfinderClientProps {
  config: WayfinderConfig;
}

/**
 * Approximate position of each venue building on the illustrated map
 * (`/assets/venue/2026/venue-map.png`), as `[xPercent, yPercent]` of the image.
 * Tune these if the pins don't sit on their buildings — they're eyeballed to the
 * drawing, not derived from geographic coordinates.
 */
const VENUE_IMAGE_POINTS: Record<string, [number, number]> = {
  gate: [22, 47], // Main Gate — entrance from Jeongneung-ro, down-left of the statue
  registration: [64, 40], // red — Administration Hall
  paper: [60, 50], // green — International Hall
  lunch: [76, 50], // blue — College of Law
};

const DEFAULT_PIN_COLOR = "#1f2937";

/**
 * Owns the `activeStep` state and keeps the map and the step list in sync:
 * selecting a step spotlights its pin; selecting a pin activates its step.
 */
export default function WayfinderClient({ config }: WayfinderClientProps) {
  const t = useTranslations("Wayfinder");
  const [activeIndex, setActiveIndex] = useState(0);
  const total = config.steps.length;
  const stepIds = useMemo(() => config.steps.map((step) => step.id), [config.steps]);
  const activePinId = config.steps[activeIndex]?.focusPinId;

  const goTo = (index: number) => setActiveIndex(clampStep(index, total));
  const selectPin = (pinId: string) => {
    const index = stepIndexForPin(config, pinId);
    if (index >= 0) setActiveIndex(index);
  };

  return (
    <div className="flex flex-col gap-6">
      <WayfinderSteps
        stepIds={stepIds}
        activeIndex={activeIndex}
        onSelect={goTo}
        onPrev={() => goTo(activeIndex - 1)}
        onNext={() => goTo(activeIndex + 1)}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
        <WayfinderMap config={config} activeIndex={activeIndex} onSelectPin={selectPin} />
        <div className="relative h-[380px] w-full overflow-hidden rounded-lg border border-border bg-muted sm:h-[460px]">
          <Image
            src="/assets/venue/2026/venue-map.png"
            alt={t("venueMapAlt")}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
          {config.pins.map((pin) => {
            const point = VENUE_IMAGE_POINTS[pin.id];
            if (!point) return null;
            const isActive = pin.id === activePinId;
            const color = pin.color ?? DEFAULT_PIN_COLOR;
            return (
              <button
                key={pin.id}
                type="button"
                onClick={() => selectPin(pin.id)}
                aria-label={t("pinAriaLabel", { role: t(`roles.${pin.id}`), stop: pin.stop })}
                aria-pressed={isActive}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-full transition-transform duration-150",
                  isActive ? "z-10 scale-125" : "z-0 hover:scale-110",
                )}
                style={{ left: `${point[0]}%`, top: `${point[1]}%` }}
              >
                {/* Pulse ring at the pin's tip */}
                <span
                  className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 animate-ping rounded-full opacity-60 motion-reduce:hidden"
                  style={{ backgroundColor: color }}
                />
                <MapPin
                  className="relative h-7 w-7 drop-shadow-md"
                  strokeWidth={1.5}
                  style={{ color: "#ffffff", fill: color }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
