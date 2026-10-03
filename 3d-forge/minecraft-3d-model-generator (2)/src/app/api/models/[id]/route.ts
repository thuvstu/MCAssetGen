import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) return jsonError("無効なモデルIDです。", 400);
  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    if (!project) return jsonError("モデルが見つかりません。", 404);
    return Response.json({ project });
  } catch (error) {
    console.error("Load model:", error);
    return jsonError("モデルを読み込めませんでした。", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) return jsonError("無効なモデルIDです。", 400);
  try {
    const deleted = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ id: projects.id });
    if (!deleted.length) return jsonError("モデルが見つかりません。", 404);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Delete model:", error);
    return jsonError("モデルを削除できませんでした。", 500);
  }
}
