import { getTranslations } from "next-intl/server";
import { AdminLoginForm } from "@/app/admin/login/AdminLoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirectAdminFromLogin } from "@/lib/auth/session";

export default async function AdminLoginPage() {
  await redirectAdminFromLogin();
  const t = await getTranslations("Admin.login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-sm rounded-lg">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminLoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
