"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deletePresentation } from "@/modules/admin/presentations/actions";

const CONFIRM_WORD = "confirm";

export function DeletePresentationDialog({ id, title }: { id: string; title: string }) {
  const t = useTranslations("Admin.presentations.actions");
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const confirmed = text === CONFIRM_WORD;

  function onDelete() {
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      const result = await deletePresentation(id);
      if (result.ok) {
        router.push("/admin/presentations");
        router.refresh();
      } else {
        setError(result.error ?? t("deleteError"));
      }
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setText("");
          setError(null);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive">
          <Trash2 className="size-4" />
          {t("deletePresentation")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deletePresentationTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deletePresentationDescription", { title, confirmWord: CONFIRM_WORD })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-delete">{t("typeConfirm", { confirmWord: CONFIRM_WORD })}</Label>
          <Input
            id="confirm-delete"
            value={text}
            autoComplete="off"
            placeholder={CONFIRM_WORD}
            onChange={(event) => setText(event.target.value)}
          />
          {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t("cancel")}</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={!confirmed || pending}
            onClick={onDelete}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("deleting")}
              </>
            ) : (
              t("deletePermanently")
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
