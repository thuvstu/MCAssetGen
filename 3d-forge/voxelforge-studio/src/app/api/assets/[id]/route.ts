import { jsonError } from "@/lib/http";
import { deleteAsset, readAsset, summarizeAsset } from "@/lib/assets-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** 1アセットの取得 (ファイル本体の base64 つき)。id でも名前でも引ける。 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const record = readAsset(decodeURIComponent(id));
  if (!record) return jsonError("アセットが見つかりません。", 404);
  return Response.json({ ok: true, asset: record });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const removed = deleteAsset(decodeURIComponent(id));
  if (!removed) return jsonError("アセットが見つかりません。", 404);
  return Response.json({ ok: true });
}

export async function HEAD(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const record = readAsset(decodeURIComponent(id));
  if (!record) return new Response(null, { status: 404 });
  const summary = summarizeAsset(record);
  return new Response(null, {
    headers: {
      "x-asset-name": summary.name,
      "x-asset-studio": summary.studio,
      "x-asset-files": String(summary.files.length),
    },
  });
}
