import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/** A single stored document: its storage path plus the original file metadata. */
export type NominationDocument = {
  path: string;
  name: string;
  size: number;
};

/** Map of document-field key (cv, achievements, supporting, …) to its stored files. */
export type NominationDocuments = Record<string, NominationDocument[]>;

export const nominations = pgTable(
  "nominations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Conference year taken from the /[year] route. */
    year: integer("year").notNull(),
    award: text("award").notNull(),

    // Nominator
    nominatorName: text("nominator_name").notNull(),
    nominatorEmail: text("nominator_email").notNull(),
    nominatorAffiliation: text("nominator_affiliation").notNull(),
    nominatorRelationship: text("nominator_relationship").notNull(),

    // Nominee
    nomineeName: text("nominee_name").notNull(),
    nomineeEmail: text("nominee_email").notNull(),
    nomineeAffiliation: text("nominee_affiliation").notNull(),
    nomineePosition: text("nominee_position").notNull(),
    nomineeCountry: text("nominee_country").notNull(),

    // Promising Graduate Student only
    degree: text("degree"),
    enrollment: text("enrollment"),

    statement: text("statement").notNull(),
    consent: boolean("consent").notNull().default(false),

    /** Uploaded document paths keyed by field. */
    documents: jsonb("documents").$type<NominationDocuments>().notNull().default({}),
    /** Detected page count for the Industry Pioneer slide deck (null if unknown). */
    slidePages: integer("slide_pages"),

    /** Marked as an award winner by an admin. Multiple winners per award allowed. */
    isWinner: boolean("is_winner").notNull().default(false),
    /** When the winner + nominator notification emails were sent (null = not yet). */
    winnerNotifiedAt: timestamp("winner_notified_at", { withTimezone: true }),
    /** Total emails successfully sent for this nomination (bulk notify + resends). */
    emailsSentCount: integer("emails_sent_count").notNull().default(0),

    ...timestamps,
  },
  (table) => [index("nominations_year_idx").on(table.year)],
);
