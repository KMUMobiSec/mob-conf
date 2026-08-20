"use client";

import { CookiesProvider as ReactCookiesProvider } from "react-cookie";

export function CookieProvider({ children }: { children: React.ReactNode }) {
  return <ReactCookiesProvider>{children}</ReactCookiesProvider>;
}
