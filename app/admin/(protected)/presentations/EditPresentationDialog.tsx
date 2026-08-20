"use client";

import { Loader2, Pencil } from "lucide-react";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  type UpdatePresentationInput,
  updatePresentation,
} from "@/modules/admin/presentations/actions";

export interface EditPresentationDialogProps {
  id: string;
  initial: UpdatePresentationInput;
  /** When true, the submission has an uploaded video, so the link is not editable. */
  hasUploadedVideo: boolean;
}

export function EditPresentationDialog({
  id,
  initial,
  hasUploadedVideo,
}: EditPresentationDialogProps) {
  const t = useTranslations("Admin.presentations.actions");
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<UpdatePresentationInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const set = (key: keyof UpdatePresentationInput, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
  };

  function onSave() {
    setFormError(null);
    setErrors({});
    startTransition(async () => {
      const result = await updatePresentation(id, values);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setErrors(result.errors ?? {});
        setFormError(result.error ?? t("saveError"));
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setValues(initial);
          setErrors({});
          setFormError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Pencil className="size-4" />
          {t("edit")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editTitle")}</DialogTitle>
          <DialogDescription>{t("editDescription")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Field data-invalid={errors.paperNumber ? true : undefined}>
            <FieldLabel htmlFor="edit-paper">{t("fields.paperNumber")}</FieldLabel>
            <Input
              id="edit-paper"
              value={values.paperNumber}
              aria-invalid={errors.paperNumber ? true : undefined}
              onChange={(e) => set("paperNumber", e.target.value)}
            />
            <FieldError>{errors.paperNumber}</FieldError>
          </Field>
          <Field data-invalid={errors.title ? true : undefined}>
            <FieldLabel htmlFor="edit-title">{t("fields.title")}</FieldLabel>
            <Input
              id="edit-title"
              value={values.title}
              aria-invalid={errors.title ? true : undefined}
              onChange={(e) => set("title", e.target.value)}
            />
            <FieldError>{errors.title}</FieldError>
          </Field>
          <Field data-invalid={errors.contactEmail ? true : undefined}>
            <FieldLabel htmlFor="edit-email">{t("fields.contactEmail")}</FieldLabel>
            <Input
              id="edit-email"
              type="email"
              value={values.contactEmail}
              aria-invalid={errors.contactEmail ? true : undefined}
              onChange={(e) => set("contactEmail", e.target.value)}
            />
            <FieldError>{errors.contactEmail}</FieldError>
          </Field>
          <Field data-invalid={errors.videoUrl ? true : undefined}>
            <FieldLabel htmlFor="edit-video">{t("fields.videoLink")}</FieldLabel>
            <Input
              id="edit-video"
              type="url"
              placeholder={t("videoPlaceholder")}
              value={values.videoUrl}
              disabled={hasUploadedVideo}
              aria-invalid={errors.videoUrl ? true : undefined}
              onChange={(e) => set("videoUrl", e.target.value)}
            />
            {hasUploadedVideo && (
              <span className="text-xs text-muted-foreground">{t("uploadedVideoHint")}</span>
            )}
            <FieldError>{errors.videoUrl}</FieldError>
          </Field>
          {formError && <span className="text-sm text-destructive">{formError}</span>}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            {t("cancel")}
          </Button>
          <Button type="button" onClick={onSave} disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("saving")}
              </>
            ) : (
              t("saveChanges")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
