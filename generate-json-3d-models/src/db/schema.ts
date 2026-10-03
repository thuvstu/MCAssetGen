import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import type { GenerationSettings, VoxelModel } from "@/lib/models";

export const voxelModels = pgTable("voxel_models", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull(),
  settings: jsonb("settings").$type<GenerationSettings>().notNull(),
  model: jsonb("model").$type<VoxelModel>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
