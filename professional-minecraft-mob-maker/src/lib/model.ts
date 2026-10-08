import { ARCHETYPES, getArchetype } from "@/data/archetypes";
import {
  ABILITIES,
  BEHAVIORS,
  EN_PREFIX,
  NAME_EN,
  NAME_NOUN,
  NAME_PREFIX,
  PALETTES,
  SOUND_SETS,
} from "@/data/catalog";
import type {
  ArchetypeId,
  Colors,
  MobDraft,
  PartDef,
  ResolvedPart,
  SpawnSpec,
  Vec3,
  VariantDef,
} from "@/types";

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  return s || "mob";
}

export function isValidId(id: string): boolean {
  return /^[a-z0-9_./-]+$/.test(id);
}

export function isValidModId(id: string): boolean {
  return /^[a-z][a-z0-9_]{0,31}$/.test(id);
}

const defaultSpawn = (): SpawnSpec => ({
  dimensions: ["overworld"],
  biomes: [],
  customBiomes: "",
  minLight: 0,
  maxLight: 15,
  minY: -64,
  maxY: 320,
  groupMin: 1,
  groupMax: 3,
  weight: 8,
  time: "any",
  weather: "any",
});

export function variantOf(archId: ArchetypeId, variantId?: string): VariantDef {
  const arch = getArchetype(archId);
  return arch.variants.find((v) => v.id === variantId) ?? arch.variants[0];
}

export function partEnabledFor(archId: ArchetypeId, variant: VariantDef): Record<string, boolean> {
  const arch = getArchetype(archId);
  const map: Record<string, boolean> = {};
  for (const part of arch.parts) {
    let on = part.optional ? part.defaultOn : true;
    if (variant.enable.includes(part.id)) on = true;
    if (variant.disable.includes(part.id)) on = false;
    map[part.id] = on;
  }
  return map;
}

export function isPartOn(mob: MobDraft, part: PartDef): boolean {
  const v = mob.partEnabled[part.id];
  if (v === undefined) return part.optional ? part.defaultOn : true;
  return v;
}

function copyScales(src: Record<string, Vec3>): Record<string, Vec3> {
  const out: Record<string, Vec3> = {};
  for (const key of Object.keys(src)) out[key] = [...src[key]] as Vec3;
  return out;
}

export function createMob(archId: ArchetypeId, variantId?: string, patch?: Partial<MobDraft>): MobDraft {
  const arch = getArchetype(archId);
  const variant = variantOf(archId, variantId ?? patch?.variant);
  const sounds = SOUND_SETS.find((s) => s.id === arch.soundSet) ?? SOUND_SETS[0];
  const now = Date.now();
  const base: MobDraft = {
    uid: uid(),
    createdAt: now,
    updatedAt: now,
    displayName: `新しい${arch.name}`,
    displayNameEn: `New ${arch.en}`,
    modId: "mobforge",
    entityId: `new_${arch.id}`,
    summary: "",
    archetype: arch.id,
    variant: variant.id,
    category: arch.category,
    temperament: arch.temperament,
    rarity: arch.rarity,
    colors: { ...arch.colors },
    eggBase: arch.eggBase,
    eggSpots: arch.eggSpots,
    scale: variant.scale,
    glow: arch.glow,
    translucent: arch.translucent,
    particles: arch.particles,
    partEnabled: partEnabledFor(arch.id, variant),
    partScale: copyScales(variant.partScale),
    partTint: {},
    health: arch.stats.health,
    armor: arch.stats.armor,
    armorToughness: arch.stats.armorToughness,
    attackDamage: arch.stats.attackDamage,
    attackInterval: arch.stats.attackInterval,
    attackKnockback: arch.stats.attackKnockback,
    movementSpeed: arch.stats.movementSpeed,
    flyingSpeed: arch.stats.flyingSpeed,
    followRange: arch.stats.followRange,
    knockbackResistance: arch.stats.knockbackResistance,
    xp: arch.stats.xp,
    canFly: arch.canFly,
    canSwim: arch.canSwim,
    canClimb: arch.canClimb,
    fireImmune: arch.fireImmune,
    breathesWater: arch.breathesWater,
    undead: arch.undead,
    arthropod: arch.arthropod,
    bossBar: arch.bossBar,
    tameable: arch.tameable,
    behaviors: [...arch.behaviors],
    abilities: arch.abilities.map((a) => ({ ...a })),
    spawn: { ...defaultSpawn(), ...arch.spawn, biomes: [...(arch.spawn.biomes ?? [])], dimensions: [...(arch.spawn.dimensions ?? ["overworld"])] },
    drops: [],
    sounds: { ambient: sounds.ambient, hurt: sounds.hurt, death: sounds.death, step: sounds.step },
    notes: "",
    foodItem: arch.foodItem,
  };
  return mergeMob(base, patch);
}

export function mergeMob(mob: MobDraft, patch?: Partial<MobDraft>): MobDraft {
  if (!patch) return mob;
  return {
    ...mob,
    ...patch,
    colors: patch.colors ?? mob.colors,
    spawn: patch.spawn ?? mob.spawn,
    sounds: patch.sounds ?? mob.sounds,
    partEnabled: patch.partEnabled ?? mob.partEnabled,
    partScale: patch.partScale ?? mob.partScale,
    partTint: patch.partTint ?? mob.partTint,
    updatedAt: Date.now(),
  };
}

export function applyVariant(mob: MobDraft, variantId: string): MobDraft {
  const variant = variantOf(mob.archetype, variantId);
  return mergeMob(mob, {
    variant: variant.id,
    scale: variant.scale,
    partEnabled: partEnabledFor(mob.archetype, variant),
    partScale: copyScales(variant.partScale),
  });
}

export function applyArchetype(mob: MobDraft, archId: ArchetypeId): MobDraft {
  const fresh = createMob(archId, undefined, {
    uid: mob.uid,
    createdAt: mob.createdAt,
    displayName: mob.displayName,
    displayNameEn: mob.displayNameEn,
    modId: mob.modId,
    entityId: mob.entityId,
    summary: mob.summary,
    notes: mob.notes,
    colors: mob.colors,
    eggBase: mob.eggBase,
    eggSpots: mob.eggSpots,
  });
  return fresh;
}

export function applyPalette(mob: MobDraft, paletteId: string): MobDraft {
  const pal = PALETTES.find((p) => p.id === paletteId);
  if (!pal) return mob;
  return mergeMob(mob, {
    colors: {
      primary: pal.primary,
      secondary: pal.secondary,
      accent: pal.accent,
      skin: pal.skin,
      eye: pal.eye,
      detail: pal.detail,
    },
    eggBase: pal.eggBase,
    eggSpots: pal.eggSpots,
    partTint: {},
  });
}

export function bakeScale(origin: Vec3, size: Vec3, pivot: Vec3, scale: Vec3): { origin: Vec3; size: Vec3; pivot: Vec3 } {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < 8; i++) {
    const p: Vec3 = [
      origin[0] + ((i & 1) !== 0 ? size[0] : 0),
      origin[1] + ((i & 2) !== 0 ? size[1] : 0),
      origin[2] + ((i & 4) !== 0 ? size[2] : 0),
    ];
    const s: Vec3 = [
      pivot[0] + (p[0] - pivot[0]) * scale[0],
      pivot[1] + (p[1] - pivot[1]) * scale[1],
      pivot[2] + (p[2] - pivot[2]) * scale[2],
    ];
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], s[k]);
      max[k] = Math.max(max[k], s[k]);
    }
  }
  return {
    origin: min,
    size: [Math.max(0.2, max[0] - min[0]), Math.max(0.2, max[1] - min[1]), Math.max(0.2, max[2] - min[2])],
    pivot: [...pivot],
  };
}

export function resolveParts(mob: MobDraft): ResolvedPart[] {
  const arch = getArchetype(mob.archetype);
  const out: ResolvedPart[] = [];
  for (const def of arch.parts) {
    if (!isPartOn(mob, def)) continue;
    const sc = mob.partScale[def.id] ?? [1, 1, 1];
    const baked = bakeScale(def.origin, def.size, def.pivot, sc);
    const tint = mob.partTint[def.id];
    const color = tint || mob.colors[def.slot];
    const opacity = def.opacity * (mob.translucent && def.slot !== "eye" ? 0.62 : 1);
    out.push({ def, ...baked, color, opacity });
  }
  return out;
}

function rotPoint(p: Vec3, pivot: Vec3, rotDeg: Vec3): Vec3 {
  let x = p[0] - pivot[0];
  let y = p[1] - pivot[1];
  let z = p[2] - pivot[2];
  const rx = (rotDeg[0] * Math.PI) / 180;
  const ry = (rotDeg[1] * Math.PI) / 180;
  const rz = (rotDeg[2] * Math.PI) / 180;
  let y1 = y * Math.cos(rx) - z * Math.sin(rx);
  let z1 = y * Math.sin(rx) + z * Math.cos(rx);
  y = y1;
  z = z1;
  const x2 = x * Math.cos(ry) + z * Math.sin(ry);
  const z2 = -x * Math.sin(ry) + z * Math.cos(ry);
  x = x2;
  z = z2;
  const x3 = x * Math.cos(rz) - y * Math.sin(rz);
  const y3 = x * Math.sin(rz) + y * Math.cos(rz);
  return [x3 + pivot[0], y3 + pivot[1], z + pivot[2]];
}

export function modelBounds(parts: ResolvedPart[]) {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const part of parts) {
    for (let i = 0; i < 8; i++) {
      const corner: Vec3 = [
        part.origin[0] + ((i & 1) !== 0 ? part.size[0] : 0),
        part.origin[1] + ((i & 2) !== 0 ? part.size[1] : 0),
        part.origin[2] + ((i & 4) !== 0 ? part.size[2] : 0),
      ];
      const p = rotPoint(corner, part.pivot, part.def.rotation);
      for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k], p[k]);
        max[k] = Math.max(max[k], p[k]);
      }
    }
  }
  if (!Number.isFinite(min[0])) return { min: [0, 0, 0] as Vec3, max: [8, 16, 8] as Vec3 };
  return { min, max };
}

export interface Hitbox {
  width: number;
  height: number;
  eye: number;
}

export function estimateHitbox(mob: MobDraft): Hitbox {
  const bounds = modelBounds(resolveParts(mob));
  const dx = (bounds.max[0] - bounds.min[0]) / 16;
  const dy = (bounds.max[1] - bounds.min[1]) / 16;
  const dz = (bounds.max[2] - bounds.min[2]) / 16;
  const width = Math.max(0.4, Math.round(Math.max(dx, dz) * mob.scale * 100) / 100);
  const height = Math.max(0.4, Math.round(dy * mob.scale * 100) / 100);
  const eye = Math.round(Math.min(height - 0.1, height * 0.86) * 100) / 100;
  return { width, height, eye: Math.max(0.2, eye) };
}

export function combatScore(mob: MobDraft): number {
  let s = 0;
  s += mob.health * 0.72;
  s += mob.armor * 4.2;
  s += mob.armorToughness * 2.4;
  s += mob.attackDamage * 6.5;
  s += Math.max(0, 1.4 - mob.attackInterval) * 10;
  s += mob.attackKnockback * 3;
  s += mob.movementSpeed * 36;
  s += mob.followRange * 0.35;
  s += mob.knockbackResistance * 12;
  if (mob.canFly) s += 10;
  if (mob.fireImmune) s += 6;
  if (mob.canClimb) s += 4;
  if (mob.bossBar) s += 22;
  s += mob.abilities.reduce((a, b) => a + b.power * 3.4, 0);
  return Math.round(s);
}

export function rankOf(score: number): string {
  if (score >= 230) return "SSS";
  if (score >= 175) return "SS";
  if (score >= 130) return "S";
  if (score >= 98) return "A";
  if (score >= 72) return "B";
  if (score >= 50) return "C";
  if (score >= 32) return "D";
  return "E";
}

export function rankTone(rank: string): string {
  switch (rank) {
    case "SSS":
      return "text-fuchsia-200 bg-fuchsia-400/15 ring-fuchsia-300/40";
    case "SS":
      return "text-rose-200 bg-rose-400/15 ring-rose-300/30";
    case "S":
      return "text-orange-200 bg-orange-400/15 ring-orange-300/30";
    case "A":
      return "text-gold bg-gold/15 ring-gold/40";
    case "B":
      return "text-sky bg-sky/15 ring-sky/30";
    case "C":
      return "text-emerald bg-emerald/15 ring-emerald/30";
    default:
      return "text-cream/80 bg-white/5 ring-white/10";
  }
}

export function vanillaNote(mob: MobDraft): string {
  const refs = [
    { name: "ニワトリ", hp: 4 },
    { name: "ゾンビ", hp: 20 },
    { name: "エンダーマン", hp: 40 },
    { name: "ピグリンブルート", hp: 50 },
    { name: "アイアンゴーレム", hp: 100 },
    { name: "エンダードラゴン", hp: 200 },
    { name: "ウィザー", hp: 300 },
    { name: "ウォーデン", hp: 500 },
  ];
  let best = refs[0];
  let diff = Infinity;
  for (const r of refs) {
    const d = Math.abs(r.hp - mob.health);
    if (d < diff) {
      diff = d;
      best = r;
    }
  }
  const ratio = mob.health / best.hp;
  const rel = ratio > 1.15 ? "より硬い" : ratio < 0.85 ? "より脆い" : "に近い体力";
  return `体力は${best.name}${rel}（${best.hp}）`;
}

function lum(hex: string): number {
  const n = hex.replace("#", "");
  if (n.length < 6) return 0.5;
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export interface Warning {
  level: "warn" | "info";
  text: string;
}

export function warningsOf(mob: MobDraft): Warning[] {
  const list: Warning[] = [];
  if (!isValidModId(mob.modId)) list.push({ level: "warn", text: "Mod ID は英小文字で始め、英数と _ のみにしてください。" });
  if (!isValidId(mob.entityId)) list.push({ level: "warn", text: "エンティティ ID は英小文字・数字・_ だけにしてください。" });
  if (!mob.summary.trim()) list.push({ level: "info", text: "概要が空です。設計書の顔になる一文を書いてください。" });
  if (!mob.displayNameEn.trim()) list.push({ level: "info", text: "英語名が空です。en_us が弱くなります。" });
  if (mob.spawn.groupMin > mob.spawn.groupMax) list.push({ level: "warn", text: "群れの最小が最大を超えています。" });
  if (mob.spawn.minLight > mob.spawn.maxLight) list.push({ level: "warn", text: "明るさの下限が上限を超えています。" });
  if (mob.temperament === "hostile" && mob.attackDamage <= 0 && !mob.abilities.some((a) => a.id === "explode")) {
    list.push({ level: "warn", text: "敵対なのに攻撃力がなく、自爆もありません。" });
  }
  if (mob.temperament === "passive" && mob.attackDamage >= 8) {
    list.push({ level: "info", text: "友好なのに攻撃力が高めです。中立の方が意図に近いことがあります。" });
  }
  if (mob.canFly && mob.flyingSpeed < 0.08) list.push({ level: "warn", text: "飛行フラグに対して飛行速度がほぼ 0 です。" });
  if (mob.spawn.biomes.length === 0 && !mob.spawn.customBiomes.trim() && mob.spawn.weight > 0) {
    list.push({ level: "info", text: "バイオーム未指定です。自然スポーンはコマンド召喚だけになります。" });
  }
  if (mob.bossBar && mob.health < 80) list.push({ level: "info", text: "ボスバーにしては体力が低めです。" });
  if (mob.drops.length === 0) list.push({ level: "info", text: "ドロップがありません。" });
  if (mob.category !== "monster" && mob.temperament === "hostile") {
    list.push({ level: "info", text: "敵対でも出現枠がモンスター以外だと、モンスター上限に入りません。" });
  }
  if (Math.abs(lum(mob.colors.eye) - lum(mob.colors.skin)) < 0.08) {
    list.push({ level: "info", text: "目の色が地色に近いです。プレビューで顔が読みにくくなります。" });
  }
  if (mob.abilities.some((a) => a.id === "explode" && a.power >= 4)) {
    list.push({ level: "info", text: "自爆威力が高めです。地形破壊の有無を設計ノートに書いてください。" });
  }
  if ((mob.behaviors.includes("tempt") || mob.behaviors.includes("breed") || mob.tameable) && !mob.foodItem.trim()) {
    list.push({ level: "warn", text: "餌・手懐けを使うのに餌アイテムが空です。" });
  }
  return list;
}

export function completeness(mob: MobDraft): { score: number; missing: string[] } {
  const checks: { ok: boolean; label: string }[] = [
    { ok: mob.displayName.trim().length > 0 && !mob.displayName.startsWith("新しい"), label: "名前" },
    { ok: mob.displayNameEn.trim().length > 1, label: "英語名" },
    { ok: isValidId(mob.entityId) && isValidModId(mob.modId), label: "ID" },
    { ok: mob.summary.trim().length >= 12, label: "概要" },
    { ok: mob.spawn.biomes.length > 0 || mob.spawn.customBiomes.trim().length > 0, label: "バイオーム" },
    { ok: mob.drops.length > 0, label: "ドロップ" },
    { ok: mob.behaviors.length >= 2, label: "行動" },
    { ok: mob.sounds.ambient.includes(":"), label: "音" },
    { ok: mob.notes.trim().length >= 8, label: "実装メモ" },
    { ok: mob.health > 0 && mob.movementSpeed > 0, label: "基礎ステ" },
  ];
  const missing = checks.filter((c) => !c.ok).map((c) => c.label);
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return { score, missing };
}

export function behaviorById(id: string) {
  return BEHAVIORS.find((b) => b.id === id);
}

export function abilityById(id: string) {
  return ABILITIES.find((a) => a.id === id);
}

export function abilityTuning(power: number, id: string): string {
  const amp = Math.max(0, power - 1);
  const seconds = 2 + power * 1.5;
  if (id === "explode") return `威力 ${(0.5 + power * 0.7).toFixed(1)} / 地形破壊は要検討`;
  if (id === "fire" || id === "ignite_aura") return `着火 ${power + 1} 秒`;
  if (id === "summon") return `最大 ${power} 体`;
  if (id === "beam") return `持続 ${(1 + power * 0.6).toFixed(1)} 秒 / 毎秒 ${2 + power} ダメージ目安`;
  return `効果時間 ${seconds.toFixed(1)} 秒 / 増幅 ${amp}`;
}

function shiftHex(hex: string, deg: number): string {
  const n = hex.replace("#", "");
  if (n.length < 6) return hex;
  let r = parseInt(n.slice(0, 2), 16) / 255;
  let g = parseInt(n.slice(2, 4), 16) / 255;
  let b = parseInt(n.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d > 0.001) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  h = (h + deg) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rr = 0;
  let gg = 0;
  let bb = 0;
  if (hp < 1) [rr, gg, bb] = [c, x, 0];
  else if (hp < 2) [rr, gg, bb] = [x, c, 0];
  else if (hp < 3) [rr, gg, bb] = [0, c, x];
  else if (hp < 4) [rr, gg, bb] = [0, x, c];
  else if (hp < 5) [rr, gg, bb] = [x, 0, c];
  else [rr, gg, bb] = [c, 0, x];
  const m = l - c / 2;
  const to = (v: number) => Math.round(Math.min(255, Math.max(0, (v + m) * 255))).toString(16).padStart(2, "0");
  return `#${to(rr)}${to(gg)}${to(bb)}`;
}

export function mutateColors(colors: Colors, deg: number): Colors {
  return {
    primary: shiftHex(colors.primary, deg),
    secondary: shiftHex(colors.secondary, deg * 0.8),
    accent: shiftHex(colors.accent, deg * 1.1),
    skin: shiftHex(colors.skin, deg * 0.6),
    eye: colors.eye,
    detail: shiftHex(colors.detail, deg * 0.4),
  };
}

export function randomMob(): MobDraft {
  const arch = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
  const variant = arch.variants[Math.floor(Math.random() * arch.variants.length)];
  const pal = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const jp = `${NAME_PREFIX[Math.floor(Math.random() * NAME_PREFIX.length)]}${NAME_NOUN[arch.id][Math.floor(Math.random() * NAME_NOUN[arch.id].length)]}`;
  const en = `${EN_PREFIX[Math.floor(Math.random() * EN_PREFIX.length)]} ${NAME_EN[arch.id][Math.floor(Math.random() * NAME_EN[arch.id].length)]}`;
  const mob = createMob(arch.id, variant.id, {
    displayName: jp,
    displayNameEn: en,
    entityId: slugify(en),
    summary: `${arch.tagline} ランダム生成の下書き。ステータスと出現は型の初期値です。`,
    rarity: arch.rarity,
  });
  return applyPalette(mob, pal.id);
}

export function uniqueEntityId(base: string, mobs: MobDraft[], self?: string): string {
  let id = slugify(base);
  const taken = new Set(mobs.filter((m) => m.uid !== self).map((m) => m.entityId));
  if (!taken.has(id)) return id;
  let n = 2;
  while (taken.has(`${id}_${n}`)) n += 1;
  return `${id}_${n}`;
}

export function cloneMob(mob: MobDraft, mobs: MobDraft[], mutate = false): MobDraft {
  const copy = JSON.parse(JSON.stringify(mob)) as MobDraft;
  copy.uid = uid();
  copy.createdAt = Date.now();
  copy.updatedAt = Date.now();
  copy.displayName = mutate ? `${mob.displayName}・変異` : `${mob.displayName} の写し`;
  copy.entityId = uniqueEntityId(mob.entityId + (mutate ? "_mut" : "_copy"), mobs);
  if (mutate) {
    const deg = 18 + Math.round(Math.random() * 40);
    copy.colors = mutateColors(mob.colors, deg);
    copy.eggSpots = shiftHex(mob.eggSpots, deg);
    copy.health = Math.max(1, Math.round(mob.health * (0.9 + Math.random() * 0.25)));
  }
  return copy;
}

export function pascal(id: string): string {
  const parts = id.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const name = parts.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join("") || "Custom";
  return /^[0-9]/.test(name) ? `Mob${name}` : name;
}

export function constName(id: string): string {
  return id.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+/, "").toUpperCase() || "MOB";
}

export function hexToInt(hex: string): number {
  const n = hex.replace("#", "");
  const v = parseInt(n.slice(0, 6), 16);
  return Number.isFinite(v) ? v : 0;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
