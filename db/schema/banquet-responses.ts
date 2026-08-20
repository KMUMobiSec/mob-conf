import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const banquetResponses = pgTable(
  "banquet_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Conference year taken from the /[year] route. */
    year: integer("year").notNull(),

    name: text("name").notNull(),
    affiliation: text("affiliation"),
    /**
     * Normalized lowercase attendee email. Unique per conference year together with the name, so
     * one shared email can hold several distinct people (mirrors the registrations identity model).
     */
    email: text("email").notNull(),

    /** Whether the respondent will attend the banquet. */
    attending: boolean("attending").notNull().default(false),
    /** Selected allergen ids (see landing banquet-survey constants). Empty when not attending. */
    allergens: jsonb("allergens").$type<string[]>().notNull().default([]),
    /** Free-text allergen / dietary note. Null when not attending or unused. */
    allergenOther: text("allergen_other"),
    /** Optional message for the organizers. Null when not attending or unused. */
    message: text("message"),

    /** When the survey was submitted (null = imported invitee, not yet responded). */
    respondedAt: timestamp("responded_at", { withTimezone: true }),

    /** When the RSVP confirmation email was last sent (null = never). */
    confirmationSentAt: timestamp("confirmation_sent_at", { withTimezone: true }),
    /** Total confirmation emails successfully sent (submit + resends). */
    emailsSentCount: integer("emails_sent_count").notNull().default(0),

    /** When the banquet invitation email was last sent (null = never). */
    invitationSentAt: timestamp("invitation_sent_at", { withTimezone: true }),
    /** Total invitation emails successfully sent. */
    invitationsSentCount: integer("invitations_sent_count").notNull().default(0),

    ...timestamps,
  },
  (table) => [
    index("banquet_responses_year_idx").on(table.year),
    // Keyed by (year, email, name): a shared email can hold several distinct people, but the same
    // name+email is a duplicate. Both the admin import and the public RSVP upsert conflict on this.
    uniqueIndex("banquet_responses_year_email_name_idx").on(table.year, table.email, table.name),
  ],
);

export type BanquetResponse = typeof banquetResponses.$inferSelect;
export type NewBanquetResponse = typeof banquetResponses.$inferInsert;
