import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminAccessSession } from "@/lib/auth/admin-access";
import { isAdminSession } from "@/lib/auth/admin-access";
import { auth } from "@/lib/auth/server";

export async function getCurrentSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function getCurrentAdminSession() {
  const session = await getCurrentSession();

  if (!session || !isAdminSession(session as AdminAccessSession)) {
    return null;
  }

  return session;
}

export async function requireAdminSession() {
  const session = await getCurrentSession();

  if (!session || !isAdminSession(session as AdminAccessSession)) {
    redirect("/admin/login");
  }

  return session;
}

export async function redirectAdminFromLogin() {
  const session = await getCurrentSession();

  if (isAdminSession(session as AdminAccessSession)) {
    redirect("/admin");
  }
}
