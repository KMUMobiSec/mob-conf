/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Mock environment variables for tests
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.BETTER_AUTH_SECRET = "test-secret-for-testing-minimum-32-chars";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.API_URL = "http://localhost:3000/api";
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "pk.test-token";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const enMessages = JSON.parse(
  readFileSync(resolve(process.cwd(), "messages/en.json"), "utf8"),
) as Record<string, unknown>;

function resolveMessage(path: string): string {
  const value = path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, enMessages);

  return typeof value === "string" ? value : path;
}

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations:
    (namespace?: string) => (key: string, values?: Record<string, string | number>) => {
      const path = namespace ? `${namespace}.${key}` : key;
      const template = resolveMessage(path);
      if (!values) return template;
      return template.replace(/\{(\w+)\}/g, (_, token: string) =>
        String(values[token] ?? `{${token}}`),
      );
    },
  useLocale: () => "en",
}));

// Global test utilities
beforeAll(() => {
  // Setup before all tests
});

afterAll(() => {
  // Cleanup after all tests
});

afterEach(() => {
  // Reset mocks after each test
  vi.clearAllMocks();
});
