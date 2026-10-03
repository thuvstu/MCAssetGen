import { eq } from "drizzle-orm";
import { db } from "@/db";
import { textures } from "@/db/schema";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await db.delete(textures).where(eq(textures.id, id));
  return Response.json({ ok: true });
}
