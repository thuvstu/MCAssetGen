import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, writeFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

export const dynamic = "force-dynamic";
export const maxDuration = 900;

const run = promisify(execFile);

async function which(cmd: string): Promise<string | null> {
  try {
    const { stdout } = await run("sh", ["-c", `command -v ${cmd}`], { timeout: 5000 });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

async function toolchain() {
  const java = process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, "bin", "java") : await which("java");
  const gradle = process.env.GRADLE_PATH || (await which("gradle"));
  let javaVersion: string | null = null;
  if (java) {
    try {
      const r = await run(java, ["-version"], { timeout: 10000 });
      javaVersion = (r.stderr || r.stdout).split("\n")[0];
    } catch {
      javaVersion = null;
    }
  }
  return { java, javaVersion, gradle, enabled: process.env.ENABLE_SERVER_COMPILE === "1" };
}

export async function GET() {
  const tc = await toolchain();
  return NextResponse.json({ available: Boolean(tc.java && tc.gradle && tc.enabled), ...tc });
}

export async function POST(req: Request) {
  const tc = await toolchain();
  if (!tc.java || !tc.gradle || !tc.enabled) {
    return NextResponse.json(
      {
        ok: false,
        available: false,
        log:
          "このサーバーには JDK 21 / Gradle が無い、または ENABLE_SERVER_COMPILE=1 が設定されていないため、サーバー側コンパイルは利用できません。\n" +
          "ZIP をダウンロードしてローカルで `gradle build` するか、GitHub に push して同梱の Actions でビルドしてください。",
        ...tc,
      },
      { status: 200 },
    );
  }
  const body = (await req.json().catch(() => null)) as { files?: { path: string; content: string }[] } | null;
  if (!body?.files?.length) return NextResponse.json({ ok: false, log: "files がありません" }, { status: 400 });
  const dir = await mkdtemp(path.join(tmpdir(), "mcmod-"));
  try {
    for (const f of body.files) {
      const safe = path.normalize(f.path).replace(/^(\.\.(\/|\\|$))+/, "");
      if (path.isAbsolute(safe) || safe.startsWith("..")) continue;
      const full = path.join(dir, safe);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, f.content);
    }
    const started = Date.now();
    let log = "";
    let ok = false;
    try {
      const r = await run(tc.gradle, ["build", "--no-daemon", "--console=plain", "-q"], { cwd: dir, timeout: 850_000, maxBuffer: 20 * 1024 * 1024 });
      log = r.stdout + "\n" + r.stderr;
      ok = true;
    } catch (e) {
      const err = e as { stdout?: string; stderr?: string; message?: string };
      log = (err.stdout ?? "") + "\n" + (err.stderr ?? err.message ?? "");
    }
    let jars: string[] = [];
    try {
      jars = await readdir(path.join(dir, "build", "libs"));
    } catch {
      jars = [];
    }
    return NextResponse.json({ ok, log: log.slice(-50_000), jars, seconds: Math.round((Date.now() - started) / 1000) });
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
