export type AdminAccessSession = {
  user?: {
    role?: string | null;
    banned?: boolean | null;
  } | null;
} | null;

export function isAdminSession(session: AdminAccessSession): boolean {
  return session?.user?.role === "admin" && session.user.banned !== true;
}

export function getAdminAccessRedirect(
  session: AdminAccessSession,
  pathname: "/admin" | "/admin/login",
): "/admin" | "/admin/login" | null {
  const isAdmin = isAdminSession(session);

  if (!isAdmin && pathname === "/admin") return "/admin/login";
  if (isAdmin && pathname === "/admin/login") return "/admin";
  return null;
}
