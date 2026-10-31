import {
  boolean,
  index,
  integer,
  numeric,
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

/** 'unpaid' until a PayPal capture or a manually-confirmed bank transfer marks it 'paid'. */
export type RegistrationOrderStatus = "unpaid" | "paid";
export type RegistrationOrderPaymentMethod = "paypal" | "bank_transfer";

/**
 * A foreign (non-Korea) attendee's registration + payment order. Local/Korea attendees register
 * through KIISC's own external portal and never create a row here. Separate from `registrations`
 * (the admin-imported check-in/badge list) — this table is the public self-service payment flow.
 */
export const registrationOrders = pgTable(
  "registration_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    year: integer("year").notNull(),

    email: text("email").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    affiliation: text("affiliation").notNull(),
    phoneNumber: text("phone_number"),
    country: text("country").notNull(),

    /** Snapshot of the selected fee category at submission time (year data may change later). */
    categoryName: text("category_name").notNull(),
    categoryCurrency: text("category_currency").notNull().default("USD"),
    categoryPrice: numeric("category_price", { precision: 12, scale: 2 }).notNull(),
    requiresPaper: boolean("requires_paper").notNull().default(false),
    paperId: text("paper_id"),
    paperTitle: text("paper_title"),

    // Optional billing-address block — feeds the invoice "Bill To" block when provided.
    billingOrganization: text("billing_organization"),
    billingDepartment: text("billing_department"),
    billingAddress: text("billing_address"),
    billingCity: text("billing_city"),
    billingState: text("billing_state"),
    billingZipCode: text("billing_zip_code"),
    billingCountry: text("billing_country"),
    billingVatNumber: text("billing_vat_number"),
    billingContactName: text("billing_contact_name"),

    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0.00"),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),

    status: text("status").$type<RegistrationOrderStatus>().notNull().default("unpaid"),
    paymentMethod: text("payment_method").$type<RegistrationOrderPaymentMethod>(),
    /** PayPal capture id, once paid via PayPal. */
    paymentId: text("payment_id"),
    /** Raw PayPal capture response JSON, kept for support/audit purposes. */
    paymentPayload: text("payment_payload"),
    paidAt: timestamp("paid_at", { withTimezone: true }),

    /** Public token embedded in the invoice URL; not the row id, so it can be rotated independently. */
    invoiceToken: text("invoice_token").notNull(),

    ...timestamps,
  },
  (table) => [
    index("registration_orders_year_idx").on(table.year),
    uniqueIndex("registration_orders_invoice_token_idx").on(table.invoiceToken),
  ],
);

export type RegistrationOrder = typeof registrationOrders.$inferSelect;
export type NewRegistrationOrder = typeof registrationOrders.$inferInsert;
