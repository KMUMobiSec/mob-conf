import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ValidYear } from "@/constants/config";
import { YEAR_CONFIG } from "@/constants/config";

export interface ProceedingPeriod {
  id: string;
  title: string;
  description: string | null;
  periodId: number | null;
  coverImageUrl: string | null;
  createdAt: string;
}

export interface Paper {
  id: string;
  session: string | null;
  sessionTitle: string | null;
  room: string | null;
  chair: string | null;
  articleId: string | null;
  presentationType: string;
  presentationDate: string | null;
  startTime: string | null;
  endTime: string | null;
  paperTitle: string;
  authors: string;
  institutions: string | null;
  keywords: string | null;
  abstractFileUrl: string | null;
  paperFileUrl: string | null;
}

export interface Period {
  id: number;
  name: string;
  venue: string | null;
  date: string | null;
}

const PROCEEDINGS_CONFIG: Record<
  ValidYear,
  { csvPath: string; papersDir: string; coverImage: string } | null
> = {
  2025: {
    csvPath: "public/data/2025/program-book-table.csv",
    papersDir: "public/data/2025/mobisec-papers",
    coverImage: "/proceedings/mobisec-2025.png",
  },
  2026: {
    csvPath: "public/data/2026/program-book-table.csv",
    papersDir: "public/data/2026/mobisec-papers",
    coverImage: "/proceedings/mobisec-2026.jpg",
  },
};

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? "";
    }
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let field = "";
      i++;
      while (i < line.length) {
        if (line[i] === '"') {
          i++;
          if (line[i] === '"') {
            field += '"';
            i++;
          } else {
            break;
          }
        } else {
          field += line[i];
          i++;
        }
      }
      result.push(field);
      if (line[i] === ",") i++;
    } else {
      let field = "";
      while (i < line.length && line[i] !== ",") {
        field += line[i];
        i++;
      }
      result.push(field.trim());
      if (line[i] === ",") i++;
    }
  }
  return result;
}

/**
 * Normalize an articleId (from the CSV) or a filename's leading token to a
 * canonical key. Orals become a zero-padded 2-digit number ("1" -> "01"),
 * posters become "P" + zero-padded number ("P-1"/"P7" -> "P01"/"P07").
 * Returns null when the value has no recognizable id prefix.
 */
function canonicalArticleId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const match = raw
    .trim()
    .toUpperCase()
    .match(/^(P)?-?\s*0*(\d{1,2})(?![0-9])/);
  if (!match) return null;
  return `${match[1] ? "P" : ""}${match[2].padStart(2, "0")}`;
}

function getPdfMap(papersDir: string): Map<string, string> {
  const map = new Map<string, string>();
  // Public URL for the papers dir (strip the leading `public/` from the fs path).
  const urlBase = `/${papersDir.replace(/^public\//, "")}`;
  try {
    const basePath = join(process.cwd(), papersDir);
    const files = readdirSync(basePath);
    for (const file of files) {
      if (!file.endsWith(".pdf")) continue;
      const key = canonicalArticleId(file);
      if (key && !map.has(key)) {
        map.set(key, `${urlBase}/${encodeURIComponent(file)}`);
      }
    }
  } catch {
    // Directory may not exist
  }
  return map;
}

export function getProceedingPeriods(year: ValidYear): ProceedingPeriod[] {
  const config = PROCEEDINGS_CONFIG[year];
  if (!config) return [];

  const yearConfig = YEAR_CONFIG[year];
  const proceedingId = `mobisec-${year}`;
  return [
    {
      id: proceedingId,
      title: `MOBISEC ${year} Proceedings`,
      description: `Online proceedings for ${yearConfig.conferenceName}`,
      periodId: 1,
      coverImageUrl: config.coverImage,
      createdAt: yearConfig.startDate,
    },
  ];
}

export function getProceedingDetail(
  year: ValidYear,
  proceedingId: string,
): {
  proceedingPeriod: ProceedingPeriod | null;
  period: Period | null;
  papers: Paper[];
} {
  const config = PROCEEDINGS_CONFIG[year];
  if (!config || proceedingId !== `mobisec-${year}`) {
    return { proceedingPeriod: null, period: null, papers: [] };
  }

  const yearConfig = YEAR_CONFIG[year];
  const csvPath = join(process.cwd(), config.csvPath);
  let csvContent: string;
  try {
    csvContent = readFileSync(csvPath, "utf-8");
  } catch {
    return {
      proceedingPeriod: {
        id: proceedingId,
        title: `MOBISEC ${year} Proceedings`,
        description: null,
        periodId: 1,
        coverImageUrl: config.coverImage,
        createdAt: yearConfig.startDate,
      },
      period: {
        id: 1,
        name: yearConfig.conferenceName,
        venue: yearConfig.venue,
        date: yearConfig.dates,
      },
      papers: [],
    };
  }

  const rows = parseCSV(csvContent);
  const pdfMap = getPdfMap(config.papersDir);
  const papers: Paper[] = rows.map((row, index) => {
    const articleKey = canonicalArticleId(row.articleId);
    const paperFile = articleKey ? pdfMap.get(articleKey) : undefined;
    return {
      id: `paper-${year}-${index + 1}`,
      session: row.session || null,
      sessionTitle: row.sessionTitle || row.session || null,
      room: row.room || null,
      chair: row.chair || null,
      articleId: row.articleId || null,
      presentationType: row.presentationType || "oral",
      presentationDate: row.presentationDate || null,
      startTime: row.startTime || null,
      endTime: row.endTime || null,
      paperTitle: row.paperTitle || "",
      authors: row.authors || "",
      institutions: row.institutions || null,
      keywords: row.keywords || null,
      abstractFileUrl: null,
      paperFileUrl: paperFile || null,
    };
  });

  const proceedingPeriod: ProceedingPeriod = {
    id: proceedingId,
    title: `MOBISEC ${year} Proceedings`,
    description: `Online proceedings for ${yearConfig.conferenceName}`,
    coverImageUrl: config.coverImage,
    periodId: 1,
    createdAt: yearConfig.startDate,
  };

  const period: Period = {
    id: 1,
    name: yearConfig.conferenceName,
    venue: yearConfig.venue,
    date: yearConfig.dates,
  };

  return { proceedingPeriod, period, papers };
}
