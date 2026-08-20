"use client";

import { Loader2, Mail, MoreVertical, Pencil, RotateCcw, UserCheck } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ValidYear } from "@/constants/config";
import {
  sendRegistrationQrPass,
  setRegistrationCheckIn,
} from "@/modules/admin/qr-check-ins/actions";
import { EditRegistrationDialog } from "./EditRegistrationDialog";

export interface RowActionsRegistration {
  id: string;
  email: string | null;
  name: string;
  affiliation: string | null;
  /** ISO check-in time, or null when not yet checked in. Drives the toggle direction. */
  checkedInAt: string | null;
}

/**
 * Per-row actions menu (⋮): the manual check-in toggle, edit, and send-QR, collapsed into one
 * dropdown so the table row stays clean. Undoing a real check-in is guarded by a confirm dialog;
 * marking checked-in is one click. Feedback bubbles up to the table's shared message line via
 * `onMessage`. The Edit and confirm dialogs render as siblings of the menu (not inside it) so Radix
 * can hand focus cleanly from the closing menu to the opening dialog.
 */
export function RegistrationRowActions({
  registration,
  year,
  testMode,
  disabled = false,
  onMessage,
}: {
  registration: RowActionsRegistration;
  year: ValidYear;
  testMode: boolean;
  /** Disabled while a bulk send is running, to avoid overlapping writes. */
  disabled?: boolean;
  onMessage: (message: string) => void;
}) {
  const t = useTranslations("Admin.qrCheckIns.registrations");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmUncheckOpen, setConfirmUncheckOpen] = useState(false);

  const isCheckedIn = registration.checkedInAt !== null;
  const canSend = Boolean(registration.email) || testMode;

  function checkIn() {
    onMessage("");
    startTransition(async () => {
      const result = await setRegistrationCheckIn({ year, id: registration.id, checkedIn: true });
      onMessage(
        result.ok
          ? t("checkInSuccess", { name: registration.name })
          : (result.error ?? t("checkInError")),
      );
      router.refresh();
    });
  }

  function confirmUncheck() {
    onMessage("");
    startTransition(async () => {
      const result = await setRegistrationCheckIn({ year, id: registration.id, checkedIn: false });
      onMessage(result.ok ? t("undoSuccess") : (result.error ?? t("undoError")));
      setConfirmUncheckOpen(false);
      router.refresh();
    });
  }

  function send() {
    onMessage("");
    startTransition(async () => {
      const result = await sendRegistrationQrPass({ year, id: registration.id });
      onMessage(
        result.ok
          ? t("sendOneSuccess")
          : (result.failures[0]?.error ?? result.error ?? t("sendOneError")),
      );
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled || isPending}
            aria-label={t("actionsMenuLabel", { name: registration.name })}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MoreVertical className="size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isCheckedIn ? (
            // Defer opening the confirm dialog until the menu has closed, so focus lands in the
            // dialog rather than snapping back to the trigger (Radix menu→dialog focus race).
            <DropdownMenuItem onSelect={() => setTimeout(() => setConfirmUncheckOpen(true), 0)}>
              <RotateCcw className="size-4" />
              {t("undoCheckIn")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={checkIn}>
              <UserCheck className="size-4" />
              {t("markCheckedIn")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setTimeout(() => setEditOpen(true), 0)}>
            <Pencil className="size-4" />
            {t("editAction")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={send} disabled={!canSend}>
            <Mail className="size-4" />
            {t("send")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditRegistrationDialog
        registration={{
          id: registration.id,
          email: registration.email,
          name: registration.name,
          affiliation: registration.affiliation,
        }}
        year={year}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={confirmUncheckOpen} onOpenChange={setConfirmUncheckOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmUncheckTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmUncheckDescription", { name: registration.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{t("confirmCancel")}</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmUncheck} disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RotateCcw className="size-4" />
              )}
              {t("confirmUncheckAction")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
