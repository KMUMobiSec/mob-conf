import { BedDouble, Car, ExternalLink, Footprints, MapPin } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ValidYear } from "@/constants/config";
import { loadData } from "@/lib/data";

interface Hotel {
  name: string;
  address?: string;
  websiteUrl: string;
  image?: string;
  isVenue?: boolean;
  distanceMeters?: number;
  walkMinutes?: number;
  carMinutes?: number;
}

interface AccommodationsData {
  primary: Hotel[];
  additional: Hotel[];
}

type AccommodationsTranslator = Awaited<ReturnType<typeof getTranslations<"Accommodations">>>;

function HotelCard({
  hotel,
  t,
  venueBadge,
  visitWebsite,
}: {
  hotel: Hotel;
  t: AccommodationsTranslator;
  venueBadge: string;
  visitWebsite: string;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-background/60 transition-all hover:border-primary/30 hover:shadow-sm">
      <div className="relative aspect-video w-full bg-muted">
        {hotel.image ? (
          <Image
            src={hotel.image}
            alt={hotel.name}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BedDouble className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="body font-medium text-foreground">{hotel.name}</span>
          {hotel.isVenue && <Badge variant="secondary">{venueBadge}</Badge>}
        </div>

        {hotel.address && (
          <p className="caption flex items-start gap-1.5 text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {hotel.address}
          </p>
        )}

        {hotel.distanceMeters !== undefined && (
          <div className="flex flex-col gap-1 border-t border-border pt-3">
            <p className="caption text-foreground">
              {t("distanceApprox", { meters: hotel.distanceMeters })}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
              {hotel.walkMinutes !== undefined && (
                <span className="caption flex items-center gap-1">
                  <Footprints className="h-3.5 w-3.5" />
                  {t("walkApprox", { minutes: hotel.walkMinutes })}
                </span>
              )}
              {hotel.carMinutes !== undefined && (
                <span className="caption flex items-center gap-1">
                  <Car className="h-3.5 w-3.5" />
                  {t("carApprox", { minutes: hotel.carMinutes })}
                </span>
              )}
            </div>
          </div>
        )}

        <Button asChild variant="outline" size="sm" className="mt-auto w-fit">
          <a href={hotel.websiteUrl} target="_blank" rel="noopener noreferrer">
            {visitWebsite}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}

const Accommodations = async ({ year }: { year: ValidYear }) => {
  const t = await getTranslations("Accommodations");
  const tCommon = await getTranslations("Common");

  let data: AccommodationsData | null = null;
  try {
    data = await loadData<AccommodationsData>("accommodations", year);
  } catch {
    data = null;
  }

  if (!data || (data.primary.length === 0 && data.additional.length === 0)) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="tag text-primary">{t("tag")}</p>
        <h2 className="title text-foreground">{t("title")}</h2>
        <p className="body text-muted-foreground max-w-2xl">{t("description")}</p>
      </div>

      <div className="flex flex-col gap-8">
        {data.primary.length > 0 && (
          <div className="flex flex-col gap-4">
            <h5 className="small-heading text-foreground">{t("primaryHeading")}</h5>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {data.primary.map((hotel) => (
                <HotelCard
                  key={hotel.name}
                  hotel={hotel}
                  t={t}
                  venueBadge={t("conferenceVenueBadge")}
                  visitWebsite={tCommon("visitWebsite")}
                />
              ))}
            </div>
          </div>
        )}

        {data.additional.length > 0 && (
          <div className="flex flex-col gap-4">
            <h5 className="small-heading text-foreground">{t("additionalHeading")}</h5>
            <p className="body text-muted-foreground">{t("additionalDescription")}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.additional.map((hotel) => (
                <HotelCard
                  key={hotel.name}
                  hotel={hotel}
                  t={t}
                  venueBadge={t("conferenceVenueBadge")}
                  visitWebsite={tCommon("visitWebsite")}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="caption text-muted-foreground">{t("note")}</p>
    </div>
  );
};

export default Accommodations;
