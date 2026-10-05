import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { generateProject } from "../../mod/mythicforge-studio/src/lib/mod/codegen";
import { arg, cmd, fail } from "./argv";

const command = cmd();

if (command === "build") {
  const projPath = arg("project") ?? fail("usage: mythic:build --project file.json --out dir/");
  const out = arg("out") ?? fail("usage: mythic:build --project file.json --out dir/");
  const project = JSON.parse(readFileSync(projPath, "utf-8"));
  const files = generateProject(project);
  for (const file of files) {
    const target = join(out, file.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.content);
  }
  console.log(`wrote ${files.length} files to ${out}`);
} else {
  console.log(`mythic commands: build --project file.json --out dir/`);
}
