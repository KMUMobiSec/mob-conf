import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isValidYear } from "@/constants/config";
import {
  createProceedingsToken,
  getProceedingsAuthCookie,
  getProceedingsCookieName,
  getProceedingsPassword,
  isProceedingsPasswordRequired,
  PROCEEDINGS_AUTH_MAX_AGE,
  verifyProceedingsToken,
} from "@/lib/proceedings-auth";

export async function POST(request: NextRequest) {
  let body: { password?: string; year?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const year = Number(body.year);
  if (!isValidYear(year)) {
    return NextResponse.json({ ok: false, error: "Invalid or missing year" }, { status: 400 });
  }

  if (!isProceedingsPasswordRequired(year)) {
    return NextResponse.json(
      { ok: false, error: "Proceeding access is not configured" },
      { status: 503 },
    );
  }

  const password = getProceedingsPassword(year);
  const submitted = body.password ?? "";
  if (submitted !== password) {
    return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
  }

  const token = createProceedingsToken(year);
  if (!token) {
    return NextResponse.json({ ok: false, error: "Unable to create session" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getProceedingsCookieName(year), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PROCEEDINGS_AUTH_MAX_AGE,
    path: "/",
  });
  return response;
}

export async function GET(request: NextRequest) {
  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? Number.parseInt(yearParam, 10) : null;
  if (!year || !isValidYear(year)) {
    return NextResponse.json({ ok: false, error: "Invalid or missing year" }, { status: 400 });
  }

  const required = isProceedingsPasswordRequired(year);
  const cookie = getProceedingsAuthCookie(request, year);
  const authenticated = !required || verifyProceedingsToken(cookie, year);
  return NextResponse.json({ ok: true, authenticated, required });
}
