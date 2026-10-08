import { db, storageMode } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  // DB が未設定でもスタジオは動作する (保存のみメモリ)。到達性だけを報告する。
  if (!db) {
    return Response.json({ ok: true, storage: "memory", database: false });
  }
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, storage: storageMode, database: true });
  } catch {
    return Response.json(
      { ok: false, storage: storageMode, database: false },
      { status: 500 },
    );
  }
}
