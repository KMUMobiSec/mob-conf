import { ArrowLeft, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAdminDateTime } from "@/modules/admin/lib/intl";
import { getNomination } from "@/modules/admin/nominations/lib/queries";
import {
  DOC_FIELD_KEYS,
  DOC_LABELS,
  degreeLabel,
  enrollmentLabel,
  getAward,
} from "@/modules/landing/nomination-form/lib/constants";
import { DeleteNominationDialog } from "../DeleteNominationDialog";
import { DocumentLink } from "../DocumentLink";
import { ResendWinnerButton } from "../ResendWinnerButton";
import { WinnerToggle } from "../WinnerToggle";

export const metadata: Metadata = { title: "Nomination — Admin" };

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[200px_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm text-foreground">{children}</dd>
    </div>
  );
}

export default async function NominationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("Admin.nominations.detail");
  const n = await getNomination(id);
  if (!n) notFound();

  const degree = degreeLabel(n.degree ?? "");
  const enrollment = enrollmentLabel(n.enrollment ?? "");
  const submitted = formatAdminDateTime(locale, n.createdAt);
  const documentSections = DOC_FIELD_KEYS.map((key) => ({
    key,
    label: DOC_LABELS[key],
    docs: n.documents?.[key] ?? [],
  })).filter((section) => section.docs.length > 0);

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Link
        href="/admin/nominations"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h2 className="heading text-foreground">{n.nomineeName}</h2>
            {n.isWinner && (
              <Badge>
                <Trophy className="size-3" />
                {t("winner")}
              </Badge>
            )}
          </div>
          <p className="body text-muted-foreground">
            {getAward(n.award)?.name ?? n.award} · MOBISEC {n.year}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <WinnerToggle id={n.id} initialIsWinner={n.isWinner} />
          {n.isWinner && <ResendWinnerButton id={n.id} />}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("nomineeTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <DetailRow label={t("labels.fullName")}>{n.nomineeName}</DetailRow>
            <DetailRow label={t("labels.email")}>{n.nomineeEmail}</DetailRow>
            <DetailRow label={t("labels.affiliation")}>{n.nomineeAffiliation}</DetailRow>
            <DetailRow label={t("labels.position")}>{n.nomineePosition}</DetailRow>
            <DetailRow label={t("labels.country")}>{n.nomineeCountry}</DetailRow>
            {degree && (
              <DetailRow label={t("labels.degreeProgram")}>
                {degree}
                {enrollment ? ` · ${enrollment}` : ""}
              </DetailRow>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("nominatorTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <DetailRow label={t("labels.fullName")}>{n.nominatorName}</DetailRow>
            <DetailRow label={t("labels.email")}>{n.nominatorEmail}</DetailRow>
            <DetailRow label={t("labels.affiliation")}>{n.nominatorAffiliation}</DetailRow>
            <DetailRow label={t("labels.relationship")}>{n.nominatorRelationship}</DetailRow>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("statementTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="body whitespace-pre-wrap text-foreground">{n.statement}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("documentsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {documentSections.length === 0 ? (
            <p className="caption text-muted-foreground">{t("noDocuments")}</p>
          ) : (
            documentSections.map((section) => (
              <div key={section.key} className="flex flex-col gap-2">
                <p className="small-heading text-foreground">{section.label}</p>
                {section.docs.map((doc) => (
                  <DocumentLink
                    key={doc.path}
                    nominationId={n.id}
                    path={doc.path}
                    name={doc.name}
                    size={doc.size}
                  />
                ))}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("submissionTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <DetailRow label={t("labels.consent")}>
              {n.consent ? t("consentConfirmed") : t("consentNotConfirmed")}
            </DetailRow>
            {n.slidePages != null && (
              <DetailRow label={t("labels.slidePages")}>{n.slidePages}</DetailRow>
            )}
            <DetailRow label={t("labels.submitted")}>{submitted}</DetailRow>
            <DetailRow label={t("labels.emailsSent")}>{n.emailsSentCount}</DetailRow>
          </dl>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">{t("dangerZoneTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3">
          <p className="caption text-muted-foreground">{t("dangerZoneDescription")}</p>
          <DeleteNominationDialog id={n.id} nomineeName={n.nomineeName} />
        </CardContent>
      </Card>
    </div>
  );
}
