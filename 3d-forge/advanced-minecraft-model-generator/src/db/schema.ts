import { pgTable, text, serial, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

export const savedModels = pgTable("saved_models", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // sword, staff, armor, relic, etc.
  theme: text("theme").notNull(), // void, inferno, celestial, etc.
  config: jsonb("config").notNull(), // Complete generator configuration
  previewDataUrl: text("preview_data_url"), // Thumbnail snapshot
  downloadsCount: integer("downloads_count").default(0),
  likesCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SavedModel = typeof savedModels.$inferSelect;
export type NewSavedModel = typeof savedModels.$inferInsert;
