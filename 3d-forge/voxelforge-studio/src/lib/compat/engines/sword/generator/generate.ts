import { hexToRgb, mix, mulberry32, rgbToHex } from "../engine/color";
import { EFFECT_PRESETS } from "../engine/presets";
import type { Element, GuardStyle, HandleStyle, Silhouette, SurfaceStyle, SwordOptions } from "../engine/types";
import { SURFACE_LABELS } from "../engine/surfaces";
import {
  BLADE_LABELS, BLADE_PROFILES, ELEMENT_LABELS, GROUP_IDS, GROUPS, PALETTE_KITS, THEMES, parseRecipe,
} from "./catalog";
import type { GroupId, Recipe, ThemeId } from "./catalog";

// Each generated field has exactly one owner. Locks are applied at this boundary.
export const GROUP_FIELDS = {
  blade: ["silhouette", "bladeWidth", "bladeLength"],
  guard: ["guardStyle", "guardWidth", "gem", "gemShape", "filigree"],
  grip: ["handleStyle", "handleLength", "pommelStyle", "pommelBand"],
  palette: ["palette", "tipColor", "midGradientColor", "gemColor", "runeColor", "shardColor", "outlineColorMode"],
  element: ["element", "elementIntensity"],
  attachments: ["spurs", "spurCount", "boneSpurs", "crystalShards", "serrated"],
  finish: ["surface", "fuller", "fullerLength", "runeInlay", "edgeGradient", "ricasso", "horimono", "gradientBlade", "edgeHighlight", "bevelLine", "noise", "shading", "outline", "surfaceSeed"],
  effects: ["effectPreset", "sheen", "sheenSpeed", "sheenPos", "sparkle", "sparkleDensity", "tipGlow", "particles", "lightning", "shatter", "runePulse", "gemGlow", "holographic", "auraBloom", "effectSeed"],
} as const satisfies Record<GroupId, readonly (keyof SwordOptions)[]>;

export type DesignIssue = { id: string; groups: GroupId[]; message: string };
export type GenerationReport = {
  seed: number; theme: ThemeId; changed: GroupId[]; kept: GroupId[]; specified: GroupId[];
  notes: string[]; issues: DesignIssue[];
};
export type GenerationResult = { options: SwordOptions; report: GenerationReport; name: string };

const json = (v: unknown) => JSON.stringify(v);
export function groupEqual(a: SwordOptions, b: SwordOptions, id: GroupId): boolean {
  return GROUP_FIELDS[id].every((key) => json(a[key]) === json(b[key]));
}

export function analyzeDesign(o: SwordOptions): DesignIssue[] {
  const issues: DesignIssue[] = [];
  const add = (id: string, groups: GroupId[], message: string) => issues.push({ id, groups, message });
  const profile = BLADE_PROFILES[o.silhouette];
  const slim = profile.slim || o.bladeWidth <= 1;
  if (slim && (o.spurs || o.boneSpurs || o.serrated))
    add("slender-spikes", ["blade", "attachments"], "細身の刀身に大きなトゲを組み合わせています。固定・指定を解除すると軽い装飾を選べます。");
  if (Number(o.spurs) + Number(o.boneSpurs) + Number(o.crystalShards) + Number(o.serrated) > 1)
    add("attachment-stack", ["attachments"], "複数のアタッチメントが重なっています。主役を1種類に絞ると輪郭が見やすくなります。");
  if (o.fuller && o.runeInlay)
    add("centerline", ["finish"], "樋とルーンが同じ中央部分を使っています。どちらかを主役にするのがおすすめです。");
  if (Number(o.lightning) + Number(o.shatter) + Number(o.holographic) > 1)
    add("effect-stack", ["effects"], "強いエフェクトが重なっています。刀身を見せたい場合は1種類に絞ってください。");
  if (slim && o.guardWidth > 4)
    add("guard-scale", ["blade", "guard"], "細い刀身に対して鍔が大きめです。鍔をおまかせにすると比率を調整します。");
  if (!(profile.guards as readonly string[]).includes(o.guardStyle))
    add("guard-language", ["blade", "guard"], "刀身と鍔の系統が異なります。意図的な組み合わせなら、そのまま使えます。");
  if (!(profile.grips as readonly string[]).includes(o.handleStyle))
    add("grip-language", ["blade", "grip"], "刀身と柄巻きの系統が異なります。固定や指定を優先して保持しています。");
  if (o.element === "none" && (o.lightning || o.shatter))
    add("untyped-energy", ["element", "effects"], "無属性に魔法系の演出を指定しています。指定した内容を優先して保持しています。");
  if (o.size <= 32 && (o.boneSpurs || o.shatter || (o.runeInlay && o.surface !== "polished")))
    add("small-detail", ["attachments", "finish", "effects"], "この解像度では装飾の細部がつぶれやすくなります。64px以上での確認がおすすめです。");
  if (o.runePulse && !o.runeInlay)
    add("rune-dependency", ["finish", "effects"], "ルーンの脈動にはルーン彫刻が必要です。仕上げを指定するか、脈動を解除してください。");
  const effectElement = o.effectPreset !== "calm" ? EFFECT_PRESETS[o.effectPreset]?.element : undefined;
  if (effectElement && effectElement !== o.element)
    add("element-effect", ["element", "effects"], "属性とFXプリセットの系統が異なります。指定・固定はそのまま保持しています。");
  const clash: Partial<Record<SurfaceStyle, Element[]>> = { magma: ["frost", "ocean"], frost: ["flame"], prismarine: ["flame"], circuit: ["nature"], wood: ["frost"] };
  if (clash[o.surface]?.includes(o.element))
    add("surface-element", ["finish", "element"], `${SURFACE_LABELS[o.surface]}と${ELEMENT_LABELS[o.element]}属性は系統が離れています。意図した対比なら、そのまま使えます。`);
  if (o.runeInlay && ["circuit", "etched", "gilded", "starfield"].includes(o.surface) === false && ["damascus", "scales", "crystal", "amethyst", "frost"].includes(o.surface))
    add("rune-busy", ["finish"], "模様の強い素材にルーンを重ねています。どちらかを主役にすると読みやすくなります。");
  const brightness = (hex: string) => {
    const [r, g, b] = hexToRgb(hex);
    return r * 0.2126 + g * 0.7152 + b * 0.0722;
  };
  if (brightness(o.palette.bladeEdge) - brightness(o.palette.bladeCore) < 35)
    add("contrast", ["palette"], "刃先と芯の明暗差が小さめです。配色をおまかせにすると陰影を整理します。");
  return issues;
}

function closestKit(palette: SwordOptions["palette"]) {
  const target = hexToRgb(palette.blade);
  return [...PALETTE_KITS].sort((a, b) => {
    const distance = (hex: string) => hexToRgb(hex).reduce((sum, value, i) => sum + (value - target[i]) ** 2, 0);
    return distance(a.palette.blade) - distance(b.palette.blade);
  })[0];
}

/** Pure and deterministic: same document + recipe + seed always produces the same result. */
export function generateSword(current: SwordOptions, input: Recipe, seed: number, scope: readonly GroupId[] = GROUP_IDS): GenerationResult {
  const recipe = parseRecipe(input);
  const rules = recipe.groups;
  const rnd = mulberry32(seed >>> 0);
  const pick = <T,>(values: readonly T[]): T => values[Math.floor(rnd() * values.length)];
  const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
  const kept = (id: GroupId) => rules[id].mode === "keep" || !scope.includes(id);
  const chosen = (id: GroupId) => !kept(id) && rules[id].mode === "pick" ? rules[id].value : undefined;
  const auto = (id: GroupId) => !kept(id) && rules[id].mode === "auto";
  const next: SwordOptions = { ...current, palette: { ...current.palette } };
  const write = (id: GroupId, patch: Partial<SwordOptions>) => {
    if (kept(id)) return;
    for (const key of GROUP_FIELDS[id]) {
      if (patch[key] !== undefined) Object.assign(next, { [key]: patch[key] });
    }
  };
  const quiet = recipe.density === "quiet";
  const ornate = recipe.density === "ornate";
  const small = current.size <= 32 || current.detailLevel === "minecraft";

  const forcedBlade = kept("blade") ? current.silhouette : chosen("blade") as Silhouette | undefined;
  const forcedElement = kept("element") ? current.element : chosen("element") as Element | undefined;
  const forcedGuard = kept("guard") ? current.guardStyle : chosen("guard") as GuardStyle | undefined;
  const forcedGrip = kept("grip") ? current.handleStyle : chosen("grip") as HandleStyle | undefined;
  const forcedHeavy = kept("attachments") ? current.spurs || current.boneSpurs || current.serrated : ["spurs", "bone", "serrated"].includes(chosen("attachments") ?? "");
  const paletteHint = kept("palette") ? closestKit(current.palette) : PALETTE_KITS.find((p) => p.id === chosen("palette"));
  const effectElement = kept("effects") && current.effectPreset !== "calm" ? EFFECT_PRESETS[current.effectPreset]?.element :
    chosen("effects") === "lightning" ? "lightning" : undefined;
  const evidence = forcedElement ?? effectElement ?? paletteHint?.element;
  let theme = THEMES.find((t) => t.id === recipe.theme);
  if (!theme) {
    const scored = THEMES.map((t) => ({ theme: t, score:
      (forcedBlade && t.blades.includes(forcedBlade) ? 4 : 0) +
      (evidence && t.elements.includes(evidence) ? 3 : 0) +
      (forcedGuard && t.guards.includes(forcedGuard) ? 2 : 0) +
      (forcedGrip && t.grips.includes(forcedGrip) ? 2 : 0) +
      (chosen("attachments") === "bone" && t.id === "abyssal" ? 5 : 0) +
      (chosen("finish") && t.surfaces.includes(chosen("finish") as SurfaceStyle) ? 3 : 0) +
      (paletteHint && t.palettes.includes(paletteHint.id) ? 3 : 0),
    }));
    const best = Math.max(...scored.map((s) => s.score));
    theme = pick(scored.filter((s) => s.score === best)).theme;
  }

  const compatibility = (blade: Silhouette) => {
    const p = BLADE_PROFILES[blade];
    return (forcedGuard && p.guards.includes(forcedGuard) ? 6 : 0) +
      (forcedGrip && p.grips.includes(forcedGrip) ? 4 : 0) + (forcedHeavy && !p.slim ? 6 : 0) -
      (kept("guard") && current.guardWidth > 4 && p.slim ? 2 : 0);
  };
  const scores = Object.keys(BLADE_PROFILES).map((id) => ({ id: id as Silhouette, score: compatibility(id as Silhouette) }));
  const bestScore = Math.max(...scores.map((s) => s.score));
  const matches = scores.filter((s) => s.score === bestScore).map((s) => s.id);
  const themed = theme.blades.filter((id) => matches.includes(id));
  const silhouette = forcedBlade ?? pick(themed.length ? themed : matches);
  const shape = BLADE_PROFILES[silhouette];
  write("blade", { silhouette, bladeWidth: int(...shape.width), bladeLength: int(...shape.length) });
  const slim = shape.slim || next.bladeWidth <= 1;

  let element: Element = evidence ?? pick(theme.elements);
  if (forcedElement === "none") element = "none";
  write("element", { element, elementIntensity: element === "none" ? 0 : quiet ? 0.18 : ornate ? 0.45 : 0.3 });
  element = next.element;

  const themedKits = PALETTE_KITS.filter((p) => theme!.palettes.includes(p.id));
  const matchingKits = themedKits.filter((p) => p.element === element || element === "none");
  const fallbackKits = PALETTE_KITS.filter((p) => p.element === element);
  const paletteKit = PALETTE_KITS.find((p) => p.id === chosen("palette")) ?? pick(matchingKits.length ? matchingKits : fallbackKits.length ? fallbackKits : themedKits);
  const palette = { ...paletteKit.palette };
  // Keep a limited tonal ramp; variation never introduces a third unrelated accent.
  if (auto("palette")) {
    const amount = rnd() * 0.09;
    palette.blade = rgbToHex(mix(hexToRgb(palette.blade), hexToRgb(palette.bladeEdge), amount));
  }
  write("palette", { palette, tipColor: palette.bladeEdge, midGradientColor: palette.blade,
    gemColor: paletteKit.accent, runeColor: paletteKit.accent, shardColor: paletteKit.accent, outlineColorMode: "tinted" });

  const matchingGuards = shape.guards.filter((id) => theme!.guards.includes(id));
  const matchingGrips = shape.grips.filter((id) => theme!.grips.includes(id));
  const guardStyle = chosen("guard") as GuardStyle | undefined ?? pick(matchingGuards.length ? matchingGuards : shape.guards);
  const smallGuard = guardStyle === "none" || ["katana", "nodachi", "tanto", "dagger", "spear", "macuahuitl", "khopesh", "bow", "whip", "ribbon", "sakura", "essence"].includes(silhouette);
  write("guard", {
    guardStyle, guardWidth: Math.max(1, Math.min(slim ? 4 : 6, shape.guard + (ornate && !slim ? 1 : 0))),
    gem: !quiet && !smallGuard, gemShape: smallGuard ? "circle" : theme.id === "crystal" ? "hex" : "diamond",
    filigree: !quiet && !smallGuard && ["royal", "celestial", "ancient"].includes(theme.id),
  });
  const gripStyle = chosen("grip") as HandleStyle | undefined ?? pick(matchingGrips.length ? matchingGrips : shape.grips);
  write("grip", {
    handleStyle: gripStyle, handleLength: shape.handle,
    pommelStyle: smallGuard ? "ring" : pick(theme.pommels),
    pommelBand: ["royal", "crystal", "celestial", "arcanotech"].includes(theme.id) || (ornate && rnd() < 0.5),
  });

  let attachment = chosen("attachments");
  if (!attachment) {
    const dominantFx = (kept("effects") && (current.lightning || current.shatter || current.holographic)) || ["lightning", "orbit", "hologram"].includes(chosen("effects") ?? "");
    attachment = quiet || slim || small || dominantFx ? "none" :
      theme.id === "abyssal" || theme.id === "nether" ? pick(["bone", "spurs", "serrated", "none"]) :
      theme.id === "crystal" || theme.id === "arcanotech" ? pick(["crystals", "none", "none"]) :
      theme.id === "ancient" ? pick(["serrated", "none", "none"]) : ornate ? pick(["crystals", "spurs", "none", "none"]) : "none";
  }
  write("attachments", {
    spurs: attachment === "spurs", boneSpurs: attachment === "bone", crystalShards: attachment === "crystals",
    serrated: attachment === "serrated", spurCount: ornate ? 3 : 2,
  });
  const heavyAttachment = next.spurs || next.boneSpurs || next.serrated;

  const needsRunes = chosen("effects") === "runic" || (kept("effects") && current.runePulse);
  const finishPick = chosen("finish");
  const surfacePool = (() => {
    const fromTheme = theme.surfaces.filter((id) => paletteKit.surfaces.includes(id));
    const pool = fromTheme.length ? fromTheme : paletteKit.surfaces;
    // "vanilla" / "faithful" / "warmith" work as fallback base looks even when not themed.
    const lowDetailFallback = ["polished", "hamon", "suguha", "banded", "worn", "gilded", "vanilla", "faithful", "warmith", "bevel"];
    return small ? pool.filter((id) => lowDetailFallback.includes(id)) : pool;
  })();
  let surface: SurfaceStyle = "polished";
  let fuller = false, runeInlay = false;
  if (finishPick === "fullered") { fuller = true; surface = pick(["polished", "damascus", "hamon"].filter((id) => surfacePool.includes(id as SurfaceStyle)) as SurfaceStyle[]) ?? "polished"; }
  else if (finishPick === "runic") { runeInlay = true; surface = pick(["polished", "obsidian", "gilded", "starfield", "etched"].filter((id) => surfacePool.includes(id as SurfaceStyle)) as SurfaceStyle[]) ?? "polished"; }
  else if (finishPick) surface = finishPick as SurfaceStyle;
  else {
    surface = quiet ? pick(["polished", ...surfacePool.slice(0, 1)] as SurfaceStyle[]) : pick(surfacePool.length ? surfacePool : ["polished"]);
    if (needsRunes) { runeInlay = true; if (!["polished", "obsidian", "gilded", "starfield", "etched", "banded"].includes(surface)) surface = "polished"; }
    else if (!slim && !small && ["polished", "damascus", "hamon"].includes(surface) && rnd() < (ornate ? 0.55 : 0.3)) fuller = true;
    else if (!small && ["polished", "obsidian", "gilded", "starfield"].includes(surface) && rnd() < (ornate ? 0.35 : 0.15)) runeInlay = true;
  }
  const busy = !["polished", "hamon", "banded", "worn", "gilded", "etched"].includes(surface);
  const spinesWithEdge = ["rengoku", "dualtone", "nightflame", "luminous", "divine"];
  write("finish", {
    surface, fuller, fullerLength: 0.75, runeInlay,
    // The Rengoku-style spine→edge gradient only makes sense on surfaces without their own cross-axis pattern.
    edgeGradient: spinesWithEdge.includes(surface) ? true : (!quiet && !small && rnd() < 0.22),
    ricasso: !slim && !small && ["straight", "claymore", "zweihander", "estoc", "jian", "gladius", "rapier"].includes(silhouette) && rnd() < (ornate ? 0.4 : 0.18),
    horimono: !small && ["suguha", "gunome", "choji", "notare", "inazuma", "kinsuji"].includes(surface) && rnd() < (ornate ? 0.5 : 0.25),
    gradientBlade: !["damascus", "wood", "bone", "magma", "starfield", "ender"].includes(surface), edgeHighlight: true, bevelLine: true,
    noise: busy ? 0.06 : 0.08 + Math.round(rnd() * 8) / 100,
    shading: 0.82, outline: true, surfaceSeed: (seed ^ 0x4a2f37) >>> 0,
  });

  let effect = chosen("effects");
  if (!effect) {
    effect = quiet || small || element === "none" || heavyAttachment ? "subtle" :
      element === "lightning" && ornate ? "lightning" : next.runeInlay ? "runic" : "elemental";
  }
  const effectPreset: SwordOptions["effectPreset"] = ({
    none: "calm", flame: "infernal", frost: "glacial", void: "abyssal", holy: "celestial",
    lightning: "stormcaller", poison: "verdant", shadow: "necrotic", blood: "infernum", arcane: "stellar",
    ocean: "tidal", nature: "sylvan",
  } as Record<Element, SwordOptions["effectPreset"]>)[element];
  const energy = !["none", "subtle"].includes(effect);
  write("effects", {
    effectPreset: energy ? effectPreset : "calm", sheen: effect !== "none", sheenSpeed: 0.6,
    sheenPos: 0.3, sparkle: energy && effect !== "lightning", sparkleDensity: ornate ? 0.28 : 0.15,
    tipGlow: energy, particles: energy && !heavyAttachment && !slim && effect === "elemental",
    lightning: effect === "lightning", shatter: effect === "orbit", holographic: effect === "hologram",
    runePulse: effect === "runic", gemGlow: energy && next.gem, auraBloom: energy,
    effectSeed: (seed ^ 0x16d847) >>> 0,
  });

  const changed = GROUP_IDS.filter((id) => !groupEqual(current, next, id));
  if (changed.length) next.seed = seed >>> 0;
  const notes = [
    `${BLADE_LABELS[next.silhouette]}を基準に、変更可能なパーツだけを組み合わせました。`,
    "解像度・描画モードは維持しています。",
  ];
  if (current.detailLevel === "minecraft") notes.push("Minecraft描画に合わせて、自動の装飾とエフェクトを控えめにしています。");
  if (kept("palette")) notes.push("宝石・ルーンを含む配色をそのまま保持しました。");
  if (auto("attachments")) notes.push(slim ? "細身の刃が隠れないよう、アタッチメントを抑えました。" : "アタッチメントの主役を1種類以内にしています。");
  if (!forcedBlade && (forcedGuard || forcedGrip || forcedHeavy)) notes.push("固定・指定された鍔や柄から、相性のよい刀身を逆算しました。");
  const suffix: Record<Element, string> = { none: "Steel", flame: "Ember", frost: "Frost", void: "Void", holy: "Dawn", lightning: "Storm", poison: "Venom", shadow: "Dusk", blood: "Crimson", arcane: "Astral", nature: "Verdant", ocean: "Tide" };
  return {
    options: next, name: `${theme.name.toLowerCase()}_${suffix[next.element].toLowerCase()}_${next.silhouette}`,
    report: { seed: next.seed, theme: theme.id, changed,
      kept: GROUP_IDS.filter(kept), specified: GROUP_IDS.filter((id) => !!chosen(id)), notes, issues: analyzeDesign(next) },
  };
}

export function summarizeGroup(o: SwordOptions, id: GroupId): string {
  switch (id) {
    case "blade": return `${BLADE_LABELS[o.silhouette]} / ${o.bladeWidth} : ${o.bladeLength}`;
    case "guard": return `${GROUPS.guard.choices.find((c) => c.id === o.guardStyle)?.label} / 幅 ${o.guardWidth}`;
    case "grip": return `${GROUPS.grip.choices.find((c) => c.id === o.handleStyle)?.label} / 長さ ${o.handleLength}`;
    case "palette": return "刃・柄・アクセントの全色";
    case "element": return `${ELEMENT_LABELS[o.element]} / ${Math.round(o.elementIntensity * 100)}%`;
    case "attachments": return [o.spurs && "スパイク", o.boneSpurs && "骨", o.crystalShards && "結晶", o.serrated && "鋸刃"].filter(Boolean).join(" + ") || "装飾なし";
    case "finish": return [SURFACE_LABELS[o.surface].split(" / ")[0], o.fuller && "樋", o.runeInlay && "ルーン"].filter(Boolean).join(" + ");
    case "effects": return o.lightning ? "稲妻" : o.shatter ? "浮遊する欠片" : o.holographic ? "偏光シマー" : o.runePulse ? "ルーンの脈動" : o.particles ? "属性の輝き" : o.sheen ? "静かな光沢" : "エフェクトなし";
  }
}
