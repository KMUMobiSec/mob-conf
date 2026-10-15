import { describe, expect, it } from "vitest";
import {
  checkInWelcomeSubject,
  registrationPassSubject,
  renderCheckInWelcomeHtml,
  renderRegistrationPassHtml,
} from "@/lib/email/registration-check-in.templates";

describe("registration QR pass email", () => {
  it("names the attendee, year, venue, and links to the public QR pass page", () => {
    const html = renderRegistrationPassHtml({
      year: 2026,
      name: "Ada Lovelace",
      venue: "Kookmin University",
      dates: "July 8-10, 2026",
      passUrl: "https://mobisec.example/registration-pass/abc123",
    });

    expect(html).toContain("Dear Ada Lovelace");
    expect(html).toContain("MOBISEC 2026");
    expect(html).toContain("Kookmin University");
    expect(html).toContain("July 8-10, 2026");
    expect(html).toContain("https://mobisec.example/registration-pass/abc123");
    expect(html).toContain("View your QR pass");
    expect(html).not.toContain("data:image");
    expect(registrationPassSubject(2026)).toContain("2026");
  });

  it("escapes attendee-controlled values", () => {
    const html = renderRegistrationPassHtml({
      year: 2026,
      name: "<b>Ada</b>",
      venue: "<script>",
      dates: "July",
      passUrl: "https://mobisec.example/registration-pass/abc123?x=<script>",
    });

    expect(html).toContain("&lt;b&gt;Ada&lt;/b&gt;");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("x=&lt;script&gt;");
    expect(html).not.toContain("<b>Ada</b>");
  });
});

describe("check-in welcome email", () => {
  it("welcomes the attendee to MOBISEC for the selected year", () => {
    const html = renderCheckInWelcomeHtml({ year: 2026, name: "Grace Hopper" });

    expect(html).toContain("Dear Grace Hopper");
    expect(html).toContain("Welcome to MOBISEC 2026");
    expect(checkInWelcomeSubject(2026)).toContain("2026");
  });
});
