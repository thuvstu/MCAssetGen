import { writeFileSync } from "node:fs";
import { DEFAULT_CONFIG, applyElement, autoGenerate } from "../../weapons/minecraft-magic-staff-generator/src/engine/generator";
import { renderFrame } from "../../weapons/minecraft-magic-staff-generator/src/engine/render";
import { ELEMENTS } from "../../weapons/minecraft-magic-staff-generator/src/engine/data";
import { arg, cmd, fail } from "./argv";
import { encodePng } from "../../texture/texcraft/src/lib/pngCodec";
import type { Tex } from "../../texture/texcraft/src/lib/tex";

const command = cmd();

if (command === "elements") {
  for (const [id, el] of Object.entries(ELEMENTS)) console.log(`${id}\t${el.label}`);
} else if (command === "render") {
  const out = arg("out") ?? fail("usage: spell:render [--random] [--element <id>] [--size 64] --out file.png");
  let cfg = { ...DEFAULT_CONFIG };
  if (arg("element")) {
    cfg = applyElement(autoGenerate(cfg), arg("element") as never);
  } else {
    cfg = autoGenerate(cfg);
  }
  const size = Number(arg("size", "64"));
  const img = renderFrame(cfg);
  const src: Tex = { w: img.width, h: img.height, d: new Uint8ClampedArray(img.data) };
  void size;
  writeFileSync(out, encodePng(src));
  console.log(`wrote ${out} (${src.w}x${src.h}, element=${cfg.element})`);
} else {
  console.log(`spell commands: elements | render [--random] [--element <id>] [--size 64] --out file.png`);
}
