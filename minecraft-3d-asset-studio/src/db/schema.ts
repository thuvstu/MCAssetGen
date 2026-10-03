import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import type { ModelData } from "@/types/model";

export const modelsTable = pgTable("models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  category: text("category").notNull().default("sword"), // sword, armor, staff, magic, relic, custom
  theme: text("theme").notNull().default("fantasy"), // fantasy, nether, void, holy, cyber, frost, nature
  textureResolution: integer("texture_resolution").notNull().default(32), // 16, 32, 64, 128
  modelData: jsonb("model_data").$type<ModelData>().notNull(),
  textureDataUrl: text("texture_data_url").notNull(),
  thumbnailDataUrl: text("thumbnail_data_url"),
  isPreset: boolean("is_preset").notNull().default(false),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ModelRecord = typeof modelsTable.$inferSelect;
export type NewModelRecord = typeof modelsTable.$inferInsert;
