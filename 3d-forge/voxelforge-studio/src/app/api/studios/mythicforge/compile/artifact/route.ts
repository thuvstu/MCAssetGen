import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

export const dynamic = "force-dynamic";

const safeName = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "") || "mod";

export async function GET(req: Request) {
  const mod = new URL(req.url).searchParams.get("mod");
  if (!mod) return Response.json({ error: "mod required" }, { status: 400 });
  const dir = path.join(os.tmpdir(), "mythicforge-build", safeName(mod), "build", "libs");
  let jar: string | null = null;
  try {
    jar = (await fs.readdir(dir)).find((f) => f.endsWith(".jar") && !f.endsWith("-sources.jar")) ?? null;
  } catch {
    jar = null;
  }
  if (!jar) return Response.json({ error: "ビルド成果物がありません。先にコンパイルを実行してください。" }, { status: 404 });
  const buf = await fs.readFile(path.join(dir, jar));
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/java-archive",
      "Content-Disposition": `attachment; filename="${jar}"`,
      "Content-Length": String(buf.length),
    },
  });
}
