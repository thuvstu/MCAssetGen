"use client";

import { useState } from "react";
import { ARMOR_MATERIALS, ITEM_TEXTURES, newItem } from "@/lib/mod/catalog";
import { resolveEnv } from "@/lib/mod/targets";
import { Card, DiagnosticRow, Field, ListDetail, NumInput, Select, TextArea, TextInput, TextureUpload, Toggle, slug, uniqueId, type TabProps } from "./ui";
import { TexturePicker, skillOptions } from "./itemsShared";

export default function ItemsTab({ project, update, analysis }: TabProps) {
  const [sel, setSel] = useState(0);
  const idx = Math.min(sel, project.items.length - 1);
  const it = project.items[idx];
  const legacyYarn = resolveEnv(project.meta).mappings === "yarn";
  const canSkill = !it || it.kind === "simple" || !legacyYarn;
  const set = (fn: (x: typeof it) => void) => update((p) => fn(p.items[idx]));
  const diags = it ? analysis.diagnostics.filter((d) => d.file === "project" && d.message.startsWith(`[アイテム: ${it.id}]`)) : [];

  return (
    <ListDetail
      title="アイテム"
      rows={project.items.map((x) => ({ key: x.id, label: x.name, sub: `${project.meta.modId}:${x.id}`, badge: analysis.diagnostics.filter((d) => d.severity === "error" && d.message.startsWith(`[アイテム: ${x.id}]`)).length }))}
      selected={idx} onSelect={setSel}
      onAdd={() => { update((p) => { p.items.push({ ...newItem(p.meta.modId), id: uniqueId("new_item", [...p.items.map((x) => x.id), ...p.blocks.map((x) => x.id)]), name: "新しいアイテム" }); }); setSel(project.items.length); }}
      onDuplicate={() => { if (!it) return; update((p) => { const c = structuredClone(p.items[idx]); c.id = uniqueId(`${c.id}_copy`, p.items.map((x) => x.id)); p.items.splice(idx + 1, 0, c); }); setSel(idx + 1); }}
      onDelete={() => { if (!it) return; update((p) => { p.items.splice(idx, 1); }); setSel(Math.max(0, idx - 1)); }}
      empty="アイテムがありません"
    >
      {!it ? <Card><p className="text-sm text-slate-400">「＋ 追加」でアイテムを作成します。</p></Card> : (
        <div className="space-y-4 pb-8">
          <Card title="基本">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <Field label="表示名"><TextInput value={it.name} onChange={(v) => set((x) => (x.name = v))} /></Field>
              <Field label="ID"><TextInput mono value={it.id} onChange={(v) => set((x) => (x.id = slug(v)))} /></Field>
              <Field label="アイテム種別">
                <Select value={it.kind} onChange={(v) => set((x) => (x.kind = v as typeof x.kind))} options={[
                  { value: "simple", label: "一般アイテム" },
                  { value: "sword", label: "剣 (攻撃力あり)" },
                  { value: "pickaxe", label: "ツルハシ" },
                  { value: "axe", label: "斧" },
                  { value: "shovel", label: "シャベル" },
                  { value: "armor", label: "防具" },
                ]} />
              </Field>
              <Field label="レアリティ">
                <Select value={it.rarity} onChange={(v) => set((x) => (x.rarity = v as typeof x.rarity))} options={[
                  { value: "COMMON", label: "COMMON (白)" }, { value: "UNCOMMON", label: "UNCOMMON (黄)" }, { value: "RARE", label: "RARE (水色)" }, { value: "EPIC", label: "EPIC (紫)" },
                ]} />
              </Field>
              <Field label="テクスチャ(バニラ参照)" className="col-span-2"><TexturePicker list={ITEM_TEXTURES} value={it.texture} onChange={(v) => set((x) => (x.texture = v))} /></Field>
              <div className="col-span-full"><TextureUpload kind="item" value={it.customTexture} onChange={(v) => set((x) => (x.customTexture = v))} /></div>
              <Field label="持ち方モデル">
                <Select value={it.model} onChange={(v) => set((x) => (x.model = v as typeof x.model))} options={[{ value: "generated", label: "通常 (generated)" }, { value: "handheld", label: "手持ち武器/道具 (handheld)" }]} />
              </Field>
              {it.kind === "simple" && <Field label="最大スタック数"><NumInput value={it.maxCount} min={1} max={99} onChange={(v) => set((x) => (x.maxCount = v))} /></Field>}
              {it.kind === "armor" && (
                <>
                  <Field label="防具スロット">
                    <Select value={it.armorSlot} onChange={(v) => set((x) => (x.armorSlot = v as typeof x.armorSlot))} options={[
                      { value: "HELMET", label: "兜" }, { value: "CHESTPLATE", label: "チェストプレート" }, { value: "LEGGINGS", label: "レギンス" }, { value: "BOOTS", label: "ブーツ" },
                    ]} />
                  </Field>
                  <Field label="防具素材">
                    <Select value={it.armorMaterial} onChange={(v) => set((x) => (x.armorMaterial = v as typeof x.armorMaterial))} options={ARMOR_MATERIALS.map((m) => ({ value: m.key, label: `${m.label} (${m.key})` }))} />
                  </Field>
                  <Field label="耐久値 (0 = 素材に合わせる)" hint="防御力・見た目はバニラの素材に従います"><NumInput value={it.durability} min={0} onChange={(v) => set((x) => (x.durability = v))} /></Field>
                </>
              )}
              {["sword", "pickaxe", "axe", "shovel"].includes(it.kind) && (
                <>
                  <Field label="道具素材" hint="耐久値は素材に合わせて自動設定">
                    <Select value={it.material} onChange={(v) => set((x) => (x.material = v as typeof x.material))} options={["WOOD", "STONE", "IRON", "GOLD", "DIAMOND", "NETHERITE"].map((m) => ({ value: m, label: m }))} />
                  </Field>
                  <Field label="追加攻撃力" hint="ダイヤの剣=4 (基礎攻撃力1+4)"><NumInput value={it.attackDamage} min={0} max={50} step={1} onChange={(v) => set((x) => (x.attackDamage = v))} /></Field>
                  <Field label="攻撃速度補正" hint="剣の標準 = -2.4"><NumInput value={it.attackSpeed} min={-4} max={0} step={0.1} onChange={(v) => set((x) => (x.attackSpeed = v))} /></Field>
                </>
              )}
              <Field label="耐久値 (0=なし)"><NumInput value={it.durability} min={0} onChange={(v) => set((x) => (x.durability = v))} /></Field>
              <div className="flex flex-col justify-end">
                <Toggle checked={it.fireproof} onChange={(v) => set((x) => (x.fireproof = v))} label="耐火 (溶岩で燃えない)" />
                <Toggle checked={it.glint} onChange={(v) => set((x) => (x.glint = v))} label="エンチャント風の輝き" />
              </div>
              <Field label="ツールチップ (1行1文)" className="col-span-full"><TextArea rows={2} value={it.tooltip} onChange={(v) => set((x) => (x.tooltip = v))} /></Field>
            </div>
          </Card>
                    <Card title="⚡ 特殊ステータス・属性ボーナス (持つ/装備するだけで適用)">
            <p className="mb-3 text-xs text-slate-400">アイテムをメインハンドに持っている間 (武器・道具)、または防具を身に着けている間 (防具) にプレイヤーの基礎ステータスを強化します。</p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Field label="追加最大体力 (ハート1=2)" hint="例: 4.0 (ハート2個)">
                <NumInput value={it.bonusMaxHealth ?? 0} min={0} max={100} step={1} onChange={(v) => set((x) => (x.bonusMaxHealth = v))} />
              </Field>
              <Field label="追加移動速度ボーナス" hint="例: 0.05 (+10%)">
                <NumInput value={it.bonusMovementSpeed ?? 0} min={0} max={1} step={0.01} onChange={(v) => set((x) => (x.bonusMovementSpeed = v))} />
              </Field>
              <Field label="追加防御力" hint="例: 2.0 (鎧の厚み)">
                <NumInput value={it.bonusArmor ?? 0} min={0} max={30} step={1} onChange={(v) => set((x) => (x.bonusArmor = v))} />
              </Field>
              <Field label="追加タフネス" hint="例: 1.0 (頑丈さ)">
                <NumInput value={it.bonusToughness ?? 0} min={0} max={20} step={0.5} onChange={(v) => set((x) => (x.bonusToughness = v))} />
              </Field>
              <Field label="追加ノックバック耐性" hint="例: 0.1 (+10%の確率)">
                <NumInput value={it.bonusKnockbackResistance ?? 0} min={0} max={1} step={0.05} onChange={(v) => set((x) => (x.bonusKnockbackResistance = v))} />
              </Field>
            </div>
          </Card>

          {(it.kind === "armor" || ["sword", "pickaxe", "axe", "shovel"].includes(it.kind)) && (
            <Card title="⚙️ 素材 (「拡張」タブで定義)">
              <Field label="カスタム素材" hint="攻撃力・採掘速度・耐久に倍率を適用します。未選択ならバニラ素材そのまま">
                <Select value={it.materialId ?? ""} onChange={(v) => set((x) => (x.materialId = v || undefined))} options={[{ value: "", label: "(バニラ素材)" }, ...project.materials.map((m) => ({ value: m.id, label: `${m.name} (×${m.damageMultiplier}/×${m.speedMultiplier}/×${m.durabilityMultiplier})` }))]} />
              </Field>
            </Card>
          )}

          <Card title="🖱 スキル割り当て (右クリック / Shift+右クリック / 左クリック)">
            <p className="mb-3 text-xs text-slate-400">通常右クリックとShift+右クリックは<b>排他</b>です (スニーク中はShift用が発動し、未設定なら通常用にフォールバック)。左クリックはブロック/エンティティを殴った時に発動します。クールダウンはスキル側の設定が使われます。</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="右クリック"><Select value={canSkill ? it.skillId ?? "" : ""} onChange={(v) => set((x) => (x.skillId = v || null))} options={canSkill ? skillOptions(project) : [{ value: "", label: "(利用不可)" }]} /></Field>
              <Field label="Shift + 右クリック"><Select value={canSkill ? it.shiftSkillId ?? "" : ""} onChange={(v) => set((x) => (x.shiftSkillId = v || null))} options={canSkill ? skillOptions(project) : [{ value: "", label: "(利用不可)" }]} /></Field>
              <Field label="左クリック (殴る)"><Select value={it.leftClickSkillId ?? ""} onChange={(v) => set((x) => (x.leftClickSkillId = v || null))} options={skillOptions(project)} /></Field>
            </div>
            {!canSkill && <p className="mt-2 text-[11px] text-amber-300">旧プロファイルでは道具・防具に右クリックスキルを割り当てられません (左クリックは可)。</p>}
          </Card>
          <Card title="食べ物" right={<Toggle checked={!!it.food} onChange={(v) => set((x) => (x.food = v ? { nutrition: 4, saturation: 0.3 } : null))} label="食べられる" />}>
            {it.food ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="満腹度回復 (半分=1)"><NumInput value={it.food.nutrition} min={0} onChange={(v) => set((x) => (x.food!.nutrition = v))} /></Field>
                <Field label="隠し満腹度係数"><NumInput value={it.food.saturation} min={0} step={0.1} onChange={(v) => set((x) => (x.food!.saturation = v))} /></Field>
              </div>
            ) : <p className="text-xs text-slate-500">オフ</p>}
          </Card>
          {diags.length > 0 && <Card title="検証結果">{diags.map((d, i) => <DiagnosticRow key={i} d={d} />)}</Card>}
        </div>
      )}
    </ListDetail>
  );
}
