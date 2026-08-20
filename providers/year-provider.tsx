"use client";

import { createContext, useContext } from "react";
import type { ValidYear } from "@/constants/config";

const YearContext = createContext<ValidYear>(2026);

export function YearProvider({ year, children }: { year: ValidYear; children: React.ReactNode }) {
  return <YearContext.Provider value={year}>{children}</YearContext.Provider>;
}

export function useYear(): ValidYear {
  return useContext(YearContext);
}
