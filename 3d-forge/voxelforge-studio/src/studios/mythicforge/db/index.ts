import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * 保存庫。DATABASE_URL が無い環境 (プレビュー/ローカル) でもスタジオ全体が
 * 使えるよう、例外を投げず null を返してメモリ保存へフォールバックする。
 */
const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __mythicforgePool?: Pool;
};

export const pool = databaseUrl
  ? (globalForDb.__mythicforgePool ?? new Pool({ connectionString: databaseUrl }))
  : null;

if (pool && process.env.NODE_ENV !== "production") {
  globalForDb.__mythicforgePool = pool;
}

export const db: NodePgDatabase | null = pool ? drizzle(pool) : null;

export const storageMode: "postgres" | "memory" = db ? "postgres" : "memory";
