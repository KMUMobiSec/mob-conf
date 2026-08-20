import type { ReactNode } from "react";
import { AdminHeaderTitle } from "@/app/admin/(protected)/AdminHeaderTitle";
import { AdminSidebar } from "@/app/admin/(protected)/AdminSidebar";
import { CookieProvider } from "@/components/cookie-provider";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { requireAdminSession } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminSession();
  const user = { name: session.user.name, email: session.user.email };

  return (
    <CookieProvider>
      <SidebarProvider>
        <AdminSidebar user={user} />
        {/* App shell capped to the viewport: the header stays put and the content area is the
            scroll boundary (min-h-0 lets a fill-height child, e.g. a table, scroll internally
            instead of growing the page). Normal pages still scroll here as usual. */}
        <SidebarInset className="h-svh overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <AdminHeaderTitle />
            {/* Right-aligned slot pages portal per-route actions into (e.g. QR check-in test mode). */}
            <div id="admin-header-actions" className="ml-auto flex items-center gap-2" />
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </CookieProvider>
  );
}
