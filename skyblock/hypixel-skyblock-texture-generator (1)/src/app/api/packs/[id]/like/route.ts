import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { packs } from "@/db/schema";
import { toPackDTO } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await db
    .update(packs)
    .set({ likes: sql`${packs.likes} + 1` })
    .where(eq(packs.id, id));
  const [row] = await db.select().from(packs).where(eq(packs.id, id)).limit(1);
  if (!row) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(toPackDTO(row));
}
