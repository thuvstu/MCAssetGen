/** Runs the REAL exporter (src/lib/exporter.ts → buildPack) with a Node PNG
 *  encoder and validates every reference in the produced zip. */
import JSZip from 'jszip';
import { PNG } from 'pngjs';
import { buildPack, type Encoder } from '../src/lib/forge-exporter';
import { CATALOG } from '../src/lib/forge-catalog';
import { PRESETS } from '../src/lib/forge-essence';
import { pack4 } from '../src/lib/forge-edits';

const encode: Encoder = async (rgba, w, h, scale = 1) => {
  const W = w * scale, H = h * scale;
  const png = new PNG({ width: W, height: H });
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const s = ((Math.floor(y / scale) * w) + Math.floor(x / scale)) * 4, d = (y * W + x) * 4;
    png.data[d] = rgba[s]; png.data[d + 1] = rgba[s + 1]; png.data[d + 2] = rgba[s + 2]; png.data[d + 3] = rgba[s + 3];
  }
  return new Uint8Array(PNG.sync.write(png));
};

let fails = 0;
const bad = (m: string) => { fails++; if (fails < 25) console.log('  ✘', m); };
const EDIT_PX = 5 * 64 + 5; // (5,5)
const EDIT_COL = pack4(250, 10, 200, 255);

for (const target of ['catharsis', 'optifine', 'vanilla'] as const) for (const n of [16, 32, 64] as const) {
  const buf = await buildPack(CATALOG, {
    name: 'Test Pack', target, n, style: PRESETS.furfsky, light: 135, styleName: 'FurfSky', encode,
    editsFor: (e) => (e.id === 'HYPERION' ? { [n === 64 ? EDIT_PX : 5 * n + 5]: EDIT_COL } : undefined),
  });
  const zip = await JSZip.loadAsync(buf as Uint8Array);
  const has = (p: string) => !!zip.file(p);
  const readPng = async (p: string) => PNG.sync.read(Buffer.from(await zip.file(p)!.async('uint8array')));
  const files = Object.keys(zip.files).filter((f) => !zip.files[f].dir);
  let pngs = 0, anims = 0, bows = 0;

  const mcPath = target === 'vanilla' ? 'resourcepack/pack.mcmeta' : 'pack.mcmeta';
  const mc = JSON.parse(await zip.file(mcPath)!.async('string'));
  if (target === 'catharsis' && !(mc.pack.min_format === 75 && mc['catharsis:pack/v1'])) bad(`${target}@${n} mcmeta`);
  if (target === 'optifine' && mc.pack.pack_format !== 1) bad(`${target}@${n} mcmeta pack_format`);
  if (target === 'vanilla' && (mc.pack.pack_format !== 46 || JSON.parse(await zip.file('datapack/pack.mcmeta')!.async('string')).pack.pack_format !== 61)) bad(`${target}@${n} resource/datapack pack_format`);
  const packPng = target === 'vanilla' ? 'resourcepack/pack.png' : 'pack.png';
  if (!has(packPng)) bad(`${target}@${n} pack.png missing`);
  if (!has('FORGE_MANIFEST.json')) bad(`${target}@${n} reproducible forge manifest missing`);
  else {
    const manifest = JSON.parse(await zip.file('FORGE_MANIFEST.json')!.async('string'));
    if (manifest.schema !== 'skyblock-texture-forge/1' || manifest.entries?.length !== CATALOG.length) bad(`${target}@${n} invalid forge manifest`);
  }

  for (const f of files.filter((f) => f.endsWith('.png'))) {
    pngs++;
    const p = await readPng(f);
    if (f !== packPng && !f.includes('/textures/entity/banner/') && !f.includes('/textures/entity/shield/') && p.width !== n) bad(`${f} width ${p.width} ≠ ${n}`);
    if ((f.includes('/textures/entity/banner/') || f.includes('/textures/entity/shield/')) && p.width !== 64) bad(`${f} banner mask width ${p.width} ≠ 64`);
    const frames = p.height / p.width;
    const meta = f + '.mcmeta';
    if (f !== packPng && frames !== 1) {
      if (!has(meta)) bad(`${f} has ${frames} frames but no .mcmeta`);
      else { anims++; const m = JSON.parse(await zip.file(meta)!.async('string')); if (!m.animation || m.animation.frametime !== PRESETS.furfsky.frametime) bad(`${meta} bad animation block`); }
    }
    if (f !== packPng && !Number.isInteger(frames)) bad(`${f} height not a multiple of width`);
  }

  if (target === 'catharsis') {
    for (const f of files.filter((f) => f.startsWith('assets/skyblock/items/'))) {
      const def = JSON.parse(await zip.file(f)!.async('string'));
      const refs: string[] = [];
      const walk = (o: any) => { if (!o || typeof o !== 'object') return; if (o.type === 'minecraft:model' && o.model) refs.push(o.model); Object.values(o).forEach(walk); };
      walk(def);
      if (def.model.type === 'minecraft:condition') {
        bows++;
        const t = def.model;
        const ok = t.property === 'minecraft:using_item' && t.on_true.type === 'minecraft:range_dispatch' && t.on_true.property === 'minecraft:use_duration' && t.on_true.scale === 0.05
          && t.on_true.entries.map((e: any) => e.threshold).join() === '0.65,0.9' && /_pulling_0$/.test(t.on_true.fallback.model);
        if (!ok) bad(`${f} bow dispatch differs from PacksHQ structure`);
      }
      for (const r of refs) {
        const [ns, path] = r.split(':');
        const mp = `assets/${ns}/models/${path}.json`;
        if (!has(mp)) { bad(`${f} → missing model ${mp}`); continue; }
        const model = JSON.parse(await zip.file(mp)!.async('string'));
        const [tns, tpath] = model.textures.layer0.split(':');
        if (!has(`assets/${tns}/textures/${tpath}.png`)) bad(`${mp} → missing texture ${tpath}`);
        if (def.model.type === 'minecraft:condition' && model.parent !== 'minecraft:item/bow') bad(`${mp} bow model parent ${model.parent}`);
      }
    }
    const hy = await readPng('assets/test_pack/textures/item/hyperion.png');
    const i = (5 * n + 5) * 4;
    if (!(hy.data[i] === 250 && hy.data[i + 1] === 10 && hy.data[i + 2] === 200)) bad(`${target}@${n} hand edit not in exported HYPERION png (got ${hy.data[i]},${hy.data[i + 1]},${hy.data[i + 2]})`);
  } else if (target === 'optifine') {
    const dir = 'assets/minecraft/mcpatcher/cit/test_pack/';
    for (const f of files.filter((f) => f.endsWith('.properties'))) {
      const props = Object.fromEntries((await zip.file(f)!.async('string')).trim().split('\n').map((l) => l.split('=') as [string, string]));
      if (!props['nbt.ExtraAttributes.id']) bad(`${f} missing nbt.ExtraAttributes.id`);
      if (!props.items) bad(`${f} missing items=`);
      for (const [k, v] of Object.entries(props)) if (k === 'texture' || k.startsWith('texture.')) if (!has(dir + v + '.png')) bad(`${f} → ${k}=${v} has no png`);
      if (props.items === 'bow') { bows++; for (const s of ['bow_standby', 'bow_pulling_0', 'bow_pulling_1', 'bow_pulling_2']) if (!props['texture.' + s]) bad(`${f} missing texture.${s}`); }
    }
  } else {
    const itemDir = 'resourcepack/assets/test_pack/items/';
    const shieldDefPath = itemDir + 'aegis_of_the_elements.json';
    if (!has(shieldDefPath)) bad(`${target}@${n} shield client item missing`);
    else {
      const def = JSON.parse(await zip.file(shieldDefPath)!.async('string'));
      const model = def.model;
      if (model.type !== 'minecraft:condition' || model.property !== 'minecraft:using_item') bad(`${target}@${n} shield special condition missing`);
      for (const m of [model.on_false, model.on_true]) {
        if (m.type !== 'minecraft:special' || m.model.type !== 'minecraft:shield') bad(`${target}@${n} special shield renderer missing`);
        const [namespace, path] = m.base.split(':');
        if (!has(`resourcepack/assets/${namespace}/models/${path}.json`)) bad(`${target}@${n} shield base model missing ${m.base}`);
      }
    }
    const shieldCmd = await zip.file('datapack/data/test_pack/function/give/aegis_of_the_elements.mcfunction')!.async('string');
    if (!shieldCmd.includes('minecraft:item_model=test_pack:aegis_of_the_elements') || !shieldCmd.includes('minecraft:banner_patterns=[')) bad(`${target}@${n} shield grant command components missing`);
    if (!has('datapack/data/test_pack/banner_pattern/aegis_of_the_elements_00.json')) bad(`${target}@${n} custom banner registry missing`);
    if (!has('resourcepack/assets/minecraft/atlases/banner_patterns.json')) bad(`${target}@${n} banner atlas source missing`);
    if (!has('datapack/data/minecraft/tags/banner_pattern/no_item_required.json')) bad(`${target}@${n} loom pattern tag missing`);
    const banner = await readPng('resourcepack/assets/test_pack/textures/entity/banner/aegis_of_the_elements_00.png');
    if (banner.width !== 64 || banner.height !== 64) bad(`${target}@${n} shield pattern mask is not 64×64`);
    const regularDef = JSON.parse(await zip.file(itemDir + 'hyperion.json')!.async('string'));
    if (regularDef.model.model !== 'test_pack:item/hyperion') bad(`${target}@${n} vanilla item_model binding missing`);
    const hy = await readPng('resourcepack/assets/test_pack/textures/item/hyperion.png');
    const i = (5 * n + 5) * 4;
    if (!(hy.data[i] === 250 && hy.data[i + 1] === 10 && hy.data[i + 2] === 200)) bad(`${target}@${n} manual edit missing from modern target`);
    if (!has('COMMANDS.md')) bad(`${target}@${n} command guide missing`);
  }
  console.log(`${target.padEnd(9)} @${n}: ${files.length} files · ${pngs} png decoded · ${anims} animated · ${bows} bows`);
}
console.log(fails ? `\n✘ ${fails} issue(s)` : '\n✔ real exporter output: every reference resolves, animations valid, bow dispatch = PacksHQ, hand edits exported');
process.exit(fails ? 1 : 0);
