import { describe, expect, it } from "vitest";

import {
  bestTitleMatch,
  normalizeTitle,
  TITLE_MATCH_THRESHOLD,
  titleSimilarity,
} from "@/modules/admin/presentations/lib/match";

describe("normalizeTitle", () => {
  it("lowercases, strips punctuation, collapses whitespace", () => {
    expect(normalizeTitle("  A Study:  Foo — Bar!  ")).toBe("a study foo bar");
  });

  it("treats punctuation-only differences as equal", () => {
    expect(normalizeTitle("Global Value Chains — A Review.")).toBe(
      normalizeTitle("Global Value Chains - A Review"),
    );
  });
});

describe("titleSimilarity", () => {
  it("scores identical (post-normalization) titles as 1", () => {
    expect(
      titleSimilarity(
        "Comparative Learning Strategies for Training Belief Rule Base Systems: A Case Study of E-Government Assessment",
        "Comparative Learning Strategies for Training Belief Rule Base Systems: A Case Study of E-Government Assessment",
      ),
    ).toBe(1);
  });

  it("scores a minor edit above the threshold", () => {
    const score = titleSimilarity(
      "Higher Dynamic AES for Commercial Market",
      "Higher Dynamic AES for the Commercial Market",
    );
    expect(score).toBeGreaterThanOrEqual(TITLE_MATCH_THRESHOLD);
  });

  it("scores a substantially reworded title below the threshold", () => {
    const score = titleSimilarity(
      "QFT-Inspired Spectral Edge Filtering for Hybrid Visual Information Systems",
      "QFT-based spectral edge detection framework",
    );
    expect(score).toBeLessThan(TITLE_MATCH_THRESHOLD);
  });
});

describe("bestTitleMatch", () => {
  const uploads = [
    { id: "a", title: "Higher Dynamic AES for Commercial Market" },
    {
      id: "b",
      title:
        "Digital Economy Integration and the Operational Efficiency of Chinese Manufacturing Enterprises: The Mediating Role of Global Value Chains — A Systematic Literature Review",
    },
  ];

  it("returns the closest upload above the threshold", () => {
    const match = bestTitleMatch(
      "Digital Economy Integration and the Operational Efficiency of Chinese Manufacturing Enterprises: The Mediating Role of Global Value Chains - A Systematic Literature Review",
      uploads,
      (u) => u.title,
    );
    expect(match?.id).toBe("b");
  });

  it("returns null when nothing clears the threshold", () => {
    const match = bestTitleMatch("An entirely unrelated keynote talk", uploads, (u) => u.title);
    expect(match).toBeNull();
  });
});
