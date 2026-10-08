import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("sword"),
  width: integer("width").notNull().default(16),
  height: integer("height").notNull().default(16),
  frametime: integer("frametime").notNull().default(2),
  interpolate: boolean("interpolate").notNull().default(false),
  // frames: number[][] (packed RGBA per pixel)
  frames: jsonb("frames").notNull().$type<number[][]>(),
  // generator + model settings
  meta: jsonb("meta").notNull().default({}).$type<Record<string, unknown>>(),
  thumbnail: text("thumbnail"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
