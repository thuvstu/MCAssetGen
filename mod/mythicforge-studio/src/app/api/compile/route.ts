import { generateProject } from "@/lib/mod/codegen";
import { buildMod, detectToolchain } from "@/lib/server/compile";
import type { ModProject } from "@/lib/mod/types";

export const dynamic = "force-dynamic";
export const maxDuration = 420;

let running = false;

export async function GET() {
  const tc = await detectToolchain();
  return Response.json({ available: Boolean(tc), javaHome: tc?.javaHome ?? null, gradle: tc?.gradle ?? null, busy: running });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { project?: ModProject };
  const project = body.project;
  if (!project?.meta?.modId) return Response.json({ error: "project required" }, { status: 400 });
  const tc = await detectToolchain();
  if (!tc) {
    return Response.json(
      { available: false, ok: false, error: "この実行環境に JDK 21 / Gradle がありません。ZIPをダウンロードしてローカルまたは GitHub Actions でビルドしてください。" },
      { status: 503 },
    );
  }
  if (running) return Response.json({ available: true, ok: false, busy: true, error: "ビルド実行中です。しばらく待ってから再度お試しください。" }, { status: 409 });
  running = true;
  try {
    const files = generateProject(project);
    const result = await buildMod(project.meta.modId, files);
    return Response.json({ available: true, ...result });
  } catch (e) {
    return Response.json({ available: true, ok: false, error: (e as Error).message }, { status: 500 });
  } finally {
    running = false;
  }
}
