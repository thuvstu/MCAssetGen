import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type MixEntryRow = { id: string; weight: number };

export const packs = pgTable("packs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  author: text("author").notNull().default("Anonymous"),
  description: text("description").notNull().default(""),
  resolution: integer("resolution").notNull().default(16),
  /** Colour lineage (palette) that represents the pack. */
  styleId: text("style_id").notNull().default("reborn_flare"),
  /** Rendering archetype (signature) that represents the pack. */
  signatureId: text("signature_id").notNull().default("reborn_clean"),
  isPublic: boolean("is_public").notNull().default(true),
  downloads: integer("downloads").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const textures = pgTable(
  "textures",
  {
    id: text("id").primaryKey(),
    packId: text("pack_id")
      .notNull()
      .references(() => packs.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    rarity: text("rarity").notNull(),
    /** Blended colour lineages. */
    styleMix: jsonb("style_mix").$type<MixEntryRow[]>().notNull(),
    /** Blended rendering archetypes. */
    signatureMix: jsonb("signature_mix").$type<MixEntryRow[]>().notNull().default([]),
    seed: integer("seed").notNull(),
    resolution: integer("resolution").notNull().default(16),
    pixels: jsonb("pixels").$type<number[]>().notNull(),
    hueShift: integer("hue_shift").notNull().default(0),
    glow: integer("glow").notNull().default(40),
    metallic: integer("metallic").notNull().default(45),
    chaos: integer("chaos").notNull().default(25),
    templateId: text("template_id").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("textures_pack_idx").on(t.packId)],
);

export type PackRow = typeof packs.$inferSelect;
export type TextureRow = typeof textures.$inferSelect;
