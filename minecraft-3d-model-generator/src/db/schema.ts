import { jsonb, serial, text, timestamp, pgTable } from "drizzle-orm/pg-core";

export const models = pgTable("models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  params: jsonb("params").notNull().$type<Record<string, unknown>>(),
  thumbnail: text("thumbnail"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ModelRow = typeof models.$inferSelect;
