import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { emptyProject } from "../../mod/mythiccraft-studio/src/lib/mod/defaults";
import { generateProject } from "../../mod/mythiccraft-studio/src/lib/mod/codegen";
import { arg, cmd, fail } from "./argv";

const command = cmd();

if (command === "sample") {
  const out = arg("out") ?? fail("usage: mythiccraft:sample --name mymod --out project.json");
  const name = arg("name", "mymod");
  writeFileSync(out, JSON.stringify(emptyProject(name), null, 2));
  console.log(`wrote ${out}`);
} else if (command === "build") {
  const projPath = arg("project") ?? fail("usage: mythiccraft:build --project file.json --out dir/");
  const out = arg("out") ?? fail("usage: mythiccraft:build --project file.json --out dir/");
  const project = JSON.parse(readFileSync(projPath, "utf-8"));
  const files = generateProject(project);
  for (const file of files) {
    const target = join(out, file.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.content);
  }
  console.log(`wrote ${files.length} files to ${out}`);
} else {
  console.log(`mythiccraft commands: sample --name mymod --out project.json | build --project file.json --out dir/`);
}
