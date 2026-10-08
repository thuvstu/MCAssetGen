import { DEFAULT_OPTIONS, normalizeOptions, optionsForPreset } from "../engine/options";
import { SWORD, WEAPON_DEFS } from "../vanilla/pixmaps";
import { TIER_PALETTES, resolveColor } from "../vanilla/renderer";
import { DEFAULT_VANILLA_PLUS, vanillaPlusPixels } from "../vanilla/vanillaPlus";
import { PRESETS } from "../engine/presets";
import { ANIMATION_SECONDS, renderPixels } from "../engine/render";
import { createHistory, historyReducer } from "../studio/history";
import {
  BLADE_LABELS, BLADE_PROFILES, GROUP_IDS, GROUPS, GUARD_LABELS, POMMEL_LABELS,
  SILHOUETTE_CATEGORIES, SURFACE_CATEGORIES, THEMES, createRecipe,
} from "./catalog";
import { SURFACE_LABELS } from "../engine/surfaces";
import type { GuardStyle, PommelStyle, Silhouette, SurfaceStyle } from "../engine/types";
import { GROUP_FIELDS, analyzeDesign, generateSword, groupEqual } from "./generate";

type Check = { name: string; run: () => void };
export type CheckResult = { name: string; passed: boolean; error?: string };
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const assert = (condition: boolean, message: string) => { if (!condition) throw new Error(message); };

/** Browser-runnable invariant suite. No DOM is needed by the generator or pixel renderer. */
export function runGeneratorChecks(): CheckResult[] {
  const checks: Check[] = [
    { name: "Deterministic seed", run: () => {
      const a = generateSword(DEFAULT_OPTIONS, createRecipe(), 91);
      const b = generateSword(DEFAULT_OPTIONS, createRecipe(), 91);
      assert(equal(a, b), "The same inputs must be reproducible.");
    } },
    { name: "No input mutation", run: () => {
      const options = normalizeOptions(DEFAULT_OPTIONS), recipe = createRecipe();
      const before = JSON.stringify([options, recipe]);
      generateSword(options, recipe, 5);
      assert(before === JSON.stringify([options, recipe]), "Inputs were mutated.");
    } },
    { name: "Unique field ownership", run: () => {
      const fields = Object.values(GROUP_FIELDS).flat();
      assert(fields.length === new Set(fields).size, "A field is owned by more than one group.");
      const unowned = Object.keys(DEFAULT_OPTIONS).filter((key) => !fields.includes(key as typeof fields[number]));
      assert(equal(unowned.sort(), ["antiAlias", "detailLevel", "seed", "size"].sort()), "A generated field lacks an owner.");
    } },
    { name: "Automatic composition, 300 seeds", run: () => {
      for (let seed = 0; seed < 300; seed++) {
        const next = generateSword(DEFAULT_OPTIONS, createRecipe(), seed).options;
        assert(analyzeDesign(next).length === 0, `Composition conflict at seed ${seed}: ${analyzeDesign(next).map((i) => i.id).join(", ")}`);
      }
    } },
    { name: "All locked is a no-op", run: () => {
      const recipe = createRecipe();
      GROUP_IDS.forEach((id) => { recipe.groups[id].mode = "keep"; });
      const result = generateSword(DEFAULT_OPTIONS, recipe, 9999);
      assert(equal(result.options, DEFAULT_OPTIONS) && !result.report.changed.length, "A locked document changed.");
    } },
    { name: "Theme-compatible hardware", run: () => {
      for (const theme of THEMES) {
        const recipe = createRecipe(); recipe.theme = theme.id;
        for (let seed = 0; seed < 25; seed++) {
          const o = generateSword(DEFAULT_OPTIONS, recipe, seed).options;
          const profile = BLADE_PROFILES[o.silhouette];
          assert(theme.guards.includes(o.guardStyle) && theme.grips.includes(o.handleStyle), `${theme.id} received unrelated hardware (${o.silhouette}: ${o.guardStyle}/${o.handleStyle}).`);
          assert(profile.guards.includes(o.guardStyle) && profile.grips.includes(o.handleStyle), `${theme.id} produced a profile-incompatible hardware combination (${o.silhouette}: ${o.guardStyle}/${o.handleStyle}).`);
        }
      }
    } },
    { name: "Locked microtexture and FX seeds", run: () => {
      const recipe = createRecipe(); recipe.groups.finish.mode = "keep"; recipe.groups.effects.mode = "keep";
      const o = generateSword(DEFAULT_OPTIONS, recipe, 7789).options;
      assert(o.surfaceSeed === DEFAULT_OPTIONS.surfaceSeed && o.effectSeed === DEFAULT_OPTIONS.effectSeed, "Locked procedural detail was reseeded.");
    } },
    { name: "Output settings are preserved", run: () => {
      const source = { ...DEFAULT_OPTIONS, size: 128, detailLevel: "cinematic" as const, antiAlias: true };
      const next = generateSword(source, createRecipe(), 1).options;
      assert(next.size === 128 && next.detailLevel === "cinematic" && next.antiAlias, "Output settings changed.");
    } },
    { name: "Locked effect informs automatic element", run: () => {
      const recipe = createRecipe(); recipe.groups.effects.mode = "keep";
      const source = { ...DEFAULT_OPTIONS, effectPreset: "infernal" as const, element: "flame" as const };
      for (let seed = 0; seed < 20; seed++) {
        const result = generateSword(source, recipe, seed);
        assert(result.options.element === "flame", "Automatic element contradicts the locked effect.");
        assert(groupEqual(source, result.options, "effects"), "The locked effect was changed.");
      }
    } },
    { name: "Minecraft mode limits automatic clutter", run: () => {
      const source = { ...DEFAULT_OPTIONS, size: 128, detailLevel: "minecraft" as const };
      const next = generateSword(source, createRecipe(), 81).options;
      assert(!next.spurs && !next.boneSpurs && !next.shatter && !next.lightning && !next.holographic, "Pixel mode produced oversized automatic effects.");
    } },
    { name: "Specified blade, attribute and palette", run: () => {
      const recipe = createRecipe();
      recipe.groups.blade = { mode: "pick", value: "katana" };
      recipe.groups.element = { mode: "pick", value: "frost" };
      recipe.groups.palette = { mode: "keep", value: "glacier" };
      for (let seed = 0; seed < 30; seed++) {
        const next = generateSword(DEFAULT_OPTIONS, recipe, seed).options;
        assert(next.silhouette === "katana" && next.element === "frost", "An explicit choice was overwritten.");
        assert(groupEqual(next, DEFAULT_OPTIONS, "palette"), "Palette colors changed.");
      }
    } },
    { name: "Conflicting locks are respected", run: () => {
      const source = { ...DEFAULT_OPTIONS, silhouette: "rapier" as const, boneSpurs: true, spurs: true, lightning: true, shatter: true };
      const recipe = createRecipe();
      for (const id of ["blade", "attachments", "effects"] as const) recipe.groups[id].mode = "keep";
      const result = generateSword(source, recipe, 121);
      assert((["blade", "attachments", "effects"] as const).every((id) => groupEqual(source, result.options, id)), "Conflicting locks were silently changed.");
      assert(result.report.issues.some((i) => i.id === "slender-spikes"), "Conflicts need a visible explanation.");
    } },
    { name: "Automatic blade respects specified hilt", run: () => {
      const recipe = createRecipe();
      recipe.groups.guard = { mode: "pick", value: "round" };
      recipe.groups.grip = { mode: "pick", value: "wrapped_parchment" };
      for (let seed = 0; seed < 20; seed++) {
        const result = generateSword(DEFAULT_OPTIONS, recipe, seed);
        const profile = BLADE_PROFILES[result.options.silhouette];
        assert(profile.guards.includes("round") && profile.grips.includes("wrapped_parchment"), `Automatic blade ignored the specified hilt (${result.options.silhouette}).`);
        assert(result.report.issues.length === 0, "Compatible constraints should not produce warnings.");
      }
    } },
    { name: "Runic FX request prepares an automatic finish", run: () => {
      const recipe = createRecipe(); recipe.groups.effects = { mode: "pick", value: "runic" };
      const result = generateSword(DEFAULT_OPTIONS, recipe, 29);
      assert(result.options.runeInlay && result.options.runePulse, "Runic FX has no matching engraving.");
    } },
    { name: "Storage validation", run: () => {
      const next = normalizeOptions({ size: -999, bladeWidth: Infinity, seed: NaN, element: "missing", palette: { blade: "not-a-color" } });
      assert(next.size === DEFAULT_OPTIONS.size && next.palette.blade === DEFAULT_OPTIONS.palette.blade && Number.isFinite(next.seed), "Invalid storage escaped validation.");
    } },
    { name: "Undo restores metadata", run: () => {
      const first = { name: "first", options: DEFAULT_OPTIONS };
      let history = createHistory(first);
      const second = { name: "second", options: generateSword(DEFAULT_OPTIONS, createRecipe(), 1).options };
      history = historyReducer(history, { type: "commit", next: second, at: 100 });
      history = historyReducer(history, { type: "undo" });
      assert(equal(history.present, first), "Undo did not restore the complete document.");
      history = historyReducer(history, { type: "redo" });
      assert(equal(history.present, second), "Redo did not restore the complete document.");
    } },
    { name: "Edits invalidate redo", run: () => {
      let history = createHistory(0);
      history = historyReducer(history, { type: "commit", next: 1, group: "slider", at: 10 });
      history = historyReducer(history, { type: "commit", next: 2, group: "slider", at: 20 });
      assert(history.past.length === 1, "Slider updates must coalesce.");
      history = historyReducer(history, { type: "undo" });
      history = historyReducer(history, { type: "commit", next: 3, group: "slider", at: 30 });
      assert(!history.future.length && history.past.length === 1, "A new edit left stale redo entries.");
    } },
    { name: "Pixel renderer and looping animation", run: () => {
      const options = { ...DEFAULT_OPTIONS, size: 32, lightning: true, particles: true, shatter: true };
      const first = renderPixels(options, 0), last = renderPixels(options, ANIMATION_SECONDS);
      assert(first.data.length === 32 * 32 * 4 && first.width === 32, "Incorrect pixel dimensions.");
      assert(first.data.every((n, i) => n === last.data[i]), "The animation does not loop.");
      assert(first.data.some((n, i) => i % 4 === 3 && n > 0), "The render is empty.");
      assert(first.data.some((n, i) => i % 4 === 3 && n === 0), "Transparency was lost.");
    } },
    { name: "Supersampling produces alpha coverage", run: () => {
      const frame = renderPixels({ ...DEFAULT_OPTIONS, size: 32, antiAlias: true, sparkle: false }, 0);
      assert(frame.data.some((v, i) => i % 4 === 3 && v > 0 && v < 255), "AA has no fractional edge coverage.");
    } },
  ];
  for (const id of GROUP_IDS) {
    checks.push({ name: `Lock: ${GROUPS[id].english}`, run: () => {
      const recipe = createRecipe(); recipe.groups[id].mode = "keep";
      for (let seed = 0; seed < 20; seed++) assert(groupEqual(DEFAULT_OPTIONS, generateSword(DEFAULT_OPTIONS, recipe, seed).options, id), `${id} lock was overwritten.`);
    } });
    checks.push({ name: `Scoped generation: ${GROUPS[id].english}`, run: () => {
      const next = generateSword(DEFAULT_OPTIONS, createRecipe(), 25, [id]).options;
      assert(GROUP_IDS.filter((g) => g !== id).every((g) => groupEqual(DEFAULT_OPTIONS, next, g)), "Scoped generation changed a different group.");
    } });
  }
  /** 8-connected component sizes of the opaque mask (pixel-art diagonals are 8-connected). */
  const islands = (o: typeof DEFAULT_OPTIONS) => {
    const f = renderPixels(o, 0), w = f.width, m = new Uint8Array(w * w), seen = new Uint8Array(w * w), sizes: number[] = [];
    for (let i = 0; i < m.length; i++) m[i] = f.data[i * 4 + 3] > 40 ? 1 : 0;
    for (let i = 0; i < m.length; i++) {
      if (!m[i] || seen[i]) continue;
      let size = 0; const stack = [i]; seen[i] = 1;
      while (stack.length) {
        const j = stack.pop()!; size++;
        const x = j % w, y = Math.floor(j / w);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= w) continue;
          const k = ny * w + nx;
          if (m[k] && !seen[k]) { seen[k] = 1; stack.push(k); }
        }
      }
      sizes.push(size);
    }
    return sizes.sort((a, b) => b - a);
  };
  const quiet = { ...DEFAULT_OPTIONS, sparkle: false, particles: false, lightning: false, shatter: false, gem: false, runeInlay: false };
  for (const silhouette of Object.keys(BLADE_LABELS) as Silhouette[]) {
    checks.push({ name: `Geometry: ${silhouette}`, run: () => {
      const profile = BLADE_PROFILES[silhouette];
      for (const guardStyle of Object.keys(GUARD_LABELS) as GuardStyle[]) {
        for (const pommelStyle of Object.keys(POMMEL_LABELS) as PommelStyle[]) {
          for (const size of [24, 48]) {
            const sizes = islands({ ...quiet, size, silhouette, guardStyle, pommelStyle, bladeWidth: profile.width[0], bladeLength: profile.length[1], guardWidth: profile.guard, handleLength: profile.handle, spurs: true, spurCount: 3, crystalShards: true });
            assert(sizes[0] > 15, `${silhouette} has no visible silhouette.`);
            assert(sizes.filter((n) => n >= 2).length === 1, `${silhouette}/${guardStyle}/${pommelStyle}@${size} has floating fragments (${sizes.slice(0, 4).join("/")}).`);
          }
        }
      }
    } });
  }
  checks.push({ name: "Surface patterns stay readable", run: () => {
    const lum = (d: Uint8ClampedArray, i: number) => d[i] * 0.3 + d[i + 1] * 0.6 + d[i + 2] * 0.1;
    for (const surface of Object.keys(SURFACE_LABELS) as SurfaceStyle[]) {
      const f = renderPixels({ ...quiet, size: 64, silhouette: "claymore", bladeWidth: 4, bladeLength: 11, guardWidth: 5, handleLength: 4, surface, noise: 0.1, gradientBlade: false }, 0);
      let n = 0, jumps = 0;
      for (let y = 0; y < f.width; y++) for (let x = 0; x < f.width - 1; x++) {
        const i = (y * f.width + x) * 4;
        if (f.data[i + 3] < 40 || f.data[i + 7] < 40) continue;
        n++; if (Math.abs(lum(f.data, i) - lum(f.data, i + 4)) > 50) jumps++;
      }
      assert(jumps / n < 0.3, `${surface} is too noisy (${(jumps / n).toFixed(2)}).`);
    }
  } });
  checks.push({ name: "Hamon family is visually distinct", run: () => {
    const family = ["suguha", "gunome", "choji", "notare", "inazuma", "kinsuji"] as SurfaceStyle[];
    const signatures: Record<string, number[]> = {};
    for (const surface of family) {
      const f = renderPixels({ ...quiet, size: 64, silhouette: "uchigatana", bladeWidth: 3, bladeLength: 11, guardWidth: 2, handleLength: 4, surface, noise: 0, gradientBlade: false, edgeHighlight: false }, 0);
      // sample the edge band brightness profile along the blade
      const profile: number[] = [];
      for (let y = 6; y < 30; y++) {
        let sum = 0, n = 0;
        for (let x = 0; x < f.width; x++) {
          const i = (y * f.width + x) * 4;
          if (f.data[i + 3] < 40) continue;
          sum += f.data[i] * 0.3 + f.data[i + 1] * 0.6 + f.data[i + 2] * 0.1; n++;
        }
        profile.push(n ? sum / n : 0);
      }
      signatures[surface] = profile;
    }
    // each pair must differ somewhere by a meaningful amount
    for (let a = 0; a < family.length; a++) for (let b = a + 1; b < family.length; b++) {
      const pa = signatures[family[a]], pb = signatures[family[b]];
      let maxDiff = 0;
      for (let i = 0; i < Math.min(pa.length, pb.length); i++) maxDiff = Math.max(maxDiff, Math.abs(pa[i] - pb[i]));
      assert(maxDiff > 2, `${family[a]} and ${family[b]} render identically.`);
    }
  } });
  checks.push({ name: "Rengoku edge gradient lights the edge and cools the spine", run: () => {
    const base = { ...quiet, size: 64, silhouette: "katana", bladeWidth: 3, bladeLength: 11, guardWidth: 2, handleLength: 4, surface: "polished", noise: 0, gradientBlade: false, edgeHighlight: false } as typeof DEFAULT_OPTIONS;
    // For a diagonal blade, `across < 0` (the cutting edge) lies on the smaller-x side
    // of a horizontal cross-section, so read one row and split it in half.
    const halves = (o: typeof base) => {
      const f = renderPixels(o, 0);
      const y = Math.floor(f.width * 0.45);
      const row: number[] = [];
      for (let x = 0; x < f.width; x++) {
        const i = (y * f.width + x) * 4;
        if (f.data[i + 3] < 40) continue;
        row.push(f.data[i] * 0.3 + f.data[i + 1] * 0.6 + f.data[i + 2] * 0.1);
      }
      if (row.length < 4) throw new Error("no blade pixels in the cross-section");
      const half = Math.floor(row.length / 2);
      const avg = (a: number[]) => a.reduce((p, c) => p + c, 0) / a.length;
      return { edge: avg(row.slice(0, half)), spine: avg(row.slice(half)) };
    };
    const off = halves({ ...base, edgeGradient: false });
    const on = halves({ ...base, edgeGradient: true });
    assert(on.edge > off.edge + 2, `the cutting edge did not brighten (${off.edge.toFixed(1)} -> ${on.edge.toFixed(1)}).`);
    assert(on.spine < off.spine - 2, `the spine did not cool (${off.spine.toFixed(1)} -> ${on.spine.toFixed(1)}).`);
  } });
  checks.push({ name: "Lighting from upper-left", run: () => {
    for (const surface of Object.keys(SURFACE_LABELS) as SurfaceStyle[]) {
      const f = renderPixels({ ...quiet, size: 64, silhouette: "claymore", bladeWidth: 4, bladeLength: 11, guardWidth: 5, handleLength: 4, surface, noise: 0, gradientBlade: false }, 0);
      const w = f.width;
      const lit: number[] = []; const dark: number[] = [];
      for (let y = 8; y < 28; y++) for (let x = 26; x < 38; x++) {
        const i = (y * w + x) * 4; if (f.data[i + 3] < 40) continue;
        const luma = f.data[i] * 0.3 + f.data[i + 1] * 0.6 + f.data[i + 2] * 0.1;
        // upper-left rim is to the lower-left of the blade centre
        if (x + y < 64) lit.push(luma); else dark.push(luma);
      }
      if (lit.length < 5 || dark.length < 5) continue;
      const avgLit = lit.reduce((a, b) => a + b, 0) / lit.length;
      const avgDark = dark.reduce((a, b) => a + b, 0) / dark.length;
      assert(avgLit >= avgDark - 5, `${surface}: upper-left (${avgLit.toFixed(1)}) not brighter than lower-right (${avgDark.toFixed(1)}).`);
    }
  } });
  // ─── Pixel-art connectivity invariant ────────────────────────────────
  // At 16px each logical cell is exactly one pixel, so a diagonal blade is a
  // chain of pixels touching only at their corners. That is how vanilla
  // Minecraft draws a sword, so the correct test is 8-connectivity: the item
  // must be ONE shape, and no pixel may float free of every neighbour
  // (a floating pixel reads as dirt, not as detail).
  checks.push({ name: "Silhouettes stay connected at 16px and 32px", run: () => {
    const offenders: string[] = [];
    for (const size of [16, 32] as const) {
      for (const silhouette of Object.keys(BLADE_LABELS) as Silhouette[]) {
        const frame = renderPixels(normalizeOptions({ ...quiet, silhouette, size }), 0);
        const { width: w, height: h, data } = frame;
        const mask = new Uint8Array(w * h);
        let total = 0;
        for (let i = 0; i < w * h; i++) if (data[i * 4 + 3] > 0) { mask[i] = 1; total++; }
        if (total < 16) { offenders.push(`${silhouette}@${size}: only ${total}px`); continue; }

        const seen = new Uint8Array(w * h);
        let components = 0, floating = 0, largest = 0;
        for (let start = 0; start < w * h; start++) {
          if (!mask[start] || seen[start]) continue;
          components++;
          const stack = [start]; seen[start] = 1;
          let n = 0;
          while (stack.length) {
            const c = stack.pop() as number; n++;
            const cx = c % w, cy = (c / w) | 0;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
              if (!dx && !dy) continue;
              const nx = cx + dx, ny = cy + dy;
              if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
              const j = ny * w + nx;
              if (mask[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
            }
          }
          if (n > largest) largest = n;
          if (n === 1) floating++;
        }
        if (components !== 1) offenders.push(`${silhouette}@${size}: ${components} components (largest ${Math.round((largest / total) * 100)}%)`);
        if (floating > 0) offenders.push(`${silhouette}@${size}: ${floating} floating pixel(s)`);
      }
    }
    assert(offenders.length === 0, offenders.slice(0, 6).join("; "));
  } });

  checks.push({ name: "All silhouettes are reachable in themes with matching hardware", run: () => {
    const allBlades = Object.keys(BLADE_LABELS) as Silhouette[];
    const themedBlades = new Set(THEMES.flatMap((t) => t.blades));
    const missing = allBlades.filter((b) => !themedBlades.has(b));
    assert(missing.length === 0, `Silhouettes missing from THEMES: ${missing.join(", ")}`);
    for (const theme of THEMES) {
      for (const blade of theme.blades) {
        const p = BLADE_PROFILES[blade];
        const hasGuard = p.guards.some((g) => theme.guards.includes(g));
        const hasGrip = p.grips.some((g) => theme.grips.includes(g));
        assert(hasGuard && hasGrip, `${theme.id}/${blade} lacks compatible guard (${hasGuard}) or grip (${hasGrip}).`);
      }
    }
  } });

  checks.push({ name: "UI category filters cover all silhouettes and surfaces", run: () => {
    const allBlades = Object.keys(BLADE_LABELS);
    const catBlades = SILHOUETTE_CATEGORIES.filter((c) => c.items).flatMap((c) => c.items!);
    assert(catBlades.length === allBlades.length && new Set(catBlades).size === allBlades.length, "SILHOUETTE_CATEGORIES does not partition all 42 silhouettes.");
    const allSurfaces = Object.keys(SURFACE_LABELS);
    const catSurfaces = SURFACE_CATEGORIES.filter((c) => c.items).flatMap((c) => c.items!);
    assert(catSurfaces.length === allSurfaces.length && new Set(catSurfaces).size === allSurfaces.length, `SURFACE_CATEGORIES does not partition all ${allSurfaces.length} surfaces.`);
  } });

  checks.push({ name: "All presets normalize and render cleanly", run: () => {
    for (const key of Object.keys(PRESETS)) {
      const o = optionsForPreset(key, { ...DEFAULT_OPTIONS, size: 32 });
      const f = renderPixels(o, 0);
      let opaque = 0;
      for (let i = 3; i < f.data.length; i += 4) if (f.data[i] > 0) opaque++;
      assert(opaque >= 25, `Preset ${key} rendered too few pixels (${opaque}).`);
    }
  } });

  // ─── Vanilla lattice & symmetry invariant ────────────────────────────
  // Verifies all 13 vanilla 16×16 weapon/tool maps:
  //  - 16×16 grid dimensions
  //  - Single 8-connected component, zero floating pixels
  //  - SWORD silhouette is mirror-symmetric across x + y = 15 (T(x,y) = (15-y,15-x))
  //  - All 8 shading indices (1..8) are present on the vanilla sword
  //  - All 11 material palettes resolve indices 1..9 to non-black RGB colours
  checks.push({ name: "Vanilla maps sit on the 16x16 lattice with exact sword symmetry", run: () => {
    const bad: string[] = [];
    const w = 16;
    for (const def of WEAPON_DEFS) {
      const map = def.map;
      if (map.length !== w || map.some((row) => row.length !== w)) {
        bad.push(`${def.id}: invalid grid dimensions`);
        continue;
      }
      const mask = map.map((row) => row.map((v) => v !== 0));
      let total = 0;
      for (const row of mask) for (const v of row) if (v) total++;
      if (total < 24 || total > 130) { bad.push(`${def.id}: ${total}px`); continue; }

      const seen = map.map(() => Array(w).fill(false));
      const sizes: number[] = [];
      let floating = 0;
      for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
        if (!mask[y][x] || seen[y][x]) continue;
        const stack = [[x, y]]; seen[y][x] = true;
        let n = 0;
        while (stack.length) {
          const [cx, cy] = stack.pop() as [number, number]; n++;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= w) continue;
            if (mask[ny][nx] && !seen[ny][nx]) { seen[ny][nx] = true; stack.push([nx, ny]); }
          }
        }
        sizes.push(n);
        if (n === 1) floating++;
      }
      if (sizes.length !== 1) bad.push(`${def.id}: ${sizes.length} components`);
      if (floating > 0) bad.push(`${def.id}: ${floating} floating pixel(s)`);
    }

    // Exact diagonal mirror symmetry T(x, y) = (15 - y, 15 - x) for the vanilla sword
    for (let y = 0; y < w; y++) {
      for (let x = 0; x < w; x++) {
        const a = SWORD[y][x] !== 0;
        const b = SWORD[15 - x][15 - y] !== 0;
        if (a !== b) bad.push(`sword symmetry mismatch at (${x},${y}) vs (${15 - y},${15 - x})`);
      }
    }
    const swordIndices = new Set(SWORD.flat().filter((v) => v > 0));
    for (const idx of [1, 2, 3, 4, 5, 6, 7, 8]) {
      if (!swordIndices.has(idx)) bad.push(`sword missing tone index ${idx}`);
    }

    for (const [tier, pal] of Object.entries(TIER_PALETTES)) {
      for (let idx = 1; idx <= 9; idx++) {
        const rgb = resolveColor(idx, pal);
        if (!rgb || (rgb[0] === 0 && rgb[1] === 0 && rgb[2] === 0)) {
          bad.push(`${tier} palette index ${idx} resolved to empty/black`);
        }
      }
    }
    assert(bad.length === 0, bad.slice(0, 6).join("; "));
  } });

  // ─── Vanilla+ invariant ──────────────────────────────────────────────
  // Vanilla+ must keep the EXACT opaque mask of pure vanilla (pixel positions
  // never move), be fully deterministic, and actually refine colours.
  checks.push({ name: "Vanilla+ keeps the vanilla mask and refines colours", run: () => {
    const bad: string[] = [];
    const tiers = ["diamond", "iron"];
    for (const def of WEAPON_DEFS) {
      for (const tier of tiers) {
        const pal = TIER_PALETTES[tier];
        for (const size of [16, 32]) {
          const a = vanillaPlusPixels(def.map, pal, size, DEFAULT_VANILLA_PLUS);
          const b = vanillaPlusPixels(def.map, pal, size, DEFAULT_VANILLA_PLUS);
          // deterministic
          for (let i = 0; i < a.data.length; i++) {
            if (a.data[i] !== b.data[i]) {
              bad.push(`${def.id}/${tier}@${size}: non-deterministic output`);
              break;
            }
          }
          // mask identical to the pure 16×16 map (scaled)
          const scale = size / 16;
          for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
              const expected = def.map[Math.floor(y / scale)][Math.floor(x / scale)] !== 0 ? 1 : 0;
              if (a.mask[y * size + x] !== expected) {
                bad.push(`${def.id}/${tier}@${size}: mask drift at (${x},${y})`);
                y = size;
                break;
              }
            }
          }
        }
      }
    }
    // Vanilla+ must visibly differ from flat pure-vanilla colours somewhere
    const sword = WEAPON_DEFS.find((w) => w.id === "sword")!;
    const pal = TIER_PALETTES.diamond;
    const plus = vanillaPlusPixels(sword.map, pal, 32, DEFAULT_VANILLA_PLUS);
    let diff = 0;
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const col = resolveColor(sword.map[Math.floor(y / 2)][Math.floor(x / 2)], pal);
        if (!col) continue;
        const i = (y * 32 + x) * 4;
        if (
          Math.abs(plus.data[i] - col[0]) > 2 ||
          Math.abs(plus.data[i + 1] - col[1]) > 2 ||
          Math.abs(plus.data[i + 2] - col[2]) > 2
        ) {
          diff++;
        }
      }
    }
    if (diff < 20) bad.push(`vanilla_plus barely differs from pure (${diff}px)`);
    assert(bad.length === 0, bad.slice(0, 6).join("; "));
  } });

  return checks.map(({ name, run }) => {
    try { run(); return { name, passed: true }; }
    catch (error) { return { name, passed: false, error: error instanceof Error ? error.message : String(error) }; }
  });
}