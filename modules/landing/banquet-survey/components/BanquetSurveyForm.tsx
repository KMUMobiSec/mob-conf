"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { ValidYear } from "@/constants/config";
import { cn } from "@/lib/helpers/utils";
import { submitBanquetSurvey } from "../actions";
import { ALLERGEN_OPTIONS, MAX_ALLERGEN_OTHER_LENGTH, MAX_MESSAGE_LENGTH } from "../lib/constants";
import { type BanquetValues, EMAIL_RE, EMPTY_VALUES, validateBanquet } from "../lib/schema";
import { type BanquetSnapshot, SuccessView } from "./SuccessView";

const ATTENDING_OPTIONS = [
  { value: "yes", label: "Yes, I will attend" },
  { value: "no", label: "No, I cannot attend" },
] as const;

function RequiredMark() {
  return (
    <span className="font-bold text-destructive" aria-hidden="true">
      *
    </span>
  );
}

function omitError(errors: Record<string, string>, key: string): Record<string, string> {
  if (!(key in errors)) return errors;
  const { [key]: _removed, ...rest } = errors;
  return rest;
}

export function BanquetSurveyForm({
  year,
  initialEmail,
  initialName,
  initialAffiliation,
  banquetDate,
  banquetVenue,
}: {
  year: ValidYear;
  initialEmail: string;
  initialName: string;
  initialAffiliation: string;
  banquetDate: string;
  banquetVenue: string;
}) {
  const [values, setValues] = useState<BanquetValues>({
    ...EMPTY_VALUES,
    name: initialName,
    affiliation: initialAffiliation,
    email: initialEmail,
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [tried, setTried] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<BanquetSnapshot | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Lock the email only when the prefilled value is itself valid. A malformed
  // ?email= param stays editable so the attendee can correct it (otherwise the
  // read-only field would fail validation with no way to fix it).
  const emailLocked = EMAIL_RE.test(initialEmail.trim());
  // Lock the name and affiliation whenever they were prefilled from the invitation
  // link (?name= / ?affiliation=), since they come from the registration record.
  const nameLocked = initialName.trim() !== "";
  const affiliationLocked = initialAffiliation.trim() !== "";

  const clearFieldError = (key: string) => setServerFieldErrors((prev) => omitError(prev, key));

  const set = <K extends keyof BanquetValues>(key: K, val: BanquetValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    clearFieldError(key);
  };
  const touch = (key: string) => setTouched((prev) => ({ ...prev, [key]: true }));

  const { valid, errors } = useMemo(() => validateBanquet(values), [values]);
  const displayErrors = useMemo(
    () => ({ ...errors, ...serverFieldErrors }),
    [errors, serverFieldErrors],
  );
  const showErr = (key: string) => (touched[key] || tried ? displayErrors[key] : undefined);

  const attending = values.attending === "yes";

  const toggleAllergen = (id: string, checked: boolean) => {
    clearFieldError("allergens");
    touch("allergens");
    setValues((prev) => {
      const next = new Set(prev.allergens);
      if (checked) next.add(id);
      else next.delete(id);
      // Keep the canonical option order for a stable, readable recap.
      return {
        ...prev,
        allergens: ALLERGEN_OPTIONS.map((o) => o.value).filter((v) => next.has(v)),
      };
    });
  };

  function buildFormData(): FormData {
    const fd = new FormData();
    fd.set("year", String(year));
    fd.set("company", honeypot);
    fd.set("name", values.name);
    fd.set("affiliation", values.affiliation);
    fd.set("email", values.email);
    fd.set("attending", values.attending);
    fd.set("allergens", JSON.stringify(attending ? values.allergens : []));
    fd.set("allergen_other", attending ? values.allergenOther : "");
    fd.set("message", attending ? values.message : "");
    return fd;
  }

  function scrollFirstInvalid() {
    requestAnimationFrame(() => {
      const firstInvalid = formRef.current?.querySelector<HTMLElement>(
        '[data-invalid="true"], [aria-invalid="true"]',
      );
      firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTried(true);
    setServerError(null);
    setServerFieldErrors({});
    if (!valid) {
      scrollFirstInvalid();
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitBanquetSurvey(buildFormData());
      if (result.ok) {
        setSubmitted({
          values: { ...values },
          banquetDate,
          banquetVenue,
          emailed: result.emailed ?? false,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setServerFieldErrors(result.errors ?? {});
        setServerError(result.message ?? "Please correct the highlighted fields and try again.");
        scrollFirstInvalid();
      }
    } catch {
      setServerError(
        "Your response could not be submitted. Please try again. If this happens again, contact the EBISION team.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setValues({
      ...EMPTY_VALUES,
      name: initialName,
      affiliation: initialAffiliation,
      email: initialEmail,
    });
    setTouched({});
    setTried(false);
    setHoneypot("");
    setServerFieldErrors({});
    setServerError(null);
    setSubmitted(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submitted) {
    return <SuccessView snapshot={submitted} onReset={reset} />;
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <Card className="gap-0 overflow-hidden p-0">
        <section className="flex flex-col gap-4 border-b border-border px-5 py-6 sm:px-8">
          <Field data-invalid={showErr("name") ? true : undefined}>
            <FieldLabel htmlFor="name">
              Full name
              <RequiredMark />
            </FieldLabel>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Enter your full name"
              value={values.name}
              readOnly={nameLocked}
              aria-invalid={showErr("name") ? true : undefined}
              className={nameLocked ? "bg-muted/50 text-muted-foreground" : undefined}
              onChange={(event) => set("name", event.target.value)}
              onBlur={() => touch("name")}
            />
            <FieldError>{showErr("name")}</FieldError>
          </Field>

          <Field data-invalid={showErr("affiliation") ? true : undefined}>
            <FieldLabel htmlFor="affiliation">
              Affiliation / institution
              <RequiredMark />
            </FieldLabel>
            <Input
              id="affiliation"
              placeholder="Enter your affiliation or institution"
              value={values.affiliation}
              readOnly={affiliationLocked}
              aria-invalid={showErr("affiliation") ? true : undefined}
              className={affiliationLocked ? "bg-muted/50 text-muted-foreground" : undefined}
              onChange={(event) => set("affiliation", event.target.value)}
              onBlur={() => touch("affiliation")}
            />
            <FieldError>{showErr("affiliation")}</FieldError>
          </Field>

          <Field data-invalid={showErr("email") ? true : undefined}>
            <FieldLabel htmlFor="email">
              Email
              <RequiredMark />
            </FieldLabel>
            {emailLocked && (
              <FieldDescription>This RSVP is linked to your registration email.</FieldDescription>
            )}
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={values.email}
              readOnly={emailLocked}
              aria-invalid={showErr("email") ? true : undefined}
              className={emailLocked ? "bg-muted/50 text-muted-foreground" : undefined}
              onChange={(event) => set("email", event.target.value)}
              onBlur={() => touch("email")}
            />
            <FieldError>{showErr("email")}</FieldError>
          </Field>
        </section>

        <section className="flex flex-col gap-4 border-b border-border px-5 py-6 sm:px-8">
          <Field data-invalid={showErr("attending") ? true : undefined}>
            <FieldLabel>
              Are you attending the banquet on {banquetDate} at {banquetVenue}?
              <RequiredMark />
            </FieldLabel>
            <RadioGroup
              className="flex flex-wrap gap-3"
              value={values.attending}
              onValueChange={(val) => {
                set("attending", val as BanquetValues["attending"]);
                touch("attending");
              }}
            >
              {ATTENDING_OPTIONS.map((option) => (
                <Label
                  key={option.value}
                  className={cn(
                    "cursor-pointer rounded-md border px-3.5 py-2.5 text-sm font-normal transition-colors hover:border-primary",
                    values.attending === option.value ? "border-primary bg-accent" : "border-input",
                  )}
                >
                  <RadioGroupItem value={option.value} />
                  {option.label}
                </Label>
              ))}
            </RadioGroup>
            <FieldError>{showErr("attending")}</FieldError>
          </Field>

          {attending && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-1">
              <Field data-invalid={showErr("allergens") ? true : undefined}>
                <FieldLabel>Allergens and dietary needs</FieldLabel>
                <FieldDescription>Select any that apply so we can plan the menu.</FieldDescription>
                <div className="flex flex-wrap gap-3">
                  {ALLERGEN_OPTIONS.map((option) => {
                    const checked = values.allergens.includes(option.value);
                    return (
                      <Label
                        key={option.value}
                        className={cn(
                          "cursor-pointer rounded-md border px-3.5 py-2.5 text-sm font-normal transition-colors hover:border-primary",
                          checked ? "border-primary bg-accent" : "border-input",
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(state) => toggleAllergen(option.value, state === true)}
                        />
                        {option.label}
                      </Label>
                    );
                  })}
                </div>
                <FieldError>{showErr("allergens")}</FieldError>
              </Field>

              <Field data-invalid={showErr("allergenOther") ? true : undefined}>
                <FieldLabel htmlFor="allergen_other">Other dietary notes</FieldLabel>
                <FieldDescription>
                  Anything else we should know about your dietary needs.
                </FieldDescription>
                <Input
                  id="allergen_other"
                  placeholder="e.g. low sodium, kosher, halal"
                  value={values.allergenOther}
                  maxLength={MAX_ALLERGEN_OTHER_LENGTH}
                  aria-invalid={showErr("allergenOther") ? true : undefined}
                  onChange={(event) => set("allergenOther", event.target.value)}
                  onBlur={() => touch("allergenOther")}
                />
                <FieldError>{showErr("allergenOther")}</FieldError>
              </Field>

              <Field data-invalid={showErr("message") ? true : undefined}>
                <FieldLabel htmlFor="message">A message for us</FieldLabel>
                <FieldDescription>
                  Optional. Share anything you would like us to know.
                </FieldDescription>
                <Textarea
                  id="message"
                  className="min-h-28"
                  placeholder="Your message…"
                  value={values.message}
                  maxLength={MAX_MESSAGE_LENGTH}
                  aria-invalid={showErr("message") ? true : undefined}
                  onChange={(event) => set("message", event.target.value)}
                  onBlur={() => touch("message")}
                />
                <p className="body text-right text-xs text-muted-foreground">
                  {values.message.trim().length} / {MAX_MESSAGE_LENGTH} characters
                </p>
                <FieldError>{showErr("message")}</FieldError>
              </Field>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4 px-5 py-6 sm:px-8">
          {tried && !valid && (
            <div className="rounded-md border border-destructive/35 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
              Please correct the highlighted fields before submitting.
            </div>
          )}
          {serverError && (
            <div className="rounded-md border border-destructive/35 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          {/* Honeypot — must remain empty */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden"
          >
            <label>
              Company
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3.5">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit RSVP"}
            </Button>
            <Button type="button" variant="ghost" onClick={reset} disabled={submitting}>
              Clear form
            </Button>
            <span className="text-xs text-muted-foreground">* required</span>
          </div>
        </section>
      </Card>
    </form>
  );
}
