import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { presentations } from "./presentations";

/** A single uploaded file belonging to a presentation submission. */
export type PresentationFileKind = "material" | "video";

export const presentationFiles = pgTable(
  "presentation_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    presentationId: uuid("presentation_id")
      .notNull()
      .references(() => presentations.id, { onDelete: "cascade" }),

    /** `material` (slides/docs) or `video` (an uploaded recording ≤ 50 MB). */
    kind: text("kind").notNull(),

    // Uploaded file in the private `presentations` bucket.
    fileName: text("file_name").notNull(),
    filePath: text("file_path").notNull(),
    fileSize: integer("file_size").notNull(),
    contentType: text("content_type"),

    /** Display order within the submission (0-based). */
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("presentation_files_presentation_id_idx").on(table.presentationId)],
);

export type PresentationFile = typeof presentationFiles.$inferSelect;
export type NewPresentationFile = typeof presentationFiles.$inferInsert;
