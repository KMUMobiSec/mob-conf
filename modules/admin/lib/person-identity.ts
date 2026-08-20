/**
 * Shared identity rules for attendee-like people (registrations, banquet invitees). A person is
 * keyed by email + name, so one shared email can hold several distinct people, while the same
 * name+email is a duplicate. Kept in one place so every import/dedupe path folds names identically.
 */

/** Fold a name to a comparison form so case and stray whitespace don't split one person into two. */
export function normalizePersonName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Identity key for a person with an email. Two records collapse only when they share both the
 * email and the (normalized) name; the same email with a different name is a distinct person. The
 * NUL separator can't occur in an email or a name, so distinct (email, name) pairs never collide.
 * Pass an already-normalized (trimmed, lowercased) email — callers normalize emails at their edge.
 */
export function personDedupeKey(email: string, name: string): string {
  return `${email}\u0000${normalizePersonName(name)}`;
}
