import { ExternalLink, MapPin, Navigation } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import type { ValidYear } from "@/constants/config";
import { loadData } from "@/lib/data";
import CampusWayfinder from "./wayfinder/CampusWayfinder";

interface VenueData {
  venue: string;
  street: string;
  city: string;
  ward: string;
  prefecture: string;
  postalCode: string;
  country: string;
  coordinates: { latitude: number; longitude: number };
  description: string;
  websiteUrl: string;
  transportation: string;
  image: { src: string; alt: string };
}

const Venue = async ({ year }: { year: ValidYear }) => {
  const t = await getTranslations("Venue");
  const venueLocation = await loadData<VenueData>("venue", year);

  return (
    <div className="flex flex-col gap-8">
      {/* Section Header */}
      <div className="flex flex-col gap-2">
        <p className="tag text-primary">Location</p>
        <h2 className="title text-foreground">Conference Venue</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Venue Image with address overlay */}
        <div className="relative w-full lg:w-1/2 aspect-video rounded-lg overflow-hidden">
          <Image
            src={venueLocation.image.src}
            alt={venueLocation.image.alt}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
            <h4 className="subheading text-white mb-1">{venueLocation.venue}</h4>
            <p className="body text-white/80 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {venueLocation.street}, {venueLocation.ward}, {venueLocation.city}{" "}
              {venueLocation.postalCode}, {venueLocation.country}
            </p>
          </div>
        </div>

        {/* Venue Details */}
        <div className="flex flex-col gap-6 w-full lg:w-1/2">
          {/* About */}
          <div className="flex flex-col gap-3">
            <h5 className="small-heading text-foreground">{t("aboutVenue")}</h5>
            <p className="body text-muted-foreground">{venueLocation.description}</p>
            <Button asChild variant="outline" className="w-fit">
              <a href={venueLocation.websiteUrl} target="_blank" rel="noopener noreferrer">
                {t("visitOfficialWebsite")}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>

          {/* Transportation */}
          <div className="border-t border-border pt-6 flex flex-col gap-3">
            <h5 className="small-heading flex items-center gap-2 text-foreground">
              <Navigation className="h-4 w-4 text-primary shrink-0" />
              {t("gettingThere")}
            </h5>
            <p className="body text-muted-foreground">{venueLocation.transportation}</p>
          </div>

          {/* Map */}
          <div className="border-t border-border pt-6 flex flex-col gap-4">
            <div className="w-full h-40 sm:h-48 rounded-lg overflow-hidden border border-border">
              <iframe
                src={`https://maps.google.com/maps?q=${venueLocation.coordinates.latitude},${venueLocation.coordinates.longitude}&z=16&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${venueLocation.venue} Location`}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="default" asChild size="sm">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${venueLocation.venue}+${venueLocation.street}+${venueLocation.ward}+${venueLocation.city}+${venueLocation.postalCode}+${venueLocation.country}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="h-3 w-3" />
                  Get Directions
                </a>
              </Button>
              <Button variant="outline" asChild size="sm">
                <a
                  href={`https://www.openstreetmap.org/?mlat=${venueLocation.coordinates.latitude}&mlon=${venueLocation.coordinates.longitude}#map=16/${venueLocation.coordinates.latitude}/${venueLocation.coordinates.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OpenStreetMap
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Campus Wayfinder — Main Gate → venue guide (only for years with a config) */}
      <CampusWayfinder year={year} />
    </div>
  );
};

export default Venue;
