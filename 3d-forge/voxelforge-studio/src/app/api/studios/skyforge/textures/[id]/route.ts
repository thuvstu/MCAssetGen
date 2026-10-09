import { deleteTexture } from "@/studios/skyforge/db/repo";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await deleteTexture(id);
  return Response.json({ ok: true });
}
