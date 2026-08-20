import "server-only";

import sanitizeHtml from "sanitize-html";

// Allowlist matches exactly what the composer's toolbar can produce. Everything else — scripts,
// styles, event handlers, inline styles, unknown tags/attributes — is stripped. This is the
// security boundary: the editor output is treated as untrusted and re-sanitized here on the server.
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "s",
    "h1",
    "h2",
    "h3",
    "ul",
    "ol",
    "li",
    "a",
    "blockquote",
    "code",
    "pre",
    "hr",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    // Preserve a non-1 starting number on ordered lists (Tiptap emits <ol start="N">).
    ol: ["start"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { a: ["http", "https", "mailto"] },
  // Drop these tags AND their text content (default behavior, listed for intent).
  nonTextTags: ["style", "script", "textarea", "option", "noscript"],
  // No inline styles or classes reach the email.
  allowedStyles: {},
  transformTags: {
    // Force every surviving link to open safely in a new tab.
    a: sanitizeHtml.simpleTransform(
      "a",
      { target: "_blank", rel: "noopener noreferrer nofollow" },
      true,
    ),
  },
};

/** Sanitize composer HTML to the allowlist above and trim surrounding whitespace. */
export function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS).trim();
}
