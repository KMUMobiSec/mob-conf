import { describe, expect, it } from "vitest";

import {
  escapeHtml,
  nominatorWinnerNoticeSubject,
  renderNominatorWinnerNoticeHtml,
  renderWinnerCongratulationsHtml,
  winnerCongratulationsSubject,
} from "@/lib/email/winner-notification.templates";

describe("escapeHtml", () => {
  it("escapes HTML-significant characters", () => {
    expect(escapeHtml(`<script>"&'`)).toBe("&lt;script&gt;&quot;&amp;&#39;");
  });
});

describe("winner congratulations email", () => {
  it("addresses the winner and names the award + year", () => {
    const html = renderWinnerCongratulationsHtml({
      year: 2026,
      awardName: "Young Researcher Award",
      nomineeName: "Alan Turing",
    });
    expect(html).toContain("Dear Alan Turing");
    expect(html).toContain("Young Researcher Award");
    expect(html).toContain("EBISION 2026");
    expect(winnerCongratulationsSubject(2026)).toContain("2026");
  });

  it("escapes interpolated values", () => {
    const html = renderWinnerCongratulationsHtml({
      year: 2026,
      awardName: "Award",
      nomineeName: "<b>x</b>",
    });
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(html).not.toContain("<b>x</b>");
  });

  it("includes the award ceremony date and venue", () => {
    const html = renderWinnerCongratulationsHtml({
      year: 2026,
      awardName: "Young Researcher Award",
      nomineeName: "Alan Turing",
    });
    expect(html).toContain("July 9, 2026");
    expect(html).toContain("The Plaza Hotel, Seoul");
    expect(html).toContain("119 Sogong-ro, Jung District, Seoul");
    expect(html).toContain("https://www.hoteltheplaza.com/en/");
  });

  it("links to the year's Roll of Honors when a URL is supplied", () => {
    const html = renderWinnerCongratulationsHtml({
      year: 2026,
      awardName: "Young Researcher Award",
      nomineeName: "Alan Turing",
      rollOfHonorsUrl: "https://ebision.org/2026/roll-of-honors",
    });
    expect(html).toContain('href="https://ebision.org/2026/roll-of-honors"');
    expect(html).toContain("View the Roll of Honors");
  });

  it("omits the Roll of Honors link when no URL is supplied", () => {
    const html = renderWinnerCongratulationsHtml({
      year: 2026,
      awardName: "Young Researcher Award",
      nomineeName: "Alan Turing",
    });
    expect(html).not.toContain("View the Roll of Honors");
  });
});

describe("nominator winner notice email", () => {
  it("addresses the nominator and names the nominee + award", () => {
    const html = renderNominatorWinnerNoticeHtml({
      year: 2026,
      awardName: "Industry Pioneer Award",
      nominatorName: "Ada Lovelace",
      nomineeName: "Alan Turing",
    });
    expect(html).toContain("Dear Ada Lovelace");
    expect(html).toContain("Alan Turing");
    expect(html).toContain("Industry Pioneer Award");
    expect(nominatorWinnerNoticeSubject(2026)).toContain("2026");
  });

  it("uses a different subject from the winner email", () => {
    expect(nominatorWinnerNoticeSubject(2026)).not.toBe(winnerCongratulationsSubject(2026));
  });

  it("includes the award ceremony details and Roll of Honors link", () => {
    const html = renderNominatorWinnerNoticeHtml({
      year: 2026,
      awardName: "Industry Pioneer Award",
      nominatorName: "Ada Lovelace",
      nomineeName: "Alan Turing",
      rollOfHonorsUrl: "https://ebision.org/2026/roll-of-honors",
    });
    expect(html).toContain("July 9, 2026");
    expect(html).toContain("The Plaza Hotel, Seoul");
    expect(html).toContain('href="https://ebision.org/2026/roll-of-honors"');
    expect(html).toContain("View the Roll of Honors");
  });
});
