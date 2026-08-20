"use client";

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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ValidYear } from "@/constants/config";
import { updateRegistration } from "@/modules/admin/qr-check-ins/actions";

export interface EditableRegistration {
  id: string;
  email: string | null;
  name: string;
  affiliation: string | null;
}

export function EditRegistrationDialog({
  registration,
  year,
  open,
  onOpenChange,
}: {
  registration: EditableRegistration;
  year: ValidYear;
  /** Controlled by the row's actions menu — this dialog renders no trigger of its own. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Admin.qrCheckIns.dialogs");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateRegistration({
        year,
        id: registration.id,
        email: String(formData.get("email") ?? ""),
        name: String(formData.get("name") ?? ""),
        affiliation: String(formData.get("affiliation") ?? ""),
      });
      if (!result.ok) {
        setError(result.error ?? Object.values(result.errors ?? {})[0] ?? t("editError"));
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("editTitle")}</DialogTitle>
            <DialogDescription>{t("editDescription", { year })}</DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-registration-name">{t("name")}</Label>
              <Input
                id="edit-registration-name"
                name="name"
                defaultValue={registration.name}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-registration-email">{t("emailOptional")}</Label>
              <Input
                id="edit-registration-email"
                name="email"
                type="email"
                defaultValue={registration.email ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-registration-affiliation">{t("affiliation")}</Label>
              <Input
                id="edit-registration-affiliation"
                name="affiliation"
                defaultValue={registration.affiliation ?? ""}
              />
            </div>
            {error ? <p className="caption text-destructive">{error}</p> : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
