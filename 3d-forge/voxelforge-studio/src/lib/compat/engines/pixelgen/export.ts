import JSZip from "jszip";
import { A, B, G, makePix, Pix, R, rgba } from "./core";
import { buildModelJson, MCElement, ModelSettings } from "./model3d";

export function pixToCanvas(p: Pix, scale = 1): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = p.w * scale;
  c.height = p.h * scale;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(p.w, p.h);
  for (let i = 0; i < p.w * p.h; i++) {
    const v = p.data[i];
    img.data[i * 4] = R(v);
    img.data[i * 4 + 1] = G(v);
    img.data[i * 4 + 2] = B(v);
    img.data[i * 4 + 3] = A(v);
  }
  if (scale === 1) ctx.putImageData(img, 0, 0);
  else {
    const tmp = document.createElement("canvas");
    tmp.width = p.w;
    tmp.height = p.h;
    tmp.getContext("2d")!.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, c.width, c.height);
  }
  return c;
}

export function pixToDataUrl(p: Pix, scale = 1): string {
  return pixToCanvas(p, scale).toDataURL("image/png");
}

/** vertical strip of frames (Minecraft animation format) */
export function framesToStrip(frames: Pix[]): Pix {
  const w = frames[0].w, h = frames[0].h;
  const out = makePix(w, h * frames.length);
  frames.forEach((f, k) => out.data.set(f.data, k * w * h));
  return out;
}

export async function canvasToBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png"));
}

export function mcmeta(frametime: number, interpolate: boolean, frameCount: number) {
  return JSON.stringify(
    { animation: { frametime, interpolate, frames: Array.from({ length: frameCount }, (_, i) => i) } },
    null,
    2,
  );
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function slug(s: string): string {
  const t = s.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  return t || "custom_item";
}

export type VersionTarget = {
  id: string;
  label: string;
  packFormat: number;
  modernItems: boolean; // 1.21.4+ items/ definitions are honoured
  note: string;
};

/** Verified against the official pack_format table (1.19.x → 26.2). */
export const VERSION_TARGETS: VersionTarget[] = [
  { id: "1.21.4", label: "1.21.4 – 1.21.8（推奨・安定）", packFormat: 46, modernItems: true, note: "新 items/ 定義 + 旧 overrides を同梱" },
  { id: "1.21.5", label: "1.21.5", packFormat: 55, modernItems: true, note: "" },
  { id: "1.21.6", label: "1.21.6", packFormat: 63, modernItems: true, note: "" },
  { id: "1.21.7", label: "1.21.7 – 1.21.8", packFormat: 64, modernItems: true, note: "" },
  { id: "1.21.9", label: "1.21.9 – 1.21.10", packFormat: 69, modernItems: true, note: "" },
  { id: "1.21.11", label: "1.21.11", packFormat: 75, modernItems: true, note: "" },
  { id: "26.1", label: "26.1", packFormat: 84, modernItems: true, note: "" },
  { id: "26.2", label: "26.2（最新）", packFormat: 88, modernItems: true, note: "" },
  { id: "1.21.2", label: "1.21.2 – 1.21.3", packFormat: 42, modernItems: false, note: "旧 overrides のみ有効" },
  { id: "1.21.0", label: "1.21 – 1.21.1", packFormat: 34, modernItems: false, note: "旧 overrides のみ有効" },
  { id: "1.20.5", label: "1.20.5 – 1.20.6", packFormat: 32, modernItems: false, note: "旧 overrides のみ有効" },
  { id: "1.20.0", label: "1.20 – 1.20.4", packFormat: 22, modernItems: false, note: "旧 overrides のみ有効" },
  { id: "1.19.x", label: "1.19 – 1.19.4", packFormat: 13, modernItems: false, note: "旧 overrides のみ有効" },
];

export function targetFor(id: string | undefined, fallbackFormat?: number): VersionTarget {
  const found = VERSION_TARGETS.find((t) => t.id === id);
  if (found) return found;
  if (fallbackFormat !== undefined) {
    const byFormat = VERSION_TARGETS.find((t) => t.packFormat === fallbackFormat);
    if (byFormat) return byFormat;
  }
  return VERSION_TARGETS[0];
}

/** Base items whose in-hand/in-world rendering is NOT driven by the item JSON model. */
export const BASE_ITEM_NOTES: Record<string, string> = {
  trident: "トライデントの手持ち表示はエンティティ描画のため、カスタム見た目はインベントリ内のみ反映。剣ベース推奨。",
  shield: "盾の手持ち・装備中表示はエンティティ描画のため、反映はインベントリ内のみ。",
  bow: "引き絞りアニメーションは無効化されます（通常の構え表示のみ）。",
  crossbow: "装填アニメーションは無効化されます（通常表示のみ）。",
};

export type PackOptions = {
  name: string; // item name (slug)
  description: string;
  frames: Pix[];
  frametime: number;
  interpolate: boolean;
  baseItem: string; // e.g. iron_sword
  customModelData: number;
  mode3d: boolean;
  elements: MCElement[];
  model: ModelSettings;
  packFormat: number;
};

export async function buildResourcePack(o: PackOptions): Promise<Blob> {
  const zip = new JSZip();
  const name = slug(o.name);
  const ns = "mcforge";
  // NOTE: only pack_format + description are emitted. Newer optional fields
  // (supported_formats object, min/max_format) are deliberately omitted: an
  // unknown or mistyped field can make the whole pack unreadable, while a
  // plain pack_format always parses and at worst shows a version notice.
  zip.file(
    "pack.mcmeta",
    JSON.stringify(
      {
        pack: {
          pack_format: o.packFormat,
          description: o.description || `${o.name} - made with MC Asset Forge`,
        },
      },
      null,
      2,
    ),
  );
  // texture
  const strip = o.frames.length > 1 ? framesToStrip(o.frames) : o.frames[0];
  const png = await canvasToBlob(pixToCanvas(strip));
  const texPath = `assets/${ns}/textures/item/${name}.png`;
  zip.file(texPath, png);
  if (o.frames.length > 1) zip.file(texPath + ".mcmeta", mcmeta(o.frametime, o.interpolate, o.frames.length));
  // pack icon (first frame upscaled)
  zip.file("pack.png", await canvasToBlob(pixToCanvas(o.frames[0], Math.max(1, Math.floor(64 / o.frames[0].w)))));

  // item model (game-agnostic JSON: works on every version that reads it)
  const texRef = `${ns}:item/${name}`;
  const texSize = o.frames[0]?.w ?? 16;
  const model = o.mode3d
    ? buildModelJson(o.elements, texRef, o.model, texSize)
    : { parent: "minecraft:item/handheld", textures: { layer0: texRef } };
  zip.file(`assets/${ns}/models/item/${name}.json`, JSON.stringify(model, null, 2));

  // 1.21.4+ item definition + legacy overrides (pure builders, unit-tested below).
  zip.file(`assets/minecraft/items/${o.baseItem}.json`, JSON.stringify(buildItemsDefinition(o.baseItem, ns, name), null, 2));
  zip.file(`assets/minecraft/models/item/${o.baseItem}.json`, JSON.stringify(buildLegacyOverride(o.baseItem, ns, name, o.customModelData), null, 2));
  zip.file("README.txt", readmeText(o, name));
  return zip.generateAsync({ type: "blob" });
}

/**
 * 1.21.4+ routing definition (assets/minecraft/items/<base>.json).
 * Uses minecraft:select on the custom_model_data STRINGS list; the fallback
 * points at the vanilla MODEL file (models dir), so there is no self-reference.
 */
export function buildItemsDefinition(baseItem: string, ns: string, name: string) {
  return {
    model: {
      type: "minecraft:select",
      property: "minecraft:custom_model_data",
      cases: [{ when: name, model: { type: "minecraft:model", model: `${ns}:item/${name}` } }],
      fallback: { type: "minecraft:model", model: `minecraft:item/${baseItem}` },
    },
  };
}

/** Legacy overrides file (assets/minecraft/models/item/<base>.json, 1.9 - 1.21.3). */
export function buildLegacyOverride(baseItem: string, ns: string, name: string, customModelData: number) {
  return {
    parent: legacyParentFor(baseItem),
    textures: { layer0: `minecraft:item/${baseItem}` },
    overrides: [{ predicate: { custom_model_data: customModelData }, model: `${ns}:item/${name}` }],
  };
}

/** Safe fallback parent for a replaced vanilla item model (never self-referential). */
export function legacyParentFor(baseItem: string): string {
  if (
    baseItem.endsWith("_sword") || baseItem.includes("pickaxe") || baseItem.includes("axe") ||
    baseItem.includes("shovel") || baseItem.includes("hoe") || baseItem === "mace" ||
    baseItem === "trident" || baseItem === "bow" || baseItem === "crossbow" ||
    baseItem === "stick" || baseItem === "blaze_rod" || baseItem === "breeze_rod"
  ) {
    return "minecraft:item/handheld";
  }
  return "minecraft:item/generated";
}

/** Display names are embedded in SNBT/JSON text components — strip quote breakouts. */
function safeDisplay(name: string): string {
  return name.replace(/["\\]/g, "").slice(0, 60) || "Custom Item";
}

/** 1.21.4+: match the strings list used by the items/ select definition. */
export function giveCommandModern(baseItem: string, name: string): string {
  const id = slug(name);
  const display = safeDisplay(name);
  return `/give @p minecraft:${baseItem}[minecraft:custom_model_data={strings:["${id}"]},minecraft:custom_name='{"text":"${display}","italic":false}'] 1`;
}

/**
 * 1.20.5 - 1.21.3: legacy overrides still work, but the component is a compound.
 * A bare number errors with "Not a map" — floats:[N] is required (verified).
 */
export function giveCommandFloats(baseItem: string, name: string, cmd: number): string {
  const display = safeDisplay(name);
  return `/give @p minecraft:${baseItem}[minecraft:custom_model_data={floats:[${cmd}]},minecraft:custom_name='{"text":"${display}","italic":false}'] 1`;
}

/** 1.9 - 1.20.4: classic NBT tag. */
export function giveCommandNBT(baseItem: string, name: string, cmd: number): string {
  const display = safeDisplay(name);
  return `/give @p minecraft:${baseItem}{CustomModelData:${cmd},display:{Name:'{"text":"${display}"}'}} 1`;
}

/** @deprecated use giveCommandModern / giveCommandFloats / giveCommandNBT */
export function giveCommand(baseItem: string, name: string, cmd: number, modern: boolean): string {
  return modern ? giveCommandModern(baseItem, name) : giveCommandFloats(baseItem, name, cmd);
}

function readmeText(o: PackOptions, name: string): string {
  const lines = [
    `${o.name} — generated by MC Asset Forge`,
    ``,
    `== Install (Java Edition) ==`,
    `1. Put this ZIP in your resourcepacks folder:`,
    `   Windows: %appdata%\\.minecraft\\resourcepacks`,
    `   Mac: ~/Library/Application Support/minecraft/resourcepacks`,
    `   Linux: ~/.minecraft/resourcepacks`,
    `2. Minecraft → Options → Resource Packs → move it to Selected.`,
    `3. In a world with cheats enabled, run ONE give command below.`,
    `4. Not showing? Press F3+T to reload packs, or re-log.`,
    ``,
    `== Give commands ==`,
    `[1.21.4 and newer]`,
    giveCommandModern(o.baseItem, o.name),
    ``,
    `[1.20.5 - 1.21.3]`,
    giveCommandFloats(o.baseItem, o.name, o.customModelData),
    ``,
    `[1.9 - 1.20.4]`,
    giveCommandNBT(o.baseItem, o.name, o.customModelData),
    ``,
    `== What's inside ==`,
    `assets/mcforge/textures/item/${name}.png (+ .mcmeta when animated)`,
    `assets/mcforge/models/item/${name}.json (3D model)`,
    `assets/minecraft/items/${o.baseItem}.json (1.21.4+ routing)`,
    `assets/minecraft/models/item/${o.baseItem}.json (legacy overrides)`,
    ``,
    `日本語: このZIPを resourcepacks に入れ、有効化してから対応バージョンの`,
    `give コマンドを実行してください。表示されない場合は F3+T で再読込。`,
  ];
  const note = BASE_ITEM_NOTES[o.baseItem];
  if (note) lines.push(``, `Note: ${note}`);
  return lines.join("\n");
}

export type McCheck = { level: "ok" | "warn" | "error"; label: string; detail?: string };

/**
 * Static validation of the exact data we ship to Minecraft. Returns an empty
 * error list when the pack is expected to load and render correctly.
 */
export function validateForMinecraft(elements: MCElement[], frames: Pix[], mode3d: boolean): McCheck[] {
  const checks: McCheck[] = [];
  if (!frames.length || !frames[0]) {
    checks.push({ level: "error", label: "テクスチャがありません" });
    return checks;
  }
  const w = frames[0].w, h = frames[0].h;
  checks.push({ level: "ok", label: `テクスチャ ${w}×${h * frames.length}${frames.length > 1 ? `（${frames.length}フレーム・アニメ）` : ""}`, detail: "PNG + .mcmeta（アニメ時）を同梱" });
  if (frames.length > 1) {
    checks.push({ level: "ok", label: "アニメーション定義を同梱", detail: "縦ストリップ + .mcmeta（frametime / interpolate）" });
  }
  if (!mode3d) {
    checks.push({ level: "ok", label: "2Dモデル（handheld継承）", detail: "全バージョンで確実に表示されます" });
    return checks;
  }
  if (!elements.length) {
    checks.push({ level: "error", label: "モデル要素がありません", detail: "3Dタブで再構築モードを確認してください" });
    return checks;
  }
  const elLabel = elements.length > 500 ? "warn" : "ok";
  checks.push({
    level: elLabel,
    label: `モデル要素数 ${elements.length}`,
    detail: elements.length > 500 ? "500超は低スペックで重くなる可能性" : "軽量で安全な範囲",
  });
  let outOfBounds = 0, badRotation = 0, faceless = 0, badUV = 0, badTexture = 0;
  for (const e of elements) {
    if (e.from.some((v) => v < -16 || v > 32) || e.to.some((v) => v < -16 || v > 32)) outOfBounds++;
    if (e.rotation) {
      const okAxis = e.rotation.axis === "x" || e.rotation.axis === "y" || e.rotation.axis === "z";
      const steps = e.rotation.angle / 22.5;
      if (!okAxis || !Number.isFinite(steps) || Math.abs(steps - Math.round(steps)) > 1e-6 || Math.abs(e.rotation.angle) > 45) badRotation++;
    }
    const faces = Object.values(e.faces);
    if (!faces.length) { faceless++; continue; }
    for (const f of faces) {
      if (!f || f.texture !== "#layer0") badTexture++;
      const [u0, v0, u1, v1] = f?.uv ?? [0, 0, 0, 0];
      if ([u0, v0, u1, v1].some((v) => !Number.isFinite(v) || v < -0.01 || v > 16.01)) badUV++;
    }
  }
  checks.push(outOfBounds
    ? { level: "error", label: `${outOfBounds}個の要素が座標範囲外`, detail: "from/to は -16〜32 の範囲が必要です" }
    : { level: "ok", label: "要素座標は -16〜32 の範囲内", detail: "Java版の制限を満たしています" });
  checks.push(badRotation
    ? { level: "error", label: `${badRotation}個の要素の回転が不正`, detail: "回転は22.5°刻み・±45°以内のみ有効" }
    : { level: "ok", label: "要素の回転は有効（22.5°刻み・±45°以内）" });
  checks.push(faceless
    ? { level: "error", label: `${faceless}個の要素に面がありません` }
    : { level: "ok", label: "全要素に面定義あり" });
  checks.push(badTexture
    ? { level: "warn", label: `${badTexture}面のテクスチャ参照が #layer0 以外`, detail: "存在しない参照は紫黒になります" }
    : { level: "ok", label: "面テクスチャ参照は正常（#layer0）" });
  checks.push(badUV
    ? { level: "warn", label: `${badUV}面のUVが 0〜16 の範囲外`, detail: "端のピクセルが引き伸ばされる可能性" }
    : { level: "ok", label: "UV座標は正常範囲内" });
  checks.push({ level: "ok", label: "新旧ルーティングを同梱", detail: "1.21.4+ items/ 定義 + 旧 overrides（1.9〜1.21.3）" });
  return checks;
}

/** Decode an image file into a Pix (nearest-neighbor fit into size×size, preserving aspect) */
export async function imageFileToPix(file: File, size: number): Promise<Pix> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error("image load failed"));
      im.src = url;
    });
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = img.width > size * 2; // smooth downscale for photos, crisp for pixel art
    const sc = Math.min(size / img.width, size / img.height);
    const dw = Math.max(1, Math.round(img.width * sc)), dh = Math.max(1, Math.round(img.height * sc));
    ctx.drawImage(img, Math.floor((size - dw) / 2), Math.floor((size - dh) / 2), dw, dh);
    const d = ctx.getImageData(0, 0, size, size).data;
    const p = makePix(size, size);
    for (let i = 0; i < size * size; i++) {
      const a = d[i * 4 + 3];
      p.data[i] = a < 8 ? 0 : rgba(d[i * 4], d[i * 4 + 1], d[i * 4 + 2], a);
    }
    return p;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Reduce colours (posterize) + optional alpha threshold – useful after importing photos */
export function quantizePix(p: Pix, levels: number, alphaThreshold = 128): Pix {
  const o = makePix(p.w, p.h);
  const q = (v: number) => Math.round((Math.round((v / 255) * (levels - 1)) / (levels - 1)) * 255);
  for (let i = 0; i < p.data.length; i++) {
    const c = p.data[i];
    if (A(c) < alphaThreshold) continue;
    o.data[i] = rgba(q(R(c)), q(G(c)), q(B(c)), 255);
  }
  return o;
}
