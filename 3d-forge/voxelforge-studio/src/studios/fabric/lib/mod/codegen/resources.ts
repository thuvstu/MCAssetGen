import type { ModProject } from "../model";
import { namespaced as ns, type Dialect } from "./shared";

export function recipeJson(project: ModProject, dialect: Dialect, r: ProjectRecipe) {
  const cells = r.grid.map((x) => x.trim());
  // 1.21.2 以降は材料を文字列で表す ("minecraft:stick" / "#minecraft:planks")。それ以前は {item} / {tag}
  const ing = (raw: string): any => {
    const isTag = raw.startsWith("#");
    const id = ns(project, isTag ? raw.slice(1) : raw);
    if (dialect === "mojmap") return isTag ? `#${id}` : id;
    return isTag ? { tag: id } : { item: id };
  };

  const isCooking = ["smelting", "blasting", "smoking", "campfire_cooking"].includes(r.type);
  const resultId = ns(project, r.resultItem);
  const count = Math.max(1, Math.round(r.resultCount));

  if (isCooking) {
    const ingredient = ing(r.inputItem || "");
    const xp = Number(r.cookingExperience) || 0.1;
    const time = Math.max(1, Math.round(r.cookingTimeTicks ?? 200));
    return {
      type: `minecraft:${r.type}`,
      category: "misc",
      ingredient,
      result: dialect === "mojmap" ? resultId : { item: resultId },
      experience: xp,
      cookingtime: time
    };
  }

  if (r.type === "stonecutting") {
    const ingredient = ing(r.inputItem || "");
    return {
      type: "minecraft:stonecutting",
      ingredient,
      result: resultId,
      count
    };
  }

  const result = { id: resultId, count };
  if (r.type === "shapeless") {
    return { type: "minecraft:crafting_shapeless", category: "misc", ingredients: cells.filter(Boolean).map((c) => ing(c)), result };
  }
  const rows = [0, 1, 2].map((y) => cells.slice(y * 3, y * 3 + 3));
  const usedRows = rows.map((row, y) => (row.some(Boolean) ? y : -1)).filter((y) => y >= 0);
  const usedCols = [0, 1, 2].filter((x) => rows.some((row) => row[x]));
  const keys = new Map<string, string>();
  const letters = "ABCDEFGHI";
  const pattern = usedRows.map((y) =>
    usedCols.map((x) => {
      const c = rows[y][x];
      if (!c) return " ";
      const id = c;
      if (!keys.has(id)) keys.set(id, letters[keys.size]);
      return keys.get(id)!;
    }).join(""),
  );
  const key: Record<string, any> = {};
  keys.forEach((letter, id) => (key[letter] = ing(id)));
  return { type: "minecraft:crafting_shaped", category: "misc", pattern, key, result };
}
type ProjectRecipe = ModProject["recipes"][number];

/** ブロックのルートテーブル。鉱石はドロップ/幸運/シルクタッチ/爆発減衰に対応 */
export function lootTable(project: ModProject, b: ModProject["blocks"][number]) {
  const self = `${project.meta.modId}:${b.id}`;
  const o = b.ore;
  if (!o || !o.dropItem.trim() || ns(project, o.dropItem) === self) {
    return { type: "minecraft:block", pools: [{ rolls: 1.0, bonus_rolls: 0.0, entries: [{ type: "minecraft:item", name: self }], conditions: [{ condition: "minecraft:survives_explosion" }] }] };
  }
  const lo = Math.max(0, Math.round(o.dropMin));
  const hi = Math.max(lo, Math.round(o.dropMax));
  const functions: Record<string, unknown>[] = [
    lo === hi ? { function: "minecraft:set_count", count: lo } : { function: "minecraft:set_count", count: { type: "minecraft:uniform", min: lo, max: hi } },
  ];
  if (o.fortune) functions.push({ function: "minecraft:apply_bonus", enchantment: "minecraft:fortune", formula: "minecraft:ore_drops" });
  if (o.explosionDecay) functions.push({ function: "minecraft:explosion_decay" });
  const drop = { type: "minecraft:item", name: ns(project, o.dropItem), functions };
  const silk = {
    type: "minecraft:item", name: self,
    conditions: [{ condition: "minecraft:match_tool", predicate: { predicates: { "minecraft:enchantments": [{ enchantments: "minecraft:silk_touch", levels: { min: 1 } }] } } }],
  };
  return {
    type: "minecraft:block",
    pools: [{ rolls: 1.0, bonus_rolls: 0.0, entries: [o.silkTouch ? { type: "minecraft:alternatives", children: [silk, drop] } : drop] }],
  };
}


/** 実績 (ルートタブ + 各実績)。進捗は impossible トリガーの段数 (step_1..N) で表現し、実行時に award する */
export function advancementJsons(project: ModProject): { id: string; json: unknown }[] {
  const mod = project.meta.modId;
  const list = project.advancements ?? [];
  if (list.length === 0) return [];
  const out: { id: string; json: unknown }[] = [];
  out.push({
    id: "root",
    json: {
      display: {
        icon: { count: 1, id: ns(project, list[0].icon || "minecraft:nether_star") },
        title: { text: project.meta.name }, description: { text: `${project.meta.name} の実績` },
        background: "minecraft:gui/advancements/backgrounds/stone", show_toast: false, announce_to_chat: false,
      },
      criteria: { auto: { trigger: "minecraft:tick" } },
      requirements: [["auto"]],
    },
  });
  for (const a of list) {
    const parent = a.parent ? (list.some((x) => x.id === a.parent) ? `${mod}:${a.parent}` : a.parent) : `${mod}:root`;
    let criteria: Record<string, unknown>;
    let requirements: string[][];
    if (a.kind === "OBTAIN_ITEM") {
      criteria = { obtain: { trigger: "minecraft:inventory_changed", conditions: { items: [{ items: ns(project, a.item) }] } } };
      requirements = [["obtain"]];
    } else {
      const n = Math.max(1, Math.round(a.steps));
      criteria = Object.fromEntries(Array.from({ length: n }, (_, k) => [`step_${k + 1}`, { trigger: "minecraft:impossible" }]));
      requirements = Array.from({ length: n }, (_, k) => [`step_${k + 1}`]);
    }
    out.push({
      id: a.id,
      json: {
        parent,
        display: {
          icon: { count: 1, id: ns(project, a.icon) },
          title: { text: a.name }, description: { text: a.description },
          frame: a.frame, show_toast: true, announce_to_chat: true, hidden: a.hidden,
        },
        criteria, requirements,
        ...(a.rewardXp > 0 ? { rewards: { experience: Math.round(a.rewardXp) } } : {}),
      },
    });
  }
  return out;
}
