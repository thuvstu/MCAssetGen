import { describe, expect, it } from "vitest";
import { listEngines, runStudioCommand } from "@/lib/studio/dispatch";
import { COMMAND_SAMPLES, DYNAMIC_COMMANDS, sampleFor } from "@/lib/studio/command-samples";

/**
 * 統一スタジオのコマンドカタログ検証。
 *
 * 1. サンプルは実在する engine:command を指していること
 * 2. 引数を取るコマンドにはサンプルがあること (コンソールで即実行できる)
 * 3. すべてのサンプルが実際に成功すること (全エンジンの疎通確認を兼ねる)
 */

const engines = listEngines();
const commands = new Map<string, (typeof engines)[number]["commands"][number]>();
for (const engine of engines) {
  for (const command of engine.commands) commands.set(`${engine.id}:${command.id}`, command);
}

describe("unified engine catalog", () => {
  it("registers 15+ engines with unique ids", () => {
    expect(engines.length).toBeGreaterThanOrEqual(15);
    expect(new Set(engines.map((engine) => engine.id)).size).toBe(engines.length);
    for (const engine of engines) {
      expect(engine.commands.length).toBeGreaterThan(0);
      expect(engine.description.length).toBeGreaterThan(0);
    }
  });

  it("keeps every sample pointing at a registered command", () => {
    for (const key of Object.keys(COMMAND_SAMPLES)) {
      expect(commands.has(key), `${key} は未登録です`).toBe(true);
    }
  });

  it("exposes a sample for every command that takes args", () => {
    const missing: string[] = [];
    for (const [key, command] of commands) {
      if (!command.args?.length) continue;
      if (DYNAMIC_COMMANDS.includes(key as never)) continue;
      if (!sampleFor(key.slice(0, key.indexOf(":")), key.slice(key.indexOf(":") + 1))) missing.push(key);
    }
    expect(missing).toEqual([]);
  });

  it.each(Object.entries(COMMAND_SAMPLES))("runs %s with its sample", async (key, sample) => {
    const separator = key.indexOf(":");
    const engineId = key.slice(0, separator);
    const commandId = key.slice(separator + 1);
    const result = await runStudioCommand(engineId, commandId, (sample ?? {}) as Record<string, unknown>);
    if (!result.ok && /unknown (engine|.*command)/.test(result.error)) expect.fail(result.error);
    if (!result.ok) expect.fail(`${key}: ${result.error}`);
    expect(result.ok).toBe(true);
    expect(result.engine).toBe(engineId);
    expect(typeof result.text).toBe("string");
  });

  it("chains tex:texture into tex:convert (dynamic input)", async () => {
    const rendered = await runStudioCommand("tex", "texture", { id: "grass_top", size: 16, seed: 1 });
    expect(rendered.ok).toBe(true);
    if (!rendered.ok) return;
    const png = rendered.files?.[0];
    expect(png?.base64.length ?? 0).toBeGreaterThan(0);
    const converted = await runStudioCommand("tex", "convert", { in: png!.base64, palette: "auto", colors: 8 });
    expect(converted.ok).toBe(true);
  });

  it("builds a mod from the mythic sample (dynamic input)", async () => {
    const sample = await runStudioCommand("mythic", "sample", {});
    expect(sample.ok).toBe(true);
    if (!sample.ok) return;
    const data = sample.data as { meta?: { modId?: string } } | undefined;
    const built = await runStudioCommand("mythic", "build", { project: sample.data ?? data });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.files?.length ?? 0).toBeGreaterThan(10);
  });
});
