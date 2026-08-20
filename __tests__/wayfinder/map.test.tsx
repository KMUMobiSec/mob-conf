import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { kookminWayfinder } from "@/constants/wayfinder";

const markerCtor = vi.fn();
const mapCtor = vi.fn();

vi.mock("mapbox-gl/dist/mapbox-gl.css", () => ({}));
vi.mock("mapbox-gl", () => {
  class LngLatBounds {
    extend() {
      return this;
    }
  }
  const Marker = vi.fn().mockImplementation(() => {
    markerCtor();
    const marker: Record<string, unknown> = {};
    marker.setLngLat = vi.fn(() => marker);
    marker.setPopup = vi.fn(() => marker);
    marker.addTo = vi.fn(() => marker);
    marker.getElement = () => document.createElement("button");
    marker.remove = vi.fn();
    return marker;
  });
  const Popup = vi.fn().mockImplementation(() => {
    const popup: Record<string, unknown> = {};
    popup.setText = vi.fn(() => popup);
    popup.setLngLat = vi.fn(() => popup);
    popup.addTo = vi.fn(() => popup);
    return popup;
  });
  const MapMock = vi.fn().mockImplementation(() => {
    mapCtor();
    return {
      addControl: vi.fn(),
      on: (event: string, cb: () => void) => {
        if (event === "load") cb();
      },
      remove: vi.fn(),
      easeTo: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn(),
      getLayer: vi.fn(),
      getSource: vi.fn(),
      setPaintProperty: vi.fn(),
      fitBounds: vi.fn(),
    };
  });
  return {
    default: {
      accessToken: "",
      Map: MapMock,
      Marker,
      Popup,
      NavigationControl: vi.fn(),
      LngLatBounds,
    },
  };
});

// Imported after the mock is registered.
import WayfinderMap from "@/modules/landing/home/components/wayfinder/WayfinderMap";

describe("WayfinderMap", () => {
  beforeEach(() => {
    markerCtor.mockClear();
    mapCtor.mockClear();
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 0),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("initializes one map and one marker per pin", () => {
    render(<WayfinderMap config={kookminWayfinder} activeIndex={0} onSelectPin={() => {}} />);
    expect(mapCtor).toHaveBeenCalledTimes(1);
    expect(markerCtor).toHaveBeenCalledTimes(kookminWayfinder.pins.length);
  });
});
