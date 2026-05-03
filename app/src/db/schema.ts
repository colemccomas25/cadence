/**
 * Cadence — relational schema (Drizzle + Postgres).
 *
 * Domain notes for future-you:
 * - A `studio` is owned by exactly one `user` in v1 (no multi-teacher yet).
 * - A `student` belongs to a studio and has 1+ parents (parent_contacts) for billing.
 * - A `lesson_template` defines a recurring weekly slot. Concrete `lessons` are
 *   materialized from templates (90 days at a time) so we can mark each as held/cancelled.
 * - An `invoice` rolls up paid-eligible lessons for one parent_contact for one month.
 */

import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  uuid,
  index,
  uniqueIndex,
  decimal,
} from "drizzle-orm/pg-core";

// --- enums ---
export const planEnum = pgEnum("plan", ["free", "solo", "studio"]);
export const lessonStatusEnum = pgEnum("lesson_status", [
  "scheduled",
  "held",
  "cancelled_by_teacher",
  "cancelled_by_student_paid",
  "cancelled_by_student_unpaid",
  "make_up_scheduled",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "void",
]);
export const recurrenceEnum = pgEnum("recurrence", ["weekly", "biweekly"]);

// --- auth tables (Auth.js / Drizzle adapter shape — abbreviated) ---
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- studio (one per user in v1) ---
export const studios = pgTable(
  "studios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    timezone: text("timezone").notNull().default("America/New_York"),
    currency: text("currency").notNull().default("USD"),
    plan: planEnum("plan").notNull().default("free"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    ownerIdx: uniqueIndex("studios_owner_idx").on(t.ownerId),
  }),
);

// --- students ---
export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studioId: uuid("studio_id")
      .notNull()
      .references(() => studios.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    instrument: text("instrument"),
    defaultLessonMinutes: integer("default_lesson_minutes").notNull().default(30),
    defaultRateCents: integer("default_rate_cents").notNull().default(4000), // $40
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    studioIdx: index("students_studio_idx").on(t.studioId),
  }),
);

// --- parent contacts (for billing — one student can have multiple parents; one parent
// can pay for multiple students) ---
export const parentContacts = pgTable(
  "parent_contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studioId: uuid("studio_id")
      .notNull()
      .references(() => studios.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name"),
    phone: text("phone"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    studioEmailIdx: uniqueIndex("parent_contacts_studio_email_idx").on(
      t.studioId,
      t.email,
    ),
  }),
);

export const studentParents = pgTable(
  "student_parents",
  {
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parentContacts.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").notNull().default(true),
  },
  (t) => ({
    pk: uniqueIndex("student_parents_pk").on(t.studentId, t.parentId),
  }),
);

// --- lesson templates (recurring) ---
export const lessonTemplates = pgTable("lesson_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  studioId: uuid("studio_id")
    .notNull()
    .references(() => studios.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  recurrence: recurrenceEnum("recurrence").notNull().default("weekly"),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday
  startTimeMinutes: integer("start_time_minutes").notNull(), // minutes from midnight, studio TZ
  durationMinutes: integer("duration_minutes").notNull().default(30),
  rateCents: integer("rate_cents").notNull(),
  startsOn: timestamp("starts_on", { withTimezone: true, mode: "date" }).notNull(),
  endsOn: timestamp("ends_on", { withTimezone: true, mode: "date" }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- lessons (concrete, materialized from templates or one-off) ---
export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studioId: uuid("studio_id")
      .notNull()
      .references(() => studios.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    templateId: uuid("template_id").references(() => lessonTemplates.id, {
      onDelete: "set null",
    }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    rateCents: integer("rate_cents").notNull(),
    status: lessonStatusEnum("status").notNull().default("scheduled"),
    notes: text("notes"),
    invoiceId: uuid("invoice_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    studioStartsIdx: index("lessons_studio_starts_idx").on(t.studioId, t.startsAt),
    studentStartsIdx: index("lessons_student_starts_idx").on(t.studentId, t.startsAt),
  }),
);

// --- invoices ---
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studioId: uuid("studio_id")
      .notNull()
      .references(() => studios.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parentContacts.id, { onDelete: "restrict" }),
    periodStart: timestamp("period_start", { withTimezone: true, mode: "date" }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true, mode: "date" }).notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    studioPeriodIdx: index("invoices_studio_period_idx").on(t.studioId, t.periodStart),
  }),
);

// --- email logs ---
export const emailLogs = pgTable(
  "email_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studioId: uuid("studio_id").references(() => studios.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // "lesson_reminder" | "invoice" | "receipt"
    toEmail: text("to_email").notNull(),
    subject: text("subject").notNull(),
    status: text("status").notNull().default("sent"), // "sent" | "failed"
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    studioIdx: index("email_logs_studio_idx").on(t.studioId),
  }),
);

export type User = typeof users.$inferSelect;
export type Studio = typeof studios.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type EmailLog = typeof emailLogs.$inferSelect;
