import { BadgeCheck, CalendarDays, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { type ValidYear, YEAR_CONFIG } from "@/constants/config";
import { requireCheckInQrSecret } from "@/modules/admin/qr-check-ins/lib/env";
import { createQrPayload } from "@/modules/admin/qr-check-ins/lib/qr";
import { getRegistration } from "@/modules/admin/qr-check-ins/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Registration QR Pass | EBISION",
  robots: { index: false, follow: false },
};

export default async function RegistrationPassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const registration = await getRegistration(id);
  if (!registration) notFound();

  const year = registration.year as ValidYear;
  const config = YEAR_CONFIG[year];
  if (!config) notFound();

  const qrPayload = createQrPayload({
    id: registration.id,
    qrNonce: registration.qrNonce,
    secret: requireCheckInQrSecret(),
  });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 360,
  });

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 text-foreground">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <header className="rounded-lg bg-primary px-6 py-5 text-primary-foreground">
          <p className="tag text-primary-foreground/80">EBISION {year}</p>
          <h1 className="subheading mt-2 text-primary-foreground">Registration QR Pass</h1>
        </header>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="caption text-muted-foreground">Attendee</p>
            <h2 className="subheading">{registration.name}</h2>
            <p className="caption text-muted-foreground">{registration.email}</p>
            {registration.affiliation ? (
              <p className="caption text-muted-foreground">{registration.affiliation}</p>
            ) : null}
          </div>

          <div className="mt-6 flex justify-center rounded-lg border border-border bg-white p-5">
            <Image
              src={qrDataUrl}
              alt={`EBISION ${year} check-in QR code`}
              width={360}
              height={360}
              unoptimized
              className="h-auto w-full max-w-80"
            />
          </div>

          <div className="mt-6 grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              <span>{config.dates}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-primary" />
              <span>
                {config.venue}, {config.location}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="size-4 text-primary" />
              <span>Present this QR code at the registration desk.</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
