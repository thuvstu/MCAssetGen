"use client";

import { useState } from "react";
import { CUSTOM_MOB_TRIGGERS, STATUS_EFFECTS } from "@/studios/mythiccraft/lib/mod/catalog";
import { newMob, newRecipe } from "@/studios/mythiccraft/lib/mod/defaults";
import { shapedFromGrid } from "@/studios/mythiccraft/lib/mod/mobgen";
import type { ModMob, ModProject, ModRecipe, RecipeType } from "@/studios/mythiccraft/lib/mod/types";
import { uid } from "@/studios/mythiccraft/lib/mod/types";
import { TriggerList } from "./ElementEditors";
import { Field, ListPane, NumInput, SectionHeader, Select, TextInput, Toggle } from "./ui";

type Mutate = (fn: (d: ModProject) => void) => void;

const BASES = [
  "minecraft:zombie", "minecraft:husk", "minecraft:drowned", "minecraft:skeleton", "minecraft:stray", "minecraft:wither_skeleton",
  "minecraft:spider", "minecraft:cave_spider", "minecraft:creeper", "minecraft:enderman", "minecraft:blaze", "minecraft:witch",
  "minecraft:pillager", "minecraft:vindicator", "minecraft:evoker", "minecraft:piglin_brute", "minecraft:iron_golem",
  "minecraft:ravager", "minecraft:slime", "minecraft:magma_cube", "minecraft:wolf", "minecraft:villager", "minecraft:warden",
];
export const COMMON_ITEMS = [
  "minecraft:diamond", "minecraft:iron_ingot", "minecraft:gold_ingot", "minecraft:netherite_ingot", "minecraft:emerald", "minecraft:stick",
  "minecraft:blaze_rod", "minecraft:blaze_powder", "minecraft:ender_pearl", "minecraft:nether_star", "minecraft:bone", "minecraft:string",
  "minecraft:redstone", "minecraft:lapis_lazuli", "minecraft:amethyst_shard", "minecraft:glowstone_dust", "minecraft:gunpowder",
  "minecraft:stone", "minecraft:cobblestone", "minecraft:oak_planks", "minecraft:obsidian", "minecraft:leather", "minecraft:feather",
  "minecraft:rotten_flesh", "minecraft:apple", "minecraft:golden_apple", "minecraft:iron_sword", "minecraft:diamond_sword",
  "minecraft:netherite_sword", "minecraft:bow", "minecraft:crossbow", "minecraft:shield", "minecraft:trident",
  "minecraft:iron_helmet", "minecraft:iron_chestplate", "minecraft:iron_leggings", "minecraft:iron_boots",
  "minecraft:diamond_helmet", "minecraft:diamond_chestplate", "minecraft:diamond_leggings", "minecraft:diamond_boots",
  "minecraft:golden_helmet", "minecraft:carved_pumpkin", "minecraft:player_head", "#minecraft:planks", "#minecraft:logs",
];

export function ItemDatalist({ project }: { project: ModProject }) {
  return (
    <datalist id="items-dl">
      {[...project.items.map((i) => `${project.meta.modId}:${i.registryName}`), ...project.blocks.map((b) => `${project.meta.modId}:${b.registryName}`), ...COMMON_ITEMS].map((i) => (
        <option key={i} value={i} />
      ))}
    </datalist>
  );
}

function ItemInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input className="input mono" list="items-dl" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

// ------------------------------------------------------------ Mobs
export function MobsEditor({ project, mutate }: { project: ModProject; mutate: Mutate }) {
  const [sel, setSel] = useState<string | null>(project.mobs[0]?.id ?? null);
  const mob = project.mobs.find((x) => x.id === sel);
  const skills = project.skills.map((s) => s.name);
  const upd = (fn: (m: ModMob) => void) => mutate((d) => fn(d.mobs.find((x) => x.id === sel)!));

  return (
    <div>
      <SectionHeader
        title="カスタムモブ"
        desc={`MythicMobs と同じ方式: バニラのモブをベースに名前・ステータス・装備・ドロップ・スキルを付与。/${project.meta.modId} spawn <名前> または summonmob メカニックで召喚。`}
      />
      <datalist id="bases-dl">
        {BASES.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
      <ItemDatalist project={project} />
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <ListPane
          items={project.mobs}
          selected={sel}
          onSelect={setSel}
          addLabel="モブ追加"
          onAdd={() => {
            let n = 1;
            while (project.mobs.some((x) => x.name === `Mob${n}`)) n++;
            const x = newMob(`Mob${n}`);
            mutate((d) => d.mobs.push(x));
            setSel(x.id);
          }}
          render={(x) => (
            <div>
              <div className="mono font-medium">{x.name}</div>
              <div className="truncate text-[11px] text-zinc-500">
                {x.baseType.replace("minecraft:", "")} · HP {x.health}
              </div>
            </div>
          )}
        />
        {mob ? (
          <div className="space-y-4">
            <div className="card grid gap-4 p-4 md:grid-cols-3">
              <Field label="内部名">
                <TextInput mono value={mob.name} onChange={(v) => {
                  const old = mob.name;
                  mutate((d) => {
                    d.mobs.find((x) => x.id === sel)!.name = v;
                    d.skills.forEach((s) => s.lines.forEach((l) => {
                      if (l.mechanic === "summonmob" && l.params.mob === old) l.params.mob = v;
                      l.conditions.forEach((c) => { if (c.type === "mythicMob" && c.params.id === old) c.params.id = v; });
                    }));
                  });
                }} />
              </Field>
              <Field label="表示名" hint="§ カラーコード可 (§c赤 §6金 §l太字)">
                <TextInput value={mob.displayName} onChange={(v) => upd((m) => (m.displayName = v))} />
              </Field>
              <Field label="ベースエンティティ">
                <input className="input mono" list="bases-dl" value={mob.baseType} onChange={(e) => upd((m) => (m.baseType = e.target.value))} />
              </Field>
              <Field label="最大HP">
                <NumInput value={mob.health} min={1} onChange={(v) => upd((m) => (m.health = v))} />
              </Field>
              <Field label="攻撃力">
                <NumInput value={mob.damage} step={0.5} min={0} onChange={(v) => upd((m) => (m.damage = v))} />
              </Field>
              <Field label="移動速度倍率">
                <NumInput value={mob.speedMultiplier} step={0.1} min={0.1} onChange={(v) => upd((m) => (m.speedMultiplier = v))} />
              </Field>
              <Field label="防御力">
                <NumInput value={mob.armor} min={0} max={30} onChange={(v) => upd((m) => (m.armor = v))} />
              </Field>
              <Field label="ノックバック耐性 (0-1)">
                <NumInput value={mob.knockbackResistance} step={0.1} min={0} max={1} onChange={(v) => upd((m) => (m.knockbackResistance = v))} />
              </Field>
              <Field label="経験値">
                <NumInput value={mob.xp} min={0} onChange={(v) => upd((m) => (m.xp = Math.trunc(v)))} />
              </Field>
              <div className="flex flex-wrap gap-5 md:col-span-3">
                <Toggle value={mob.showName} onChange={(v) => upd((m) => (m.showName = v))} label="名前を常時表示" />
                <Toggle value={mob.glowing} onChange={(v) => upd((m) => (m.glowing = v))} label="発光" />
                <Toggle value={mob.persistent} onChange={(v) => upd((m) => (m.persistent = v))} label="デスポーンしない" />
                <Toggle value={mob.silent} onChange={(v) => upd((m) => (m.silent = v))} label="無音" />
              </div>
            </div>

            <div className="card p-4">
              <div className="mb-3 font-semibold">装備</div>
              <div className="grid gap-3 md:grid-cols-3">
                {(["mainhand", "offhand", "head", "chest", "legs", "feet"] as const).map((slot) => (
                  <Field key={slot} label={{ mainhand: "メインハンド", offhand: "オフハンド", head: "頭", chest: "胴", legs: "脚", feet: "足" }[slot]}>
                    <ItemInput value={mob.equipment[slot]} placeholder="(なし)" onChange={(v) => upd((m) => (m.equipment[slot] = v))} />
                  </Field>
                ))}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-semibold">永続ポーション効果</span>
                  <button className="btn !py-0.5 text-xs" onClick={() => upd((m) => m.effects.push({ id: uid(), type: "SPEED", level: 0 }))}>
                    + 効果
                  </button>
                </div>
                {mob.effects.map((ef, i) => (
                  <div key={ef.id} className="mb-2 grid grid-cols-[1fr_90px_auto] items-end gap-2">
                    <Select value={ef.type} onChange={(v) => upd((m) => (m.effects[i].type = v))} options={STATUS_EFFECTS.map((s) => ({ value: s, label: s }))} />
                    <NumInput value={ef.level} min={0} onChange={(v) => upd((m) => (m.effects[i].level = Math.trunc(v)))} />
                    <button className="btn-danger" onClick={() => upd((m) => m.effects.splice(i, 1))}>✕</button>
                  </div>
                ))}
                {mob.effects.length === 0 && <div className="text-xs text-zinc-500">なし</div>}
              </div>
              <div className="card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-semibold">ドロップ</span>
                  <button className="btn !py-0.5 text-xs" onClick={() => upd((m) => m.drops.push({ id: uid(), item: "minecraft:diamond", min: 1, max: 1, chance: 0.5 }))}>
                    + ドロップ
                  </button>
                </div>
                {mob.drops.map((dr, i) => (
                  <div key={dr.id} className="mb-2 grid grid-cols-[1fr_60px_60px_70px_auto] items-end gap-2">
                    <Field label="アイテム"><ItemInput value={dr.item} onChange={(v) => upd((m) => (m.drops[i].item = v))} /></Field>
                    <Field label="最小"><NumInput value={dr.min} min={1} onChange={(v) => upd((m) => (m.drops[i].min = Math.trunc(v)))} /></Field>
                    <Field label="最大"><NumInput value={dr.max} min={1} onChange={(v) => upd((m) => (m.drops[i].max = Math.trunc(v)))} /></Field>
                    <Field label="確率"><NumInput value={dr.chance} step={0.05} min={0} max={1} onChange={(v) => upd((m) => (m.drops[i].chance = v))} /></Field>
                    <button className="btn-danger mb-1" onClick={() => upd((m) => m.drops.splice(i, 1))}>✕</button>
                  </div>
                ))}
                {mob.drops.length === 0 && <div className="text-xs text-zinc-500">なし（バニラのドロップのみ）</div>}
              </div>
            </div>

            <div className="card grid gap-4 p-4 md:grid-cols-[auto_200px]">
              <div>
                <Toggle value={mob.naturalSpawn} onChange={(v) => upd((m) => (m.naturalSpawn = v))} label="自然スポーン（ベースのモブが湧いた時に一定確率で置き換え）" />
                <div className="mt-1 text-[11px] text-zinc-500">ServerEntityEvents.ENTITY_LOAD で判定。各エンティティにつき1度だけ抽選されます。</div>
              </div>
              {mob.naturalSpawn && (
                <Field label="置換確率 (0-1)">
                  <NumInput value={mob.spawnChance} step={0.01} min={0} max={1} onChange={(v) => upd((m) => (m.spawnChance = v))} />
                </Field>
              )}
            </div>

            <TriggerList triggers={mob.triggers} defs={CUSTOM_MOB_TRIGGERS} skills={skills} onChange={(t) => upd((m) => (m.triggers = t))} />

            <div className="mono rounded-md bg-black/40 p-2 text-[11px] text-zinc-400">
              召喚: /{project.meta.modId} spawn {mob.name} ・ スキル内: - summonmob{"{"}mob={mob.name}{"}"} @Forward{"{"}d=3{"}"} ・ 条件: ?mythicMob{"{"}id={mob.name}{"}"}
            </div>
            <button className="btn-danger" onClick={() => { mutate((d) => (d.mobs = d.mobs.filter((x) => x.id !== mob.id))); setSel(null); }}>
              このモブを削除
            </button>
          </div>
        ) : (
          <div className="card p-10 text-center text-zinc-500">カスタムモブを選択または追加してください</div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Recipes
const RTYPES: { value: RecipeType; label: string }[] = [
  { value: "shaped", label: "作業台（定形）" },
  { value: "shapeless", label: "作業台（不定形）" },
  { value: "smelting", label: "かまど" },
  { value: "blasting", label: "溶鉱炉" },
  { value: "smoking", label: "燻製器" },
  { value: "campfire_cooking", label: "焚き火" },
  { value: "stonecutting", label: "石切台" },
];

function short(id: string) {
  return id.replace(/^#?[a-z0-9_.-]+:/, (m) => (m.startsWith("#") ? "#" : "")).replace(/_/g, " ");
}

export function RecipesEditor({ project, mutate }: { project: ModProject; mutate: Mutate }) {
  const [sel, setSel] = useState<string | null>(project.recipes[0]?.id ?? null);
  const r = project.recipes.find((x) => x.id === sel);
  const upd = (fn: (r: ModRecipe) => void) => mutate((d) => fn(d.recipes.find((x) => x.id === sel)!));
  const isGrid = r && (r.type === "shaped" || r.type === "shapeless");
  const preview = r && r.type === "shaped" ? shapedFromGrid(r.grid) : null;
  return (
    <div>
      <SectionHeader title="レシピ" desc="作業台・かまど系・石切台のレシピ JSON (data/<modid>/recipe/*.json) を生成。タグは #minecraft:planks のように指定。" />
      <ItemDatalist project={project} />
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <ListPane
          items={project.recipes}
          selected={sel}
          onSelect={setSel}
          addLabel="レシピ追加"
          onAdd={() => {
            let n = 1;
            while (project.recipes.some((x) => x.name === `recipe_${n}`)) n++;
            const first = project.items[0] ? `${project.meta.modId}:${project.items[0].registryName}` : "minecraft:diamond";
            const x = newRecipe(`recipe_${n}`, first);
            mutate((d) => d.recipes.push(x));
            setSel(x.id);
          }}
          render={(x) => (
            <div>
              <div className="mono font-medium">{x.name}</div>
              <div className="truncate text-[11px] text-zinc-500">{RTYPES.find((t) => t.value === x.type)?.label} → {short(x.result)}</div>
            </div>
          )}
        />
        {r ? (
          <div className="space-y-4">
            <div className="card grid gap-4 p-4 md:grid-cols-3">
              <Field label="レシピ名 (ファイル名)">
                <TextInput mono value={r.name} onChange={(v) => upd((x) => (x.name = v))} />
              </Field>
              <Field label="種類">
                <Select value={r.type} onChange={(v) => upd((x) => (x.type = v))} options={RTYPES} />
              </Field>
              <div />
            </div>
            <div className="card flex flex-wrap items-center gap-6 p-5">
              {isGrid ? (
                <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-zinc-800 p-2">
                  {r.grid.map((g, i) => (
                    <div key={i} className="w-40">
                      <input
                        className={`input mono !px-1.5 text-[11px] ${g ? "border-emerald-700" : ""}`}
                        list="items-dl"
                        value={g}
                        placeholder="—"
                        onChange={(e) => upd((x) => (x.grid[i] = e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Field label="材料" className="w-72">
                  <ItemInput value={r.input} onChange={(v) => upd((x) => (x.input = v))} />
                </Field>
              )}
              <div className="text-3xl text-zinc-500">→</div>
              <div className="space-y-2">
                <Field label="完成品" className="w-72">
                  <ItemInput value={r.result} onChange={(v) => upd((x) => (x.result = v))} />
                </Field>
                {(isGrid || r.type === "stonecutting") && (
                  <Field label="個数" className="w-24">
                    <NumInput value={r.count} min={1} max={99} onChange={(v) => upd((x) => (x.count = Math.trunc(v)))} />
                  </Field>
                )}
                {!isGrid && r.type !== "stonecutting" && (
                  <div className="flex gap-2">
                    <Field label="経験値" className="w-28">
                      <NumInput value={r.experience} step={0.1} min={0} onChange={(v) => upd((x) => (x.experience = v))} />
                    </Field>
                    <Field label="時間(tick)" className="w-28">
                      <NumInput value={r.cookingTime} min={1} onChange={(v) => upd((x) => (x.cookingTime = Math.trunc(v)))} />
                    </Field>
                  </div>
                )}
              </div>
            </div>
            {preview && preview.pattern.length > 0 && (
              <div className="card mono p-3 text-xs text-zinc-400">
                pattern: {JSON.stringify(preview.pattern)} · key: {Object.entries(preview.key).map(([k, v]) => `${k}=${v}`).join(", ")}
              </div>
            )}
            <button className="btn-danger" onClick={() => { mutate((d) => (d.recipes = d.recipes.filter((x) => x.id !== r.id))); setSel(null); }}>
              このレシピを削除
            </button>
          </div>
        ) : (
          <div className="card p-10 text-center text-zinc-500">レシピを選択または追加してください</div>
        )}
      </div>
    </div>
  );
}
