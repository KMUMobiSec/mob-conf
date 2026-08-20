import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const presentations = pgTable(
  "presentations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Conference year taken from the /[year] route. */
    year: integer("year").notNull(),

    paperNumber: text("paper_number").notNull(),
    title: text("title").notNull(),
    /** Designated contact person's email; the confirmation is sent here. */
    contactEmail: text("contact_email").notNull(),

    // Uploaded files live in the `presentation_files` child table.

    /**
     * External link (Google Drive/OneDrive/etc.) for a presentation video that is
     * too large to upload (> 50 MB). Mutually exclusive with an uploaded video in
     * `presentation_files`. Null when no external video link was provided.
     */
    videoUrl: text("video_url"),

    /** Marked reviewed by an admin. */
    isReviewed: boolean("is_reviewed").notNull().default(false),
    /** When an admin marked it reviewed (null = not yet). */
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),

    ...timestamps,
  },
  (table) => [index("presentations_year_idx").on(table.year)],
);

export type Presentation = typeof presentations.$inferSelect;
export type NewPresentation = typeof presentations.$inferInsert;
