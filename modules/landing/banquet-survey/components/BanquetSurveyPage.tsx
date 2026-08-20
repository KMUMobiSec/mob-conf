import type { ValidYear } from "@/constants/config";
import { getAppSettings } from "@/modules/admin/settings/lib/queries";
import { BANQUET_DATE_FALLBACK, BANQUET_VENUE_FALLBACK } from "../lib/constants";
import { BanquetSurveyForm } from "./BanquetSurveyForm";

const BanquetSurveyPage = async ({
  year,
  email,
  name,
  affiliation,
}: {
  year: ValidYear;
  email?: string;
  name?: string;
  affiliation?: string;
}) => {
  const settings = await getAppSettings();
  const banquetDate = settings.banquetDate ?? BANQUET_DATE_FALLBACK;
  const banquetVenue = settings.banquetVenue ?? BANQUET_VENUE_FALLBACK;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <p className="tag text-primary">Banquet</p>
          <h1 className="display text-foreground">Banquet RSVP</h1>
          <p className="body text-muted-foreground">
            Let us know if you will join us for the EBISION {year} banquet on {banquetDate} at{" "}
            {banquetVenue}. If you are attending, share any dietary needs so we can plan the menu. A
            confirmation will be emailed to you once you submit.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <BanquetSurveyForm
            year={year}
            initialEmail={email ?? ""}
            initialName={name ?? ""}
            initialAffiliation={affiliation ?? ""}
            banquetDate={banquetDate}
            banquetVenue={banquetVenue}
          />
        </div>
      </section>
    </div>
  );
};

export default BanquetSurveyPage;
