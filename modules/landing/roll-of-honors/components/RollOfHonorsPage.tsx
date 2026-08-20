import { getTranslations } from "next-intl/server";
import type { ValidYear } from "@/constants/config";
import { YEAR_CONFIG } from "@/constants/config";
import { loadData } from "@/lib/data";
import { AWARD_CATEGORY_ORDER } from "@/modules/landing/roll-of-honors/lib/award-order";

interface AwardRecipient {
  category: string;
  recipient?: string;
  authors?: string[];
  affiliation?: string;
  recognition?: string;
  technology?: string;
  paperTitle?: string;
}

interface AwardRecipientsData {
  recipients: AwardRecipient[];
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI"] as const;

const pad = (n: number) => String(n).padStart(2, "0");

function groupByCategory(recipients: AwardRecipient[]): Map<string, AwardRecipient[]> {
  const map = new Map<string, AwardRecipient[]>();
  for (const r of recipients) {
    const list = map.get(r.category) ?? [];
    list.push(r);
    map.set(r.category, list);
  }
  return map;
}

/** Concentric wax-seal motif used in the top-right of every laureate card. */
const CardSeal = () => (
  <span
    aria-hidden="true"
    className="absolute right-6 top-6 flex size-10 items-center justify-center rounded-full border border-primary/50"
  >
    <span className="flex size-7 items-center justify-center rounded-full border border-primary/40">
      <span className="size-2 rotate-45 bg-primary/70" />
    </span>
  </span>
);

const LaureateCard = ({ item, roman }: { item: AwardRecipient; roman: string }) => {
  const isPaper = Array.isArray(item.authors) && item.authors.length > 0;
  const name = isPaper ? (item.authors as string[]).join(", ") : (item.recipient ?? "");
  const tags = item.technology ? [item.technology] : [];
  const bio = isPaper ? item.paperTitle : item.recognition;

  return (
    <article className="group relative overflow-hidden rounded-sm border border-primary/15 bg-card p-8 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg motion-safe:hover:-translate-y-1 sm:p-9">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary to-primary/60"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-5 right-4 select-none text-[7rem] font-bold leading-none text-primary/[0.05]"
      >
        {roman}
      </span>
      <CardSeal />

      <div className="relative">
        <h3 className="subheading pr-12 font-semibold text-foreground">{name}</h3>

        {item.affiliation && (
          <div className="mt-2 flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary/80" />
            <span className="mono text-xs text-muted-foreground">{item.affiliation}</span>
          </div>
        )}

        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="mono rounded-sm border border-primary/15 bg-primary/[0.07] px-2.5 py-1 text-[0.65rem] tracking-wide text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <span aria-hidden="true" className="mt-5 block h-px w-9 bg-primary/60" />

        {bio && (
          <p
            className={`body mt-4 text-sm leading-relaxed ${
              isPaper ? "italic text-foreground" : "text-muted-foreground"
            }`}
          >
            {isPaper ? `"${bio}"` : bio}
          </p>
        )}
      </div>
    </article>
  );
};

const RollOfHonorsPage = async ({ year }: { year: ValidYear }) => {
  const t = await getTranslations("AwardRecipientsPage");
  const data = await loadData<AwardRecipientsData>("award-recipients", year);
  const config = YEAR_CONFIG[year];
  const recipients = data.recipients ?? [];
  const byCategory = groupByCategory(recipients);

  const categories = AWARD_CATEGORY_ORDER.map(({ key, tKey }) => ({
    key,
    title: t(tKey),
    items: byCategory.get(key) ?? [],
  }))
    .filter((c) => c.items.length > 0)
    .map((c, index) => ({
      ...c,
      roman: ROMAN[index] ?? String(index + 1),
      num: pad(index + 1),
      count: pad(c.items.length),
    }));

  const total = pad(categories.length);

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-12 text-center sm:px-10 sm:pt-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[540px] max-w-[92vw] -translate-x-1/2 -translate-y-[46%] rounded-full border border-primary/10"
        >
          <div className="absolute inset-11 rounded-full border border-primary/[0.08]" />
          <div className="absolute inset-24 rounded-full border border-primary/[0.05]" />
        </div>

        <div className="mb-7 flex items-center justify-center gap-4">
          <span
            aria-hidden="true"
            className="h-px w-12 bg-gradient-to-r from-transparent to-primary/60 sm:w-14"
          />
          <span className="tag tracking-[0.28em] text-primary">{t("label")}</span>
          <span
            aria-hidden="true"
            className="h-px w-12 bg-gradient-to-l from-transparent to-primary/60 sm:w-14"
          />
        </div>

        <h1 className="display text-foreground">{t("title")}</h1>
        <p className="body mx-auto mt-5 max-w-xl text-muted-foreground">
          {t("subtitle", { year })}
        </p>

        <div className="mono mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span>{config.dates}</span>
          <span aria-hidden="true" className="size-1.5 rotate-45 bg-primary/70" />
          <span>
            {config.venue}, {config.location}
          </span>
        </div>
      </section>

      {/* ── Category index ── */}
      {categories.length > 1 && (
        <nav aria-label={t("label")} className="mx-auto mb-16 w-full max-w-6xl px-6 sm:px-10">
          <div className="flex flex-wrap border-y border-primary/15">
            {categories.map(({ key, title, roman, num, count }) => (
              <a
                key={key}
                href={`#cat-${num}`}
                className="flex min-w-[220px] flex-1 items-center justify-between gap-4 px-5 py-5 transition-colors hover:bg-primary/[0.05] [&:not(:last-child)]:border-r [&:not(:last-child)]:border-primary/10"
              >
                <span className="flex items-center gap-3">
                  <span className="text-sm italic text-primary">{roman}</span>
                  <span className="text-sm font-medium leading-tight text-foreground">{title}</span>
                </span>
                <span className="mono flex size-6 shrink-0 items-center justify-center rounded-full border border-primary/20 text-[0.7rem] text-muted-foreground">
                  {count}
                </span>
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* ── Sections / Empty state ── */}
      {recipients.length === 0 ? (
        <div className="mx-auto w-full max-w-6xl px-6 pb-24 sm:px-10">
          <div className="relative overflow-hidden rounded-sm border border-primary/15 bg-card p-12 text-center shadow-sm sm:p-16">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary to-primary/60"
            />
            <h2 className="heading text-foreground">{t("emptyTitle")}</h2>
            <p className="body mx-auto mt-3 max-w-xl text-muted-foreground">
              {t("emptyDescription", { year })}
            </p>
          </div>
        </div>
      ) : (
        <main className="mx-auto w-full max-w-6xl px-6 pb-16 sm:px-10 sm:pb-24">
          {categories.map(({ key, title, items, roman, num, count }) => (
            <section key={key} id={`cat-${num}`} className="mb-20 scroll-mt-28 sm:mb-24">
              {/* section header */}
              <div className="mb-9 flex items-center gap-4 sm:gap-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/40 ring-offset-4 ring-offset-background">
                  <span className="text-lg italic leading-none">{roman}</span>
                </span>
                <div className="min-w-0">
                  <p className="mono mb-1 text-[0.65rem] uppercase tracking-[0.24em] text-primary">
                    {num} / {total}
                  </p>
                  <h2 className="heading font-semibold text-foreground sm:text-3xl">{title}</h2>
                </div>
                <span
                  aria-hidden="true"
                  className="mt-2 hidden h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent sm:block"
                />
                <span
                  aria-hidden="true"
                  className="hidden self-start text-5xl leading-none text-primary/10 sm:block sm:text-6xl"
                >
                  {count}
                </span>
              </div>

              {/* laureate grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {items.map((item, index) => (
                  <LaureateCard key={`${key}-${index}`} item={item} roman={roman} />
                ))}
              </div>
            </section>
          ))}
        </main>
      )}
    </div>
  );
};

export default RollOfHonorsPage;
