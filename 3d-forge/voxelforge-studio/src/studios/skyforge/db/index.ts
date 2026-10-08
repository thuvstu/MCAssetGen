import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * SkyForge の保存庫。DATABASE_URL 未設定でも全機能が動くよう、
 * 例外を投げず null を返してメモリ保存 (db/repo.ts) へフォールバックする。
 */
const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __skyforgePool?: Pool;
};

export const pool = databaseUrl
  ? (globalForDb.__skyforgePool ?? new Pool({ connectionString: databaseUrl }))
  : null;

if (pool && process.env.NODE_ENV !== "production") globalForDb.__skyforgePool = pool;

export const db: NodePgDatabase | null = pool ? drizzle(pool) : null;

export const storageMode: "postgres" | "memory" = db ? "postgres" : "memory";
