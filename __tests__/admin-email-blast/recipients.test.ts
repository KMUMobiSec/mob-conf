import { describe, expect, it } from "vitest";
import {
  hasRenderableBody,
  resolveRecipientEmails,
} from "@/modules/admin/email-blast/lib/recipients";

describe("resolveRecipientEmails", () => {
  it("normalizes, validates, and dedupes", () => {
    expect(
      resolveRecipientEmails([
        { email: null },
        { email: " Ada@Example.com " },
        { email: "ada@example.com" },
        { email: "not-an-email" },
        { email: "grace@example.org" },
      ]),
    ).toEqual(["ada@example.com", "grace@example.org"]);
  });

  it("returns an empty list when nothing is valid", () => {
    expect(resolveRecipientEmails([{ email: null }, { email: "bad" }])).toEqual([]);
  });
});

describe("hasRenderableBody", () => {
  it("treats an empty editor as empty", () => {
    expect(hasRenderableBody("<p></p>")).toBe(false);
    expect(hasRenderableBody("  <p>  </p> ")).toBe(false);
    expect(hasRenderableBody("<p>&nbsp;</p>")).toBe(false);
  });

  it("treats real text or a link/rule as content", () => {
    expect(hasRenderableBody("<p>Hello everyone</p>")).toBe(true);
    expect(hasRenderableBody('<p><a href="https://x.example">x</a></p>')).toBe(true);
    expect(hasRenderableBody("<p></p><hr>")).toBe(true);
  });
});
