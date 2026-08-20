"use client";

import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Portal a page's actions into the admin header's right-aligned slot (#admin-header-actions, rendered
 * by the layout). Only the page that renders this fills the slot, so header actions stay per-route
 * without the shared header needing to know about any specific page. Client-only: the actions appear
 * on mount (a frame after hydration), which is fine for admin controls.
 */
export function HeaderActionsSlot({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById("admin-header-actions"));
  }, []);

  if (!target) return null;
  return createPortal(children, target);
}
