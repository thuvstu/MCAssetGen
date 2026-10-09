import { likePack } from "@/studios/skyforge/db/repo";
import { toPackDTO } from "@/studios/skyforge/lib/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = await likePack(id);
  if (!row) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(toPackDTO(row));
}
