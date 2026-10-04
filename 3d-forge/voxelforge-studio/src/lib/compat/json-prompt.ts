import { KIND_INFO, PALETTES, type ConcretePalette, type DetailLevel, type GenerationSettings, type ModelKind } from "./json-catalog";

export type TagStatus = "applied" | "overridden" | "unsupported";
export interface TagFeedback { tag: string; status: TagStatus; effects: string[] }
export interface Blueprint {
  kind: ModelKind | null;
  palette: ConcretePalette;
  colors: string[];
  material: "crystal" | "diamond" | "iron" | "netherite" | "wood" | "gold" | "stone";
  color: string | null;
  length: number;
  width: number;
  thickness: number;
  scale: number;
  profile: "standard" | "katana" | "dagger" | "broad" | "spear" | "curved";
  style: "plain" | "ornate" | "ancient" | "elven" | "mechanical";
  spikes: boolean;
  glow: boolean | null;
  detail: DetailLevel;
}
export interface PromptAnalysis {
  engine: "procedural-v2";
  blueprint: Blueprint;
  tags: TagFeedback[];
  warnings: string[];
  summary: string[];
}
export class PromptError extends Error {
  constructor(message: string) { super(message); this.name = "PromptError"; }
}

/** Both chip entry and pending input use this same tokenizer; committing with Enter is not required. */
export function splitTags(value: string): string[] {
  return [...value.normalize("NFKC").matchAll(/"([^"]+)"|'([^']+)'|([^,、;\s]+)/g)]
    .map(match => { const value = (match[1] ?? match[2] ?? match[3]).trim(); return /^#[0-9a-f]{6}$/i.test(value) ? value : value.replace(/^#+/, ""); }).filter(Boolean);
}
export function normalizeTags(values: string[]): string[] { return [...new Set(values.flatMap(splitTags))]; }

type Key = keyof Omit<Blueprint, "colors" | "palette"> | "accent";
type Event = { key: Key; value: unknown; tag: number; at: number; label: string; fallback?: boolean };
const MAIN_KINDS: [ModelKind, RegExp][] = [
  ["pickaxe", /ピッケル|ツルハシ|つるはし|pickaxe|\bpick\b/giu],
  ["shovel", /シャベル|ショベル|スコップ|shovel|spade/giu],
  ["axe", /斧|アックス|\baxe\b/giu],
  ["hammer", /ハンマー|hammer|戦槌|金槌/giu],
  ["scythe", /鎌|大鎌|scythe/giu],
  ["sword", /剣|刀|ソード|sword|blade|セイバー|saber|短剣|ダガー|dagger|katana/giu],
  ["bow", /弓|ボウ|\bbow\b|アーチェリー/giu],
  ["staff", /杖|ワンド|\bstaff\b|\bwand\b/giu],
  ["trident", /トライデント|槍|trident|spear/giu],
  ["chest", /宝箱|チェスト|chest|^箱$|\bbox\b/giu],
  ["mushroom", /キノコ|きのこ|mushroom/giu],
  ["lantern", /ランタン|灯|lantern|lamp|照明/giu],
  ["house", /家|建築|house|建物|城|castle/giu],
  ["tree", /樹|^木$|\btree\b/giu],
  ["robot", /ロボット|robot|機械/giu],
];
const COLORS: [string, ConcretePalette, RegExp, string[] | undefined][] = [
  ["紫", "violet", /紫|パープル|purple|violet/giu, undefined],
  ["青", "ice", /青|ブルー|blue|氷|ice|水色/giu, undefined],
  ["緑", "mint", /緑|グリーン|green|mint|ミント/giu, undefined],
  ["金", "warm", /黄金|金色|^金$|golden|\bgold\b|橙|オレンジ|orange/giu, undefined],
  ["赤", "violet", /赤|レッド|\bred\b/giu, ["#d65b6c", "#ffd3d8", "#a8344d", "#742b40", "#e7bd77", "#72503d", "#36252d", "#fff0f1"]],
  ["白", "iron", /白|ホワイト|white|雪/giu, ["#dce0e8", "#ffffff", "#a3aec2", "#73839f", "#dabd79", "#7b6755", "#354152", "#ffffff"]],
  ["黒", "netherite", /黒|ブラック|black|闇/giu, ["#423c4e", "#9c91b2", "#2f293a", "#201b29", "#c99d5e", "#55423d", "#17131d", "#d2c3e8"]],
  ["桃", "violet", /桃|ピンク|pink/giu, ["#e994b9", "#ffe0ed", "#c06492", "#8c3f68", "#e8bd7f", "#786064", "#432c3f", "#fff1f7"]],
];
const MATERIALS: [Blueprint["material"], RegExp, ConcretePalette, string][] = [
  ["crystal", /クリスタル|結晶|crystal|アメジスト|amethyst/giu, "violet", "結晶"],
  ["diamond", /ダイヤ(?:モンド)?|diamond/giu, "diamond", "ダイヤ"],
  ["iron", /鉄|アイアン|金属|鋼|\biron\b|steel|metal/giu, "iron", "鉄"],
  ["netherite", /ネザライト|netherite|黒曜石|obsidian/giu, "netherite", "ネザライト"],
  ["wood", /木製|木の|木材|wood(?:en)?/giu, "warm", "木"],
  ["gold", /黄金|金色|^金$|golden|\bgold\b/giu, "warm", "金"],
  ["stone", /石製|石の|stone/giu, "iron", "石"],
];
const MATERIAL_LABELS: Record<Blueprint["material"], string> = { crystal: "結晶", diamond: "ダイヤ", iron: "鉄", netherite: "ネザライト", wood: "木", gold: "金", stone: "石" };
const STYLE_LABELS: Record<Blueprint["style"], string> = { plain: "装飾なし", ornate: "宝石・金の装飾", ancient: "古代の刻印", elven: "葉の装飾", mechanical: "金属リベット" };

/** Deterministic, explicit procedural interpretation. Unsupported words are NEVER given a random motif. */
export function analyzePrompt(input: string[], settings: GenerationSettings): PromptAnalysis {
  const tags = normalizeTags(input);
  const events: Event[] = [];
  const decorative = new Set<number>();
  const known = new Set<number>();
  const partial = new Map<number, string[]>();
  const event = (key: Key, value: unknown, label: string, tag: number, at = 0, fallback = false) => {
    events.push({ key, value, label, tag, at, fallback }); known.add(tag);
  };
  tags.forEach((raw, index) => {
    const text = raw.toLowerCase().replace(/[_-]/g, " ");
    const covered = new Uint8Array(text.length);
    const mark = (start: number, length: number) => { for (let i = start; i < Math.min(text.length, start + length); i++) covered[i] = 1; };
    const scan = (regex: RegExp, cb: (at: number, match: string) => void) => {
      for (const match of text.matchAll(regex)) {
        const after = text.slice((match.index ?? 0) + match[0].length);
        const before = text.slice(Math.max(0, (match.index ?? 0) - 12), match.index);
        mark(match.index ?? 0, match[0].length);
        const negation = after.match(/^(?:ではなく|じゃなく|不要|なし|しない|ない)/u);
        if (negation) { mark(match.index ?? 0, match[0].length + negation[0].length); continue; }
        const prefix = before.match(/(?:without|no)[ -]*$/u);
        if (prefix) { mark(Math.max(0, (match.index ?? 0) - prefix[0].length), prefix[0].length + match[0].length); continue; }
        cb(match.index ?? 0, match[0]);
      }
    };
    MAIN_KINDS.forEach(([kind, regex]) => scan(regex, at => event("kind", kind, `形状：${KIND_INFO[kind].label}`, index, at)));
    scan(/鉱石|gem|クリスタル|結晶|crystal/giu, at => event("kind", "crystal", "形状：クリスタル", index, at, true));
    scan(/武器|weapon/giu, at => event("kind", "sword", "形状：剣（武器の既定）", index, at, true));
    scan(/ツール|\btool\b|採掘/giu, at => event("kind", "pickaxe", "形状：ピッケル", index, at, true));
    COLORS.forEach(([label, palette, regex, colors]) => scan(regex, at => {
      if (/装飾|縁|trim|accent/iu.test(text)) { event("accent", "gold", "金の縁取り", index, at); return; }
      event("color", { label, palette, colors }, `色：${label}`, index, at);
    }));
    if (/^#[0-9a-f]{6}$/i.test(text)) {
      mark(0, text.length);
      const rgb = [1, 3, 5].map(offset => parseInt(text.slice(offset, offset + 2), 16));
      const shade = (factor: number, white = 0) => "#" + rgb.map(channel => Math.round(Math.min(255, channel * factor + 255 * white)).toString(16).padStart(2, "0")).join("");
      event("color", { label: text, palette: "violet", colors: [text, shade(.5, .5), shade(.7), shade(.45), "#dbb777", "#78543c", shade(.25), shade(.25, .75)] }, `色：${text}`, index);
    }
    scan(/金(?:の)?(?:装飾|縁)|gold(?:en)?(?:[ ]?(?:trim|accent))/giu, at => event("accent", "gold", "金の縁取り", index, at));
    MATERIALS.forEach(([material, regex, , label]) => scan(regex, at => {
      if (/装飾|縁|trim|accent/iu.test(text)) event("accent", "gold", "金の縁取り", index, at);
      else event("material", material, `素材：${label}`, index, at);
    }));
    scan(/短剣|ダガー|dagger/giu, at => event("profile", "dagger", "刃：短剣", index, at));
    scan(/刀|katana|曲刀|反り|湾曲|curved/giu, at => event("profile", "katana", "刃：反りのある片刃", index, at));
    scan(/大剣|両刃|broadsword|greatsword/giu, at => event("profile", "broad", "刃：幅広の両刃", index, at));
    scan(/槍|spear/giu, at => event("profile", "spear", "穂先：一本の槍", index, at));
    scan(/シャムシール|逆刃|scimitar/giu, at => event("profile", "curved", "刃：逆方向に反る片刃", index, at));
    scan(/長い|長め|長剣|長弓|ロング|\blong\b/giu, at => event("length", 1.25, "長さ：125%", index, at));
    scan(/短い|短め|ショート|\bshort\b/giu, at => event("length", .7, "長さ：70%", index, at));
    scan(/幅広|太い|太め|wide|broad/giu, at => event("width", 1.55, "幅：155%", index, at));
    scan(/細長い|細い|細め|スリム|slim|narrow|thin/giu, at => event("width", .65, "幅：65%", index, at));
    scan(/厚い|重厚|重い|heavy|thick/giu, at => event("thickness", 1.7, "厚み：170%", index, at));
    scan(/薄い|薄め|flat/giu, at => event("thickness", .5, "厚み：50%", index, at));
    scan(/小さい|小さな|小さめ|小型|ミニ|mini|small|little|かわいい|可愛い|cute/giu, at => event("scale", .72, "大きさ：72%", index, at));
    scan(/大きい|大きな|大型|巨大|big|large/giu, at => event("scale", 1.15, "大きさ：115%", index, at));
    scan(/ファンタジー|fantasy|宝石|宝飾|豪華|ornate/giu, at => event("style", "ornate", "宝石・金の装飾", index, at));
    scan(/魔法|magic/giu, at => { event("style", "ornate", "魔法の装飾", index, at); event("glow", true, "発光する面", index, at); });
    scan(/古代|ancient|古い|old|遺跡/giu, at => event("style", "ancient", "古代の刻印", index, at));
    scan(/エルフ|elf|elven|森|forest|自然|nature/giu, at => event("style", "elven", "葉の装飾", index, at));
    scan(/機械的|メカ|mechanical|tech/giu, at => event("style", "mechanical", "金属リベット", index, at));
    scan(/装飾なし|無装飾|シンプル|simple|plain|no[ -]?decoration/giu, at => event("style", "plain", "装飾なし", index, at));
    scan(/棘|トゲ|とげ|spike|ギザギザ|鋸刃|serrated/giu, at => event("spikes", true, "側面のトゲ", index, at));
    scan(/発光|光る|glow|emissive/giu, at => event("glow", true, "発光する面", index, at));
    for (const match of text.matchAll(/発光(?:なし|しない)|光らない|非発光|no[ -]?glow|without[ -]?glow/giu)) {
      mark(match.index ?? 0, match[0].length);
      event("glow", false, "発光なし", index, match.index);
    }
    scan(/高精細|細かい|high[ -]?detail|detailed/giu, at => event("detail", "high", "高精細ジオメトリ", index, at));
    scan(/low[ -]?poly|ローポリ/giu, at => event("detail", "low", "簡素なジオメトリ", index, at));
    scan(/ピクセルアート|pixel[ ]?art|\bpixel\b|\bart\b|ボクセル|voxel|minecraft|blockbench/giu, () => { known.add(index); decorative.add(index); });
    // Explicit numeric modifiers are capped to the legal cuboid model range.
    const numeric: [Key, RegExp, string][] = [
      ["length", /(?:長さ|length)[:=](\d+(?:\.\d+)?)/giu, "長さ"],
      ["width", /(?:幅|width)[:=](\d+(?:\.\d+)?)/giu, "幅"],
      ["thickness", /(?:厚み|depth)[:=](\d+(?:\.\d+)?)/giu, "厚み"],
      ["scale", /(?:サイズ|scale)[:=](\d+(?:\.\d+)?)/giu, "大きさ"],
    ];
    numeric.forEach(([key, regex, label]) => {
      for (const match of text.matchAll(regex)) {
        const value = Math.min(1.8, Math.max(.35, Number(match[1])));
        mark(match.index ?? 0, match[0].length);
        event(key, value, `${label}：${Math.round(value * 100)}%`, index, match.index);
      }
    });
    if (known.has(index)) {
      const leftover = text.split("").map((char, position) => covered[position] ? " " : char).join("");
      const parts = leftover.split(/\s+/).map(part => part.replace(/^(?:の|な|を|が|と|に|で)+|(?:の|な|を|が|と|に|で|っぽい|風|系)+$/gu, ""))
        .filter(part => part && !/^(?:い|ではなく|じゃなく|ではない|なし|ない|不要|付き|付|モデル|ください|of|a|an|the|with|and|for|style|no|without)$/iu.test(part));
      if (parts.length) partial.set(index, [...new Set(parts)]);
    }
  });
  events.sort((a, b) => a.tag - b.tag || a.at - b.at);
  const winners = new Map<Key, Event>();
  for (const entry of events) {
    if (entry.key === "kind" && entry.fallback && events.some(other => other.key === "kind" && !other.fallback)) continue;
    winners.set(entry.key, entry);
  }
  const get = <T,>(key: Key, fallback: T): T => (winners.get(key)?.value as T | undefined) ?? fallback;
  const material = get<Blueprint["material"]>("material", "iron");
  const chosenColor = get<{ label: string; palette: ConcretePalette; colors?: string[] } | null>("color", null);
  const materialPalette = MATERIALS.find(([m]) => m === material)?.[2] ?? "iron";
  const palette = settings.palette === "auto" ? chosenColor?.palette ?? materialPalette : settings.palette;
  const colors = settings.palette === "auto" && chosenColor?.colors ? [...chosenColor.colors] : [...PALETTES[palette]];
  if (material === "wood") { colors[5] = "#805632"; colors[6] = "#3c2c24"; }
  if (material === "stone" && !chosenColor && settings.palette === "auto") { colors[0] = "#91969d"; colors[1] = "#c7ccd2"; colors[2] = "#6a6e74"; }
  const accent = winners.get("accent"), styleEvent = winners.get("style");
  const accentLast = accent && (!styleEvent || accent.tag > styleEvent.tag || accent.tag === styleEvent.tag && accent.at > styleEvent.at);
  const style = accentLast ? "ornate" : get<Blueprint["style"]>("style", "plain");
  const blueprint: Blueprint = {
    kind: get<ModelKind | null>("kind", null), palette, colors, material, color: chosenColor?.label ?? null,
    length: get("length", 1), width: get("width", 1), thickness: get("thickness", 1), scale: get("scale", 1),
    profile: get("profile", "standard"), style, spikes: get("spikes", false), glow: get<boolean | null>("glow", null),
    detail: get("detail", settings.detail),
  };
  const warnings: string[] = [];
  const uniqueKinds = new Set(events.filter(entry => entry.key === "kind" && !entry.fallback).map(entry => entry.value));
  if (uniqueKinds.size > 1) warnings.push(`複数の形状を指定したため、最後の「${blueprint.kind ? KIND_INFO[blueprint.kind].label : ""}」を採用しました。`);
  if (settings.palette !== "auto" && chosenColor) warnings.push(`配色が固定されています。色タグを使うにはパレットを「自動」にしてください。`);
  if (blueprint.profile !== "standard" && blueprint.kind !== "sword" && blueprint.kind !== "trident") {
    warnings.push("刃の種類は剣・槍にだけ反映されます。"); blueprint.profile = "standard";
  }
  for (const [index, parts] of partial) warnings.push(`「${tags[index]}」の「${parts.join("、")}」は未対応です。認識した部分だけ反映します。`);
  const feedback: TagFeedback[] = tags.map((tag, index) => {
    const applied = [...winners.values()].filter(entry => entry.tag === index && !(entry.key === "color" && settings.palette !== "auto"));
    if (applied.length) return { tag, status: "applied", effects: [...new Set(applied.map(entry => entry.label)), ...(partial.has(index) ? [`未対応の部分：${partial.get(index)?.join("、")}`] : [])] };
    if (decorative.has(index)) return { tag, status: "applied", effects: ["キューブ・ピクセル形式"] };
    if (known.has(index)) return { tag, status: "overridden", effects: ["後のタグ、または固定設定で上書き"] };
    return { tag, status: "unsupported", effects: ["未対応。この語は形状に反映されません"] };
  });
  const unknown = feedback.filter(entry => entry.status === "unsupported");
  if (unknown.length) warnings.push(`未対応：${unknown.map(entry => entry.tag).join("、")}。未対応の語は変更しません。`);
  const summary = [
    blueprint.kind ? KIND_INFO[blueprint.kind].label : "形状が未指定", `素材：${MATERIAL_LABELS[material]}`,
    ...(blueprint.color ? [`色：${blueprint.color}`] : []),
    ...(blueprint.length !== 1 ? [`長さ ${Math.round(blueprint.length * 100)}%`] : []),
    ...(blueprint.width !== 1 ? [`幅 ${Math.round(blueprint.width * 100)}%`] : []),
    ...(blueprint.thickness !== 1 ? [`厚み ${Math.round(blueprint.thickness * 100)}%`] : []),
    ...(blueprint.scale !== 1 ? [`大きさ ${Math.round(blueprint.scale * 100)}%`] : []),
    STYLE_LABELS[style], ...(blueprint.spikes ? ["トゲあり"] : []),
    ...(blueprint.glow !== null ? [blueprint.glow ? "発光" : "発光なし"] : []),
  ];
  return { engine: "procedural-v2", blueprint, tags: feedback, warnings, summary };
}

export const PROMPT_EXAMPLES = [
  { label: "長い結晶の剣", tags: ["剣", "クリスタル", "青", "長い", "細い", "発光"] },
  { label: "古代のピッケル", tags: ["ピッケル", "ネザライト", "幅広", "古代"] },
  { label: "小さな森の弓", tags: ["弓", "木製", "緑", "小さい", "エルフ"] },
  { label: "反りのある刀", tags: ["刀", "鉄", "黒", "金の装飾", "発光なし"] },
];
