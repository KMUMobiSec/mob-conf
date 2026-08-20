import { personDedupeKey } from "@/modules/admin/lib/person-identity";

/**
 * Pick the invitees to insert as banquet rows: drop anyone whose (email + name) identity is already
 * present in the banquet responses, and collapse duplicates within the batch. A shared email with
 * different names yields several distinct invitees (mirrors the registrations identity model).
 */
export function dedupeBanquetInvitees<T extends { email: string; name: string }>(
  invitees: T[],
  existingKeys: Set<string>,
): T[] {
  const seen = new Set<string>();
  return invitees.filter((invitee) => {
    const key = personDedupeKey(invitee.email, invitee.name);
    if (existingKeys.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
