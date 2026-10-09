import JSZip from 'jszip';
import { forge, toStrip, type Anim, type Mats, type Motion } from './forge-engine';
import { ARCHES, type Design } from './forge-archetypes';
import type { StyleParams } from './forge-essence';
import { applyEdits, type EditMap } from './forge-edits';

export type Target = 'catharsis' | 'optifine' | 'vanilla';
export type PackEntry = { id: string; en: string; base: string; design: Design; mats: Mats; anim: Anim };

export const TARGETS: Record<Target, { label: string; note: string }> = {
  catharsis: {
    label: 'Catharsis · 1.21.11 – 26.2',
    note: 'FurfSky Reborn / Hypixel+ c / PacksHQ / SkyBlock Legacy と同じ形式（assets/skyblock/items/<id>.json）',
  },
  optifine: {
    label: 'OptiFine CIT · 1.8.9',
    note: 'mcpatcher/cit/*.properties を nbt.ExtraAttributes.id で判定する従来形式',
  },
  vanilla: {
    label: 'Vanilla item_model + datapack · 1.21.4+',
    note: 'assets/<namespace>/items/<id>.json + datapack/functions/give。盾は1.21.4のspecial shield + 専用バナーパターンで描画。',
  },
};

export const packNamespace = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'forge_pack';

export type Encoder = (rgba: Uint8ClampedArray, w: number, h: number, scale?: number) => Promise<Blob | Uint8Array>;

const DYES: { id: string; rgb: [number, number, number] }[] = [
  { id: 'white', rgb: [240, 240, 240] }, { id: 'light_gray', rgb: [156, 157, 151] }, { id: 'gray', rgb: [71, 79, 82] }, { id: 'black', rgb: [29, 29, 33] },
  { id: 'brown', rgb: [131, 84, 50] }, { id: 'red', rgb: [176, 46, 38] }, { id: 'orange', rgb: [249, 128, 29] }, { id: 'yellow', rgb: [254, 216, 61] },
  { id: 'lime', rgb: [128, 199, 31] }, { id: 'green', rgb: [94, 124, 22] }, { id: 'cyan', rgb: [21, 137, 145] }, { id: 'light_blue', rgb: [58, 175, 217] },
  { id: 'blue', rgb: [60, 68, 170] }, { id: 'purple', rgb: [137, 50, 184] }, { id: 'magenta', rgb: [199, 78, 189] }, { id: 'pink', rgb: [243, 139, 170] },
];
const nearestDye = (r: number, g: number, b: number) => DYES.reduce((best, d) => {
  const score = (d.rgb[0] - r) ** 2 + (d.rgb[1] - g) ** 2 + (d.rgb[2] - b) ** 2;
  return score < best.score ? { id: d.id, score } : best;
}, { id: 'white', score: Infinity }).id;

const shieldBaseModel = (blocking: boolean) => ({
  gui_light: 'front',
  textures: { particle: 'minecraft:block/white_wool' },
  display: blocking
    ? {
        thirdperson_righthand: { rotation: [45, 155, 0], translation: [-3.49, 11, -2], scale: [1, 1, 1] },
        thirdperson_lefthand: { rotation: [45, 155, 0], translation: [11.51, 7, 2.5], scale: [1, 1, 1] },
        firstperson_righthand: { rotation: [0, 180, -5], translation: [-15, 5, -11], scale: [1.25, 1.25, 1.25] },
        firstperson_lefthand: { rotation: [0, 180, -5], translation: [5, 5, -11], scale: [1.25, 1.25, 1.25] },
        gui: { rotation: [15, -25, -5], translation: [2, 3, 0], scale: [0.65, 0.65, 0.65] },
        fixed: { rotation: [0, 180, 0], translation: [-4.5, 4.5, -5], scale: [0.55, 0.55, 0.55] },
        ground: { rotation: [0, 0, 0], translation: [2, 4, 2], scale: [0.25, 0.25, 0.25] },
      }
    : {
        thirdperson_righthand: { rotation: [0, 90, 0], translation: [10, 6, -4], scale: [1, 1, 1] },
        thirdperson_lefthand: { rotation: [0, 90, 0], translation: [10, 6, 12], scale: [1, 1, 1] },
        firstperson_righthand: { rotation: [0, 180, 5], translation: [-10, 2, -10], scale: [1.25, 1.25, 1.25] },
        firstperson_lefthand: { rotation: [0, 180, 5], translation: [10, 0, -10], scale: [1.25, 1.25, 1.25] },
        gui: { rotation: [15, -25, -5], translation: [2, 3, 0], scale: [0.65, 0.65, 0.65] },
        fixed: { rotation: [0, 180, 0], translation: [-4.5, 4.5, -5], scale: [0.55, 0.55, 0.55] },
        ground: { rotation: [0, 0, 0], translation: [2, 4, 2], scale: [0.25, 0.25, 0.25] },
      },
});

export function rgbaToPng(rgba: Uint8ClampedArray, w: number, h: number, scale = 1): Promise<Blob> {
  const src = document.createElement('canvas');
  src.width = w;
  src.height = h;
  const sctx = src.getContext('2d')!;
  const img = sctx.createImageData(w, h);
  img.data.set(rgba);
  sctx.putImageData(img, 0, 0);
  let out = src;
  if (scale !== 1) {
    out = document.createElement('canvas');
    out.width = w * scale;
    out.height = h * scale;
    const octx = out.getContext('2d')!;
    octx.imageSmoothingEnabled = false;
    octx.drawImage(src, 0, 0, w * scale, h * scale);
  }
  return new Promise((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error('png'))), 'image/png'));
}

export async function buildPack(
  entries: PackEntry[],
  o: { name: string; target: Target; n: 16 | 32 | 64; style: StyleParams; light: number; motion?: Motion; styleName: string; editsFor?: (e: PackEntry) => EditMap | undefined; encode?: Encoder },
): Promise<Blob | Uint8Array> {
  const zip = new JSZip();
  const enc: Encoder = o.encode ?? rgbaToPng;
  const ns = packNamespace(o.name);
  const desc = `${o.name} — ${o.n}x SkyBlock pack · ${o.styleName} essence`;
  const anim = (ft: number) => JSON.stringify({ animation: { frametime: ft, interpolate: false } }, null, 2);
  const citDir = `assets/minecraft/mcpatcher/cit/${ns}`;
  let needBlank = false;
  const log: string[] = [];

  if (o.target === 'catharsis') {
    zip.file(
      'pack.mcmeta',
      JSON.stringify(
        {
          pack: { description: desc, min_format: 75, max_format: 88 },
          'catharsis:pack/v1': { id: ns, version: '1.0.0', dependencies: { catharsis: '>=1.0.0-beta.5' } },
        },
        null,
        2,
      ),
    );
  } else if (o.target === 'optifine') {
    zip.file('pack.mcmeta', JSON.stringify({ pack: { pack_format: 1, description: desc } }, null, 2));
  } else {
    // 1.21.4 introduced client item definitions and item_model. Keep this
    // export pinned to pack format 46; the nested datapack uses its own format.
    zip.file('resourcepack/pack.mcmeta', JSON.stringify({ pack: { pack_format: 46, description: `${desc} · item_model` } }, null, 2));
    zip.file('datapack/pack.mcmeta', JSON.stringify({ pack: { pack_format: 61, description: `${o.name} item grants · Minecraft 1.21.4` } }, null, 2));
  }

  const modelParent = (e: PackEntry) =>
    e.design.arch === 'bow' ? 'minecraft:item/bow' : ARCHES[e.design.arch].handheld ? 'minecraft:item/handheld' : 'minecraft:item/generated';
  const PULLS = ['pulling_0', 'pulling_1', 'pulling_2'];
  let edited = 0;
  const noItemPatterns: string[] = [];
  const patternLanguage: Record<string, string> = {};
  let atlasWritten = false;

  const writeBannerPattern = async (entry: PackEntry, frame: Uint8ClampedArray, colorKeys: number[]) => {
    if (!atlasWritten) {
      atlasWritten = true;
      zip.file('resourcepack/assets/minecraft/atlases/banner_patterns.json', JSON.stringify({ sources: [{ type: 'directory', source: 'entity/banner', prefix: 'entity/banner/' }] }, null, 2));
    }
    const assetId = (pattern: string) => `${ns}:${pattern}`;
    for (let c = 0; c < colorKeys.length; c++) {
      const key = colorKeys[c];
      const r = (key >>> 16) & 255, g = (key >>> 8) & 255, b = key & 255;
      const dye = nearestDye(r, g, b);
      const pattern = `${entry.id.toLowerCase()}_${String(c).padStart(2, '0')}`;
      const patternKey = `${ns}:${pattern}`;
      const patternTexture = new Uint8ClampedArray(o.n * o.n * 4);
      for (let i = 0; i < o.n * o.n; i++) {
        const p = i * 4;
        if (frame[p + 3] && (((frame[p] << 16) | (frame[p + 1] << 8) | frame[p + 2]) === key)) {
          patternTexture[p] = 255; patternTexture[p + 1] = 255; patternTexture[p + 2] = 255; patternTexture[p + 3] = 255;
        }
      }
      zip.file(`datapack/data/${ns}/banner_pattern/${pattern}.json`, JSON.stringify({ asset_id: assetId(pattern), translation_key: `block.${ns}.banner.${pattern}` }, null, 2));
      zip.file(`resourcepack/assets/${ns}/textures/entity/banner/${pattern}.png`, await enc(patternTexture, o.n, o.n, 64 / o.n));
      zip.file(`resourcepack/assets/${ns}/textures/entity/shield/${pattern}.png`, await enc(patternTexture, o.n, o.n, 64 / o.n));
      patternLanguage[`block.${ns}.banner.${pattern}`] = `${entry.en} pigment ${c + 1} (${dye})`;
      noItemPatterns.push(patternKey);
    }
  };

  for (const e of entries) {
    const map = o.editsFor?.(e);
    if (map && Object.keys(map).length) edited++;
    const fg = applyEdits(forge({ n: o.n, design: e.design, mats: e.mats, style: o.style, light: o.light, anim: e.anim, seed: 7, motion: o.motion }), map);
    const lower = e.id.toLowerCase();
    const png = await enc(toStrip(fg), o.n, o.n * fg.frames.length);
    const animated = fg.frames.length > 1;
    const isBow = e.design.arch === 'bow';
    // bows ship all four vanilla draw states (standby + pulling_0..2), drawn — not copied
    const pulls: (Blob | Uint8Array)[] = [];
    if (isBow)
      for (let k = 1; k <= 3; k++) {
        const pf = forge({ n: o.n, design: { ...e.design, pull: k }, mats: e.mats, style: o.style, light: o.light, anim: 'none', seed: 7, motion: o.motion });
        pulls.push(await enc(pf.frames[0], o.n, o.n));
      }
    if (o.target === 'catharsis') {
      const ref = (suffix = '') => ({ type: 'minecraft:model', model: `${ns}:item/${lower}${suffix}` });
      // identical to the structure PacksHQ ships for its bows
      const def = isBow
        ? {
            model: {
              type: 'minecraft:condition',
              property: 'minecraft:using_item',
              on_false: ref(),
              on_true: {
                type: 'minecraft:range_dispatch',
                property: 'minecraft:use_duration',
                scale: 0.05,
                entries: [
                  { threshold: 0.65, model: ref('_pulling_1') },
                  { threshold: 0.9, model: ref('_pulling_2') },
                ],
                fallback: ref('_pulling_0'),
              },
            },
          }
        : { model: ref() };
      zip.file(`assets/skyblock/items/${lower}.json`, JSON.stringify(def, null, 2));
      const writeModel = (suffix: string) =>
        zip.file(`assets/${ns}/models/item/${lower}${suffix}.json`, JSON.stringify({ parent: modelParent(e), textures: { layer0: `${ns}:item/${lower}${suffix}` } }, null, 2));
      writeModel('');
      zip.file(`assets/${ns}/textures/item/${lower}.png`, png);
      if (animated) zip.file(`assets/${ns}/textures/item/${lower}.png.mcmeta`, anim(fg.frametime));
      pulls.forEach((b, k) => {
        writeModel(`_${PULLS[k]}`);
        zip.file(`assets/${ns}/textures/item/${lower}_${PULLS[k]}.png`, b);
      });
    } else if (o.target === 'optifine') {
      // 1.8.9 predates shields. Keep the artwork usable in the legacy CIT pack
      // by binding it to a real handheld proxy instead of shipping a dead ID.
      const citBase = e.base === 'shield' ? 'iron_sword' : e.base;
      const props = ['type=item', `items=${citBase}`];
      if (citBase === 'bow') {
        props.push(`texture.bow_standby=${lower}`);
        PULLS.forEach((p) => props.push(`texture.bow_${p}=${isBow ? `${lower}_${p}` : lower}`));
      } else if (citBase === 'fishing_rod') props.push(`texture.fishing_rod_uncast=${lower}`, `texture.fishing_rod_cast=${lower}`);
      else if (citBase.startsWith('leather_')) {
        // the base leather layer is dye-tinted — blank it and ship the art on the untinted overlay
        props.push(`texture.${citBase}=blank`, `texture.${citBase}_overlay=${lower}`);
        needBlank = true;
      } else props.push(`texture=${lower}`);
      props.push(`nbt.ExtraAttributes.id=${e.id}`);
      zip.file(`${citDir}/${lower}.properties`, props.join('\n') + '\n');
      zip.file(`${citDir}/${lower}.png`, png);
      if (animated) zip.file(`${citDir}/${lower}.png.mcmeta`, anim(fg.frametime));
      if (citBase === 'bow' && isBow) pulls.forEach((b, k) => zip.file(`${citDir}/${lower}_${PULLS[k]}.png`, b));
      if (e.base === 'shield') log.push(`${e.id}: 1.8.9 has no shield item; OptiFine CIT uses iron_sword as a display proxy.`);
    } else {
      const modelId = `${ns}:${lower}`;
      const modelRef = (suffix = '') => ({ type: 'minecraft:model', model: `${ns}:item/${lower}${suffix}` });
      if (e.design.arch === 'shield') {
        const colors = new Map<number, number>();
        const frame = fg.frames[0];
        for (let i = 0; i < o.n * o.n; i++) {
          const p = i * 4;
          if (!frame[p + 3]) continue;
          const key = (frame[p] << 16) | (frame[p + 1] << 8) | frame[p + 2];
          colors.set(key, (colors.get(key) ?? 0) + 1);
        }
        const ordered = [...colors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16).map(([c]) => c);
        await writeBannerPattern(e, frame, ordered);
        const patterns = ordered.map((key, i) => {
          const dye = nearestDye((key >>> 16) & 255, (key >>> 8) & 255, key & 255);
          return { pattern: `${ns}:${lower}_${String(i).padStart(2, '0')}`, color: dye };
        });
        const special = (base: string) => ({ type: 'minecraft:special', model: { type: 'minecraft:shield' }, base });
        zip.file(`resourcepack/assets/${ns}/items/${lower}.json`, JSON.stringify({ model: { type: 'minecraft:condition', property: 'minecraft:using_item', on_false: special(`${ns}:item/shield_base`), on_true: special(`${ns}:item/shield_blocking_base`) } }, null, 2));
        zip.file(`resourcepack/assets/${ns}/models/item/shield_base.json`, JSON.stringify(shieldBaseModel(false), null, 2));
        zip.file(`resourcepack/assets/${ns}/models/item/shield_blocking_base.json`, JSON.stringify(shieldBaseModel(true), null, 2));
        const cmd = `/give @s minecraft:shield[minecraft:item_model=${modelId},minecraft:base_color=white,minecraft:banner_patterns=${JSON.stringify(patterns)}] 1`;
        zip.file(`datapack/data/${ns}/function/give/${lower}.mcfunction`, cmd + '\n');
        log.push(`${e.id.padEnd(28)} ${e.en.padEnd(28)} ${o.n}x${o.n} · shield special · ${patterns.length} banner layers`);
      } else {
        const def = isBow
          ? { model: { type: 'minecraft:condition', property: 'minecraft:using_item', on_false: modelRef(), on_true: { type: 'minecraft:range_dispatch', property: 'minecraft:use_duration', scale: 0.05, entries: [{ threshold: 0.65, model: modelRef('_pulling_1') }, { threshold: 0.9, model: modelRef('_pulling_2') }], fallback: modelRef('_pulling_0') } } }
          : { model: modelRef() };
        zip.file(`resourcepack/assets/${ns}/items/${lower}.json`, JSON.stringify(def, null, 2));
        const writeModel = (suffix = '') => zip.file(`resourcepack/assets/${ns}/models/item/${lower}${suffix}.json`, JSON.stringify({ parent: modelParent(e), textures: { layer0: `${ns}:item/${lower}${suffix}` } }, null, 2));
        writeModel();
        zip.file(`resourcepack/assets/${ns}/textures/item/${lower}.png`, png);
        if (animated) zip.file(`resourcepack/assets/${ns}/textures/item/${lower}.png.mcmeta`, anim(fg.frametime));
        pulls.forEach((b, k) => { writeModel(`_${PULLS[k]}`); zip.file(`resourcepack/assets/${ns}/textures/item/${lower}_${PULLS[k]}.png`, b); });
        const cmd = `/give @s minecraft:${e.base}[minecraft:item_model=${modelId}] 1`;
        zip.file(`datapack/data/${ns}/function/give/${lower}.mcfunction`, cmd + '\n');
        log.push(`${e.id.padEnd(28)} ${e.en.padEnd(28)} ${o.n}x${o.n}${animated ? ` · ${fg.frames.length}f @${fg.frametime}t` : ''} · ${fg.palette} colors${isBow ? ' · 4 draw states' : ''}`);
      }
    }
    if (o.target !== 'vanilla') log.push(`${e.id.padEnd(28)} ${e.en.padEnd(28)} ${o.n}x${o.n}${animated ? ` · ${fg.frames.length}f @${fg.frametime}t` : ''} · ${fg.palette} colors${isBow ? ' · 4 draw states' : ''}${map && Object.keys(map).length ? ` · ${Object.keys(map).length}px hand-edited` : ''}`);
  }
  if (o.target === 'vanilla') {
    if (noItemPatterns.length) {
      zip.file('datapack/data/minecraft/tags/banner_pattern/no_item_required.json', JSON.stringify({ replace: false, values: noItemPatterns }, null, 2));
      zip.file(`resourcepack/assets/${ns}/lang/en_us.json`, JSON.stringify(patternLanguage, null, 2));
    }
    zip.file(`datapack/data/${ns}/function/give/all.mcfunction`, entries.map((e) => `function ${ns}:give/${e.id.toLowerCase()}`).join('\n') + '\n');
  }
  if (edited) log.push('', `手直し済みテクスチャ: ${edited}`);
  if (needBlank) zip.file(`${citDir}/blank.png`, await enc(new Uint8ClampedArray(o.n * o.n * 4), o.n, o.n));

  if (entries[0]) {
    const e = entries[0];
    const fg = forge({ n: o.n, design: e.design, mats: e.mats, style: o.style, light: o.light, anim: 'none', seed: 7, motion: o.motion });
    zip.file(`${o.target === 'vanilla' ? 'resourcepack/' : ''}pack.png`, await enc(fg.frames[0], o.n, o.n, Math.max(1, Math.round(128 / o.n))));
  }

  zip.file(
    'README.txt',
    [
      o.name,
      '='.repeat(56),
      'SKYBLOCK TEXTURE FORGE で生成された Hypixel SkyBlock 用リソースパックです。',
      `形式: ${TARGETS[o.target].label}`,
      `様式: ${o.styleName}（実パック計測値に一致するよう調整済み）`,
      `解像度: ${o.n}x${o.n} / テクスチャ数: ${entries.length}`,
      '',
      o.target === 'catharsis'
        ? '導入: Catharsis MOD (1.0.0-beta.5 以降) を入れ、.minecraft/resourcepacks/ に置いて有効化。'
        : o.target === 'optifine'
          ? '導入: OptiFine 導入済みの 1.8.9 で .minecraft/resourcepacks/ に置いて有効化。'
          : 'Vanilla: ZIP内 resourcepack/ を resourcepacks/ へ、datapack/ を world/datapacks/ へ分けて導入。/reload 後 /function ' + ns + ':give/all で取得。Shieldは16色のBanner dye paletteへ量子化されます。',
      '',
      ...log,
      '',
    ].join('\n'),
  );
  // Reproducible project recipe: this is intentionally not a Minecraft file.
  // It lets the generator or a version-control workflow recreate every output
  // without reverse-engineering pixels from the exported PNGs.
  zip.file(
    'FORGE_MANIFEST.json',
    JSON.stringify(
      {
        schema: 'skyblock-texture-forge/1',
        name: o.name,
        target: o.target,
        resolution: o.n,
        style_name: o.styleName,
        style: o.style,
        motion: o.motion ?? { intensity: 0.75, speed: 1, density: 0.55 },
        entries: entries.map((e) => ({ id: e.id, name: e.en, base: e.base, design: e.design, materials: e.mats, animation: e.anim, hand_edited: Object.keys(o.editsFor?.(e) ?? {}).length })),
      },
      null,
      2,
    ),
  );
  if (o.target === 'vanilla') {
    zip.file(
      'COMMANDS.md',
      [
        '# Forge Commands',
        '',
        `Target: Minecraft Java 1.21.4 (resource pack 46 / data pack 61)`,
        '',
        'After placing the two folders and running `/reload`, use:',
        '',
        ...entries.map((e) => `- \`/function ${ns}:give/${e.id.toLowerCase()}\``),
        '',
        `- \`/function ${ns}:give/all\``,
      ].join('\n'),
    );
  }
  return o.encode ? zip.generateAsync({ type: 'uint8array' }) : zip.generateAsync({ type: 'blob' });
}
