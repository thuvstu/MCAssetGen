import { writeFileSync } from "node:fs";
import { DEFAULT_SETTINGS, TEMPLATES } from "../../3d-forge/voxelforge-studio/src/lib/model-types";
import { generateModel } from "../../3d-forge/voxelforge-studio/src/lib/model-generator";
import { isExportFormat, toBlockbench, toMinecraft, toResourcePack } from "../../3d-forge/voxelforge-studio/src/lib/export";
import { arg, cmd, fail } from "./argv";

const command = cmd();

if (command === "kinds") {
  for (const t of TEMPLATES) console.log(`${t.kind}\t${t.label}`);
} else if (command === "generate") {
  const out = arg("out") ?? fail("usage: vox:generate --kind <kind> [--seed 42] --out model.bbmodel");
  const kind = arg("kind", "sword");
  if (!TEMPLATES.some((t) => t.kind === kind)) fail(`unknown kind: ${kind} (see vox:kinds)`);
  const seed = Number(arg("seed", "42"));
  const model = generateModel({
    ...DEFAULT_SETTINGS,
    kind: kind as never,
    seed,
    name: `${kind}-${seed}`,
  } as never);
  const format = arg("format", out.endsWith(".bbmodel") ? "bbmodel" : out.endsWith(".zip") ? "resourcepack" : out.endsWith(".json") && arg("mcmodel") !== undefined ? "minecraft" : out.endsWith(".json") ? "json" : "bbmodel");
  if (!isExportFormat(format) && format !== "json" && format !== "minecraft") fail(`unknown format: ${format} (bbmodel|minecraft|resourcepack|json)`);
  if (format === "resourcepack") {
    writeFileSync(out, toResourcePack(model as never));
  } else if (format === "minecraft") {
    writeFileSync(out, JSON.stringify(toMinecraft(model as never), null, 2));
  } else {
    const content = format === "json" ? JSON.stringify(model, null, 2) : JSON.stringify(toBlockbench(model as never), null, 2);
    writeFileSync(out, content);
  }
  console.log(`wrote ${out} (kind=${kind}, format=${format}, cubes=${(model as { cubes: unknown[] }).cubes.length})`);
} else {
  console.log(`vox commands: kinds | generate --kind <kind> [--seed 42] [--format bbmodel|minecraft|resourcepack|json] --out file`);
}
