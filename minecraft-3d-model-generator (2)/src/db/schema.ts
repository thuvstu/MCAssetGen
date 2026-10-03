import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import type { GeneratedModel, ModelSettings } from "@/lib/model-types";

export const projects = pgTable("voxel_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  settings: jsonb("settings").$type<ModelSettings>().notNull(),
  model: jsonb("model").$type<GeneratedModel>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
