import { describe, expect, it, vi } from "vitest";

// The sanitizer module is marked "server-only"; stub it so the module loads under vitest.
vi.mock("server-only", () => ({}));

const { sanitizeEmailHtml } = await import("@/modules/admin/email-blast/lib/sanitize");

describe("sanitizeEmailHtml", () => {
  it("removes <script> and its content", () => {
    const out = sanitizeEmailHtml('<p>Hello</p><script>alert("x")</script>');
    expect(out).toBe("<p>Hello</p>");
    expect(out).not.toContain("script");
  });

  it("removes <style> and inline event handlers", () => {
    const out = sanitizeEmailHtml('<style>p{color:red}</style><p onclick="evil()">Hi</p>');
    expect(out).toBe("<p>Hi</p>");
    expect(out).not.toContain("onclick");
  });

  it("drops javascript: links but keeps the text", () => {
    const out = sanitizeEmailHtml('<p><a href="javascript:alert(1)">Click</a></p>');
    expect(out).not.toContain("javascript:");
    expect(out).toContain("Click");
  });

  it("keeps allowed formatting and hardens links", () => {
    const out = sanitizeEmailHtml(
      '<p><strong>Bold</strong> and <a href="https://mobisec-conference.com">link</a></p>',
    );
    expect(out).toContain("<strong>Bold</strong>");
    expect(out).toContain('href="https://mobisec-conference.com"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain("noopener");
  });

  it("strips disallowed tags", () => {
    const out = sanitizeEmailHtml('<iframe src="https://evil.example"></iframe><p>Safe</p>');
    expect(out).toBe("<p>Safe</p>");
  });

  it("keeps mailto links", () => {
    const out = sanitizeEmailHtml('<p><a href="mailto:info@mobisec-conference.com">Email</a></p>');
    expect(out).toContain('href="mailto:info@mobisec-conference.com"');
  });

  it("preserves a non-1 start on ordered lists", () => {
    const out = sanitizeEmailHtml('<ol start="3"><li>Third</li></ol>');
    expect(out).toContain('start="3"');
  });
});
