import { isPayloadTooLarge, jsonError, publicErrorMessage, readJsonBody } from "@/lib/http";
import { listEngines, runStudioCommand } from "@/lib/studio/dispatch";
import { readAsset, saveAsset, summarizeAsset } from "@/lib/assets-store";

export const runtime = "nodejs";

/**
 * Runs one engine command.
 *
 * `POST { engine, command, args }` → `{ ok, text, files[], data }`.
 * Files come back base64-encoded so the CLI stays a thin HTTP client and can
 * write them wherever the user asked.
 *
 * スタジオ間連携 (アセットバス):
 *   save: "名前"   … 成功した出力をアセットバスへ保存する
 *   asset: "名前"  … バス内のアセットをこのコマンドの入力として渡す (複数可)
 *                    (宣言された args に応じて `in` / `project` / `texture` へ入る)
 */
export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const engine = typeof body.engine === "string" ? body.engine : "";
    const command = typeof body.command === "string" ? body.command : "";
    if (!engine || !command) return jsonError("engine と command を指定してください。", 400);
    const args =
      typeof body.args === "object" && body.args !== null
        ? { ...(body.args as Record<string, unknown>) }
        : {};

    // --- アセットバスから入力 (別スタジオの出力を使う) ---
    // asset は複数指定できる (例: プロジェクトJSON + テクスチャPNG を同時に MOD へ)
    const assetNames = (Array.isArray(body.asset) ? body.asset : [body.asset])
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value) => value.trim());
    if (assetNames.length) {
      const records = [];
      for (const assetName of assetNames) {
        const record = readAsset(assetName);
        if (!record) return jsonError(`アセットが見つかりません: ${assetName} (GET /api/assets)`, 400);
        records.push(record);
      }
      const files = records.flatMap((record) => record.files);
      const declared = listEngines()
        .find((entry) => entry.id === engine)
        ?.commands.find((entry) => entry.id === command)?.args ?? [];
      const asJson = files.find((file) => file.path.endsWith(".json"));
      const asPng = files.find((file) => /\.png$/i.test(file.path));
      if (!("in" in args) && declared.includes("in") && files.length >= 1) {
        args.in = files[0].base64;
      } else if (!("project" in args) && declared.includes("project") && asJson) {
        args.project = JSON.parse(Buffer.from(asJson.base64, "base64").toString("utf8"));
        // 同じアセット群に PNG が混ざっていれば MOD のテクスチャとしても渡す
        if (!("texture" in args) && declared.includes("texture") && asPng) args.texture = asPng.base64;
      } else if (!("texture" in args) && declared.includes("texture") && asPng) {
        args.texture = asPng.base64;
      } else if (files.length === 1) {
        args.in = files[0].base64;
      } else {
        return jsonError(
          `アセット ${assetNames.join(", ")} を ${engine}:${command} の入力に割り当てられません (args: ${declared.join(", ") || "なし"})`,
          400,
        );
      }
    }

    const result = await runStudioCommand(engine, command, args);
    if (!result.ok) return Response.json(result, { status: 400 });

    // --- アセットバスへ保存 (次に別スタジオで使う) ---
    const saveName = typeof body.save === "string" ? body.save.trim() : "";
    if (saveName) {
      if (!result.files?.length) return jsonError(`${engine}:${command} の出力が空のため保存できません。`, 400);
      const record = saveAsset({
        name: saveName,
        studio: engine,
        kind: command,
        files: result.files.map((file) => ({ path: file.path, base64: file.base64 })),
      });
      return Response.json({ ...result, asset: summarizeAsset(record) });
    }

    return Response.json(result, { status: 200 });
  } catch (error) {
    if (isPayloadTooLarge(error)) return jsonError(error.message, 413);
    return jsonError(publicErrorMessage(error, "コマンドの実行に失敗しました。"), 400);
  }
}
