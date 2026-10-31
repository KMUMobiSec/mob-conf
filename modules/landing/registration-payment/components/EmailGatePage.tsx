"use client";

import { Mail } from "lucide-react";
import { useState } from "react";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ValidYear } from "@/constants/config";
import { requestRegistrationLink } from "../actions";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

const EmailGatePage = ({
  year,
  labels,
}: {
  year: ValidYear;
  labels: {
    title: string;
    subtitle: string;
    fieldLabel: string;
    submit: string;
    submitting: string;
    sentTitle: string;
    sentDescription: string;
  };
}) => {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("year", String(year));
      fd.set("email", email);
      fd.set("company", honeypot);
      fd.set("cf-turnstile-response", token);
      const result = await requestRegistrationLink(fd);
      if (!result.ok) {
        setError(result.message ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col px-4 sm:px-8 lg:px-12 py-16 sm:py-24">
      <div className="max-w-md mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="title text-foreground">{labels.title}</h1>
          <p className="body text-muted-foreground">{labels.subtitle}</p>
        </div>

        <Card className="p-6 sm:p-8">
          {sent ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <Mail className="h-8 w-8 text-primary" />
              <h2 className="subheading text-foreground">{labels.sentTitle}</h2>
              <p className="body text-muted-foreground">
                {labels.sentDescription.replace("{email}", email)}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
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

              <Field>
                <FieldLabel htmlFor="email">{labels.fieldLabel}</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </Field>

              {SITE_KEY && <TurnstileWidget siteKey={SITE_KEY} onToken={setToken} />}

              {error && <FieldError>{error}</FieldError>}

              <Button type="submit" disabled={submitting || !email} className="w-full">
                {submitting ? labels.submitting : labels.submit}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EmailGatePage;
