import { Building2, CalendarClock, ChevronDown, MapPin, Mic, Users } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { ValidYear } from "@/constants/config";
import { loadData } from "@/lib/data";

interface KeynoteSpeaker {
  name: string;
  role: string;
  org: string;
  credential?: string;
  country: string;
  countryCode?: string;
  image: string;
  imagePosition?: string;
  talkTitle: string;
  summary: string;
  abstract?: string;
  bio?: string;
}

interface InvitedSpeaker {
  name: string;
  role: string;
  org: string;
  country: string;
  countryCode?: string;
  image: string;
  imagePosition?: string;
  talkTitle: string;
  summary: string;
  bio?: string;
}

interface IndustrialTalk {
  company: string;
  companyShort: string;
  speaker: string;
  country: string;
  countryCode?: string;
  image?: string;
  images?: string[];
  talkTitle: string;
  summary: string;
  abstract?: string;
}

interface FeaturedSpeakersData {
  keynotes: KeynoteSpeaker[];
  invited: InvitedSpeaker[];
  industrial: IndustrialTalk[];
}

const cardClass =
  "bg-card/60 backdrop-blur-xl border border-border/60 rounded-xl shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md";

const CountryPill = ({ country, onImage = false }: { country: string; onImage?: boolean }) => (
  <span
    className={
      onImage
        ? "inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-foreground caption font-medium backdrop-blur-sm shadow-sm"
        : "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-primary caption font-medium"
    }
  >
    <MapPin className="size-3" aria-hidden="true" />
    {country}
  </span>
);

const Disclosure = ({ label, text }: { label: string; text?: string }) => {
  if (!text?.trim()) return null;
  return (
    <details className="group border-t border-border/50 pt-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-primary caption font-semibold transition-colors hover:text-primary/80 [&::-webkit-details-marker]:hidden">
        <span>{label}</span>
        <ChevronDown
          className="size-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <p className="body mt-2 whitespace-pre-line text-muted-foreground">{text}</p>
    </details>
  );
};

const SectionHeader = ({
  icon: Icon,
  label,
  title,
  subtitle,
  count,
}: {
  icon: typeof Mic;
  label: string;
  title: string;
  subtitle: string;
  count: number;
}) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
      <Icon className="size-5" aria-hidden="true" />
    </span>
    <div className="flex-1">
      <p className="tag text-primary">{label}</p>
      <h2 className="title text-foreground">{title}</h2>
      <p className="caption text-muted-foreground">{subtitle}</p>
    </div>
    <span className="hidden shrink-0 items-baseline gap-1.5 sm:inline-flex">
      <span className="display-number text-3xl text-primary/30">{count}</span>
    </span>
  </div>
);

const KeynoteCard = ({
  keynote,
  index,
  abstractLabel,
  biographyLabel,
}: {
  keynote: KeynoteSpeaker;
  index: number;
  abstractLabel: string;
  biographyLabel: string;
}) => (
  <article className={`${cardClass} flex flex-col overflow-hidden`}>
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
      <Image
        src={keynote.image}
        alt={`Portrait of ${keynote.name}`}
        fill
        sizes="(max-width: 1024px) 100vw, 33vw"
        className="object-cover"
        style={{ objectPosition: keynote.imagePosition ?? "center top" }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
        aria-hidden="true"
      />
      <span className="absolute left-3 top-3 inline-flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground mono text-sm font-bold shadow-md">
        {index + 1}
      </span>
      <span className="absolute right-3 top-3">
        <CountryPill country={keynote.country} onImage />
      </span>
      <h3 className="absolute inset-x-4 bottom-3 heading text-white drop-shadow-md">
        {keynote.name}
      </h3>
    </div>
    <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-col gap-0.5">
        <p className="small-heading text-primary">{keynote.role}</p>
        <p className="caption text-muted-foreground">{keynote.org}</p>
        {keynote.credential && (
          <p className="caption text-muted-foreground/80">{keynote.credential}</p>
        )}
      </div>
      <div className="border-l-2 border-primary/30 pl-4">
        <h4 className="subheading text-foreground">{keynote.talkTitle}</h4>
      </div>
      <p className="body text-muted-foreground">{keynote.summary}</p>
      <div className="mt-auto flex flex-col gap-3 pt-1">
        <Disclosure label={abstractLabel} text={keynote.abstract} />
        <Disclosure label={biographyLabel} text={keynote.bio} />
      </div>
    </div>
  </article>
);

const InvitedCard = ({
  speaker,
  biographyLabel,
}: {
  speaker: InvitedSpeaker;
  biographyLabel: string;
}) => (
  <article className={`${cardClass} flex flex-col gap-4 p-5 sm:p-6`}>
    <div className="flex items-start gap-4">
      <Image
        src={speaker.image}
        alt={`Portrait of ${speaker.name}`}
        width={112}
        height={112}
        className="size-20 sm:size-24 shrink-0 rounded-lg border border-primary/10 object-cover"
        style={{ objectPosition: speaker.imagePosition ?? "center top" }}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3 className="heading text-foreground">{speaker.name}</h3>
        <p className="caption text-primary">{speaker.role}</p>
        <p className="caption text-muted-foreground">{speaker.org}</p>
        <CountryPill country={speaker.country} />
      </div>
    </div>
    <div className="relative border-l-2 border-primary/30 pl-4">
      <h4 className="subheading text-foreground">{speaker.talkTitle}</h4>
    </div>
    <p className="body text-muted-foreground">{speaker.summary}</p>
    <div className="mt-auto">
      <Disclosure label={biographyLabel} text={speaker.bio} />
    </div>
  </article>
);

const IndustrialCard = ({
  talk,
  abstractLabel,
}: {
  talk: IndustrialTalk;
  abstractLabel: string;
}) => {
  const photos = talk.images?.length ? talk.images : talk.image ? [talk.image] : [];
  const isDuo = photos.length > 1;
  const primaryPhoto = photos[0];
  return (
    <article className={`${cardClass} flex flex-col gap-4 p-5 sm:p-6`}>
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          {isDuo ? (
            <div className="flex -space-x-5">
              {photos.map((src) => (
                <Image
                  key={src}
                  src={src}
                  alt={`Portrait of a ${talk.company} speaker`}
                  width={96}
                  height={96}
                  className="size-16 sm:size-20 rounded-full border-2 border-card object-cover object-top"
                />
              ))}
            </div>
          ) : (
            primaryPhoto && (
              <Image
                src={primaryPhoto}
                alt={`Portrait of ${talk.speaker}`}
                width={112}
                height={112}
                className="size-20 sm:size-24 rounded-lg border border-primary/10 object-cover object-top"
              />
            )
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="tag w-fit rounded-md bg-primary px-2 py-0.5 text-primary-foreground">
            {talk.companyShort}
          </span>
          <h3 className="heading text-foreground">{talk.company}</h3>
          <p className="caption text-muted-foreground">
            {talk.speaker} · {talk.country}
          </p>
        </div>
      </div>
      <div className="relative border-l-2 border-primary/30 pl-4">
        <h4 className="subheading text-foreground">{talk.talkTitle}</h4>
      </div>
      <p className="body text-muted-foreground">{talk.summary}</p>
      <div className="mt-auto">
        <Disclosure label={abstractLabel} text={talk.abstract} />
      </div>
    </article>
  );
};

const FeaturedSpeakersPage = async ({ year }: { year: ValidYear }) => {
  const t = await getTranslations("FeaturedSpeakersPage");

  let data: FeaturedSpeakersData | null = null;
  try {
    data = await loadData<FeaturedSpeakersData>("featured-speakers", year);
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <section className="px-4 sm:px-8 lg:px-12 py-16 sm:py-24">
        <div className="mx-auto flex max-w-8xl flex-col items-center gap-4 text-center">
          <p className="tag text-primary">{t("label")}</p>
          <h1 className="display text-foreground">{t("title")}</h1>
          <p className="body max-w-2xl text-muted-foreground">{t("emptyDescription", { year })}</p>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col">
      {/* ── Header ── */}
      <section className="px-4 sm:px-8 lg:px-12 pt-12 pb-8 sm:pt-16 sm:pb-12">
        <div className="mx-auto flex max-w-8xl flex-col gap-5">
          <div className="flex flex-col gap-3">
            <p className="tag text-primary">{t("label")}</p>
            <h1 className="display text-foreground">{t("title")}</h1>
            <p className="body max-w-3xl text-muted-foreground">{t("subtitle", { year })}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="#keynotes" className="group">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 backdrop-blur-md transition-colors group-hover:border-primary/40 group-hover:bg-accent">
                <Mic className="size-4 text-primary" aria-hidden="true" />
                <span className="caption font-semibold text-foreground">
                  {data.keynotes.length} {t("keynotesChip")}
                </span>
              </span>
            </a>
            <a href="#invited" className="group">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 backdrop-blur-md transition-colors group-hover:border-primary/40 group-hover:bg-accent">
                <Users className="size-4 text-primary" aria-hidden="true" />
                <span className="caption font-semibold text-foreground">
                  {data.invited.length} {t("invitedChip")}
                </span>
              </span>
            </a>
            <a href="#industrial" className="group">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 backdrop-blur-md transition-colors group-hover:border-primary/40 group-hover:bg-accent">
                <Building2 className="size-4 text-primary" aria-hidden="true" />
                <span className="caption font-semibold text-foreground">
                  {data.industrial.length} {t("industrialChip")}
                </span>
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ── Keynote Speakers ── */}
      <section id="keynotes" className="scroll-mt-24 px-4 sm:px-8 lg:px-12 py-10 sm:py-12">
        <div className="mx-auto flex max-w-8xl flex-col gap-8">
          <SectionHeader
            icon={Mic}
            label={t("keynoteLabel")}
            title={t("keynoteTitle")}
            subtitle={t("keynoteSubtitle")}
            count={data.keynotes.length}
          />
          <div className="grid grid-cols-1 gap-6 has-[details[open]]:items-start md:grid-cols-2 lg:grid-cols-3">
            {data.keynotes.map((keynote, index) => (
              <KeynoteCard
                key={keynote.name}
                keynote={keynote}
                index={index}
                abstractLabel={t("abstract")}
                biographyLabel={t("biography")}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Invited Speakers ── */}
      <section id="invited" className="scroll-mt-24 px-4 sm:px-8 lg:px-12 py-10 sm:py-12">
        <div className="mx-auto flex max-w-8xl flex-col gap-8">
          <SectionHeader
            icon={Users}
            label={t("invitedLabel")}
            title={t("invitedTitle")}
            subtitle={t("invitedSubtitle")}
            count={data.invited.length}
          />
          <div className="grid grid-cols-1 gap-6 has-[details[open]]:items-start lg:grid-cols-2">
            {data.invited.map((speaker) => (
              <InvitedCard key={speaker.name} speaker={speaker} biographyLabel={t("biography")} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Industrial Session ── */}
      <section
        id="industrial"
        className="scroll-mt-24 px-4 sm:px-8 lg:px-12 py-10 sm:py-12 pb-16 sm:pb-24"
      >
        <div className="mx-auto flex max-w-8xl flex-col gap-8">
          <SectionHeader
            icon={Building2}
            label={t("industrialLabel")}
            title={t("industrialTitle")}
            subtitle={t("industrialSubtitle")}
            count={data.industrial.length}
          />
          <div className="grid grid-cols-1 gap-6 has-[details[open]]:items-start lg:grid-cols-2">
            {data.industrial.map((talk) => (
              <IndustrialCard key={talk.company} talk={talk} abstractLabel={t("abstract")} />
            ))}
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-accent/50 px-5 py-4">
            <CalendarClock className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="caption text-muted-foreground">{t("industrialNote")}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturedSpeakersPage;
