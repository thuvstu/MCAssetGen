import { writeFileSync } from "node:fs";
import { CATALOG, getItem } from "../../skyblock/hypixel-skyblock-texture-generator (1)/src/lib/catalog";
import { DEFAULT_PALETTE, DEFAULT_SIGNATURE, generateTexture } from "../../skyblock/hypixel-skyblock-texture-generator (1)/src/lib/generate";
import { isRarity } from "../../skyblock/hypixel-skyblock-texture-generator (1)/src/lib/rarity";
import { encodePng } from "../../skyblock/hypixel-skyblock-texture-generator (1)/src/lib/png";
import { arg, cmd, fail } from "./argv";

const command = cmd();

if (command === "items") {
  for (const item of CATALOG) console.log(`${item.id}\t${item.rarity}\t${item.name}`);
} else if (command === "render") {
  const out = arg("out") ?? fail("usage: sky:render --item <id> [--seed 7] [--res 16] --out file.png");
  const item = getItem(arg("item") ?? "") ?? fail(`unknown item: ${arg("item")} (see sky:items)`);
  const res = arg("res", "16") === "64" ? 64 : arg("res") === "32" ? 32 : 16;
  const generated = generateTexture({
    itemId: item.id,
    resolution: res,
    seed: Number(arg("seed", "1")),
    styleMix: [{ id: DEFAULT_PALETTE, weight: 1 }],
    signatureMix: [{ id: DEFAULT_SIGNATURE, weight: 1 }],
    rarity: isRarity(arg("rarity", "")) ? (arg("rarity") as never) : item.rarity,
    hueShift: 0,
    glow: 40,
    metallic: 45,
    chaos: 25,
  });
  writeFileSync(out, encodePng(generated.width, generated.height, generated.pixels));
  console.log(`wrote ${out} (${generated.width}x${generated.height}, item=${item.id}, mode=${generated.renderMode})`);
} else {
  console.log(`sky commands: items | render --item <id> [--seed 7] [--res 16|32|64] [--rarity <id>] --out file.png`);
}
