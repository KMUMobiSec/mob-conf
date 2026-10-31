import type { ValidYear } from "@/constants/config";
import { loadData } from "@/lib/data";

export interface RegistrationCategory {
  name: string;
  krw: number;
  usd: number;
  requiresPaper: boolean;
}

export interface RegistrationYearData {
  registrationStart: string;
  registrationEnd: string;
  localRegistrationUrl: string;
  categories: RegistrationCategory[];
}

export async function loadRegistrationYearData(year: ValidYear): Promise<RegistrationYearData> {
  return loadData<RegistrationYearData>("registration-categories", year);
}

/** Whether `now` falls within the year's registration window (inclusive end-of-day on the end date). */
export function isRegistrationOpen(data: RegistrationYearData, now = new Date()): boolean {
  const start = new Date(`${data.registrationStart}T00:00:00Z`);
  const end = new Date(`${data.registrationEnd}T23:59:59Z`);
  return now >= start && now <= end;
}

export function findCategory(
  data: RegistrationYearData,
  name: string,
): RegistrationCategory | undefined {
  return data.categories.find((c) => c.name === name);
}
