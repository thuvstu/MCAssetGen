import { writeFileSync } from "node:fs";
import { CATALOG } from "../../skyblock/skyblock-texture-pack-generator/src/lib/catalog";
import { forge, toStrip, type Anim } from "../../skyblock/skyblock-texture-pack-generator/src/lib/engine";
import { PRESETS, type PackId } from "../../skyblock/skyblock-texture-pack-generator/src/lib/essence";
import { buildPack, TARGETS, type Target } from "../../skyblock/skyblock-texture-pack-generator/src/lib/exporter";
import { arg, cmd, fail } from "./argv";
import { encodePng } from "../../texture/texcraft/src/lib/pngCodec";
import type { Tex } from "../../texture/texcraft/src/lib/tex";

const ANIMS: Anim[] = ["none", "shimmer", "pulse", "flow", "twinkle", "flame", "embers", "orbit", "arcane", "lightning", "frost", "aurora", "water", "chain", "muzzle", "charge", "drip", "shockwave", "enchant", "smoke", "glitch", "scan", "sparks"];

function styleOf(): (typeof PRESETS)[PackId] {
  const id = arg("style", "furfsky")!;
  const preset = (PRESETS as Record<string, unknown>)[id];
  if (!preset) fail(`unknown style: ${id} (see forge:styles)`);
  return preset as (typeof PRESETS)[PackId];
}

function scaleEncode(rgba: Uint8ClampedArray, w: number, h: number, scale = 1): Uint8Array {
  const s = Math.max(1, Math.round(scale));
  if (s === 1) return encodePng({ w, h, d: new Uint8ClampedArray(rgba) } as Tex);
  const out = new Uint8ClampedArray(w * s * h * s * 4);
  for (let y = 0; y < h * s; y++) {
    for (let x = 0; x < w * s; x++) {
      out.set(rgba.subarray((Math.floor(y / s) * w + Math.floor(x / s)) * 4, (Math.floor(y / s) * w + Math.floor(x / s)) * 4 + 4), (y * w * s + x) * 4);
    }
  }
  return encodePng({ w: w * s, h: h * s, d: out } as Tex);
}

const command = cmd();

if (command === "items") {
  for (const item of CATALOG) console.log(`${item.id}\t${item.base}\t${item.rarity ?? "-"}\t${item.en}`);
} else if (command === "styles") {
  for (const id of Object.keys(PRESETS)) console.log(id);
} else if (command === "render") {
  const out = arg("out") ?? fail("usage: forge:render --item <ID> [--res 16|32|64] [--seed 7] [--style furfsky] [--anim shimmer] [--strip] --out file.png");
  const id = arg("item") ?? fail("usage: forge:render --item <ID> [--res 16|32|64] [--seed 7] --out file.png");
  const item = CATALOG.find((i) => i.id.toLowerCase() === id.toLowerCase()) ?? fail(`unknown item: ${id} (see forge:items)`);
  const res = Number(arg("res", "32"));
  const n = (res === 16 ? 16 : res === 64 ? 64 : 32) as 16 | 32 | 64;
  const anim = (arg("anim") ?? item.anim) as Anim;
  if (!ANIMS.includes(anim)) fail(`unknown anim: ${anim}`);
  const fg = forge({ n, design: item.design, mats: item.mats, style: styleOf(), light: Number(arg("light", "135")), anim, seed: Number(arg("seed", "7")) });
  if (arg("strip") !== undefined) {
    const strip = toStrip(fg);
    const tex: Tex = { w: n, h: n * fg.frames.length, d: new Uint8ClampedArray(strip) };
    writeFileSync(out, encodePng(tex));
    console.log(`wrote ${out} (${n}x${n * fg.frames.length}, item=${item.id}, frames=${fg.frames.length})`);
  } else {
    const tex: Tex = { w: n, h: n, d: new Uint8ClampedArray(fg.frames[0]) };
    writeFileSync(out, encodePng(tex));
    console.log(`wrote ${out} (${n}x${n}, item=${item.id}, frames=${fg.frames.length}, palette=${fg.palette})`);
  }
} else if (command === "pack") {
  const out = arg("out") ?? fail("usage: forge:pack [--items ID1,ID2|all] [--target catharsis|optifine|vanilla] [--name <name>] [--res 16|32|64] [--style furfsky] --out pack.zip");
  const target = (arg("target", "catharsis") ?? "catharsis") as Target;
  if (!Object.keys(TARGETS).includes(target)) fail(`unknown target: ${target} (catharsis|optifine|vanilla)`);
  const want = arg("items", "all")!;
  const entries = want === "all"
    ? CATALOG.map((i) => ({ id: i.id, en: i.en, base: i.base, design: i.design, mats: i.mats, anim: i.anim }))
    : want.split(",").map((id) => {
      const item = CATALOG.find((i) => i.id.toLowerCase() === id.trim().toLowerCase()) ?? fail(`unknown item: ${id} (see forge:items)`);
      return { id: item.id, en: item.en, base: item.base, design: item.design, mats: item.mats, anim: item.anim };
    });
  const res = Number(arg("res", "32"));
  const n = (res === 16 ? 16 : res === 64 ? 64 : 32) as 16 | 32 | 64;
  const name = arg("name", "Forge Pack")!;
  const style = styleOf();
  const styleName = arg("style", "furfsky")!;
  buildPack(entries, {
    name, target, n, style, styleName, light: Number(arg("light", "135")),
    encode: async (rgba, w, h, scale) => scaleEncode(rgba, w, h, scale),
  }).then((zip) => {
    writeFileSync(out, zip as Uint8Array);
    console.log(`wrote ${out} (target=${target}, items=${entries.length}, res=${n})`);
  }).catch((e) => {
    console.error(String(e));
    process.exit(1);
  });
} else {
  console.log(`forge commands: items | styles | render --item <ID> [--res 16|32|64] [--seed 7] [--style <id>] [--anim <id>] [--strip] --out file.png | pack [--items ID1,ID2|all] [--target catharsis|optifine|vanilla] [--name <name>] [--res 16|32|64] --out pack.zip`);
}
