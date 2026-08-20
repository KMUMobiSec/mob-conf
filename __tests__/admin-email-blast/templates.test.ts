import { describe, expect, it } from "vitest";
import { renderEmailBlastHtml } from "@/lib/email/email-blast.templates";

describe("renderEmailBlastHtml", () => {
  it("wraps the sanitized body and shows the subject + year, escaping the subject", () => {
    const html = renderEmailBlastHtml({
      year: 2026,
      subject: "Hi <there> & welcome",
      bodyHtml: "<p>Body content</p>",
      logoUrl: "https://ebision.ifip-wg84.org/assets/email/ebision-logo-email.png",
    });

    expect(html).toContain("<p>Body content</p>");
    expect(html).toContain("EBISION 2026");
    // Subject is HTML-escaped in the header.
    expect(html).toContain("Hi &lt;there&gt; &amp; welcome");
    expect(html).not.toContain("Hi <there>");
    // Logo is rendered when a URL is provided.
    expect(html).toContain("https://ebision.ifip-wg84.org/assets/email/ebision-logo-email.png");
  });

  it("omits the logo image when no URL is provided", () => {
    const html = renderEmailBlastHtml({
      year: 2026,
      subject: "No logo",
      bodyHtml: "<p>Body</p>",
    });
    expect(html).not.toContain("<img");
    expect(html).toContain("<p>Body</p>");
  });
});
