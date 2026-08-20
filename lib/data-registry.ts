import type { ValidYear } from "@/constants/config";

// 2025 English
import en2025GuestSpeaker from "@/data/2025/en/guest-speaker.json";
import en2025Keynotes from "@/data/2025/en/keynotes.json";
import en2025LifetimeAchievement from "@/data/2025/en/lifetime-achievement.json";
// 2025 Korean
import kr2025GuestSpeaker from "@/data/2025/kr/guest-speaker.json";
import kr2025Keynotes from "@/data/2025/kr/keynotes.json";
import kr2025LifetimeAchievement from "@/data/2025/kr/lifetime-achievement.json";
// 2026 English
import en2026GuestSpeaker from "@/data/2026/en/guest-speaker.json";
import en2026Keynotes from "@/data/2026/en/keynotes.json";
import en2026LifetimeAchievement from "@/data/2026/en/lifetime-achievement.json";
// 2026 Korean
import kr2026GuestSpeaker from "@/data/2026/kr/guest-speaker.json";
import kr2026Keynotes from "@/data/2026/kr/keynotes.json";
import kr2026LifetimeAchievement from "@/data/2026/kr/lifetime-achievement.json";

type DataFileName = "keynotes" | "guest-speaker" | "lifetime-achievement";

const DATA_REGISTRY: Record<ValidYear, Record<string, Record<DataFileName, unknown>>> = {
  2025: {
    en: {
      keynotes: en2025Keynotes,
      "guest-speaker": en2025GuestSpeaker,
      "lifetime-achievement": en2025LifetimeAchievement,
    },
    kr: {
      keynotes: kr2025Keynotes,
      "guest-speaker": kr2025GuestSpeaker,
      "lifetime-achievement": kr2025LifetimeAchievement,
    },
  },
  2026: {
    en: {
      keynotes: en2026Keynotes,
      "guest-speaker": en2026GuestSpeaker,
      "lifetime-achievement": en2026LifetimeAchievement,
    },
    kr: {
      keynotes: kr2026Keynotes,
      "guest-speaker": kr2026GuestSpeaker,
      "lifetime-achievement": kr2026LifetimeAchievement,
    },
  },
};

/**
 * Gets pre-imported data for client components by year, locale, and filename.
 */
export function getClientData<T>(year: ValidYear, locale: string, filename: DataFileName): T {
  const effectiveLocale = locale === "kr" ? "kr" : "en";
  return DATA_REGISTRY[year][effectiveLocale][filename] as T;
}
