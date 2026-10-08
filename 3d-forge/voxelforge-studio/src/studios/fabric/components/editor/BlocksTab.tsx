"use client";

import { useState } from "react";
import { BLOCK_SOUNDS, BLOCK_TEXTURES, newBlock, newOre } from "@/studios/fabric/lib/mod/catalog";
import { Card, DiagnosticRow, Field, ListDetail, NumInput, Select, TextInput, TextureUpload, Toggle, slug, uniqueId, type TabProps } from "./ui";
import { TexturePicker, skillOptions } from "./itemsShared";

export default function BlocksTab({ project, update, analysis }: TabProps) {
  const [sel, setSel] = useState(0);
  const idx = Math.min(sel, project.blocks.length - 1);
  const b = project.blocks[idx];
  const set = (fn: (x: typeof b) => void) => update((p) => fn(p.blocks[idx]));
  const diags = b ? analysis.diagnostics.filter((d) => d.file === "project" && d.message.startsWith(`[ブロック: ${b.id}]`)) : [];

  return (
    <ListDetail
      title="ブロック"
      rows={project.blocks.map((x) => ({ key: x.id, label: x.name, sub: `${project.meta.modId}:${x.id}`, badge: analysis.diagnostics.filter((d) => d.severity === "error" && d.message.startsWith(`[ブロック: ${x.id}]`)).length }))}
      selected={idx} onSelect={setSel}
      onAdd={() => { update((p) => { p.blocks.push({ ...newBlock(), id: uniqueId("new_block", [...p.items.map((x) => x.id), ...p.blocks.map((x) => x.id)]), name: "新しいブロック" }); }); setSel(project.blocks.length); }}
      onDuplicate={() => { if (!b) return; update((p) => { const c = structuredClone(p.blocks[idx]); c.id = uniqueId(`${c.id}_copy`, p.blocks.map((x) => x.id)); p.blocks.splice(idx + 1, 0, c); }); setSel(idx + 1); }}
      onDelete={() => { if (!b) return; update((p) => { p.blocks.splice(idx, 1); }); setSel(Math.max(0, idx - 1)); }}
      empty="ブロックがありません"
    >
      {!b ? <Card><p className="text-sm text-slate-400">「＋ 追加」でブロックを作成します。</p></Card> : (
        <div className="space-y-4 pb-8">
          <Card title="基本">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <Field label="表示名"><TextInput value={b.name} onChange={(v) => set((x) => (x.name = v))} /></Field>
              <Field label="ID"><TextInput mono value={b.id} onChange={(v) => set((x) => (x.id = slug(v)))} /></Field>
              <Field label="サウンド"><Select value={b.sound} onChange={(v) => set((x) => (x.sound = v))} options={BLOCK_SOUNDS.map((s) => ({ value: s, label: s }))} /></Field>
              <Field label="テクスチャ(全面・バニラ参照)" className="col-span-full"><TexturePicker list={BLOCK_TEXTURES} value={b.texture} onChange={(v) => set((x) => (x.texture = v))} /></Field>
              <div className="col-span-full"><TextureUpload kind="block" value={b.customTexture} onChange={(v) => set((x) => (x.customTexture = v))} /></div>
              <Field label="硬さ"><NumInput value={b.hardness} min={0} step={0.5} onChange={(v) => set((x) => (x.hardness = v))} /></Field>
              <Field label="爆発耐性"><NumInput value={b.resistance} min={0} step={0.5} onChange={(v) => set((x) => (x.resistance = v))} /></Field>
              <Field label="発光レベル (0-15)"><NumInput value={b.luminance} min={0} max={15} onChange={(v) => set((x) => (x.luminance = v))} /></Field>
            </div>
          </Card>
          <Card title="採掘設定">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <Field label="適正ツール">
                <Select value={b.tool} onChange={(v) => set((x) => (x.tool = v as typeof x.tool))} options={[
                  { value: "none", label: "なし" }, { value: "pickaxe", label: "ピッケル" }, { value: "axe", label: "斧" }, { value: "shovel", label: "シャベル" }, { value: "hoe", label: "クワ" },
                ]} />
              </Field>
              <Field label="必要ツールティア">
                <Select value={b.toolTier} onChange={(v) => set((x) => (x.toolTier = v as typeof x.toolTier))} options={[
                  { value: "none", label: "なし" }, { value: "stone", label: "石以上" }, { value: "iron", label: "鉄以上" }, { value: "diamond", label: "ダイヤ以上" },
                ]} />
              </Field>
              <div className="flex items-end"><Toggle checked={b.requiresTool} onChange={(v) => set((x) => (x.requiresTool = v))} label="適正ツールがないとドロップしない" /></div>
            </div>
            <p className="mt-2 text-xs text-slate-500">ドロップは自分自身(ルートテーブル自動生成)。</p>
          </Card>
          <Card
            title="⛏️ 鉱石設定 (ワールド生成・ドロップ)"
            right={<Toggle checked={!!b.ore} onChange={(v) => set((x) => { x.ore = v ? newOre() : null; if (v) { x.tool = "pickaxe"; x.requiresTool = true; } })} label="鉱石として生成する" />}
          >
            {!b.ore ? <p className="text-xs text-slate-500">オンにすると、新しく生成されるチャンクにこのブロックが鉱脈として出現し、ドロップも設定できます。</p> : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <Field label="ドロップアイテム" hint="空欄 = ブロック自身" className="col-span-2"><TextInput mono list="item-datalist" value={b.ore.dropItem} onChange={(v) => set((x) => (x.ore!.dropItem = v.trim()))} /></Field>
                  <Field label="ドロップ数 最小"><NumInput value={b.ore.dropMin} min={0} onChange={(v) => set((x) => (x.ore!.dropMin = v))} /></Field>
                  <Field label="ドロップ数 最大"><NumInput value={b.ore.dropMax} min={0} onChange={(v) => set((x) => (x.ore!.dropMax = v))} /></Field>
                  <Field label="経験値 最小"><NumInput value={b.ore.xpMin} min={0} onChange={(v) => set((x) => (x.ore!.xpMin = v))} /></Field>
                  <Field label="経験値 最大" hint="0なら経験値なし"><NumInput value={b.ore.xpMax} min={0} onChange={(v) => set((x) => (x.ore!.xpMax = v))} /></Field>
                </div>
                <div className="flex flex-wrap gap-x-6">
                  <Toggle checked={b.ore.fortune} onChange={(v) => set((x) => (x.ore!.fortune = v))} label="幸運で増える" />
                  <Toggle checked={b.ore.silkTouch} onChange={(v) => set((x) => (x.ore!.silkTouch = v))} label="シルクタッチで鉱石ブロックをドロップ" />
                  <Toggle checked={b.ore.explosionDecay} onChange={(v) => set((x) => (x.ore!.explosionDecay = v))} label="爆発で減る" />
                </div>
                <div className="rounded-lg border border-[#262f3e] bg-[#0c0f14] p-3">
                  <p className="mb-2 text-xs font-semibold text-slate-300">ワールド生成 (新しく生成されるチャンクのみ)</p>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <Field label="ディメンション">
                      <Select value={b.ore.dimension} onChange={(v) => set((x) => { x.ore!.dimension = v as typeof x.ore extends infer O ? (O extends { dimension: infer D } ? D : never) : never; if (v === "NETHER") { x.ore!.minY = 10; x.ore!.maxY = 117; } else if (v === "END") { x.ore!.minY = 0; x.ore!.maxY = 80; } else { x.ore!.minY = -64; x.ore!.maxY = 64; } })}
                        options={[{ value: "OVERWORLD", label: "オーバーワールド (石/深層岩を置換)" }, { value: "NETHER", label: "ネザー (ネザー岩を置換)" }, { value: "END", label: "エンド (エンドストーンを置換)" }]} />
                    </Field>
                    <Field label="脈のサイズ"><NumInput value={b.ore.veinSize} min={1} max={64} onChange={(v) => set((x) => (x.ore!.veinSize = v))} /></Field>
                    <Field label="1チャンクの脈数"><NumInput value={b.ore.veinsPerChunk} min={1} max={64} onChange={(v) => set((x) => (x.ore!.veinsPerChunk = v))} /></Field>
                    <Field label="最小Y"><NumInput value={b.ore.minY} onChange={(v) => set((x) => (x.ore!.minY = v))} /></Field>
                    <Field label="最大Y"><NumInput value={b.ore.maxY} onChange={(v) => set((x) => (x.ore!.maxY = v))} /></Field>
                  </div>
                  <div className="mt-3 max-w-md"><Field label="生成バイオーム (タグ)" hint="空 = 全バイオーム。例: minecraft:is_forest / minecraft:is_mountain / minecraft:is_badlands"><TextInput mono list="biome-tag-datalist" value={b.ore.biomeTag ?? ""} onChange={(v) => set((x) => (x.ore!.biomeTag = v.trim()))} /></Field></div>
                  <p className="mt-2 text-[11px] text-slate-500">参考: 鉄 脈サイズ9 / 1チャンク10脈 / Y -64〜72、ダイヤ 脈サイズ4〜8 / 7脈 / Y -64〜16</p>
                </div>
              </div>
            )}
          </Card>
          <Card
            title="🌿 地表クラスター生成 (バイオーム指定)"
            right={<Toggle checked={!!b.surface} onChange={(v) => set((x) => { x.surface = v ? { biomeTag: "minecraft:is_forest", rarity: 12, tries: 8, spread: 4 } : null; })} label="地表に生成する" />}
          >
            {!b.surface ? <p className="text-xs text-slate-500">オンにすると、指定バイオームの地表にこのブロックが群生します (水晶・岩・キノコ状の装飾など)。新しく生成されるチャンクのみ。</p> : (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Field label="バイオーム (タグ)" hint="空 = 全オーバーワールド" className="col-span-2"><TextInput mono list="biome-tag-datalist" value={b.surface.biomeTag} onChange={(v) => set((x) => (x.surface!.biomeTag = v.trim()))} /></Field>
                <Field label="希少度 (1/Nチャンク)" hint="大きいほど珍しい"><NumInput value={b.surface.rarity} min={1} max={1000} onChange={(v) => set((x) => (x.surface!.rarity = Math.round(v)))} /></Field>
                <Field label="1群の個数 (試行回数)"><NumInput value={b.surface.tries} min={1} max={256} onChange={(v) => set((x) => (x.surface!.tries = Math.round(v)))} /></Field>
                <Field label="広がり (ブロック)"><NumInput value={b.surface.spread} min={1} max={16} onChange={(v) => set((x) => (x.surface!.spread = Math.round(v)))} /></Field>
              </div>
            )}
            <datalist id="biome-tag-datalist">
              {["minecraft:is_forest", "minecraft:is_mountain", "minecraft:is_hill", "minecraft:is_taiga", "minecraft:is_jungle", "minecraft:is_savanna", "minecraft:is_badlands", "minecraft:is_ocean", "minecraft:is_river", "minecraft:is_beach", "minecraft:is_overworld", "minecraft:is_nether", "minecraft:is_end"].map((t) => <option key={t} value={t} />)}
            </datalist>
          </Card>

          <Card title="ブロック操作スキル (通常右クリック / Shift+右クリック)">
            <p className="mb-3 text-xs text-slate-400">ブロックを右クリックした時にスキルを発動します。作業台やエンダーチェストなどのUI展開スキル、魔法陣の起動などに便利です。</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="通常右クリックで発動">
                <Select value={b.skillId ?? ""} onChange={(v) => set((x) => (x.skillId = v || null))} options={skillOptions(project)} />
              </Field>
              <Field label="Shift+右クリックで発動 (スニーク時)">
                <Select value={b.shiftSkillId ?? ""} onChange={(v) => set((x) => (x.shiftSkillId = v || null))} options={skillOptions(project)} />
              </Field>
            </div>
            <p className="mt-2 text-xs text-slate-500">スニークしながらアイテムを持って右クリックすると、スキルでなくブロック設置になります。</p>
          </Card>
          {diags.length > 0 && <Card title="検証結果">{diags.map((d, i) => <DiagnosticRow key={i} d={d} />)}</Card>}
        </div>
      )}
    </ListDetail>
  );
}
