"use client";

import { Eraser, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  clearBanquetResponse,
  updateBanquetResponse,
} from "@/modules/admin/banquet-survey/actions";
import type { EditAttending } from "@/modules/admin/banquet-survey/lib/edit";
import { ALLERGEN_OPTIONS } from "@/modules/landing/banquet-survey/lib/constants";

/** Minimal row shape the dialog edits — structurally satisfied by the table's row type. */
export interface EditableBanquetRow {
  id: string;
  name: string;
  affiliation: string | null;
  email: string;
  attending: boolean;
  respondedAt: string | null;
  allergens: string[];
  allergenOther: string | null;
  message: string | null;
}

type AttendingUi = "invited" | "yes" | "no";

function initialAttending(row: EditableBanquetRow): AttendingUi {
  if (!row.respondedAt) return "invited";
  return row.attending ? "yes" : "no";
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export function EditResponseDialog({
  row,
  year,
  open,
  onOpenChange,
  onSaved,
}: {
  row: EditableBanquetRow | null;
  year: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [email, setEmail] = useState("");
  const [attending, setAttending] = useState<AttendingUi>("invited");
  const [allergens, setAllergens] = useState<string[]>([]);
  const [allergenOther, setAllergenOther] = useState("");
  const [message, setMessage] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [pendingAction, setPendingAction] = useState<"save" | "clear" | null>(null);
  const [isPending, startTransition] = useTransition();

  // Re-seed the form whenever a different row is opened.
  useEffect(() => {
    if (!row) return;
    setName(row.name);
    setAffiliation(row.affiliation ?? "");
    setEmail(row.email);
    setAttending(initialAttending(row));
    setAllergens(row.allergens);
    setAllergenOther(row.allergenOther ?? "");
    setMessage(row.message ?? "");
    setFieldErrors({});
    setError(null);
  }, [row]);

  if (!row) return null;

  const attendingValue: EditAttending = attending === "invited" ? "" : attending;

  function toggleAllergen(value: string, checked: boolean) {
    setAllergens((current) => (checked ? [...current, value] : current.filter((a) => a !== value)));
  }

  function save() {
    if (!row) return;
    setError(null);
    setFieldErrors({});
    setPendingAction("save");
    startTransition(async () => {
      const result = await updateBanquetResponse({
        year,
        id: row.id,
        values: {
          name,
          affiliation,
          email,
          attending: attendingValue,
          allergens,
          allergenOther,
          message,
        },
      });
      setPendingAction(null);
      if (result.ok) {
        onOpenChange(false);
        onSaved();
      } else {
        setFieldErrors(result.fieldErrors ?? {});
        setError(result.error ?? null);
      }
    });
  }

  function clearAnswers() {
    if (!row) return;
    setConfirmClear(false);
    setError(null);
    setPendingAction("clear");
    startTransition(async () => {
      const result = await clearBanquetResponse({ year, id: row.id });
      setPendingAction(null);
      if (result.ok) {
        onOpenChange(false);
        onSaved();
      } else {
        setError(result.error ?? "Could not clear answers.");
      }
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit banquet response</DialogTitle>
            <DialogDescription>
              Update this person's details or attendance. Use “Clear answers” to reset a test
              account back to Invited.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="banquet-name">Name</Label>
              <Input id="banquet-name" value={name} onChange={(e) => setName(e.target.value)} />
              <FieldError message={fieldErrors.name} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="banquet-affiliation">Affiliation</Label>
              <Input
                id="banquet-affiliation"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
              />
              <FieldError message={fieldErrors.affiliation} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="banquet-email">Email</Label>
              <Input
                id="banquet-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <FieldError message={fieldErrors.email} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Attendance</Label>
              <RadioGroup
                value={attending}
                onValueChange={(value) => setAttending(value as AttendingUi)}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="invited" id="attending-invited" />
                  <Label htmlFor="attending-invited" className="font-normal">
                    Invited (no response yet)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="yes" id="attending-yes" />
                  <Label htmlFor="attending-yes" className="font-normal">
                    Attending
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id="attending-no" />
                  <Label htmlFor="attending-no" className="font-normal">
                    Not attending
                  </Label>
                </div>
              </RadioGroup>
              <FieldError message={fieldErrors.attending} />
            </div>

            {attending === "yes" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label>Allergens / dietary</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALLERGEN_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`allergen-${option.value}`}
                          checked={allergens.includes(option.value)}
                          onCheckedChange={(checked) =>
                            toggleAllergen(option.value, checked === true)
                          }
                        />
                        <Label htmlFor={`allergen-${option.value}`} className="font-normal">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <FieldError message={fieldErrors.allergens} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="banquet-allergen-other">Other dietary note</Label>
                  <Textarea
                    id="banquet-allergen-other"
                    value={allergenOther}
                    onChange={(e) => setAllergenOther(e.target.value)}
                    rows={2}
                  />
                  <FieldError message={fieldErrors.allergenOther} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="banquet-message">Message for organizers</Label>
                  <Textarea
                    id="banquet-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                  <FieldError message={fieldErrors.message} />
                </div>
              </>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmClear(true)}
              disabled={isPending}
            >
              {pendingAction === "clear" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Eraser className="size-4" />
              )}
              Clear answers
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="button" onClick={save} disabled={isPending}>
                {pendingAction === "save" && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear this response?</AlertDialogTitle>
            <AlertDialogDescription>
              This resets {row.name} back to Invited — attendance, allergens, and message are
              cleared, and they drop out of the attending and dietary counts. Their name, email, and
              email history are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={clearAnswers} disabled={isPending}>
              Clear answers
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
