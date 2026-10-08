"use client";

import { useRef, useState } from "react";
import { newForgeStyle } from "@/lib/mod/catalog";
import { resolveEnv } from "@/lib/mod/targets";
import { Btn, Card, DiagnosticRow, Field, ListDetail, NumInput, Select, TextArea, TextInput, TextureUpload, Toggle, slug, uniqueId, type TabProps } from "./ui";

const TIERS = [
  { tier: "WOOD", cost: "minecraft:oak_planks" },
  { tier: "STONE", cost: "minecraft:cobblestone" },
  { tier: "COPPER", cost: "minecraft:copper_ingot" },
  { tier: "IRON", cost: "minecraft:iron_ingot" },
  { tier: "GOLD", cost: "minecraft:gold_ingot" },
  { tier: "DIAMOND", cost: "minecraft:diamond" },
  { tier: "NETHERITE", cost: "minecraft:netherite_ingot" },
];

export default function ForgeTab({ project, update, analysis }: TabProps) {
  const [sel, setSel] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const idx = Math.min(sel, project.forge.styles.length - 1);
  const style = project.forge.styles[idx];
  const set = (fn: (x: NonNullable<typeof style>) => void) => update((p) => fn(p.forge.styles[idx]));
  const profile = resolveEnv(project.meta);
  const moj = profile.mappings === "mojmap";
  const diags = analysis.diagnostics.filter((d) => d.file === "project" && d.message.startsWith("[武器工房:"));
  const styleDiags = style ? diags.filter((d) => d.message.startsWith(`[武器工房: ${style.id}]`)) : [];
  const model: Record<string, unknown> | null = (() => {
    try {
      const m = JSON.parse(style?.modelJson || "") as unknown;
      return m && typeof m === "object" && !Array.isArray(m) ? m as Record<string, unknown> : null;
    } catch { return null; }
  })();
  const chooseModel = async (file: File) => {
    setUploadError("");
    if (file.name.toLowerCase().endsWith(".bbmodel")) {
      setUploadError(".bbmodel はBlockbenchの編集用形式です。Blockbenchで「File → Export → Export Block/Item Model」を選び、.json を読み込んでください。");
      return;
    }
    if (file.size > 90 * 1024) { setUploadError("モデルJSONは90KB以下にしてください。"); return; }
    const text = await file.text();
    try {
      const obj = JSON.parse(text) as Record<string, unknown>;
      if (!obj || typeof obj !== "object" || Array.isArray(obj) || !("elements" in obj || "parent" in obj)) throw new Error("BlockbenchのJava Block/ItemモデルJSONが必要です");
      set((x) => (x.modelJson = JSON.stringify(obj, null, 2)));
    } catch (e) { setUploadError((e as Error).message); }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#262f3e] bg-[#141922] p-3">
        <div>
          <h2 className="text-sm font-semibold">⚒ ゲーム内武器工房</h2>
          <p className="mt-1 text-xs text-slate-400">Mod起動時に「武器工房ブロック」と「鍛造武器の素体」を登録。ゲーム内では武器を一振りずつデザインして鍛造します。</p>
        </div>
        <Toggle checked={project.forge.enabled} onChange={(v) => update((p) => (p.forge.enabled = v))} label="武器工房を有効にする" />
      </div>
      {!moj && project.forge.enabled && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">旧1.21.1/Yarnプロファイルでは使用できません。Mod設定で Minecraft 1.21.11 / Mojang公式マッピングに切り替えてください。</p>}
      <div className="min-h-0 flex-1">
        <ListDetail
          title="同梱する外見"
          rows={project.forge.styles.map((x) => ({ key: x.id, label: x.name, sub: `${x.id} · ${x.costItem} x${x.costCount}`, badge: diags.filter((d) => d.severity === "error" && d.message.startsWith(`[武器工房: ${x.id}]`)).length }))}
          selected={idx} onSelect={setSel}
          onAdd={() => { update((p) => p.forge.styles.push({ ...newForgeStyle(), id: uniqueId("new_blade", p.forge.styles.map((x) => x.id)) })); setSel(project.forge.styles.length); }}
          onDuplicate={() => { if (!style) return; update((p) => { const c = structuredClone(p.forge.styles[idx]); c.id = uniqueId(`${c.id}_copy`, p.forge.styles.map((x) => x.id)); p.forge.styles.splice(idx + 1, 0, c); }); setSel(idx + 1); }}
          onDelete={() => { if (!style) return; update((p) => p.forge.styles.splice(idx, 1)); setSel(Math.max(0, idx - 1)); }}
          empty="外見候補がありません。オンにする場合は最低1件追加してください。"
        >
          {!style ? <Card><p className="text-sm text-slate-400">＋追加で外見を作り、Modの中にPNGとモデルを同梱します。ゲーム内ではこの候補から選択します。</p></Card> : (
            <div className="space-y-4 pb-8">
              <Card title="基本と見た目">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                  <Field label="ゲーム内に表示する外見名"><TextInput value={style.name} onChange={(v) => set((x) => (x.name = v))} /></Field>
                  <Field label="外見ID" hint={`実際の登録アイテムID: ${project.meta.modId}:forged_${style.id} ／ モデル: assets/${project.meta.modId}/items/forge/${style.id}.json`}><TextInput mono value={style.id} onChange={(v) => set((x) => (x.id = slug(v)))} /></Field>
                  <Field label="モデルの持ち方">
                    <Select value={style.parent} onChange={(v) => set((x) => (x.parent = v as typeof x.parent))} options={[{ value: "handheld", label: "手持ち武器 (handheld)" }, { value: "generated", label: "平面アイテム (generated)" }]} />
                  </Field>
                  <Field label="バニラ等のテクスチャID" className="col-span-2" hint="PNGをアップロードしない場合に使用。例: minecraft:item/diamond_sword"><TextInput mono value={style.texture} onChange={(v) => set((x) => (x.texture = v.trim()))} /></Field>
                  <div className="col-span-full"><TextureUpload kind="item" value={style.customTexture} onChange={(v) => set((x) => (x.customTexture = v))} /></div>
                </div>
              </Card>

              <Card title="Blockbench / 3Dモデル (任意)">
                <p className="mb-3 text-xs leading-relaxed text-slate-400">Blockbenchから <b>Java Block/Item モデル JSON</b> をエクスポートして取り込みます。<code className="font-code">.bbmodel</code> ファイルは編集用なのでそのままでは使えません。テクスチャの参照に <code className="font-code">$uploaded</code> と書くと上のPNGへ自動で置換します。</p>
                <Btn onClick={() => fileRef.current?.click()}>⬆ モデル JSON を読み込む</Btn>
                <input ref={fileRef} type="file" accept=".json,.bbmodel,application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) chooseModel(f); e.target.value = ""; }} />
                {uploadError && <p role="alert" className="mt-2 text-xs text-red-300">⚠ {uploadError}</p>}
                <div className="mt-3"><Field label="モデルJSON" hint="未設定なら上のテクスチャから自動生成。JSONの elements / textures / display で3D形状や持ち方を編集できます"><TextArea mono rows={7} value={style.modelJson ?? ""} onChange={(v) => set((x) => (x.modelJson = v))} placeholder={'{\n  "parent": "minecraft:item/handheld",\n  "textures": { "layer0": "$uploaded" }\n}'} /></Field></div>
                {style.modelJson?.trim() && <p className={`mt-1 text-xs ${model ? "text-emerald-300" : "text-red-300"}`}>{model ? "✔ JSONとして読み込めます" : "✖ JSONに構文エラーがあります"}</p>}
              </Card>

              <Card title="ゲーム内の初期値と鍛造材料">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <Field label="追加材料のアイテムID" className="col-span-2" hint="ゲーム内で選ぶ素材(WOOD〜NETHERITE)1個が別途必要です"><TextInput mono list="item-datalist" value={style.costItem} onChange={(v) => set((x) => (x.costItem = v.trim()))} /></Field>
                  <Field label="追加材料の個数"><NumInput value={style.costCount} min={1} max={64} onChange={(v) => set((x) => (x.costCount = Math.round(v)))} /></Field>
                  <Field label="初期攻撃力 (1〜20)"><NumInput value={style.defaultDamage} min={1} max={20} step={0.5} onChange={(v) => set((x) => (x.defaultDamage = v))} /></Field>
                  <Field label="初期攻撃速度補正 (-4〜0)"><NumInput value={style.defaultSpeed} min={-4} max={0} step={0.1} onChange={(v) => set((x) => (x.defaultSpeed = v))} /></Field>
                  <Field label="初期耐久値 (32〜4096)"><NumInput value={style.defaultDurability} min={32} max={4096} onChange={(v) => set((x) => (x.defaultDurability = Math.round(v)))} /></Field>
                  <Field label="最初に選ばれるスキル" className="col-span-2">
                    <Select value={style.defaultSkillId} onChange={(v) => set((x) => (x.defaultSkillId = v))} options={[{ value: "", label: "(なし)" }, ...project.skills.map((sk) => ({ value: sk.id, label: `${sk.name} (${sk.id})` }))]} />
                  </Field>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">初期値はゲーム内の画面や <code className="font-code">/forge</code> コマンドで一振りごとに調整できます。数値には上限を設定しています。</p>
              </Card>

              {styleDiags.length > 0 && <Card title="この外見の検証結果">{styleDiags.map((d, i) => <DiagnosticRow key={i} d={d} />)}</Card>}
            </div>
          )}
        </ListDetail>
      </div>
      {project.forge.enabled && (
        <Card title="ゲーム内で武器を作る手順">
          <ol className="list-decimal space-y-1 pl-4 text-xs leading-relaxed text-slate-300">
            <li>ZIPからModをビルドし、ゲームに導入。<b>武器工房ブロック</b>を作るか、<code className="font-code">/forge open</code> を使います。</li>
            <li>6行の画面で外見・素材・右/Shift右/左クリックのスキル・性能を選びます。<code className="font-code">/forge name &lt;名前&gt;</code> で自由に名前を変更できます。</li>
            <li>必要材料を持ち、右下の<b>「鍛造」</b>をクリック。個体ごとに名前・性能・見た目・スキルが保存されます。</li>
          </ol>
          <p className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200">
            Minecraftの制約: 武器素体と各外見のアイテムID (<code className="font-code">{project.meta.modId}:forged_外見ID</code>) は<b>Mod起動時に登録</b>します。ゲーム中は登録済み外見から選んで武器を作り、名前・能力・スキルを個々のアイテムに記録します。新しいID・PNG・モデルを追加するにはWebアプリで設定してModを<b>再ビルド</b>してください。
          </p>
          <p className="mt-2 text-[11px] text-slate-500">素材の追加費用: {TIERS.map((t) => `${t.tier} = ${t.cost}`).join(" · ")}。クリエイティブモードでは材料を消費しません。</p>
          {diags.filter((d) => !style || !d.message.startsWith(`[武器工房: ${style.id}]`)).map((d, i) => <DiagnosticRow key={i} d={d} />)}
        </Card>
      )}
    </div>
  );
}
