import { db } from "@/studios/skyforge/db";
import { storage } from "@/studios/skyforge/db/repo";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (db) await db.execute(sql`select 1`);
    return Response.json({ ok: true, storage, database: Boolean(db) });
  } catch {
    return Response.json({ ok: false, storage, database: Boolean(db) }, { status: 500 });
  }
}
