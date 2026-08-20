"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ValidYear } from "@/constants/config";
import { createRegistration } from "@/modules/admin/qr-check-ins/actions";

export function AddRegistrationDialog({ year }: { year: ValidYear }) {
  const t = useTranslations("Admin.qrCheckIns.dialogs");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createRegistration({
        year,
        email: String(formData.get("email") ?? ""),
        name: String(formData.get("name") ?? ""),
        affiliation: String(formData.get("affiliation") ?? ""),
      });
      if (!result.ok) {
        setError(result.error ?? Object.values(result.errors ?? {})[0] ?? t("addError"));
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          {t("addButton")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("addTitle")}</DialogTitle>
            <DialogDescription>{t("addDescription", { year })}</DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="registration-name">{t("name")}</Label>
              <Input id="registration-name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="registration-email">{t("emailOptional")}</Label>
              <Input id="registration-email" name="email" type="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="registration-affiliation">{t("affiliation")}</Label>
              <Input id="registration-affiliation" name="affiliation" />
            </div>
            {error ? <p className="caption text-destructive">{error}</p> : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("adding") : t("add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
