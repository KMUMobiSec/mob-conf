import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAdminDateTime } from "@/modules/admin/lib/intl";
import { getPresentation } from "@/modules/admin/presentations/lib/queries";
import { DeletePresentationDialog } from "../DeletePresentationDialog";
import { EditPresentationDialog } from "../EditPresentationDialog";
import { PresentationFileLink } from "../PresentationFileLink";
import { ReviewedToggle } from "../ReviewedToggle";

export const metadata: Metadata = { title: "Presentation — Admin" };

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[200px_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm text-foreground">{children}</dd>
    </div>
  );
}

export default async function PresentationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("Admin.presentations.detail");
  const detail = await getPresentation(id);
  if (!detail) notFound();

  const { presentation: p, materials, video } = detail;

  const submitted = formatAdminDateTime(locale, p.createdAt);

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Link
        href="/admin/presentations"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h2 className="heading text-foreground">{p.title}</h2>
            {p.isReviewed && (
              <Badge>
                <CheckCircle2 className="size-3" />
                {t("reviewed")}
              </Badge>
            )}
          </div>
          <p className="body text-muted-foreground">
            {t("paperSummary", { paperNumber: p.paperNumber, year: p.year })}
          </p>
        </div>
        <ReviewedToggle id={p.id} initialIsReviewed={p.isReviewed} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>{t("submissionTitle")}</CardTitle>
          <EditPresentationDialog
            id={p.id}
            initial={{
              paperNumber: p.paperNumber,
              title: p.title,
              contactEmail: p.contactEmail,
              videoUrl: p.videoUrl ?? "",
            }}
            hasUploadedVideo={video !== null}
          />
        </CardHeader>
        <CardContent>
          <dl>
            <DetailRow label={t("labels.paperNumber")}>{p.paperNumber}</DetailRow>
            <DetailRow label={t("labels.title")}>{p.title}</DetailRow>
            <DetailRow label={t("labels.contactEmail")}>{p.contactEmail}</DetailRow>
            <DetailRow label={t("labels.submitted")}>{submitted}</DetailRow>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("materialsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {materials.length ? (
            materials.map((file) => (
              <PresentationFileLink
                key={file.id}
                id={file.id}
                name={file.fileName}
                size={file.fileSize}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t("noMaterialFiles")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("videoTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {video ? (
            <PresentationFileLink id={video.id} name={video.fileName} size={video.fileSize} />
          ) : p.videoUrl ? (
            <div className="flex flex-col gap-1.5">
              <a
                href={p.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-2 rounded-md border border-border bg-muted/40 py-2 pl-2.5 pr-3 text-sm transition-colors hover:border-primary hover:bg-accent"
              >
                <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{p.videoUrl}</span>
                <span className="shrink-0 text-xs font-medium text-primary">{t("openLink")}</span>
              </a>
              <span className="text-xs text-muted-foreground">{t("externalLinkHint")}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noVideoSubmitted")}</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">{t("dangerZoneTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3">
          <p className="caption text-muted-foreground">{t("dangerZoneDescription")}</p>
          <DeletePresentationDialog id={p.id} title={p.title} />
        </CardContent>
      </Card>
    </div>
  );
}
