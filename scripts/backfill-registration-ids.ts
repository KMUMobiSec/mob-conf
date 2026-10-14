import "dotenv/config";
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";
import { closeDb, db } from "@/db";
import { registrations } from "@/db/schema";
import { normalizePersonName, personDedupeKey } from "@/modules/admin/lib/person-identity";
import { normalizeRegistrationEmail } from "@/modules/admin/qr-check-ins/lib/registration-input";

/**
 * One-time ops script: assign each existing registration its participant ID number (`No.` column)
 * from the reference participant list.
 *
 * Matching mirrors the CSV importer's identity rules:
 *   - a list row WITH an email matches the registration sharing its (normalized email, name)
 *   - a list row WITHOUT an email matches a unique null-email registration by normalized name
 *
 * DRY RUN by default: prints matched / unmatched / un-numbered reports and writes nothing.
 * Pass `--apply` to commit. Idempotent — applying only touches rows whose id_number differs.
 *
 * Usage:
 *   pnpm registrations:backfill-ids                       # dry run, default CSV + year 2026
 *   pnpm registrations:backfill-ids --apply               # write
 *   pnpm registrations:backfill-ids "path/to.csv" 2026 --apply
 */

const DEFAULT_CSV = "MOBISEC Participants - 시트1.csv";
const DEFAULT_YEAR = 2026;

interface ListRow {
  no: number;
  name: string;
  email: string | null;
}

function parseList(csvPath: string): {
  rows: ListRow[];
  skipped: { line: number; reason: string }[];
} {
  const content = readFileSync(csvPath, "utf8");
  const records = parse(content, {
    // Same header folding as the importer, so "No." → "no" and "E-mail" → "e-mail".
    columns: (headers: string[]) =>
      headers.map((header) => header.trim().toLowerCase().replace(/\.+$/, "")),
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const rows: ListRow[] = [];
  const skipped: { line: number; reason: string }[] = [];
  records.forEach((record, index) => {
    const line = index + 2; // header is line 1
    const name = (record.name ?? "").trim();
    const rawNo = (record.no ?? record.id ?? "").trim();
    const no = Number.parseInt(rawNo, 10);
    if (!name) {
      skipped.push({ line, reason: "missing name" });
      return;
    }
    if (!/^\d+$/.test(rawNo) || no <= 0) {
      skipped.push({ line, reason: `invalid No. "${rawNo}" for ${name}` });
      return;
    }
    const rawEmail = (record["e-mail"] ?? record.email ?? "").trim();
    rows.push({ no, name, email: rawEmail ? normalizeRegistrationEmail(rawEmail) : null });
  });
  return { rows, skipped };
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const positional = args.filter((arg) => !arg.startsWith("--"));
  const csvPath = positional[0] ?? DEFAULT_CSV;
  const year = positional[1] ? Number.parseInt(positional[1], 10) : DEFAULT_YEAR;

  console.log(`Backfilling registration ID numbers for year ${year} from "${csvPath}"`);
  console.log(
    apply ? "Mode: APPLY (writing changes)\n" : "Mode: DRY RUN (no changes will be written)\n",
  );

  const { rows: listRows, skipped } = parseList(csvPath);

  const regs = await db.select().from(registrations).where(eq(registrations.year, year));

  // Identity maps mirroring the importer: email rows by (email, name); walk-ins by unique name.
  const byEmailName = new Map<string, (typeof regs)[number]>();
  const nullEmailByName = new Map<string, (typeof regs)[number][]>();
  for (const reg of regs) {
    if (reg.email) {
      byEmailName.set(personDedupeKey(normalizeRegistrationEmail(reg.email), reg.name), reg);
    } else {
      const key = normalizePersonName(reg.name);
      const list = nullEmailByName.get(key) ?? [];
      list.push(reg);
      nullEmailByName.set(key, list);
    }
  }

  const updates: { id: string; from: number | null; to: number; name: string }[] = [];
  const unchanged: number[] = [];
  const unmatched: ListRow[] = [];
  const ambiguous: ListRow[] = [];
  const collisions: { name: string; firstNo: number; secondNo: number }[] = [];
  const matchedRegIds = new Set<string>();
  const noAssignedBy = new Map<number, string>(); // No. -> registration name it was first assigned to
  const regAssignedNo = new Map<string, number>(); // registration id -> No. already assigned this run

  for (const row of listRows) {
    let match: (typeof regs)[number] | undefined;
    if (row.email) {
      match = byEmailName.get(personDedupeKey(row.email, row.name));
    } else {
      const list = nullEmailByName.get(normalizePersonName(row.name)) ?? [];
      if (list.length === 1) match = list[0];
      else if (list.length > 1) {
        ambiguous.push(row);
        continue;
      }
    }

    if (!match) {
      unmatched.push(row);
      continue;
    }

    // Two list rows resolving to one registration would silently let the last No. win — surface it
    // and skip the conflicting overwrite instead. Likewise flag one No. reused across two people.
    const priorNo = regAssignedNo.get(match.id);
    if (priorNo !== undefined) {
      collisions.push({ name: match.name, firstNo: priorNo, secondNo: row.no });
      continue;
    }
    const priorName = noAssignedBy.get(row.no);
    if (priorName !== undefined && priorName !== match.name) {
      collisions.push({
        name: `#${row.no} → ${priorName} & ${match.name}`,
        firstNo: row.no,
        secondNo: row.no,
      });
    }
    regAssignedNo.set(match.id, row.no);
    noAssignedBy.set(row.no, match.name);

    matchedRegIds.add(match.id);
    if (match.idNumber === row.no) {
      unchanged.push(row.no);
    } else {
      updates.push({ id: match.id, from: match.idNumber, to: row.no, name: match.name });
    }
  }

  const unnumbered = regs.filter((reg) => !matchedRegIds.has(reg.id) && reg.idNumber == null);

  // ---- Report ----
  console.log(`List rows read:        ${listRows.length}`);
  console.log(`Registrations (${year}):  ${regs.length}`);
  console.log(`Already correct:       ${unchanged.length}`);
  console.log(`To assign/update:      ${updates.length}`);
  console.log(`Unmatched list rows:   ${unmatched.length}`);
  console.log(`Ambiguous (name):      ${ambiguous.length}`);
  console.log(`Collisions:            ${collisions.length}`);
  console.log(`Registrations w/o ID:  ${unnumbered.length}`);
  if (skipped.length) console.log(`Skipped CSV lines:     ${skipped.length}`);

  if (updates.length) {
    console.log("\nAssignments:");
    for (const u of updates) {
      console.log(
        `  #${String(u.to).padStart(3, "0")}  ${u.name}${u.from != null ? `  (was #${u.from})` : ""}`,
      );
    }
  }
  if (unmatched.length) {
    console.log("\nUnmatched list rows (no registration found):");
    for (const r of unmatched)
      console.log(`  #${r.no}  ${r.name}${r.email ? `  <${r.email}>` : "  (no email)"}`);
  }
  if (ambiguous.length) {
    console.log("\nAmbiguous list rows (multiple null-email registrations share the name):");
    for (const r of ambiguous) console.log(`  #${r.no}  ${r.name}`);
  }
  if (collisions.length) {
    console.log("\nCollisions (two list rows map to one registration, or one No. reused):");
    for (const c of collisions) console.log(`  ${c.name}: #${c.firstNo} vs #${c.secondNo}`);
  }
  if (unnumbered.length) {
    console.log("\nRegistrations left without an ID number:");
    for (const reg of unnumbered)
      console.log(`  ${reg.name}${reg.email ? `  <${reg.email}>` : "  (no email)"}`);
  }
  if (skipped.length) {
    console.log("\nSkipped CSV lines:");
    for (const s of skipped) console.log(`  line ${s.line}: ${s.reason}`);
  }

  if (!apply) {
    console.log("\nDry run complete. Re-run with --apply to write these assignments.");
    return;
  }

  if (collisions.length) {
    console.log("\nRefusing to apply: resolve the collisions above in the source list first.");
    process.exitCode = 1;
    return;
  }

  if (updates.length === 0) {
    console.log("\nNothing to write.");
    return;
  }

  await db.transaction(async (tx) => {
    for (const u of updates) {
      await tx
        .update(registrations)
        .set({ idNumber: u.to, updatedAt: new Date() })
        .where(eq(registrations.id, u.id));
    }
  });
  console.log(`\nApplied ${updates.length} ID number assignment(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
