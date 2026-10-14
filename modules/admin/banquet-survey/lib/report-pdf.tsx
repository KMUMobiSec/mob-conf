import { Document, Image, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";
import { isValidYear, YEAR_CONFIG } from "@/constants/config";
import { allergenLabel } from "@/modules/landing/banquet-survey/lib/constants";
import type { BanquetStats } from "./queries";
import { LOGO_PATH, REPORT_FONTS } from "./report-fonts";
import {
  allergenBreakdown,
  hasDietaryNeed,
  orderAttendingForReport,
  otherDietaryCount,
} from "./summary";

/** Structural subset of `BanquetResponse` the report needs. */
export interface BanquetReportRow {
  name: string;
  affiliation: string | null;
  email: string;
  attending: boolean;
  respondedAt: Date | null;
  allergens: string[];
  allergenOther: string | null;
}

const SANS = REPORT_FONTS.sans;
const MONO = REPORT_FONTS.mono;

// MOBISEC light theme (styles/globals.css): warm-white surfaces, near-black ink, forest-green brand.
const INK = "#121212"; // --foreground
const BODY = "#3a3a3a"; // slightly softened ink for running text
const MUTED = "#737373"; // --muted-foreground (rgba(0,0,0,.55))
const FAINT = "#9a9a9a";
const LINE = "#e3e3e3"; // --border (rgba(0,0,0,.12) on white)
const SURFACE = "#FAFAFA"; // --background
const GREEN = "#578429"; // --primary
const GREEN_DARK = "#3D5E1D"; // --chart-1
const GREEN_MID = "#7AB356"; // --chart-3
const GREEN_SOFT = "#EDF4E8"; // --accent
const GREEN_LINE = "#A3D182"; // --chart-4

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 46,
    paddingHorizontal: 36,
    fontFamily: SANS,
    fontSize: 9.5,
    fontWeight: 400,
    color: BODY,
    lineHeight: 1.45,
  },

  // ── Masthead ──
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 38, height: 38 },
  brand: {
    fontFamily: MONO,
    fontWeight: 500,
    fontSize: 8,
    letterSpacing: 2,
    color: GREEN,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontFamily: SANS,
    fontWeight: 300,
    fontSize: 23,
    lineHeight: 1,
    color: INK,
    marginTop: 3,
  },
  headerSub: { fontSize: 8.5, color: MUTED, marginTop: 6 },
  headerMetaLabel: {
    fontFamily: MONO,
    fontWeight: 500,
    fontSize: 6.5,
    letterSpacing: 1.5,
    color: FAINT,
    textTransform: "uppercase",
    textAlign: "right",
  },
  headerMetaValue: {
    fontFamily: MONO,
    fontSize: 8.5,
    color: BODY,
    marginTop: 3,
    textAlign: "right",
  },
  rule: { height: 2, backgroundColor: GREEN, borderRadius: 2, marginTop: 12 },

  // ── KPI cards ──
  kpiRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  kpiCard: {
    flex: 1,
    borderRadius: 8,
    border: `1 solid ${LINE}`,
    borderTop: `3 solid ${GREEN}`,
    backgroundColor: "#ffffff",
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  kpiCardSoft: {
    borderColor: GREEN_LINE,
    borderTop: `3 solid ${GREEN_DARK}`,
    backgroundColor: GREEN_SOFT,
  },
  kpiValue: { fontFamily: SANS, fontWeight: 600, fontSize: 29, lineHeight: 1, color: INK },
  kpiValueSoft: { color: GREEN_DARK },
  kpiLabel: { fontFamily: SANS, fontWeight: 500, fontSize: 10.5, color: INK, marginTop: 7 },
  kpiHint: { fontSize: 8, color: MUTED, marginTop: 2 },

  // ── Secondary stat strip ──
  strip: {
    flexDirection: "row",
    marginTop: 12,
    borderRadius: 8,
    border: `1 solid ${LINE}`,
    backgroundColor: SURFACE,
    paddingVertical: 11,
  },
  stripItem: { flex: 1, alignItems: "center", borderRight: `1 solid ${LINE}` },
  stripItemLast: { borderRight: "0" },
  stripValue: { fontFamily: SANS, fontWeight: 600, fontSize: 14, color: INK },
  stripLabel: {
    fontFamily: MONO,
    fontWeight: 500,
    fontSize: 6.5,
    color: MUTED,
    marginTop: 3,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  // ── Section headings ──
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 9,
    borderBottom: `1 solid ${LINE}`,
    paddingBottom: 5,
  },
  sectionTitle: { fontFamily: SANS, fontWeight: 600, fontSize: 12, color: INK },
  sectionMeta: {
    fontFamily: MONO,
    fontWeight: 400,
    fontSize: 7.5,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Dietary breakdown bars ──
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  barLabel: { width: 92, fontSize: 9, color: BODY },
  barTrack: { flex: 1, height: 9, backgroundColor: "#EFEFEF", borderRadius: 5 },
  barFill: { height: 9, borderRadius: 5, backgroundColor: GREEN },
  barFillAlt: { backgroundColor: GREEN_MID },
  barCount: {
    width: 22,
    fontFamily: SANS,
    fontWeight: 600,
    fontSize: 9,
    color: INK,
    textAlign: "right",
  },
  emptyNote: { fontSize: 9, color: MUTED, fontWeight: 300 },

  // ── Guest table ──
  legendRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 7 },
  legendSwatch: {
    width: 9,
    height: 9,
    borderRadius: 2,
    backgroundColor: GREEN_SOFT,
    border: `1 solid ${GREEN_LINE}`,
  },
  legendText: { fontSize: 8, color: MUTED },
  tHead: {
    flexDirection: "row",
    backgroundColor: GREEN,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  th: {
    fontFamily: MONO,
    fontWeight: 500,
    fontSize: 7.5,
    color: "#ffffff",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  tRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderBottom: `1 solid ${LINE}`,
    borderLeft: "3 solid #ffffff",
  },
  tRowDiet: { backgroundColor: GREEN_SOFT, borderLeft: `3 solid ${GREEN}` },
  cName: { width: "30%", paddingRight: 6, fontFamily: SANS, fontWeight: 500, color: INK },
  cAff: { width: "34%", paddingRight: 6, color: BODY },
  cDiet: { width: "36%", color: BODY },
  dietTag: { fontWeight: 500, color: GREEN_DARK },
  dietNone: { color: FAINT },

  footer: {
    position: "absolute",
    bottom: 22,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontFamily: MONO,
    fontSize: 7,
    color: FAINT,
    borderTop: `1 solid ${LINE}`,
    paddingTop: 7,
  },
});

function conferenceLine(year: number): string {
  if (!isValidYear(year)) return "";
  const c = YEAR_CONFIG[year];
  return `${c.venue} · ${c.location}`;
}

function Kpi({
  value,
  label,
  hint,
  soft,
}: {
  value: number;
  label: string;
  hint: string;
  soft?: boolean;
}) {
  return (
    <View style={soft ? [styles.kpiCard, styles.kpiCardSoft] : styles.kpiCard}>
      <Text style={soft ? [styles.kpiValue, styles.kpiValueSoft] : styles.kpiValue}>
        {value.toLocaleString()}
      </Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiHint}>{hint}</Text>
    </View>
  );
}

function StripStat({
  value,
  label,
  last,
}: {
  value: number | string;
  label: string;
  last?: boolean;
}) {
  return (
    <View style={last ? [styles.stripItem, styles.stripItemLast] : styles.stripItem}>
      <Text style={styles.stripValue}>{value}</Text>
      <Text style={styles.stripLabel}>{label}</Text>
    </View>
  );
}

function dietaryText(row: BanquetReportRow): { text: string; need: boolean } {
  const parts = [
    row.allergens.map(allergenLabel).join(", "),
    row.allergenOther?.trim() || "",
  ].filter(Boolean);
  if (parts.length === 0) return { text: "None", need: false };
  return { text: parts.join(" · "), need: true };
}

function BanquetReportDocument({
  year,
  rows,
  stats,
  generatedAtLabel,
}: {
  year: number;
  rows: BanquetReportRow[];
  stats: BanquetStats;
  generatedAtLabel: string;
}) {
  const breakdown = allergenBreakdown(rows);
  const otherCount = otherDietaryCount(rows);
  const maxCount = Math.max(1, ...breakdown.map((b) => b.count), otherCount);
  const guests = orderAttendingForReport(rows);
  const dietaryGuests = guests.filter(hasDietaryNeed).length;
  const subtitle = conferenceLine(year);

  return (
    <Document title={`MOBISEC ${year} Banquet Report`}>
      <Page size="A4" style={styles.page}>
        {/* Masthead */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {LOGO_PATH ? <Image src={LOGO_PATH} style={styles.logo} /> : null}
            <View>
              <Text style={styles.brand}>MOBISEC {year}</Text>
              <Text style={styles.headerTitle}>Banquet Report</Text>
              {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
            </View>
          </View>
          <View>
            <Text style={styles.headerMetaLabel}>Generated</Text>
            <Text style={styles.headerMetaValue}>{generatedAtLabel}</Text>
          </View>
        </View>
        <View style={styles.rule} />

        {/* Headline KPIs */}
        <View style={styles.kpiRow}>
          <Kpi value={stats.attending} label="Expected attendance" hint="confirmed guests" />
          <Kpi
            value={stats.dietaryNeeds}
            label="With dietary needs"
            hint="allergens or notes"
            soft
          />
        </View>

        {/* Secondary counts — the only place not-attending & invited appear */}
        <View style={styles.strip}>
          <StripStat value={stats.total} label="Invitees" />
          <StripStat value={stats.responded} label="Responded" />
          <StripStat value={stats.notAttending} label="Not attending" />
          <StripStat value={stats.awaiting} label="Invited / awaiting" />
          <StripStat value={`${stats.responseRate}%`} label="Response rate" last />
        </View>

        {/* Dietary breakdown */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Dietary breakdown</Text>
          <Text style={styles.sectionMeta}>among confirmed guests</Text>
        </View>
        {breakdown.length === 0 && otherCount === 0 ? (
          <Text style={styles.emptyNote}>No dietary needs reported among attending guests.</Text>
        ) : (
          <View>
            {breakdown.map((a) => (
              <View key={a.id} style={styles.barRow}>
                <Text style={styles.barLabel}>{a.label}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(a.count / maxCount) * 100}%` }]} />
                </View>
                <Text style={styles.barCount}>{a.count}</Text>
              </View>
            ))}
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Other note</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    styles.barFillAlt,
                    { width: `${(otherCount / maxCount) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.barCount}>{otherCount}</Text>
            </View>
          </View>
        )}

        {/* Attending guest list */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Attending guests</Text>
          <Text style={styles.sectionMeta}>
            {guests.length} total · {dietaryGuests} with dietary needs
          </Text>
        </View>

        {guests.length === 0 ? (
          <Text style={styles.emptyNote}>No confirmed attendees yet.</Text>
        ) : (
          <View>
            <View style={styles.legendRow}>
              <View style={styles.legendSwatch} />
              <Text style={styles.legendText}>
                Rows highlighted in green have dietary needs and are listed first.
              </Text>
            </View>
            <View style={styles.tHead} fixed>
              <Text style={[styles.th, styles.cName]}>Name</Text>
              <Text style={[styles.th, styles.cAff]}>Affiliation</Text>
              <Text style={[styles.th, styles.cDiet]}>Dietary requirements</Text>
            </View>
            {guests.map((row, i) => {
              const diet = dietaryText(row);
              return (
                <View
                  key={`${row.email}-${row.name}-${i}`}
                  style={diet.need ? [styles.tRow, styles.tRowDiet] : styles.tRow}
                  wrap={false}
                >
                  <Text style={styles.cName}>{row.name}</Text>
                  <Text style={styles.cAff}>{row.affiliation || "—"}</Text>
                  <Text style={[styles.cDiet, diet.need ? styles.dietTag : styles.dietNone]}>
                    {diet.text}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>MOBISEC {year} · Banquet Report</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** Render the banquet report to a PDF buffer. `generatedAtLabel` is passed in for testability. */
export function renderBanquetReport(input: {
  year: number;
  rows: BanquetReportRow[];
  stats: BanquetStats;
  generatedAtLabel: string;
}): Promise<Buffer> {
  return renderToBuffer(<BanquetReportDocument {...input} />);
}
