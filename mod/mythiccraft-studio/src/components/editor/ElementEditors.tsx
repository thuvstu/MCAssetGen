"use client";

import { useState } from "react";
import { BLOCK_TRIGGERS, GLOBAL_TRIGGERS, ITEM_TRIGGERS, MOB_TRIGGERS, type TriggerDef } from "@/lib/mod/catalog";
import { newBlock, newItem } from "@/lib/mod/defaults";
import type { ItemKind, ModBlock, ModItem, ModMeta, ModProject, ToolMaterial, TriggerBinding } from "@/lib/mod/types";
import { uid } from "@/lib/mod/types";
import { Field, ListPane, NumInput, SectionHeader, Select, TextInput, Toggle } from "./ui";

type Mutate = (fn: (d: ModProject) => void) => void;

export function TextureField({ texture, onChange, hint }: { texture?: string; onChange: (dataUrl: string | undefined) => void; hint?: string }) {
  return (
    <Field label="テクスチャ" hint={hint ?? "TexCraft等で作ったPNG。未設定なら仮生成"}>
      <div className="flex items-center gap-2">
        {texture ? (
          <img src={texture} alt="texture" className="h-12 w-12 rounded border border-zinc-700" style={{ imageRendering: "pixelated" }} />
        ) : (
          <span className="text-xs text-zinc-500">未設定</span>
        )}
        <label className="btn cursor-pointer">
          選択
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : undefined);
              reader.readAsDataURL(file);
            }}
          />
        </label>
        {texture && <button className="btn" onClick={() => onChange(undefined)}>クリア</button>}
      </div>
    </Field>
  );
}

export function TriggerList({ triggers, defs, skills, onChange }: { triggers: TriggerBinding[]; defs: TriggerDef[]; skills: string[]; onChange: (t: TriggerBinding[]) => void }) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-semibold">トリガー → スキル</div>
          <div className="text-xs text-zinc-500">MythicMobs の ~onX に相当。同じトリガーに複数スキルを登録できます。</div>
        </div>
        <button className="btn-primary" onClick={() => onChange([...triggers, { id: uid(), trigger: defs[0].id, skill: skills[0] ?? "", interval: 20 }])}>
          + トリガー
        </button>
      </div>
      <div className="space-y-2">
        {triggers.map((t, i) => {
          const def = defs.find((d) => d.id === t.trigger);
          const set = (patch: Partial<TriggerBinding>) => {
            const n = [...triggers];
            n[i] = { ...t, ...patch };
            onChange(n);
          };
          return (
            <div key={t.id} className="grid items-end gap-2 rounded-md border border-zinc-800 bg-black/20 p-2 md:grid-cols-[1fr_1fr_110px_auto]">
              <Field label="トリガー" hint={def?.description}>
                <Select value={t.trigger} onChange={(v) => set({ trigger: v })} options={defs.map((d) => ({ value: d.id, label: d.label }))} />
              </Field>
              <Field label="スキル">
                <Select value={t.skill} onChange={(v) => set({ skill: v })} options={skills.map((s) => ({ value: s, label: s }))} />
              </Field>
              <Field label="間隔(tick)">
                {def?.needsInterval ? <NumInput value={t.interval ?? 20} min={1} onChange={(v) => set({ interval: Math.trunc(v) })} /> : <div className="py-1.5 text-xs text-zinc-600">—</div>}
              </Field>
              <button className="btn-danger mb-1" onClick={() => onChange(triggers.filter((x) => x.id !== t.id))}>
                削除
              </button>
            </div>
          );
        })}
        {triggers.length === 0 && <div className="text-center text-xs text-zinc-500">トリガーなし（見た目/素材のみのアイテム）</div>}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Meta
export function MetaEditor({ project, mutate }: { project: ModProject; mutate: Mutate }) {
  const m = project.meta;
  const set = (patch: Partial<ModMeta>) => mutate((d) => Object.assign(d.meta, patch));
  const t = (k: keyof ModMeta, label: string, hint?: string, mono = true) => (
    <Field label={label} hint={hint}>
      <TextInput mono={mono} value={String(m[k])} onChange={(v) => set({ [k]: v } as Partial<ModMeta>)} />
    </Field>
  );
  return (
    <div>
      <SectionHeader title="Mod 設定" desc="fabric.mod.json / gradle.properties に反映されます" />
      <div className="card grid gap-4 p-5 md:grid-cols-2">
        {t("name", "Mod 名", undefined, false)}
        {t("modId", "Mod ID", "小文字英数字と _ （例: arcane_magic）")}
        {t("packageName", "パッケージ", "例: com.example.arcanemagic")}
        {t("mainClass", "メインクラス名", "PascalCase（ModInitializer を実装する object）")}
        {t("version", "バージョン")}
        {t("authors", "作者（カンマ区切り）", undefined, false)}
        <Field label="説明" className="md:col-span-2">
          <textarea className="input min-h-[70px]" value={m.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>
      </div>
      <h3 className="mb-2 mt-6 font-semibold">ツールチェーン / 依存バージョン</h3>
      <div className="card grid gap-4 p-5 md:grid-cols-3">
        {t("minecraftVersion", "Minecraft")}
        {t("yarnMappings", "Yarn Mappings")}
        {t("loaderVersion", "Fabric Loader")}
        {t("fabricVersion", "Fabric API")}
        {t("fabricKotlinVersion", "Fabric Language Kotlin")}
        {t("kotlinVersion", "Kotlin")}
        {t("loomVersion", "Fabric Loom")}
        {t("gradleVersion", "Gradle")}
      </div>
      <p className="mt-2 text-xs text-zinc-500">既定値は Fabric Maven で確認済みの 1.21.1 対応版（Fabric API 0.116.17+1.21.1 / Kotlin 2.1.21 / Loom 1.11）。</p>
    </div>
  );
}

// ------------------------------------------------------------ Items
const KINDS: { value: ItemKind; label: string }[] = [
  { value: "basic", label: "基本アイテム" },
  { value: "food", label: "食料" },
  { value: "sword", label: "剣" },
  { value: "pickaxe", label: "ツルハシ" },
  { value: "axe", label: "斧" },
  { value: "shovel", label: "シャベル" },
  { value: "hoe", label: "クワ" },
  { value: "helmet", label: "ヘルメット" },
  { value: "chestplate", label: "チェストプレート" },
  { value: "leggings", label: "レギンス" },
  { value: "boots", label: "ブーツ" },
];
const ARMOR_MATS = ["LEATHER", "CHAIN", "IRON", "GOLD", "DIAMOND", "NETHERITE", "TURTLE"] as const;
const isArmorKind = (k: string) => ["helmet", "chestplate", "leggings", "boots"].includes(k);
const MATERIALS: ToolMaterial[] = ["WOOD", "STONE", "IRON", "GOLD", "DIAMOND", "NETHERITE"];

export function ItemsEditor({ project, mutate }: { project: ModProject; mutate: Mutate }) {
  const [sel, setSel] = useState<string | null>(project.items[0]?.id ?? null);
  const it = project.items.find((x) => x.id === sel);
  const skills = project.skills.map((s) => s.name);
  const set = (patch: Partial<ModItem>) => mutate((d) => Object.assign(d.items.find((x) => x.id === sel)!, patch));
  return (
    <div>
      <SectionHeader title="アイテム" desc="基本アイテム・食料・ツール/武器。右クリックや攻撃でスキルを発動できます。" />
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <ListPane
          items={project.items}
          selected={sel}
          onSelect={setSel}
          addLabel="アイテム追加"
          onAdd={() => {
            let n = 1;
            while (project.items.some((x) => x.registryName === `item_${n}`)) n++;
            const x = newItem(`item_${n}`);
            mutate((d) => d.items.push(x));
            setSel(x.id);
          }}
          render={(x) => (
            <div>
              <div className="font-medium">{x.displayName}</div>
              <div className="mono text-[11px] text-zinc-500">{x.registryName} · {KINDS.find((k) => k.value === x.kind)?.label}</div>
            </div>
          )}
        />
        {it ? (
          <div className="space-y-4">
            <div className="card grid gap-4 p-4 md:grid-cols-3">
              <Field label="表示名">
                <TextInput value={it.displayName} onChange={(v) => set({ displayName: v })} />
              </Field>
              <Field label="登録名 (ID)" hint={`${project.meta.modId}:${it.registryName}`}>
                <TextInput mono value={it.registryName} onChange={(v) => set({ registryName: v })} />
              </Field>
              <TextureField texture={it.texture} onChange={(v) => set({ texture: v })} />
              <Field label="種類">
                <Select value={it.kind} onChange={(v) => set({ kind: v })} options={KINDS} />
              </Field>
              {(it.kind === "basic" || it.kind === "food") && (
                <Field label="最大スタック数">
                  <NumInput value={it.maxCount} min={1} max={99} onChange={(v) => set({ maxCount: Math.trunc(v) })} />
                </Field>
              )}
              <Field label="レアリティ">
                <Select value={it.rarity} onChange={(v) => set({ rarity: v })} options={["COMMON", "UNCOMMON", "RARE", "EPIC"].map((r) => ({ value: r as ModItem["rarity"], label: r }))} />
              </Field>
              <Field label="使用後クールダウン (tick)" hint="~onUse 時に適用 (20tick = 1秒)">
                <NumInput value={it.useCooldown} min={0} onChange={(v) => set({ useCooldown: Math.trunc(v) })} />
              </Field>
              {isArmorKind(it.kind) && (
                <Field label="防具素材 (ArmorMaterials)" hint="防御力・耐久値・着用時の見た目はバニラ素材に準拠">
                  <Select value={it.armorMaterial ?? "IRON"} onChange={(v) => set({ armorMaterial: v })} options={ARMOR_MATS.map((m) => ({ value: m, label: m }))} />
                </Field>
              )}
              {it.kind !== "basic" && it.kind !== "food" && !isArmorKind(it.kind) && (
                <>
                  <Field label="素材 (ToolMaterials)">
                    <Select value={it.material} onChange={(v) => set({ material: v })} options={MATERIALS.map((m) => ({ value: m, label: m }))} />
                  </Field>
                  <Field label="追加攻撃力">
                    <NumInput value={it.attackDamage} step={0.5} onChange={(v) => set({ attackDamage: v })} />
                  </Field>
                  <Field label="攻撃速度 (基準4.0からの差)">
                    <NumInput value={it.attackSpeed} step={0.1} onChange={(v) => set({ attackSpeed: v })} />
                  </Field>
                </>
              )}
              {it.kind === "food" && (
                <>
                  <Field label="満腹度回復">
                    <NumInput value={it.nutrition} min={0} onChange={(v) => set({ nutrition: Math.trunc(v) })} />
                  </Field>
                  <Field label="隠し満腹度倍率">
                    <NumInput value={it.saturation} step={0.1} onChange={(v) => set({ saturation: v })} />
                  </Field>
                  <div className="flex items-end pb-2">
                    <Toggle value={it.alwaysEdible} onChange={(v) => set({ alwaysEdible: v })} label="満腹でも食べられる" />
                  </div>
                </>
              )}
              <div className="flex flex-wrap items-center gap-6 md:col-span-3">
                <Toggle value={it.glint} onChange={(v) => set({ glint: v })} label="エンチャントの輝き" />
                <Toggle value={it.fireproof} onChange={(v) => set({ fireproof: v })} label="耐火 (溶岩で燃えない)" />
              </div>
              <Field label="ツールチップ（改行で複数行）" className="md:col-span-3">
                <textarea className="input min-h-[60px]" value={it.tooltip} onChange={(e) => set({ tooltip: e.target.value })} />
              </Field>
            </div>
            <TriggerList triggers={it.triggers} defs={ITEM_TRIGGERS} skills={skills} onChange={(t) => set({ triggers: t })} />
            <button
              className="btn-danger"
              onClick={() => {
                mutate((d) => (d.items = d.items.filter((x) => x.id !== it.id)));
                setSel(null);
              }}
            >
              このアイテムを削除
            </button>
          </div>
        ) : (
          <div className="card p-10 text-center text-zinc-500">アイテムを選択または追加してください</div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Blocks
const SOUNDS = ["STONE", "WOOD", "GRAVEL", "GRASS", "METAL", "GLASS", "WOOL", "SAND", "AMETHYST_BLOCK", "DEEPSLATE", "NETHERITE", "COPPER", "SLIME"];

export function BlocksEditor({ project, mutate }: { project: ModProject; mutate: Mutate }) {
  const [sel, setSel] = useState<string | null>(project.blocks[0]?.id ?? null);
  const b = project.blocks.find((x) => x.id === sel);
  const skills = project.skills.map((s) => s.name);
  const set = (patch: Partial<ModBlock>) => mutate((d) => Object.assign(d.blocks.find((x) => x.id === sel)!, patch));
  return (
    <div>
      <SectionHeader title="ブロック" desc="立方体ブロック（BlockItem・ルートテーブル・採掘タグ自動生成）" />
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <ListPane
          items={project.blocks}
          selected={sel}
          onSelect={setSel}
          addLabel="ブロック追加"
          onAdd={() => {
            let n = 1;
            while (project.blocks.some((x) => x.registryName === `block_${n}`)) n++;
            const x = newBlock(`block_${n}`);
            mutate((d) => d.blocks.push(x));
            setSel(x.id);
          }}
          render={(x) => (
            <div>
              <div className="font-medium">{x.displayName}</div>
              <div className="mono text-[11px] text-zinc-500">{x.registryName}</div>
            </div>
          )}
        />
        {b ? (
          <div className="space-y-4">
            <div className="card grid gap-4 p-4 md:grid-cols-3">
              <Field label="表示名">
                <TextInput value={b.displayName} onChange={(v) => set({ displayName: v })} />
              </Field>
              <Field label="登録名 (ID)" hint={`${project.meta.modId}:${b.registryName}`}>
                <TextInput mono value={b.registryName} onChange={(v) => set({ registryName: v })} />
              </Field>
              <TextureField texture={b.texture} onChange={(v) => set({ texture: v })} />
              <Field label="サウンド">
                <Select value={b.sound} onChange={(v) => set({ sound: v })} options={SOUNDS.map((s) => ({ value: s, label: s }))} />
              </Field>
              <Field label="硬度" hint="石=1.5, 黒曜石=50, -1=破壊不可">
                <NumInput value={b.hardness} step={0.5} onChange={(v) => set({ hardness: v })} />
              </Field>
              <Field label="爆発耐性">
                <NumInput value={b.resistance} step={0.5} onChange={(v) => set({ resistance: v })} />
              </Field>
              <Field label="明るさ (0-15)">
                <NumInput value={b.luminance} min={0} max={15} onChange={(v) => set({ luminance: Math.trunc(v) })} />
              </Field>
              <Field label="適正ツール">
                <Select value={b.tool} onChange={(v) => set({ tool: v })} options={(["none", "pickaxe", "axe", "shovel", "hoe"] as const).map((s) => ({ value: s, label: s }))} />
              </Field>
              <Field label="必要ツールレベル">
                <Select value={b.toolLevel} onChange={(v) => set({ toolLevel: v })} options={(["any", "stone", "iron", "diamond"] as const).map((s) => ({ value: s, label: s }))} />
              </Field>
              <div className="flex flex-col justify-end gap-2 pb-1">
                <Toggle value={b.requiresTool} onChange={(v) => set({ requiresTool: v })} label="適正ツール必須" />
                <Toggle value={b.dropsSelf} onChange={(v) => set({ dropsSelf: v })} label="自身をドロップ" />
              </div>
            </div>
            <div className="card grid gap-4 p-4 md:grid-cols-3">
              <div className="font-semibold md:col-span-3">鉱石設定</div>
              <Field label="ドロップアイテム (空=自身)" hint="指定すると幸運で増加・シルクタッチで自身をドロップ">
                <TextInput mono value={b.dropItem ?? ""} placeholder="例: minecraft:diamond" onChange={(v) => set({ dropItem: v })} />
              </Field>
              <Field label="ドロップ最小">
                <NumInput value={b.dropMin ?? 1} min={1} onChange={(v) => set({ dropMin: Math.trunc(v) })} />
              </Field>
              <Field label="ドロップ最大">
                <NumInput value={b.dropMax ?? 1} min={1} onChange={(v) => set({ dropMax: Math.trunc(v) })} />
              </Field>
              <div className="md:col-span-3">
                <Toggle
                  value={!!b.oreGen?.enabled}
                  onChange={(v) => set({ oreGen: { dimension: "overworld", veinSize: 8, veinsPerChunk: 6, minY: -64, maxY: 48, ...(b.oreGen ?? {}), enabled: v } })}
                  label="ワールドに自然生成する（新しいチャンクのみ）"
                />
              </div>
              {b.oreGen?.enabled && (
                <>
                  <Field label="ディメンション">
                    <Select value={b.oreGen.dimension} onChange={(v) => set({ oreGen: { ...b.oreGen!, dimension: v } })} options={[{ value: "overworld", label: "オーバーワールド(石/深層岩)" }, { value: "nether", label: "ネザー" }, { value: "end", label: "エンド" }]} />
                  </Field>
                  <Field label="鉱脈サイズ (1-64)">
                    <NumInput value={b.oreGen.veinSize} min={1} max={64} onChange={(v) => set({ oreGen: { ...b.oreGen!, veinSize: Math.trunc(v) } })} />
                  </Field>
                  <Field label="チャンク当たりの鉱脈数">
                    <NumInput value={b.oreGen.veinsPerChunk} min={1} onChange={(v) => set({ oreGen: { ...b.oreGen!, veinsPerChunk: Math.trunc(v) } })} />
                  </Field>
                  <Field label="最小Y">
                    <NumInput value={b.oreGen.minY} onChange={(v) => set({ oreGen: { ...b.oreGen!, minY: Math.trunc(v) } })} />
                  </Field>
                  <Field label="最大Y" hint="分布は台形（中央が最多）">
                    <NumInput value={b.oreGen.maxY} onChange={(v) => set({ oreGen: { ...b.oreGen!, maxY: Math.trunc(v) } })} />
                  </Field>
                </>
              )}
            </div>
            <TriggerList triggers={b.triggers} defs={BLOCK_TRIGGERS} skills={skills} onChange={(t) => set({ triggers: t })} />
            <button
              className="btn-danger"
              onClick={() => {
                mutate((d) => (d.blocks = d.blocks.filter((x) => x.id !== b.id)));
                setSel(null);
              }}
            >
              このブロックを削除
            </button>
          </div>
        ) : (
          <div className="card p-10 text-center text-zinc-500">ブロックを選択または追加してください</div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Mob skills / events / commands
const MOBS = ["minecraft:zombie", "minecraft:skeleton", "minecraft:creeper", "minecraft:spider", "minecraft:enderman", "minecraft:witch", "minecraft:blaze", "minecraft:wither_skeleton", "minecraft:pillager", "minecraft:husk", "minecraft:drowned", "minecraft:iron_golem", "minecraft:warden", "minecraft:cow", "minecraft:pig"];

export function MobSkillsEditor({ project, mutate }: { project: ModProject; mutate: Mutate }) {
  const skills = project.skills.map((s) => s.name);
  return (
    <div>
      <SectionHeader
        title="モブスキル"
        desc="バニラ/他Modのモブにスキルを付与（MythicMobs の Mob Skills 相当）。エンティティIDで指定します。"
        actions={
          <button className="btn-primary" onClick={() => mutate((d) => d.mobSkills.push({ id: uid(), entityType: "minecraft:zombie", trigger: "onAttack", skill: skills[0] ?? "", interval: 40 }))}>
            + モブスキル
          </button>
        }
      />
      <datalist id="mobs">
        {MOBS.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
      <div className="space-y-2">
        {project.mobSkills.map((m, i) => (
          <div key={m.id} className="card grid items-end gap-3 p-3 md:grid-cols-[1.2fr_1fr_1fr_110px_auto]">
            <Field label="エンティティID">
              <input className="input mono" list="mobs" value={m.entityType} onChange={(e) => mutate((d) => (d.mobSkills[i].entityType = e.target.value))} />
            </Field>
            <Field label="トリガー" hint={MOB_TRIGGERS.find((t) => t.id === m.trigger)?.description}>
              <Select value={m.trigger} onChange={(v) => mutate((d) => (d.mobSkills[i].trigger = v))} options={MOB_TRIGGERS.map((t) => ({ value: t.id, label: t.label }))} />
            </Field>
            <Field label="スキル">
              <Select value={m.skill} onChange={(v) => mutate((d) => (d.mobSkills[i].skill = v))} options={skills.map((s) => ({ value: s, label: s }))} />
            </Field>
            <Field label="間隔(tick)">
              {m.trigger === "onTimer" ? <NumInput value={m.interval} min={1} onChange={(v) => mutate((d) => (d.mobSkills[i].interval = Math.trunc(v)))} /> : <div className="py-1.5 text-xs text-zinc-600">—</div>}
            </Field>
            <button className="btn-danger mb-1" onClick={() => mutate((d) => d.mobSkills.splice(i, 1))}>
              削除
            </button>
          </div>
        ))}
        {project.mobSkills.length === 0 && <div className="card p-6 text-center text-sm text-zinc-500">なし</div>}
      </div>
    </div>
  );
}

export function EventsEditor({ project, mutate }: { project: ModProject; mutate: Mutate }) {
  const skills = project.skills.map((s) => s.name);
  return (
    <div>
      <SectionHeader
        title="グローバルイベント"
        desc="プレイヤーのログイン・キル・被ダメージ・定期タイマーなどでスキルを発動"
        actions={
          <button className="btn-primary" onClick={() => mutate((d) => d.events.push({ id: uid(), trigger: "onJoin", skill: skills[0] ?? "", interval: 20 }))}>
            + イベント
          </button>
        }
      />
      <div className="space-y-2">
        {project.events.map((ev, i) => (
          <div key={ev.id} className="card grid items-end gap-3 p-3 md:grid-cols-[1fr_1fr_110px_auto]">
            <Field label="トリガー" hint={GLOBAL_TRIGGERS.find((t) => t.id === ev.trigger)?.description}>
              <Select value={ev.trigger} onChange={(v) => mutate((d) => (d.events[i].trigger = v))} options={GLOBAL_TRIGGERS.map((t) => ({ value: t.id, label: t.label }))} />
            </Field>
            <Field label="スキル">
              <Select value={ev.skill} onChange={(v) => mutate((d) => (d.events[i].skill = v))} options={skills.map((s) => ({ value: s, label: s }))} />
            </Field>
            <Field label="間隔(tick)">
              {ev.trigger === "onTimer" ? <NumInput value={ev.interval} min={1} onChange={(v) => mutate((d) => (d.events[i].interval = Math.trunc(v)))} /> : <div className="py-1.5 text-xs text-zinc-600">—</div>}
            </Field>
            <button className="btn-danger mb-1" onClick={() => mutate((d) => d.events.splice(i, 1))}>
              削除
            </button>
          </div>
        ))}
        {project.events.length === 0 && <div className="card p-6 text-center text-sm text-zinc-500">なし</div>}
      </div>
    </div>
  );
}

export function CommandsEditor({ project, mutate }: { project: ModProject; mutate: Mutate }) {
  const skills = project.skills.map((s) => s.name);
  return (
    <div>
      <SectionHeader
        title="コマンド"
        desc={`/コマンド でスキルを実行（ターゲット = 視線先のエンティティ）。デバッグ用に /${project.meta.modId} cast <skill> も自動生成されます。`}
        actions={
          <button className="btn-primary" onClick={() => mutate((d) => d.commands.push({ id: uid(), name: "myskill", skill: skills[0] ?? "", permissionLevel: 0 }))}>
            + コマンド
          </button>
        }
      />
      <div className="space-y-2">
        {project.commands.map((c, i) => (
          <div key={c.id} className="card grid items-end gap-3 p-3 md:grid-cols-[1fr_1fr_140px_auto]">
            <Field label="コマンド名 (/なし)">
              <TextInput mono value={c.name} onChange={(v) => mutate((d) => (d.commands[i].name = v))} />
            </Field>
            <Field label="スキル">
              <Select value={c.skill} onChange={(v) => mutate((d) => (d.commands[i].skill = v))} options={skills.map((s) => ({ value: s, label: s }))} />
            </Field>
            <Field label="権限レベル (0=全員)">
              <NumInput value={c.permissionLevel} min={0} max={4} onChange={(v) => mutate((d) => (d.commands[i].permissionLevel = Math.trunc(v)))} />
            </Field>
            <button className="btn-danger mb-1" onClick={() => mutate((d) => d.commands.splice(i, 1))}>
              削除
            </button>
          </div>
        ))}
        {project.commands.length === 0 && <div className="card p-6 text-center text-sm text-zinc-500">なし</div>}
      </div>
    </div>
  );
}
