import { writeFileSync } from "node:fs";
import { DEFAULT_OPTIONS, optionsForPreset } from "../../weapons/minecraft-sword-texture-maker/src/engine/options";
import { renderPixels } from "../../weapons/minecraft-sword-texture-maker/src/engine/render";
import { arg, cmd, fail } from "./argv";
import { encodePng } from "../../texture/texcraft/src/lib/pngCodec";
import type { Tex } from "../../texture/texcraft/src/lib/tex";

const command = cmd();

if (command === "render") {
  const out = arg("out") ?? fail("usage: sword:render --preset <name> [--size 64] --out file.png");
  const preset = arg("preset", "Hyperion");
  const size = Number(arg("size", "64"));
  const options = optionsForPreset(preset, DEFAULT_OPTIONS);
  const frame = renderPixels(options);
  const scale = Math.max(1, Math.round(size / frame.width));
  const tex: Tex = { w: frame.width * scale, h: frame.height * scale, d: new Uint8ClampedArray(frame.width * scale * frame.height * scale * 4) };
  for (let y = 0; y < tex.h; y++) {
    for (let x = 0; x < tex.w; x++) {
      const si = (Math.floor(y / scale) * frame.width + Math.floor(x / scale)) * 4;
      const di = (y * tex.w + x) * 4;
      tex.d[di] = frame.data[si] ?? 0;
      tex.d[di + 1] = frame.data[si + 1] ?? 0;
      tex.d[di + 2] = frame.data[si + 2] ?? 0;
      tex.d[di + 3] = frame.data[si + 3] ?? 0;
    }
  }
  writeFileSync(out, encodePng(tex));
  console.log(`wrote ${out} (${tex.w}x${tex.h}, preset=${preset})`);
} else {
  console.log(`sword commands: render --preset <name> [--size 64] --out file.png`);
}
