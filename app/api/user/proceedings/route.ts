import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isValidYear } from "@/constants/config";
import { getProceedingDetail } from "@/lib/proceedings";
import { isProceedingsAuthenticated } from "@/lib/proceedings-auth";

export async function GET(request: NextRequest) {
  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? Number.parseInt(yearParam, 10) : null;

  if (!year || !isValidYear(year)) {
    return NextResponse.json({ ok: false, error: "Invalid or missing year" }, { status: 400 });
  }

  if (!isProceedingsAuthenticated(request, year)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const proceedingId = `ebision-${year}`;
  const result = getProceedingDetail(year, proceedingId);
  if (!result.proceedingPeriod) {
    return NextResponse.json({
      ok: true,
      proceedingPeriod: null,
      period: null,
      papers: [],
    });
  }

  return NextResponse.json({
    ok: true,
    proceedingPeriod: result.proceedingPeriod,
    period: result.period,
    papers: result.papers,
  });
}
