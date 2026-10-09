import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Postgres は「保存庫」であり、アセット生成そのものは DB 不要。
 * DATABASE_URL が無い環境 (プレビュー/ローカル) でも起動できるよう、
 * ここでは例外を投げず null を返し、呼び出し側がメモリストアへ
 * フォールバックする (src/db/projects-repo.ts)。
 */
const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool = databaseUrl
  ? (globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({ connectionString: databaseUrl }))
  : null;

if (pool && process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db: NodePgDatabase | null = pool ? drizzle(pool) : null;

/** "postgres" = DATABASE_URL あり / "memory" = DB なしでプロセス内保存 */
export const storageMode: "postgres" | "memory" = db ? "postgres" : "memory";
