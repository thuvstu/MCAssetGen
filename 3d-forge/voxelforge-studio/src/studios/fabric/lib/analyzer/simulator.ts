import { schemaOf } from "../mod/catalog";
import type { Action, SkillDef } from "../mod/model";

// ================= skill simulator =================
export interface SimEvent { tick: number; text: string; icon: string; depth: number }
export interface SimResult {
  events: SimEvent[];
  totalDamage: number;
  totalHeal: number;
  endTick: number;
  dps: number;
}

const AREA_ESTIMATE = 3;
export function simulateSkill(s: SkillDef, all: SkillDef[] = []): SimResult {
  const events: SimEvent[] = [];
  const vars = new Map<string, number>();
  let depthGuard = 0;
  let dmg = 0;
  let heal = 0;
  let end = 0;
  const run = (list: Action[], base: number, depth: number) => {
    for (const a of list) {
      const sc = schemaOf(a.type);
      const p = a.params;
      const mult = p.target === "AREA" ? AREA_ESTIMATE : 1;
      if (a.type === "delay") {
        events.push({ tick: base, text: sc!.describe(p), icon: sc!.icon, depth });
        run(a.children ?? [], base + Number(p.ticks), depth + 1);
        continue;
      }
      if (a.type === "missile") {
        const travel = Math.min(Number(p.lifetime), 12);
        events.push({ tick: base, text: sc!.describe(p), icon: sc!.icon, depth });
        const hit = all.find((x) => x.id === p.onHitSkill);
        if (hit && depthGuard < 4) {
          depthGuard++;
          events.push({ tick: base + travel, text: `着弾 (約${travel}tick後) → スキル「${hit.name}」`, icon: "💥", depth: depth + 1 });
          run(hit.actions, base + travel, depth + 2);
          depthGuard--;
        }
        end = Math.max(end, base + travel);
        continue;
      }
      if (a.type === "chance") {
        events.push({ tick: base, text: `${sc!.describe(p)} (期待値として ${Number(p.percent)}% 換算)`, icon: sc!.icon, depth });
        run(a.children ?? [], base, depth + 1);
        continue;
      }
      if (a.type === "setVar" || a.type === "addVar") {
        const key = `${p.scope}:${p.name}`;
        const cur = vars.get(key) ?? 0;
        const next = a.type === "setVar" ? Number(p.value) : Math.min(Number(p.max), Math.max(Number(p.min), cur + Number(p.amount)));
        vars.set(key, next);
        events.push({ tick: base, text: `${sc!.describe(p)} → ${key} = ${next}`, icon: sc!.icon, depth });
        continue;
      }
      if (a.type === "ifVar") {
        const v = vars.get(`${p.scope}:${p.name}`) ?? 0;
        const pass = v >= Number(p.min) && v <= Number(p.max);
        events.push({ tick: base, text: `${sc!.describe(p)} → 現在 ${v}: ${pass ? "実行される" : "スキップ"}`, icon: sc!.icon, depth });
        if (pass) run(a.children ?? [], base, depth + 1);
        continue;
      }
      if (a.type === "repeat") {
        events.push({ tick: base, text: sc!.describe(p), icon: sc!.icon, depth });
        for (let k = 0; k < Number(p.times); k++) run(a.children ?? [], base + k * Number(p.interval), depth + 1);
        continue;
      }
      if (a.type === "damage") dmg += Number(p.amount) * mult;
      if (a.type === "heal") heal += Number(p.amount) * mult;
      end = Math.max(end, base);
      events.push({ tick: base, text: (sc?.describe(p) ?? a.type) + (p.target === "AREA" ? ` (想定${AREA_ESTIMATE}体)` : ""), icon: sc?.icon ?? "?", depth });
    }
  };
  run(s.actions, 0, 0);
  events.sort((a, b) => a.tick - b.tick);
  const cycle = Math.max(1, s.cooldown, end / 20);
  return { events, totalDamage: dmg, totalHeal: heal, endTick: end, dps: dmg / cycle };
}
