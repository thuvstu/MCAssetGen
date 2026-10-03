import { findMechanic } from "./catalog";
import { newMob } from "./defaults";
import { parseLine, serializeConditions, serializeLine } from "./skillText";
import type { ConditionRef, ModMob, ModProject, Skill, SkillLine, TriggerBinding } from "./types";
import { uid } from "./types";

// ---------------------------------------------------------------- tiny YAML subset parser
type Y = string | Y[] | { [k: string]: Y };

function unquote(s: string): string {
  const t = s.trim();
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
    return t.slice(1, -1).replace(/''/g, "'");
  }
  return t;
}

export function parseYamlSubset(text: string): { data: Record<string, Y>; errors: string[] } {
  const errors: string[] = [];
  const lines = text.replace(/\t/g, "  ").split("\n");
  const root: Record<string, Y> = {};
  const stack: { indent: number; obj: Record<string, Y> | Y[]; key?: string }[] = [{ indent: -1, obj: root }];
  lines.forEach((raw, idx) => {
    const noComment = raw.replace(/(^|\s)#.*$/, "");
    if (!noComment.trim()) return;
    const indent = noComment.length - noComment.trimStart().length;
    const line = noComment.trim();
    while (stack.length > 1) {
      const t = stack[stack.length - 1];
      const isDash = line.startsWith("-");
      if (Array.isArray(t.obj)) {
        if (isDash ? indent > Math.floor(t.indent) : indent > Math.ceil(t.indent)) break;
      } else if (indent > t.indent) break;
      stack.pop();
    }
    const top = stack[stack.length - 1];
    if (line.startsWith("- ") || line === "-") {
      const val = unquote(line.slice(1));
      if (!Array.isArray(top.obj)) {
        errors.push(`行 ${idx + 1}: リストの親キーが見つかりません`);
        return;
      }
      top.obj.push(val);
      return;
    }
    const m = /^([^:]+):(.*)$/.exec(line);
    if (!m) {
      errors.push(`行 ${idx + 1}: 解析できません: ${line}`);
      return;
    }
    if (Array.isArray(top.obj)) {
      errors.push(`行 ${idx + 1}: リスト内のマップは未対応です`);
      return;
    }
    const key = unquote(m[1]);
    const rest = m[2].trim();
    if (rest) {
      top.obj[key] = unquote(rest);
    } else {
      // determine child type by peeking next non-empty line
      let next = "";
      let nextIndent = 0;
      for (let j = idx + 1; j < lines.length; j++) {
        const l = lines[j].replace(/(^|\s)#.*$/, "");
        if (l.trim()) {
          next = l.trim();
          nextIndent = l.length - l.trimStart().length;
          break;
        }
      }
      const child: Record<string, Y> | Y[] = next.startsWith("-") ? [] : {};
      top.obj[key] = child as Y;
      stack.push({ indent: next.startsWith("-") && nextIndent === indent ? indent - 0.5 : indent, obj: child, key });
    }
  });
  return { data: root, errors };
}

// ---------------------------------------------------------------- export
const amp = (s: string) => s.replace(/§/g, "&");
const sect = (s: string) => s.replace(/&([0-9a-fk-or])/gi, "§$1");
const yq = (s: string) => `'${s.replace(/'/g, "''")}'`;

export function exportSkillsYaml(p: ModProject): string {
  return p.skills
    .map((s) => {
      const out = [`${s.name}:`];
      if (s.cooldown > 0) out.push(`  Cooldown: ${s.cooldown}`);
      if (s.conditions.length) {
        out.push("  Conditions:");
        for (const c of s.conditions) out.push(`  - ${serializeConditions([c]).replace(/^\?/, "")}`);
      }
      out.push("  Skills:");
      for (const l of s.lines) out.push(`  ${serializeLine(l)}`);
      return out.join("\n");
    })
    .join("\n\n") + "\n";
}

const SLOT_OUT: Record<string, string> = { mainhand: "HAND", offhand: "OFFHAND", head: "HEAD", chest: "CHEST", legs: "LEGS", feet: "FEET" };

export function exportMobsYaml(p: ModProject): string {
  return p.mobs
    .map((m) => {
      const out = [`${m.name}:`, `  Type: ${m.baseType.replace(/^minecraft:/, "").toUpperCase()}`];
      if (m.displayName) out.push(`  Display: ${yq(amp(m.displayName))}`);
      out.push(`  Health: ${m.health}`, `  Damage: ${m.damage}`);
      if (m.armor) out.push(`  Armor: ${m.armor}`);
      out.push("  Options:");
      out.push(`    AlwaysShowName: ${m.showName}`, `    Despawn: ${!m.persistent}`, `    Glowing: ${m.glowing}`, `    Silent: ${m.silent}`);
      if (m.knockbackResistance) out.push(`    KnockbackResistance: ${m.knockbackResistance}`);
      if (m.speedMultiplier !== 1) out.push(`    # MovementSpeed multiplier: ${m.speedMultiplier}`);
      const eq = Object.entries(m.equipment).filter(([, v]) => v.trim());
      if (eq.length) {
        out.push("  Equipment:");
        for (const [k, v] of eq) out.push(`  - ${v.replace(/^minecraft:/, "")} ${SLOT_OUT[k]}`);
      }
      if (m.drops.length || m.xp) {
        out.push("  Drops:");
        if (m.xp) out.push(`  - exp ${m.xp}`);
        for (const d of m.drops) out.push(`  - ${d.item.replace(/^minecraft:/, "")} ${d.min === d.max ? d.min : `${d.min}-${d.max}`} ${d.chance}`);
      }
      if (m.triggers.length || m.effects.length) {
        out.push("  Skills:");
        for (const e of m.effects) out.push(`  - potion{type=${e.type};duration=999999;level=${e.level};particles=false} @Self ~onSpawn`);
        for (const t of m.triggers) out.push(`  - skill{s=${t.skill}} ~${t.trigger}${t.trigger === "onTimer" ? `:${t.interval ?? 40}` : ""}`);
      }
      return out.join("\n");
    })
    .join("\n\n") + "\n";
}

// ---------------------------------------------------------------- import
function list(v: Y | undefined): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === "string" && v) return [v];
  return [];
}
function map(v: Y | undefined): Record<string, Y> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, Y>) : {};
}
function get(o: Record<string, Y>, key: string): Y | undefined {
  const k = Object.keys(o).find((x) => x.toLowerCase() === key.toLowerCase());
  return k ? o[k] : undefined;
}
const nsId = (s: string) => {
  const t = s.trim().toLowerCase();
  return t.includes(":") ? t : `minecraft:${t}`;
};

function parseSkillLines(lines: string[], where: string, msgs: string[]): { line: SkillLine; trigger?: string; interval?: number }[] {
  const out: { line: SkillLine; trigger?: string; interval?: number }[] = [];
  for (const raw of lines) {
    let s = raw;
    let trigger: string | undefined;
    let interval: number | undefined;
    s = s.replace(/\s~(on[A-Za-z]+)(?::(\d+))?/g, (_m, t: string, n?: string) => {
      trigger = t;
      if (n) interval = parseInt(n, 10);
      return "";
    });
    // MythicMobs health modifier / chance suffix like "0.5" or "<50%" at end -> ignore with notice
    s = s.replace(/\s+(<|>|=)?\d+(\.\d+)?%?\s*$/, (m) => {
      msgs.push(`${where}: 末尾の修飾子 "${m.trim()}" は無視しました`);
      return "";
    });
    const r = parseLine(s, 0);
    r.errors.forEach((e) => msgs.push(`${where}: ${e.message}`));
    if (r.line && findMechanic(r.line.mechanic)) out.push({ line: r.line, trigger, interval });
  }
  return out;
}

function parseConds(lines: string[], where: string, msgs: string[]): ConditionRef[] {
  const out: ConditionRef[] = [];
  for (const raw of lines) {
    const t = raw.trim().replace(/\s+(true|false)$/i, (m) => (m.trim().toLowerCase() === "false" ? " NEG" : ""));
    const neg = t.endsWith(" NEG");
    const r = parseLine(`kotlin ?${neg ? "!" : ""}${t.replace(/ NEG$/, "")}`, 0);
    r.errors.forEach((e) => msgs.push(`${where}: ${e.message}`));
    if (r.line) out.push(...r.line.conditions);
  }
  return out;
}

export interface ImportResult {
  skills: Skill[];
  mobs: ModMob[];
  messages: string[];
}

export function importMythicYaml(text: string): ImportResult {
  const { data, errors } = parseYamlSubset(text);
  const messages = [...errors];
  const skills: Skill[] = [];
  const mobs: ModMob[] = [];
  for (const [name, val] of Object.entries(data)) {
    const o = map(val);
    const safe = name.replace(/[^A-Za-z0-9_]/g, "_");
    if (get(o, "Type")) {
      const mob = newMob(safe);
      mob.baseType = nsId(String(get(o, "Type")));
      const disp = get(o, "Display");
      mob.displayName = disp ? sect(String(disp)) : "";
      const num = (k: string, d: number) => {
        const v = get(o, k);
        const n = v === undefined ? NaN : parseFloat(String(v));
        return Number.isFinite(n) ? n : d;
      };
      mob.health = num("Health", 20);
      mob.damage = num("Damage", 3);
      mob.armor = num("Armor", 0);
      const opt = map(get(o, "Options"));
      const ob = (k: string, d: boolean) => {
        const v = get(opt, k);
        return v === undefined ? d : String(v).toLowerCase() === "true";
      };
      mob.showName = ob("AlwaysShowName", !!mob.displayName);
      mob.persistent = !ob("Despawn", true) || ob("PreventDespawn", false);
      mob.glowing = ob("Glowing", false);
      mob.silent = ob("Silent", false);
      const kb = get(opt, "KnockbackResistance");
      if (kb !== undefined) mob.knockbackResistance = parseFloat(String(kb)) || 0;
      if (get(opt, "MovementSpeed") !== undefined) messages.push(`${name}: MovementSpeed は絶対値のため変換していません（倍率で再設定してください）`);
      for (const e of list(get(o, "Equipment"))) {
        const [item, slotRaw = "HAND"] = e.trim().split(/\s+/);
        const slot = ({ HAND: "mainhand", MAINHAND: "mainhand", OFFHAND: "offhand", HEAD: "head", CHEST: "chest", LEGS: "legs", FEET: "feet" } as Record<string, keyof ModMob["equipment"]>)[slotRaw.toUpperCase()];
        if (slot) mob.equipment[slot] = nsId(item.split(":").length > 2 ? item : item);
        else messages.push(`${name}: 不明な装備スロット ${slotRaw}`);
      }
      mob.xp = 0;
      for (const d of list(get(o, "Drops"))) {
        const [item, amt = "1", ch = "1"] = d.trim().split(/\s+/);
        if (item.toLowerCase() === "exp" || item.toLowerCase() === "experience") {
          mob.xp = parseInt(amt, 10) || 0;
          continue;
        }
        const [mn, mx] = amt.includes("-") ? amt.split("-").map((x) => parseInt(x, 10)) : [parseInt(amt, 10), parseInt(amt, 10)];
        mob.drops.push({ id: uid(), item: nsId(item), min: mn || 1, max: mx || mn || 1, chance: parseFloat(ch) || 1 });
      }
      const parsed = parseSkillLines(list(get(o, "Skills")), name, messages);
      let n = 0;
      const triggers: TriggerBinding[] = [];
      for (const pl of parsed) {
        const trig = pl.trigger ?? "onAttack";
        if (!pl.trigger) messages.push(`${name}: トリガー無しの行は ~onAttack として扱いました`);
        if (pl.line.mechanic === "skill" && pl.line.targeter === "Self" && pl.line.conditions.length === 0) {
          triggers.push({ id: uid(), trigger: trig, skill: String(pl.line.params.s ?? ""), interval: pl.interval ?? 40 });
        } else {
          n++;
          const skillName = `${safe}_${trig}_${n}`;
          skills.push({ id: uid(), name: skillName, description: `${name} からインポート`, cooldown: 0, conditions: [], imports: "", lines: [pl.line] });
          triggers.push({ id: uid(), trigger: trig, skill: skillName, interval: pl.interval ?? 40 });
        }
      }
      mob.triggers = triggers;
      mobs.push(mob);
    } else if (get(o, "Skills")) {
      const cd = parseFloat(String(get(o, "Cooldown") ?? "0"));
      const lines = parseSkillLines(list(get(o, "Skills")), name, messages);
      lines.forEach((l) => l.trigger && messages.push(`${name}: スキル内のトリガー ~${l.trigger} は無視しました`));
      skills.push({
        id: uid(),
        name: safe,
        description: "MythicMobs からインポート",
        cooldown: Number.isFinite(cd) ? cd : 0,
        conditions: parseConds(list(get(o, "Conditions")), name, messages),
        imports: "",
        lines: lines.map((l) => l.line),
      });
    } else {
      messages.push(`${name}: Type も Skills も無いため無視しました`);
    }
  }
  return { skills, mobs, messages };
}
