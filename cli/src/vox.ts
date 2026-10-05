import { writeFileSync } from "node:fs";
import { DEFAULT_SETTINGS, TEMPLATES } from "../../3d-forge/voxelforge-studio/src/lib/model-types";
import { generateModel } from "../../3d-forge/voxelforge-studio/src/lib/model-generator";
import { toBlockbench } from "../../3d-forge/voxelforge-studio/src/lib/export";
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
  const format = out.endsWith(".bbmodel") ? "bbmodel" : "json";
  const content = format === "bbmodel" ? JSON.stringify(toBlockbench(model as never), null, 2) : JSON.stringify(model, null, 2);
  writeFileSync(out, content);
  console.log(`wrote ${out} (kind=${kind}, cubes=${(model as { cubes: unknown[] }).cubes.length})`);
} else {
  console.log(`vox commands: kinds | generate --kind <kind> [--seed 42] --out model.bbmodel`);
}
