import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isValidYear } from "@/constants/config";
import { getProceedingPeriods } from "@/lib/proceedings";

/** Public endpoint - returns list of proceeding cards (no auth required). */
export async function GET(request: NextRequest) {
  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? Number.parseInt(yearParam, 10) : null;

  if (!year || !isValidYear(year)) {
    return NextResponse.json({ ok: false, error: "Invalid or missing year" }, { status: 400 });
  }

  const proceedingPeriods = getProceedingPeriods(year);
  return NextResponse.json({ ok: true, proceedingPeriods });
}
