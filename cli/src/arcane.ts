import { readFileSync, writeFileSync } from "node:fs";
import { DEFAULT_CONFIG } from "../../weapons/minecraft-magic-staff-generator (1)/src/lib/defaults";
import { randomConfig } from "../../weapons/minecraft-magic-staff-generator (1)/src/lib/random";
import { renderPixels } from "../../weapons/minecraft-magic-staff-generator (1)/src/lib/render/index";
import { arg, cmd, fail } from "./argv";
import { encodePng } from "../../texture/texcraft/src/lib/pngCodec";
import type { Tex } from "../../texture/texcraft/src/lib/tex";

const command = cmd();

if (command === "render") {
  const out = arg("out") ?? fail("usage: arcane:render [--random] [--config file.json] [--size 64] --out file.png");
  let cfg = DEFAULT_CONFIG;
  const configPath = arg("config");
  if (configPath) {
    cfg = { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(configPath, "utf-8")) };
  } else if (arg("random") !== undefined || !configPath) {
    cfg = randomConfig(DEFAULT_CONFIG);
  }
  const size = Number(arg("size", "64"));
  const { data, size: native } = renderPixels(cfg);
  const scale = Math.max(1, Math.round(size / native));
  const scaled: Tex = { w: native * scale, h: native * scale, d: new Uint8ClampedArray(native * scale * native * scale * 4) };
  for (let y = 0; y < scaled.h; y++) {
    for (let x = 0; x < scaled.w; x++) {
      const si = (Math.floor(y / scale) * native + Math.floor(x / scale)) * 4;
      const di = (y * scaled.w + x) * 4;
      scaled.d[di] = data[si] ?? 0;
      scaled.d[di + 1] = data[si + 1] ?? 0;
      scaled.d[di + 2] = data[si + 2] ?? 0;
      scaled.d[di + 3] = data[si + 3] ?? 0;
    }
  }
  writeFileSync(out, encodePng(scaled));
  console.log(`wrote ${out} (${scaled.w}x${scaled.h}, seed=${cfg.seed})`);
} else if (command === "config") {
  console.log(JSON.stringify(randomConfig(DEFAULT_CONFIG), null, 2));
} else {
  console.log(`arcane commands: render [--random|--config file.json] [--size 64] --out file.png | config`);
}
