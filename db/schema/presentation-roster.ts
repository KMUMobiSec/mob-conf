import { index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

/**
 * The expected-presenter roster: imported from the paper-number/title/author/contact-email
 * spreadsheet so the admin can track who still needs to upload their presentation materials
 * (joined against `presentations` by year + paper number) and blast reminders to the rest.
 */
export const presentationRoster = pgTable(
  "presentation_roster",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    year: integer("year").notNull(),

    paperNumber: text("paper_number").notNull(),
    title: text("title").notNull(),
    author: text("author").notNull(),
    contactEmail: text("contact_email").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("presentation_roster_year_idx").on(table.year),
    unique("presentation_roster_year_paper_number_key").on(table.year, table.paperNumber),
  ],
);

export type PresentationRosterRow = typeof presentationRoster.$inferSelect;
export type NewPresentationRosterRow = typeof presentationRoster.$inferInsert;
