import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export type SavedModelSpec = {
  version: 1;
  spec: unknown; // ModelSpec from src/lib/spec.ts (kept loose here to avoid circular imports)
  seed: number;
};

export const models = pgTable(
  "models",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    modelType: text("model_type").notNull(),
    seed: text("seed").notNull(),
    spec: jsonb("spec").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("models_created_at_idx").on(table.createdAt)],
);

export type ModelRow = typeof models.$inferSelect;
