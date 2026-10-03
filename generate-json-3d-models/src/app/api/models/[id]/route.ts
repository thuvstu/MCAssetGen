import { db } from "@/db";
import { voxelModels } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
const validId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!validId(id)) return Response.json({ error: "モデルが見つかりません。" }, { status: 404 });
  try {
    const [model] = await db.select().from(voxelModels).where(eq(voxelModels.id, id));
    if (!model) return Response.json({ error: "モデルが見つかりません。" }, { status: 404 });
    return Response.json({ model });
  } catch { return Response.json({ error: "モデルを読み込めませんでした。" }, { status: 500 }); }
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!validId(id)) return Response.json({ error: "モデルが見つかりません。" }, { status: 404 });
  try {
    const [removed] = await db.delete(voxelModels).where(eq(voxelModels.id, id)).returning({ id: voxelModels.id });
    if (!removed) return Response.json({ error: "モデルが見つかりません。" }, { status: 404 });
    return Response.json({ ok: true });
  } catch { return Response.json({ error: "モデルを削除できませんでした。" }, { status: 500 }); }
}
