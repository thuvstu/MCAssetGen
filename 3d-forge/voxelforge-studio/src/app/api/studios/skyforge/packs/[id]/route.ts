import {
  deletePack,
  deleteTexturesByPack,
  getPack,
  listTexturesByPack,
  updatePack,
} from "@/studios/skyforge/db/repo";
import { toPackDTO, toTextureDTO } from "@/studios/skyforge/lib/serialize";
import { PALETTES, SIGNATURES } from "@/studios/skyforge/lib/styles";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const pack = await getPack(id);
  if (!pack) return Response.json({ error: "not found" }, { status: 404 });
  const texRows = await listTexturesByPack(id);
  return Response.json({ ...toPackDTO(pack), textures: texRows.map(toTextureDTO) });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const pack = await getPack(id);
  if (!pack) return Response.json({ error: "not found" }, { status: 404 });

  const body = (await request.json()) as {
    name?: string;
    author?: string;
    description?: string;
    resolution?: number;
    styleId?: string;
    signatureId?: string;
    isPublic?: boolean;
  };

  const patch: Partial<typeof pack> = { updatedAt: new Date() };
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim().slice(0, 48);
  if (typeof body.author === "string") patch.author = body.author.trim().slice(0, 32) || "Anonymous";
  if (typeof body.description === "string") patch.description = body.description.trim().slice(0, 280);
  if (body.resolution === 16 || body.resolution === 32 || body.resolution === 64) patch.resolution = body.resolution;
  if (typeof body.styleId === "string" && PALETTES.some((s) => s.id === body.styleId)) {
    patch.styleId = body.styleId;
  }
  if (typeof body.signatureId === "string" && SIGNATURES.some((s) => s.id === body.signatureId)) {
    patch.signatureId = body.signatureId;
  }
  if (typeof body.isPublic === "boolean") patch.isPublic = body.isPublic;

  await updatePack(id, patch);
  const updated = await getPack(id);
  return Response.json(toPackDTO(updated!));
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (id.startsWith("demo_")) {
    return Response.json({ error: "デモパックは削除できません" }, { status: 400 });
  }
  await deleteTexturesByPack(id);
  await deletePack(id);
  return Response.json({ ok: true });
}
