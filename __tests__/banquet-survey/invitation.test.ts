import { describe, expect, it } from "vitest";
import {
  banquetInvitationSubject,
  renderBanquetInvitationHtml,
  renderBanquetInvitationText,
} from "@/lib/email/banquet-invitation.templates";
import { renderBanquetVenueHero } from "@/lib/email/banquet-venue.templates";
import { banquetSurveyPath, banquetSurveyUrl } from "@/lib/routes/banquet-survey";

const VENUE_IMAGE = "https://ebision.org/assets/venue/2026/THE_PLAZA.jpg";

const EMDASH = "—";

const baseInput = {
  year: 2026,
  name: "Jane Doe",
  banquetDate: "July 9",
  banquetVenue: "the Plaza Hotel",
  surveyUrl: "https://example.org/2026/banquet-survey?email=jane%40x.org&name=Jane%20Doe",
};

describe("banquet invitation email", () => {
  it("subject includes the year", () => {
    expect(banquetInvitationSubject(2026)).toContain("2026");
  });

  it("html includes the recipient name, date, venue, and survey link", () => {
    const html = renderBanquetInvitationHtml(baseInput);
    expect(html).toContain("Jane Doe");
    expect(html).toContain("July 9");
    expect(html).toContain("the Plaza Hotel");
    // The URL is HTML-escaped inside the href (its & becomes &amp;).
    expect(html).toContain("https://example.org/2026/banquet-survey?email=jane%40x.org");
    expect(html).toContain("&amp;name=Jane%20Doe");
  });

  it("text includes the raw (unescaped) survey link", () => {
    expect(renderBanquetInvitationText(baseInput)).toContain(baseInput.surveyUrl);
  });

  it("escapes injected HTML in the name", () => {
    const html = renderBanquetInvitationHtml({ ...baseInput, name: "<script>alert(1)</script>" });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("falls back to a generic greeting when no name is provided", () => {
    const html = renderBanquetInvitationHtml({ ...baseInput, name: "" });
    expect(html).toContain("Hello,");
    const text = renderBanquetInvitationText({ ...baseInput, name: "" });
    expect(text).toContain("Hello,");
  });

  it("contains no emdash in html or text", () => {
    expect(renderBanquetInvitationHtml(baseInput)).not.toContain(EMDASH);
    expect(renderBanquetInvitationText(baseInput)).not.toContain(EMDASH);
  });
});

describe("banquet venue hero", () => {
  it("embeds the given image with alt text and a text caption fallback", () => {
    const hero = renderBanquetVenueHero({
      imageUrl: VENUE_IMAGE,
      venue: "the Plaza Hotel",
      date: "July 9",
    });
    expect(hero).toContain(VENUE_IMAGE);
    expect(hero).toContain('alt="the Plaza Hotel, the banquet venue"');
    // Caption renders as text even if the image never loads.
    expect(hero).toContain("the Plaza Hotel on July 9");
    expect(hero).not.toContain(EMDASH);
  });

  it("renders nothing when no image is available", () => {
    expect(renderBanquetVenueHero({ venue: "the Plaza Hotel", date: "July 9" })).toBe("");
  });

  it("escapes injected venue text", () => {
    const hero = renderBanquetVenueHero({
      imageUrl: VENUE_IMAGE,
      venue: "<b>x</b>",
      date: "July 9",
    });
    expect(hero).not.toContain("<b>x</b>");
    expect(hero).toContain("&lt;b&gt;x&lt;/b&gt;");
  });

  it("is included in the invitation email body only when a venue image is supplied", () => {
    const withImage = renderBanquetInvitationHtml({ ...baseInput, venueImageUrl: VENUE_IMAGE });
    expect(withImage).toContain(VENUE_IMAGE);
    const withoutImage = renderBanquetInvitationHtml(baseInput);
    expect(withoutImage).not.toContain("assets/venue");
  });
});

describe("banquet survey route helper", () => {
  it("builds a bare path with no params", () => {
    expect(banquetSurveyPath(2026)).toBe("/2026/banquet-survey");
  });

  it("encodes email, name, and affiliation params", () => {
    const path = banquetSurveyPath(2026, {
      email: "jane@x.org",
      name: "Jane Doe",
      affiliation: "ACME University",
    });
    expect(path).toContain("email=jane%40x.org");
    expect(path).toContain("name=Jane+Doe");
    expect(path).toContain("affiliation=ACME+University");
  });

  it("omits absent params", () => {
    expect(banquetSurveyPath(2026, { email: "jane@x.org" })).toBe(
      "/2026/banquet-survey?email=jane%40x.org",
    );
  });

  it("builds an absolute url and trims a trailing slash on the base", () => {
    expect(banquetSurveyUrl("https://example.org/", 2026, { email: "jane@x.org" })).toBe(
      "https://example.org/2026/banquet-survey?email=jane%40x.org",
    );
  });
});
