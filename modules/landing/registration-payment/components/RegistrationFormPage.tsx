"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ValidYear } from "@/constants/config";
import { COUNTRIES } from "@/constants/countries";
import { submitRegistration } from "../actions";
import type { RegistrationCategory } from "../lib/categories";

export interface RegistrationFormLabels {
  subtitle: string;
  fields: {
    firstName: string;
    lastName: string;
    affiliation: string;
    phoneNumber: string;
    country: string;
    countryPlaceholder: string;
    category: string;
    paperId: string;
    paperTitle: string;
    billingHeading: string;
    billingOrganization: string;
    billingDepartment: string;
    billingAddress: string;
    billingCity: string;
    billingState: string;
    billingZipCode: string;
    billingCountry: string;
    billingVatNumber: string;
    billingContactName: string;
  };
  priceSummary: string;
  submit: string;
  submitting: string;
}

const RegistrationFormPage = ({
  year,
  token,
  email,
  categories,
  labels,
}: {
  year: ValidYear;
  token: string;
  email: string;
  categories: RegistrationCategory[];
  labels: RegistrationFormLabels;
}) => {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("");
  const [categoryName, setCategoryName] = useState(categories[0]?.name ?? "");
  const [paperId, setPaperId] = useState("");
  const [paperTitle, setPaperTitle] = useState("");
  const [billing, setBilling] = useState({
    billingOrganization: "",
    billingDepartment: "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingZipCode: "",
    billingCountry: "",
    billingVatNumber: "",
    billingContactName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.name === categoryName),
    [categories, categoryName],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setServerError(null);
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("token", token);
      fd.set("firstName", firstName);
      fd.set("lastName", lastName);
      fd.set("affiliation", affiliation);
      fd.set("phoneNumber", phoneNumber);
      fd.set("country", country);
      fd.set("category", categoryName);
      fd.set("paperId", paperId);
      fd.set("paperTitle", paperTitle);
      for (const [key, value] of Object.entries(billing)) fd.set(key, value);

      const result = await submitRegistration(fd);
      if (!result.ok) {
        setErrors(result.errors ?? {});
        setServerError(result.message ?? "Something went wrong. Please try again.");
        return;
      }
      router.push(
        `/${year}/registration-payment/success?invoice=${result.invoiceToken}&email=${encodeURIComponent(email)}`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col px-4 sm:px-8 lg:px-12 py-16 sm:py-24">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
        <p className="body text-muted-foreground text-center">
          {labels.subtitle.replace("{email}", email)}
        </p>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field data-invalid={Boolean(errors.firstName)}>
                <FieldLabel htmlFor="firstName">{labels.fields.firstName}</FieldLabel>
                <Input
                  id="firstName"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <FieldError>{errors.firstName}</FieldError>
              </Field>
              <Field data-invalid={Boolean(errors.lastName)}>
                <FieldLabel htmlFor="lastName">{labels.fields.lastName}</FieldLabel>
                <Input
                  id="lastName"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <FieldError>{errors.lastName}</FieldError>
              </Field>
            </div>

            <Field data-invalid={Boolean(errors.affiliation)}>
              <FieldLabel htmlFor="affiliation">{labels.fields.affiliation}</FieldLabel>
              <Input
                id="affiliation"
                required
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
              />
              <FieldError>{errors.affiliation}</FieldError>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field>
                <FieldLabel htmlFor="phoneNumber">{labels.fields.phoneNumber}</FieldLabel>
                <Input
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </Field>
              <Field data-invalid={Boolean(errors.country)}>
                <FieldLabel htmlFor="country">{labels.fields.country}</FieldLabel>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="country" className="w-full">
                    <SelectValue placeholder={labels.fields.countryPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{errors.country}</FieldError>
              </Field>
            </div>

            <Field data-invalid={Boolean(errors.category)}>
              <FieldLabel htmlFor="category">{labels.fields.category}</FieldLabel>
              <Select value={categoryName} onValueChange={setCategoryName}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name} — USD {c.usd}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{errors.category}</FieldError>
            </Field>

            {selectedCategory?.requiresPaper && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field data-invalid={Boolean(errors.paperId)}>
                  <FieldLabel htmlFor="paperId">{labels.fields.paperId}</FieldLabel>
                  <Input
                    id="paperId"
                    inputMode="numeric"
                    value={paperId}
                    onChange={(e) => setPaperId(e.target.value)}
                  />
                  <FieldError>{errors.paperId}</FieldError>
                </Field>
                <Field data-invalid={Boolean(errors.paperTitle)}>
                  <FieldLabel htmlFor="paperTitle">{labels.fields.paperTitle}</FieldLabel>
                  <Input
                    id="paperTitle"
                    value={paperTitle}
                    onChange={(e) => setPaperTitle(e.target.value)}
                  />
                  <FieldError>{errors.paperTitle}</FieldError>
                </Field>
              </div>
            )}

            <div className="flex flex-col gap-4 border-t border-border pt-5">
              <h3 className="small-heading text-foreground">{labels.fields.billingHeading}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field>
                  <FieldLabel htmlFor="billingOrganization">
                    {labels.fields.billingOrganization}
                  </FieldLabel>
                  <Input
                    id="billingOrganization"
                    value={billing.billingOrganization}
                    onChange={(e) =>
                      setBilling((b) => ({ ...b, billingOrganization: e.target.value }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="billingDepartment">
                    {labels.fields.billingDepartment}
                  </FieldLabel>
                  <Input
                    id="billingDepartment"
                    value={billing.billingDepartment}
                    onChange={(e) =>
                      setBilling((b) => ({ ...b, billingDepartment: e.target.value }))
                    }
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="billingAddress">{labels.fields.billingAddress}</FieldLabel>
                <Input
                  id="billingAddress"
                  value={billing.billingAddress}
                  onChange={(e) => setBilling((b) => ({ ...b, billingAddress: e.target.value }))}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Field>
                  <FieldLabel htmlFor="billingCity">{labels.fields.billingCity}</FieldLabel>
                  <Input
                    id="billingCity"
                    value={billing.billingCity}
                    onChange={(e) => setBilling((b) => ({ ...b, billingCity: e.target.value }))}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="billingState">{labels.fields.billingState}</FieldLabel>
                  <Input
                    id="billingState"
                    value={billing.billingState}
                    onChange={(e) => setBilling((b) => ({ ...b, billingState: e.target.value }))}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="billingZipCode">{labels.fields.billingZipCode}</FieldLabel>
                  <Input
                    id="billingZipCode"
                    value={billing.billingZipCode}
                    onChange={(e) => setBilling((b) => ({ ...b, billingZipCode: e.target.value }))}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field>
                  <FieldLabel htmlFor="billingCountry">{labels.fields.billingCountry}</FieldLabel>
                  <Input
                    id="billingCountry"
                    value={billing.billingCountry}
                    onChange={(e) => setBilling((b) => ({ ...b, billingCountry: e.target.value }))}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="billingVatNumber">
                    {labels.fields.billingVatNumber}
                  </FieldLabel>
                  <Input
                    id="billingVatNumber"
                    value={billing.billingVatNumber}
                    onChange={(e) =>
                      setBilling((b) => ({ ...b, billingVatNumber: e.target.value }))
                    }
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="billingContactName">
                  {labels.fields.billingContactName}
                </FieldLabel>
                <Input
                  id="billingContactName"
                  value={billing.billingContactName}
                  onChange={(e) =>
                    setBilling((b) => ({ ...b, billingContactName: e.target.value }))
                  }
                />
              </Field>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-5">
              <span className="body font-medium text-foreground">
                {labels.priceSummary.replace("{total}", String(selectedCategory?.usd ?? 0))}
              </span>
            </div>

            {serverError && <FieldError>{serverError}</FieldError>}

            <Button type="submit" size="lg" disabled={submitting} className="w-full">
              {submitting ? labels.submitting : labels.submit}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationFormPage;
