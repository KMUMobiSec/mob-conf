import { describe, expect, it } from "vitest";
import { getAdminAccessRedirect, isAdminSession } from "@/lib/auth/admin-access";

describe("admin access helpers", () => {
  it("allows only unbanned admin-role sessions", () => {
    expect(isAdminSession({ user: { role: "admin", banned: false } })).toBe(true);
    expect(isAdminSession({ user: { role: "admin", banned: null } })).toBe(true);
    expect(isAdminSession({ user: { role: "user", banned: false } })).toBe(false);
    expect(isAdminSession({ user: { role: undefined, banned: false } })).toBe(false);
    expect(isAdminSession({ user: { role: "admin", banned: true } })).toBe(false);
    expect(isAdminSession(null)).toBe(false);
  });

  it("returns the correct redirect target for admin routes", () => {
    const adminSession = { user: { role: "admin", banned: false } };

    expect(getAdminAccessRedirect(null, "/admin")).toBe("/admin/login");
    expect(getAdminAccessRedirect({ user: { role: "user" } }, "/admin")).toBe("/admin/login");
    expect(getAdminAccessRedirect(adminSession, "/admin/login")).toBe("/admin");
    expect(getAdminAccessRedirect(adminSession, "/admin")).toBeNull();
  });
});
