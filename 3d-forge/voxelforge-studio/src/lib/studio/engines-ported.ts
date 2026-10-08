import "./image-data";
import {
  asBool,
  asNumber,
  asString,
  fail,
  file,
  jsonFile,
  rgbaToPng,
  scaleRgba,
  textFile,
  type Args,
  type RegisteredEngine,
  type StudioResult,
} from "./engine-utils";

/** Ported studios: engine groups that used to be their own apps/CLIs. */
import { CATALOG as SKYFORGE_CATALOG, getItem as skyforgeGetItem } from "../compat/engines/skyforge/catalog";
import { DEFAULT_PALETTE, DEFAULT_SIGNATURE, RESOLUTIONS, generateTexture } from "../compat/engines/skyforge/generate";
import { encodePng as skyforgeEncodePng } from "../compat/engines/skyforge/png";
import { isRarity } from "../compat/engines/skyforge/rarity";
import type { Rarity } from "../compat/engines/skyforge/rarity";
import { DEFAULT_STYLE, type StyleOptions } from "../compat/engines/hypixel/design";
import { ITEMS, type ItemDef } from "../compat/engines/hypixel/items";
import { renderPixelsHeadless } from "../compat/engines/hypixel/generator";
import { CATALOG as FORGE_CATALOG } from "../compat/engines/forge/catalog";
import { forge, toStrip, type Anim, type ForgeInput } from "../compat/engines/forge/engine";
import { PRESETS as FORGE_PRESETS, type PackId } from "../compat/engines/forge/essence";
import { buildPack, TARGETS, type PackEntry, type Target } from "../compat/engines/forge/exporter";
import { DEFAULT_CONFIG as SPELL_CONFIG, applyElement, autoGenerate } from "../compat/engines/spell/generator";
import { renderFrame } from "../compat/engines/spell/render";
import { ELEMENTS } from "../compat/engines/spell/data";
import { DEFAULT_CONFIG as ARCANE_CONFIG } from "../compat/engines/arcane/defaults";
import { randomConfig } from "../compat/engines/arcane/random";
import { renderPixels as arcaneRenderPixels } from "../compat/engines/arcane/render";
import { DEFAULT_OPTIONS, optionsForPreset } from "../compat/engines/sword/engine/options";
import { PRESETS as SWORD_PRESETS } from "../compat/engines/sword/engine/presets";

const SWORD_PRESETS_KEYS = Object.keys(SWORD_PRESETS);
import { renderPixels as swordRenderPixels } from "../compat/engines/sword/engine/render";
import { ANIM_TYPES, buildAnimation, infoFromPix, type AnimLayer, type AnimType } from "../compat/engines/pixelgen/animations";
import { framesToStrip, mcmeta } from "../compat/engines/pixelgen/export";
import { DEFAULT_SETTINGS, renderWeapon, type GenSettings } from "../compat/engines/pixelgen/generator";
import { buildModel, buildModelJson, DEFAULT_MODEL } from "../compat/engines/pixelgen/model3d";
import { MATERIALS } from "../compat/engines/pixelgen/palettes";
import { SHAPES as PIXELGEN_SHAPES } from "../compat/engines/pixelgen/shapes";
import { decodePng, encodePng } from "../compat/engines/texcraft/pngCodec";
import { EFFECTS, applyStack, defaultParams, newLayer, type Params } from "../compat/engines/texcraft/effects";
import { GROUPS, VARIANTS, VARIANT_MAP } from "../compat/engines/texcraft/evolution";
import { PARTS, PART_MAP, stampPart } from "../compat/engines/texcraft/parts";
import { PALETTES, reduceTex } from "../compat/engines/texcraft/pixelConvert";
import { TEX_GROUPS, TEXTURES, generateTexture as generateProceduralTexture } from "../compat/engines/texcraft/pfTextures";
import { PRESETS as TEX_PRESETS, presetLayers } from "../compat/engines/texcraft/presets";
import { SAMPLES } from "../compat/engines/texcraft/samples";
import { resizeTex, type Tex } from "../compat/engines/texcraft/tex";

/* ------------------------------------------------------------------ sky ---- */

function runSkyforge(command: string, args: Args): StudioResult {
  if (command === "items") {
    return {
      ok: true,
      engine: "skyforge",
      command,
      text: SKYFORGE_CATALOG.map((item) => `${item.id}\t${item.rarity}\t${item.name}`).join("\n"),
      data: SKYFORGE_CATALOG.map((item) => ({ id: item.id, rarity: item.rarity, name: item.name })),
    };
  }
  if (command !== "render") fail(`unknown skyforge command: ${command} (items|render)`);
  const itemId = asString(args, "item") || fail("usage: skyforge:render --item <id> [--seed 7] [--res 16|32|64] [--rarity <id>]");
  const item = skyforgeGetItem(itemId) ?? fail(`unknown item: ${itemId} (see skyforge:items)`);
  const res = asNumber(args, "res", 16);
  const resolution = (RESOLUTIONS as number[]).includes(res) ? (res as 16 | 32 | 64) : 16;
  const requestedRarity = asString(args, "rarity");
  const generated = generateTexture({
    itemId: item.id,
    resolution,
    seed: asNumber(args, "seed", 1),
    styleMix: [{ id: DEFAULT_PALETTE, weight: 1 }],
    signatureMix: [{ id: DEFAULT_SIGNATURE, weight: 1 }],
    rarity: (isRarity(requestedRarity) ? requestedRarity : item.rarity) as Rarity,
    hueShift: asNumber(args, "hue", 0),
    glow: asNumber(args, "glow", 40),
    metallic: asNumber(args, "metallic", 45),
    chaos: asNumber(args, "chaos", 25),
  });
  const png = skyforgeEncodePng(generated.width, generated.height, generated.pixels);
  return {
    ok: true,
    engine: "skyforge",
    command,
    text: `rendered ${item.id} (${generated.width}x${generated.height}, mode=${generated.renderMode}, rarity=${item.rarity})`,
    files: [file(`${item.id}.png`, png)],
    data: { width: generated.width, height: generated.height, renderMode: generated.renderMode },
  };
}

/* ------------------------------------------------------------- sky2 (classic) - */

function styleFromArgs(args: Args): StyleOptions {
  const style = { ...DEFAULT_STYLE } as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_STYLE)) {
    const value = args[key];
    if (typeof value === "number") style[key] = value;
    else if (typeof value === "string" && Number.isFinite(Number(value))) style[key] = Number(value);
  }
  return style as unknown as StyleOptions;
}

function runSky2(command: string, args: Args): StudioResult {
  if (command === "items") {
    return {
      ok: true,
      engine: "sky2",
      command,
      text: ITEMS.map((item) => `${item.id}\t${item.kind}\t${item.rarity}\t${item.name}`).join("\n"),
      data: ITEMS.map((item) => ({ id: item.id, kind: item.kind, rarity: item.rarity, name: item.name })),
    };
  }
  if (command !== "render") fail(`unknown sky2 command: ${command} (items|render)`);
  const id = asString(args, "item") || fail("usage: sky2:render --item <id> [--size 16|32|64] [--seed 7]");
  const item: ItemDef = ITEMS.find((entry) => entry.id === id) ?? fail(`unknown item: ${id} (see sky2:items)`);
  const size = asNumber(args, "size", 32);
  const N = (size === 16 ? 16 : size === 64 ? 64 : 32) as 16 | 32 | 64;
  const { width, height, data } = renderPixelsHeadless(item, N, styleFromArgs(args), asNumber(args, "seed", 7));
  return {
    ok: true,
    engine: "sky2",
    command,
    text: `rendered ${item.id} (${width}x${height})`,
    files: [file(`${item.id}.png`, rgbaToPng(width, height, data))],
  };
}

/* --------------------------------------------------------------- forge ---- */

const FORGE_ANIMS: Anim[] = [
  "none", "shimmer", "pulse", "flow", "twinkle", "flame", "embers", "orbit", "arcane", "lightning",
  "frost", "aurora", "water", "chain", "muzzle", "charge", "drip", "shockwave", "enchant", "smoke",
  "glitch", "scan", "sparks",
];

async function runForge(command: string, args: Args): Promise<StudioResult> {
  if (command === "items") {
    return {
      ok: true,
      engine: "forge",
      command,
      text: FORGE_CATALOG.map((item) => `${item.id}\t${item.base}\t${item.rarity ?? "-"}\t${item.en}`).join("\n"),
      data: FORGE_CATALOG.map((item) => ({ id: item.id, base: item.base, rarity: item.rarity, en: item.en })),
    };
  }
  if (command === "styles")
    return { ok: true, engine: "forge", command, text: Object.keys(FORGE_PRESETS).join("\n") };
  const styleId = asString(args, "style", "furfsky");
  const style = (FORGE_PRESETS as Record<string, unknown>)[styleId];
  if (!style) fail(`unknown style: ${styleId} (see forge:styles)`);
  const typedStyle = style as (typeof FORGE_PRESETS)[PackId];

  if (command === "render") {
    const id = asString(args, "item") || fail("usage: forge:render --item <ID> [--res 16|32|64] [--seed 7] [--style furfsky] [--anim shimmer] [--strip]");
    const item = FORGE_CATALOG.find((entry) => entry.id.toLowerCase() === id.toLowerCase()) ?? fail(`unknown item: ${id} (see forge:items)`);
    const res = asNumber(args, "res", 32);
    const n = (res === 16 ? 16 : res === 64 ? 64 : 32) as 16 | 32 | 64;
    const anim = (asString(args, "anim") || item.anim) as Anim;
    if (!FORGE_ANIMS.includes(anim)) fail(`unknown anim: ${anim}`);
    const input: ForgeInput = {
      n,
      design: item.design,
      mats: item.mats,
      style: typedStyle,
      light: asNumber(args, "light", 135),
      anim,
      seed: asNumber(args, "seed", 7),
    };
    const forged = forge(input);
    const strip = args.strip !== undefined;
    const pixels = strip ? toStrip(forged) : new Uint8ClampedArray(forged.frames[0]);
    const width = n;
    const height = strip ? n * forged.frames.length : n;
    return {
      ok: true,
      engine: "forge",
      command,
      text: `rendered ${item.id} (${width}x${height}, frames=${forged.frames.length}, palette=${forged.palette})`,
      files: [file(`${item.id.toLowerCase()}.png`, rgbaToPng(width, height, pixels))],
    };
  }
  if (command === "pack") {
    const target = asString(args, "target", "catharsis") as Target;
    if (!Object.keys(TARGETS).includes(target)) fail(`unknown target: ${target} (catharsis|optifine|vanilla)`);
    const want = asString(args, "items", "all");
    const entries: PackEntry[] = (
      want === "all"
        ? FORGE_CATALOG
        : want.split(",").map((raw) => {
            const id = raw.trim();
            return FORGE_CATALOG.find((entry) => entry.id.toLowerCase() === id.toLowerCase()) ?? fail(`unknown item: ${id} (see forge:items)`);
          })
    ).map((item) => ({ id: item.id, en: item.en, base: item.base, design: item.design, mats: item.mats, anim: item.anim }));
    const res = asNumber(args, "res", 32);
    const n = (res === 16 ? 16 : res === 64 ? 64 : 32) as 16 | 32 | 64;
    const zip = await buildPack(entries, {
      name: asString(args, "name", "Forge Pack"),
      target,
      n,
      style: typedStyle,
      styleName: styleId,
      light: asNumber(args, "light", 135),
      encode: async (rgba, w, h, scale = 1) =>
        rgbaToPng(w * Math.max(1, Math.round(scale)), h * Math.max(1, Math.round(scale)),
          scaleRgba(w, h, new Uint8ClampedArray(rgba), w * Math.max(1, Math.round(scale))).data),
    });
    const bytes = zip instanceof Uint8Array ? zip : new Uint8Array(await (zip as Blob).arrayBuffer());
    return {
      ok: true,
      engine: "forge",
      command,
      text: `built pack (target=${target}, items=${entries.length}, res=${n})`,
      files: [file(`${target}_pack.zip`, bytes)],
    };
  }
  return fail(`unknown forge command: ${command} (items|styles|render|pack)`);
}

/* --------------------------------------------------------------- spell ---- */

function runSpell(command: string, args: Args): StudioResult {
  if (command === "elements") {
    return {
      ok: true,
      engine: "spell",
      command,
      text: Object.entries(ELEMENTS).map(([id, element]) => `${id}\t${element.label}`).join("\n"),
      data: Object.entries(ELEMENTS).map(([id, element]) => ({ id, label: element.label })),
    };
  }
  if (command !== "render") fail(`unknown spell command: ${command} (elements|render)`);
  let config = { ...SPELL_CONFIG };
  const element = asString(args, "element");
  if (element) {
    if (!(element in ELEMENTS)) fail(`unknown element: ${element} (see spell:elements)`);
    config = applyElement(autoGenerate(config, { seed: asNumber(args, "seed", 0) || undefined }), element as never);
  } else {
    config = autoGenerate(config, { seed: asNumber(args, "seed", 0) || undefined });
  }
  const frame = renderFrame(config);
  const data = frame.data instanceof Uint8ClampedArray ? frame.data : new Uint8ClampedArray(frame.data);
  return {
    ok: true,
    engine: "spell",
    command,
    text: `rendered staff (${frame.width}x${frame.height}, element=${config.element})`,
    files: [file(`spell_${config.element}.png`, rgbaToPng(frame.width, frame.height, data))],
  };
}

/* -------------------------------------------------------------- arcane ---- */

function runArcane(command: string, args: Args): StudioResult {
  if (command === "config") {
    const config = randomConfig(ARCANE_CONFIG);
    return { ok: true, engine: "arcane", command, text: JSON.stringify(config, null, 2), data: config };
  }
  if (command !== "render") fail(`unknown arcane command: ${command} (render|config)`);
  const provided = args.config;
  const config =
    typeof provided === "object" && provided !== null
      ? { ...ARCANE_CONFIG, ...(provided as Record<string, unknown>) }
      : randomConfig(ARCANE_CONFIG);
  const { data, size } = arcaneRenderPixels(config as never);
  const scaled = scaleRgba(size, size, new Uint8ClampedArray(data), asNumber(args, "size", 64));
  return {
    ok: true,
    engine: "arcane",
    command,
    text: `rendered staff (${scaled.width}x${scaled.height}, seed=${(config as { seed?: number }).seed ?? "?"})`,
    files: [file(`arcane_${(config as { seed?: number }).seed ?? "staff"}.png`, rgbaToPng(scaled.width, scaled.height, scaled.data))],
  };
}

/* --------------------------------------------------------------- sword ---- */

function runSword(command: string, args: Args): StudioResult {
  if (command === "presets") {
    return {
      ok: true,
      engine: "sword",
      command,
      text: SWORD_PRESETS_KEYS.map((key) => `${key}\t${SWORD_PRESETS[key].category}\t${SWORD_PRESETS[key].tier}\t${SWORD_PRESETS[key].name}`).join("\n"),
      data: SWORD_PRESETS_KEYS.map((key) => ({ id: key, category: SWORD_PRESETS[key].category, tier: SWORD_PRESETS[key].tier, name: SWORD_PRESETS[key].name })),
    };
  }
  if (command !== "render") fail(`unknown sword command: ${command} (presets|render)`);
  const preset = asString(args, "preset", "Hyperion");
  const options = optionsForPreset(preset, DEFAULT_OPTIONS);
  const frame = swordRenderPixels(options, asNumber(args, "seconds", 0));
  const scaled = scaleRgba(frame.width, frame.height, new Uint8ClampedArray(frame.data), asNumber(args, "size", 64));
  return {
    ok: true,
    engine: "sword",
    command,
    text: `rendered sword (preset=${preset}, ${scaled.width}x${scaled.height})`,
    files: [file(`${preset.replace(/[^a-z0-9_-]+/gi, "_")}.png`, rgbaToPng(scaled.width, scaled.height, scaled.data))],
  };
}

/* ----------------------------------------------------------------- adv ---- */

function pixelGenSettings(args: Args): GenSettings {
  const shape = asString(args, "shape", DEFAULT_SETTINGS.shape);
  if (!PIXELGEN_SHAPES.some((entry) => entry.id === shape)) fail(`unknown shape: ${shape} (see adv:shapes)`);
  const material = asString(args, "material", DEFAULT_SETTINGS.material);
  if (!MATERIALS.some((entry) => entry.id === material)) fail(`unknown material: ${material} (see adv:materials)`);
  return {
    ...DEFAULT_SETTINGS,
    shape,
    material,
    material2: asString(args, "material2", DEFAULT_SETTINGS.material2),
    size: (asNumber(args, "size", DEFAULT_SETTINGS.size) as 16 | 32 | 64),
    style: asString(args, "style", DEFAULT_SETTINGS.style) as GenSettings["style"],
    seed: asNumber(args, "seed", DEFAULT_SETTINGS.seed),
  };
}

function pixToPng(pix: { w: number; h: number; data: Uint32Array | number[] }): Uint8Array {
  const out = new Uint8ClampedArray(pix.w * pix.h * 4);
  for (let i = 0; i < pix.w * pix.h; i++) {
    const c = pix.data[i] ?? 0;
    out[i * 4] = (c >>> 24) & 255;
    out[i * 4 + 1] = (c >>> 16) & 255;
    out[i * 4 + 2] = (c >>> 8) & 255;
    out[i * 4 + 3] = c & 255;
  }
  return rgbaToPng(pix.w, pix.h, out);
}

function runAdv(command: string, args: Args): StudioResult {
  if (command === "shapes")
    return {
      ok: true,
      engine: "adv",
      command,
      text: PIXELGEN_SHAPES.map((shape) => `${shape.id}\t${shape.category}\t${shape.nameJa}`).join("\n"),
    };
  if (command === "materials")
    return { ok: true, engine: "adv", command, text: MATERIALS.map((material) => `${material.id}\t${material.nameJa}`).join("\n") };
  if (command === "anims")
    return { ok: true, engine: "adv", command, text: ANIM_TYPES.map((anim) => `${anim.id}\t${anim.nameJa}`).join("\n") };

  const result = renderWeapon(pixelGenSettings(args));
  if (command === "render") {
    return {
      ok: true,
      engine: "adv",
      command,
      text: `rendered ${result.settings.shape} (${result.pix.w}x${result.pix.h}, material=${result.settings.material})`,
      files: [file(`${result.settings.shape}.png`, pixToPng(result.pix))],
    };
  }
  if (command === "model") {
    const { elements } = buildModel(result.pix, DEFAULT_MODEL, result);
    const json = buildModelJson(elements, `${result.settings.shape}.png`, DEFAULT_MODEL, result.pix.w);
    return {
      ok: true,
      engine: "adv",
      command,
      text: `model json (elements=${elements.length})`,
      files: [jsonFile(`${result.settings.shape}.json`, json)],
    };
  }
  if (command === "anim") {
    const types = (asString(args, "layers", "glow_pulse") || "glow_pulse")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean) as AnimType[];
    const layers: AnimLayer[] = types.map((type) => ({ type, intensity: 1, speed: 1, enabled: true }));
    const frames = buildAnimation(result.pix, infoFromPix(result.pix), layers, asNumber(args, "frames", 4));
    const strip = framesToStrip(frames);
    const meta = mcmeta(2, false, frames.length);
    return {
      ok: true,
      engine: "adv",
      command,
      text: `animation strip (${strip.w}x${strip.h}, frames=${frames.length})`,
      files: [
        file(`${result.settings.shape}_strip.png`, pixToPng(strip)),
        textFile(`${result.settings.shape}_strip.png.mcmeta`, typeof meta === "string" ? meta : JSON.stringify(meta, null, 2)),
      ],
    };
  }
  return fail(`unknown adv command: ${command} (shapes|materials|anims|render|model|anim)`);
}

/* -------------------------------------------------------------- texcraft ---- */

function texFromArgs(args: Args, fallbackSample = "sword", size = 16): Tex {
  const inline = asString(args, "in");
  if (inline) return decodePng(new Uint8Array(Buffer.from(inline, "base64")));
  const sample = SAMPLES.find((entry) => entry.id === asString(args, "sample", fallbackSample)) ?? fail(`unknown sample: ${asString(args, "sample", fallbackSample)}`);
  return resizeTex(sample.make(), size, size);
}

function runTexCraft(command: string, args: Args): StudioResult {
  const list = (text: string, data?: unknown): StudioResult => ({ ok: true, engine: "tex", command, text, data });
  switch (command) {
    case "list-effects":
      return list(EFFECTS.map((effect) => `${effect.id}\t${effect.category}\t${effect.name}`).join("\n"));
    case "list-presets":
      return list(TEX_PRESETS.map((preset) => `${preset.id}\t${preset.name}`).join("\n"));
    case "list-samples":
      return list(SAMPLES.map((sample) => `${sample.id}\t${sample.kind}\t${sample.name}`).join("\n"));
    case "list-palettes":
      return list(Object.keys(PALETTES).join("\n"));
    case "list-textures": {
      const group = asString(args, "group");
      return list(TEXTURES.filter((texture) => !group || texture.group === group).map((texture) => `${texture.id}\t${texture.group}\t${texture.name}`).join("\n"));
    }
    case "list-parts": {
      const category = asString(args, "category");
      return list(PARTS.filter((part) => !category || part.category === category).map((part) => `${part.id}\t${part.category}\t${part.name}`).join("\n"));
    }
    case "list-variants": {
      const group = asString(args, "group");
      return list(VARIANTS.filter((variant) => !group || variant.group === group)
        .map((variant) => `${variant.id}\t${variant.group}\t${variant.name}${variant.animated ? "\tanimated" : ""}`)
        .join("\n"));
    }
    case "list-groups":
      return list([...GROUPS.map((group) => `${group.id}\t${group.name}`), `groups: ${TEX_GROUPS.join(" / ")}`].join("\n"));
    case "render": {
      const preset = TEX_PRESETS.find((entry) => entry.id === asString(args, "preset")) ?? fail(`unknown preset: ${asString(args, "preset")} (see list-presets)`);
      const size = asNumber(args, "size", 16);
      const base = texFromArgs(args, asString(args, "sample", "sword"), size);
      const result = applyStack(base, presetLayers(preset), 0.5);
      return {
        ok: true,
        engine: "tex",
        command,
        text: `rendered preset=${preset.id} (${result.w}x${result.h})`,
        files: [file(`${preset.id}.png`, encodePng(result))],
      };
    }
    case "texture": {
      const id = asString(args, "id") || fail("usage: texture --id <texture> [--size 16] [--seed 7]");
      if (!TEXTURES.some((texture) => texture.id === id)) fail(`unknown texture: ${id} (see list-textures)`);
      const size = asNumber(args, "size", 16);
      const image = generateProceduralTexture(id, size, asNumber(args, "seed", 7));
      const tex: Tex = { w: image.width, h: image.height, d: new Uint8ClampedArray(image.data) };
      return { ok: true, engine: "tex", command, text: `texture ${id} (${tex.w}x${tex.h})`, files: [file(`${id}.png`, encodePng(tex))] };
    }
    case "convert": {
      const inline = asString(args, "in") || fail("usage: convert --in <base64 png> [--palette <name>|kmeans] [--colors 16]");
      const names = Object.keys(PALETTES);
      const autoName = names.find((name) => PALETTES[name] === null) ?? names[0];
      const want = asString(args, "palette", "auto");
      // "auto" / "kmeans" は自動パレット。以降は前方一致→部分一致で解決する。
      const isAuto = /^(auto|kmeans|自動)/i.test(want);
      const palette = isAuto
        ? autoName
        : names.includes(want)
          ? want
          : names.find((name) => name.toLowerCase().startsWith(want.toLowerCase())) ??
            names.find((name) => name.toLowerCase().includes(want.toLowerCase()));
      const resolved = palette ?? fail(`unknown palette: ${want} (see list-palettes)`);
      const source = decodePng(new Uint8Array(Buffer.from(inline, "base64")));
      const useAuto = PALETTES[resolved] === null;
      const result = reduceTex(source, useAuto ? null : resolved, asNumber(args, "colors", 16));
      return { ok: true, engine: "tex", command, text: `converted (${result.w}x${result.h}, palette=${resolved})`, files: [file(`converted.png`, encodePng(result))] };
    }
    case "stamp": {
      const part = PART_MAP[asString(args, "part")] ?? fail(`unknown part: ${asString(args, "part")} (see list-parts)`);
      const size = asNumber(args, "size", 16);
      const base = texFromArgs(args, "sword", size);
      const result = stampPart(base, part, "over", 100, asString(args, "recolor") || undefined);
      return { ok: true, engine: "tex", command, text: `stamped part=${part.id} (${result.w}x${result.h})`, files: [file(`${part.id}.png`, encodePng(result))] };
    }
    case "variant": {
      const id = asString(args, "id") || fail("usage: variant --id <variant> [--sample <id>] [--size 16] [--seed 7] [--accent #hex] [--frame 0|strip]");
      const def = VARIANT_MAP[id] ?? fail(`unknown variant: ${id} (see list-variants)`);
      const size = asNumber(args, "size", 16);
      const base = texFromArgs(args, "sword", size);
      const frames = def.build({ base, accent: asString(args, "accent", "#ffcf3d"), seed: asNumber(args, "seed", 7), frames: def.animated ? 6 : 1 });
      const want = asString(args, "frame", "0");
      if (want === "strip") {
        const strip: Tex = { w: base.w, h: base.h * frames.length, d: new Uint8ClampedArray(base.w * base.h * frames.length * 4) };
        frames.forEach((frame, index) => strip.d.set(frame.d, index * base.w * base.h * 4));
        return { ok: true, engine: "tex", command, text: `variant ${def.id} strip (${strip.w}x${strip.h}, frames=${frames.length})`, files: [file(`${def.id}_strip.png`, encodePng(strip))] };
      }
      const frame = frames[Number(want)] ?? frames[0]!;
      return { ok: true, engine: "tex", command, text: `variant ${def.id} frame=${want}/${frames.length}`, files: [file(`${def.id}.png`, encodePng(frame))] };
    }
    case "effect": {
      const id = asString(args, "id") || fail("usage: effect --id <effect> [--sample <id>] [--size 16] [--params k=v]");
      const def = EFFECTS.find((effect) => effect.id === id) ?? fail(`unknown effect: ${id} (see list-effects)`);
      const size = asNumber(args, "size", 16);
      const base = texFromArgs(args, "sword", size);
      const params: Params = { ...defaultParams(def) };
      for (const pair of (asString(args, "params") || "").split(",").filter(Boolean)) {
        const [key, raw] = pair.split("=");
        if (key && raw !== undefined) params[key] = Number.isNaN(Number(raw)) ? raw : Number(raw);
      }
      const result = applyStack(base, [newLayer(def.id, params)], asNumber(args, "t", 0.5));
      return { ok: true, engine: "tex", command, text: `effect ${def.id} (${result.w}x${result.h})`, files: [file(`${def.id}.png`, encodePng(result))] };
    }
    default:
      return fail(`unknown tex command: ${command} (list-effects|list-presets|list-samples|list-palettes|list-textures|list-parts|list-variants|list-groups|render|texture|convert|stamp|variant|effect)`);
  }
}

/* ------------------------------------------------------------- registry ---- */

export const PORTED_ENGINES: RegisteredEngine[] = [
  {
    id: "skyforge",
    label: "SkyForge アイテムテクスチャ",
    group: "skyblock",
    description: "Hypixel SkyBlock 風アイテムテクスチャ (16/32/64px、レアリティ別)",
    commands: [
      { id: "items", summary: "アイテム一覧" },
      { id: "render", summary: "テクスチャPNG", args: ["item", "res", "seed", "rarity", "glow", "metallic", "chaos"] },
    ],
    run: runSkyforge,
  },
  {
    id: "sky2",
    label: "SkyBlock クラシック描画",
    group: "skyblock",
    description: "旧SkyBlockジェネレータのヘッドレス描画エンジン",
    commands: [
      { id: "items", summary: "アイテム一覧" },
      { id: "render", summary: "テクスチャPNG", args: ["item", "size", "seed"] },
    ],
    run: runSky2,
  },
  {
    id: "forge",
    label: "SkyBlock Texture Forge",
    group: "skyblock",
    description: "ラスター描画エンジンとリソースパックビルダー",
    commands: [
      { id: "items", summary: "アイテム一覧" },
      { id: "styles", summary: "スタイル一覧" },
      { id: "render", summary: "アイテムPNG", args: ["item", "res", "seed", "style", "anim", "light", "strip"] },
      { id: "pack", summary: "リソースパックZIP", args: ["items", "target", "name", "res", "style", "light"] },
    ],
    run: runForge,
  },
  {
    id: "spell",
    label: "Spellforge 杖",
    group: "weapon",
    description: "杖テクスチャ生成 (エレメント/自動生成)",
    commands: [
      { id: "elements", summary: "エレメント一覧" },
      { id: "render", summary: "杖PNG", args: ["element", "seed"] },
    ],
    run: runSpell,
  },
  {
    id: "arcane",
    label: "Arcane Forge 杖",
    group: "weapon",
    description: "別設計の杖レンダラ (ランダム構成 + カスタム設定)",
    commands: [
      { id: "render", summary: "杖PNG", args: ["config", "size"] },
      { id: "config", summary: "ランダム設定JSON" },
    ],
    run: runArcane,
  },
  {
    id: "sword",
    label: "AegisBlade 剣",
    group: "weapon",
    description: "剣テクスチャ生成 (プリセット/サイズ)",
    commands: [
      { id: "presets", summary: "プリセット一覧" },
      { id: "render", summary: "剣PNG", args: ["preset", "size", "seconds"] },
    ],
    run: runSword,
  },
  {
    id: "adv",
    label: "Advanced Weapon アセット",
    group: "weapon",
    description: "武器ピクセル生成・3DモデルJSON・アニメーションストリップ",
    commands: [
      { id: "shapes", summary: "形状一覧" },
      { id: "materials", summary: "素材一覧" },
      { id: "anims", summary: "アニメ種別一覧" },
      { id: "render", summary: "武器PNG", args: ["shape", "material", "material2", "size", "seed", "style"] },
      { id: "model", summary: "3DモデルJSON", args: ["shape", "material", "size", "seed"] },
      { id: "anim", summary: "アニメストリップ", args: ["shape", "material", "layers", "frames"] },
    ],
    run: runAdv,
  },
  {
    id: "tex",
    label: "TexCraft テクスチャスタジオ",
    group: "texture",
    description: "60以上のエフェクト、進化バリアント、パーツ合成、パレット変換",
    commands: [
      { id: "list-effects", summary: "エフェクト一覧" },
      { id: "list-presets", summary: "プリセット一覧" },
      { id: "list-samples", summary: "サンプル一覧" },
      { id: "list-palettes", summary: "パレット一覧" },
      { id: "list-textures", summary: "手続きテクスチャ一覧", args: ["group"] },
      { id: "list-parts", summary: "パーツ一覧", args: ["category"] },
      { id: "list-variants", summary: "進化バリアント一覧", args: ["group"] },
      { id: "list-groups", summary: "グループ一覧" },
      { id: "render", summary: "プリセット適用PNG", args: ["preset", "sample", "size"] },
      { id: "texture", summary: "手続きテクスチャ生成", args: ["id", "size", "seed"] },
      { id: "convert", summary: "パレット変換", args: ["in", "palette", "colors"] },
      { id: "stamp", summary: "パーツ合成", args: ["part", "sample", "size", "recolor"] },
      { id: "variant", summary: "進化バリアント描画", args: ["id", "sample", "size", "seed", "accent", "frame"] },
      { id: "effect", summary: "エフェクト適用", args: ["id", "sample", "size", "params", "t"] },
    ],
    run: runTexCraft,
  },
];
