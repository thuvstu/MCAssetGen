import { isPayloadTooLarge, jsonError, readJsonBody } from "@/lib/http";
import { listAssets, saveAsset, summarizeAsset, type AssetFile } from "@/lib/assets-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * アセットバス — スタジオ間の受け渡し。
 *
 * GET  : 保存済みアセットの一覧 (サムネイル付き)
 * POST : `{name, studio, kind, files:[{path,base64}]}` を保存
 *
 * エンジン実行 (`POST /api/studio/run` の `save`) からも、CLI の `--save` からも
 * ここへ入る。別スタジオは `--asset <名前>` で取り出す。
 */
export async function GET() {
  return Response.json({ ok: true, assets: listAssets() });
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return jsonError("name を指定してください。", 400);
    const rawFiles = Array.isArray(body.files) ? body.files : [];
    const files: AssetFile[] = rawFiles
      .filter(
        (entry): entry is { base64: string; path?: unknown } =>
          typeof entry === "object" && entry !== null && typeof (entry as { base64?: unknown }).base64 === "string",
      )
      .map((entry, index) => ({
        path:
          typeof entry.path === "string" && entry.path
            ? entry.path
            : `${name.replace(/[^a-zA-Z0-9._-]+/g, "_")}-${index + 1}.bin`,
        base64: entry.base64,
      }));
    if (!files.length) return jsonError("files (base64) が必要です。", 400);

    const record = saveAsset({
      name,
      studio: typeof body.studio === "string" ? body.studio : "manual",
      kind: typeof body.kind === "string" ? body.kind : "upload",
      files,
      note: typeof body.note === "string" ? body.note : undefined,
    });
    return Response.json({ ok: true, asset: summarizeAsset(record) }, { status: 201 });
  } catch (error) {
    if (isPayloadTooLarge(error)) return jsonError(error.message, 413);
    return jsonError(error instanceof Error ? error.message : "保存できませんでした。", 400);
  }
}
