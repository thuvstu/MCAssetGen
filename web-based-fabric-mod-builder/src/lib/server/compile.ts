import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

export interface Toolchain {
  javaHome: string;
  gradle: string;
  found: true;
}

const exists = async (p: string) => {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
};

async function firstMatch(dir: string, re: RegExp): Promise<string | null> {
  try {
    const names = await fs.readdir(dir);
    const hit = names.filter((n) => re.test(n)).sort().pop();
    return hit ? path.join(dir, hit) : null;
  } catch {
    return null;
  }
}

/** JDK 21 と Gradle を探す (JAVA_HOME / PATH / /tmp/toolchain) */
export async function detectToolchain(): Promise<Toolchain | null> {
  const javaCandidates = [
    process.env.JAVA_HOME,
    await firstMatch("/tmp/toolchain", /^jdk-/),
    await firstMatch("/usr/lib/jvm", /jdk-?21|java-21|temurin-21/),
  ].filter(Boolean) as string[];

  let javaHome: string | null = null;
  for (const c of javaCandidates) {
    if (await exists(path.join(c, "bin", "java"))) {
      javaHome = c;
      break;
    }
  }
  if (!javaHome) return null;

  const gradleCandidates = [
    process.env.GRADLE_HOME && path.join(process.env.GRADLE_HOME, "bin", "gradle"),
    await firstMatch("/tmp/toolchain", /^gradle-/),
    await firstMatch("/opt", /^gradle-/),
  ].filter(Boolean) as string[];

  let gradle: string | null = null;
  for (const c of gradleCandidates) {
    const bin = c.endsWith("gradle") ? c : path.join(c, "bin", "gradle");
    if (await exists(bin)) {
      gradle = bin;
      break;
    }
  }
  return { javaHome, gradle: gradle ?? "", found: true };
}

export interface BuildResult {
  ok: boolean;
  durationMs: number;
  log: string;
  jar?: string;
  message: string;
}

const safeName = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "") || "mod";

/** 生成されたGradleプロジェクトを実際にビルドして jar を作る */
export async function buildMod(modId: string, files: { path: string; content: string; encoding?: "base64" }[]): Promise<BuildResult> {
  const tc = await detectToolchain();
  // 生成物に同梱の Gradle Wrapper を優先 (プロファイルごとに必要な Gradle 版が異なるため)
  const hasWrapper = files.some((f) => f.path === "gradlew");
  if (!tc || (!hasWrapper && !tc.gradle)) return { ok: false, durationMs: 0, log: "", message: "JDK 21 / Gradle が見つかりません" };
  const dir = path.join(os.tmpdir(), "mythicforge-build", safeName(modId));
  await fs.rm(dir, { recursive: true, force: true });
  for (const f of files) {
    const dest = path.join(dir, f.path);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await (f.encoding === "base64" ? fs.writeFile(dest, Buffer.from(f.content, "base64")) : fs.writeFile(dest, f.content, "utf8"));
  }
  const started = Date.now();
  const res = await new Promise<{ ok: boolean; log: string }>((resolve) => {
    execFile(
      hasWrapper ? "sh" : tc.gradle,
      [...(hasWrapper ? ["./gradlew"] : []), "build", "--console=plain", "--no-daemon"],
      {
        cwd: dir,
        timeout: 600_000,
        maxBuffer: 16 * 1024 * 1024,
        env: { ...process.env, JAVA_HOME: tc.javaHome, PATH: `${path.join(tc.javaHome, "bin")}:${process.env.PATH}` },
      },
      (err, stdout, stderr) => resolve({ ok: !err, log: `${stdout}\n${stderr}` }),
    );
  });
  const durationMs = Date.now() - started;
  let jar: string | undefined;
  try {
    const libs = await fs.readdir(path.join(dir, "build", "libs"));
    jar = libs.find((f) => f.endsWith(".jar") && !f.endsWith("-sources.jar"));
  } catch {
    /* no artifact */
  }
  const log = res.log.split("\n").slice(-160).join("\n");
  return {
    ok: res.ok && Boolean(jar),
    durationMs,
    log,
    jar,
    message: res.ok ? (jar ? `${jar} のビルドに成功しました` : "ビルドは終了しましたが jar が見つかりません") : "コンパイルエラー (下のログを確認)",
  };
}
