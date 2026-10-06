import { writeFileSync } from "node:fs";
import { ITEMS } from "../../skyblock/hypixel-skyblock-texture-generator/src/lib/items";
import { renderPixelsHeadless } from "../../skyblock/hypixel-skyblock-texture-generator/src/lib/generator";
import { DEFAULT_STYLE } from "../../skyblock/hypixel-skyblock-texture-generator/src/lib/design";
import { arg, cmd, fail } from "./argv";
import { encodePng } from "../../texture/texcraft/src/lib/pngCodec";
import type { Tex } from "../../texture/texcraft/src/lib/tex";

const command = cmd();

if (command === "items") {
  for (const item of ITEMS) console.log(`${item.id}\t${item.kind}\t${item.rarity}\t${item.name}`);
} else if (command === "render") {
  const out = arg("out") ?? fail("usage: sky2:render --item <id> [--size 16|32|64] [--seed 7] --out file.png");
  const id = arg("item") ?? fail("usage: sky2:render --item <id> [--size 16|32|64] [--seed 7] --out file.png");
  const item = ITEMS.find((i) => i.id === id) ?? fail(`unknown item: ${id} (see sky2:items)`);
  const size = Number(arg("size", "32"));
  const N = (size === 16 ? 16 : size === 64 ? 64 : 32) as 16 | 32 | 64;
  const seed = Number(arg("seed", "7"));
  const { data } = renderPixelsHeadless(item, N, DEFAULT_STYLE, seed);
  const tex: Tex = { w: N, h: N, d: new Uint8ClampedArray(data) };
  writeFileSync(out, encodePng(tex));
  console.log(`wrote ${out} (${N}x${N}, item=${item.id})`);
} else {
  console.log(`sky2 commands: items | render --item <id> [--size 16|32|64] [--seed 7] --out file.png`);
}
