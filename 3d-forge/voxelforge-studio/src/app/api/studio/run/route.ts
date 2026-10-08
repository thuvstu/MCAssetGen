import { isPayloadTooLarge, jsonError, publicErrorMessage, readJsonBody } from "@/lib/http";
import { runStudioCommand } from "@/lib/studio/dispatch";

export const runtime = "nodejs";

/**
 * Runs one engine command.
 *
 * `POST { engine, command, args }` → `{ ok, text, files[], data }`.
 * Files come back base64-encoded so the CLI stays a thin HTTP client and can
 * write them wherever the user asked.
 */
export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const engine = typeof body.engine === "string" ? body.engine : "";
    const command = typeof body.command === "string" ? body.command : "";
    if (!engine || !command) return jsonError("engine と command を指定してください。", 400);
    const args =
      typeof body.args === "object" && body.args !== null
        ? (body.args as Record<string, unknown>)
        : {};
    const result = await runStudioCommand(engine, command, args);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    if (isPayloadTooLarge(error)) return jsonError(error.message, 413);
    return jsonError(publicErrorMessage(error, "コマンドの実行に失敗しました。"), 400);
  }
}
