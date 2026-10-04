import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Self-healing schema bootstrap.
 *
 * The sandbox database can be reprovisioned empty between runs, which would
 * leave the app rendering a silent empty gallery. These statements are
 * idempotent and mirror `src/db/schema.ts` exactly; `npx drizzle-kit push`
 * remains the source of truth for schema changes.
 */
const DDL = `
CREATE TABLE IF NOT EXISTS packs (
  id text PRIMARY KEY,
  name text NOT NULL,
  author text NOT NULL DEFAULT 'Anonymous',
  description text NOT NULL DEFAULT '',
  resolution integer NOT NULL DEFAULT 16,
  style_id text NOT NULL DEFAULT 'reborn_flare',
  signature_id text NOT NULL DEFAULT 'reborn_clean',
  is_public boolean NOT NULL DEFAULT true,
  downloads integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS textures (
  id text PRIMARY KEY,
  pack_id text NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  rarity text NOT NULL,
  style_mix jsonb NOT NULL,
  signature_mix jsonb NOT NULL DEFAULT '[]'::jsonb,
  seed integer NOT NULL,
  resolution integer NOT NULL DEFAULT 16,
  pixels jsonb NOT NULL,
  hue_shift integer NOT NULL DEFAULT 0,
  glow integer NOT NULL DEFAULT 40,
  metallic integer NOT NULL DEFAULT 45,
  chaos integer NOT NULL DEFAULT 25,
  template_id text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS textures_pack_idx ON textures(pack_id);
`;

let pending: Promise<void> | null = null;

/** Runs the DDL once per process. Safe to call from any server entry point. */
export async function ensureSchema(): Promise<void> {
  pending ??= (async () => {
    await db.execute(sql.raw(DDL));
  })();
  return pending;
}
