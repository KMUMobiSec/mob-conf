"use client";

import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth/client";

export function AdminLoginForm() {
  const t = useTranslations("Admin.login");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: "/admin",
      });

      if (result.error) {
        setError(result.error.message ?? t("error"));
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="admin-email">{t("email")}</Label>
        <Input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(error) || undefined}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-password">{t("password")}</Label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(error) || undefined}
        />
      </div>
      {error ? (
        <p className="caption text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button className="w-full" type="submit" disabled={isSubmitting}>
        <LogIn aria-hidden="true" />
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
