import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Advanced Weapon スタジオの保存庫。
 *
 * 元アプリは DATABASE_URL 必須だったが、統合スタジオは DB 無しでも起動できる
 * 方針なので、未設定なら null を返してメモリ保存 (projects-repo) に落とす。
 */
const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __advStudioPool?: Pool;
};

export const pool = databaseUrl
  ? (globalForDb.__advStudioPool ?? new Pool({ connectionString: databaseUrl }))
  : null;

if (pool && process.env.NODE_ENV !== "production") {
  globalForDb.__advStudioPool = pool;
}

export const db: NodePgDatabase | null = pool ? drizzle(pool) : null;

export const storageMode: "postgres" | "memory" = db ? "postgres" : "memory";
