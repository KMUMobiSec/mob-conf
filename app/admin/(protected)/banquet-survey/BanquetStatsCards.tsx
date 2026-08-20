import { Card } from "@/components/ui/card";
import type { ValidYear } from "@/constants/config";
import { getBanquetStats } from "@/modules/admin/banquet-survey/lib/queries";

function StatCard({ label, value, footnote }: { label: string; value: number; footnote: string }) {
  return (
    <Card className="gap-1 px-5 py-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tabular-nums text-foreground">
        {value.toLocaleString()}
      </span>
      <span className="text-xs text-muted-foreground">{footnote}</span>
    </Card>
  );
}

/** Whole-year overview cards shown above the banquet responses table. */
export async function BanquetStatsCards({ year }: { year: ValidYear }) {
  const stats = await getBanquetStats(year);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total invitees"
        value={stats.total}
        footnote={`${stats.responded}/${stats.total} responded · ${stats.responseRate}%`}
      />
      <StatCard label="Attending" value={stats.attending} footnote="confirmed headcount" />
      <StatCard
        label="Not attending"
        value={stats.notAttending}
        footnote={`${stats.awaiting} awaiting response`}
      />
      <StatCard
        label="Dietary needs"
        value={stats.dietaryNeeds}
        footnote="attendees with allergens/notes"
      />
    </div>
  );
}
