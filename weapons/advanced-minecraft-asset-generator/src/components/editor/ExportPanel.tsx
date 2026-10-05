"use client";
import { useMemo, useState } from "react";
import {
  BASE_ITEM_NOTES, giveCommandFloats, giveCommandModern, giveCommandNBT, slug,
  targetFor, validateForMinecraft, VERSION_TARGETS,
} from "@/lib/pixel/export";
import type { MCElement } from "@/lib/pixel/model3d";
import type { Pix } from "@/lib/pixel/core";
import type { ExportSettings } from "@/lib/editor/project";
import { Btn, Section, Select, Slider, Toggle } from "./ui";

export type ExportState = ExportSettings;

const BASE_ITEMS = [
  "wooden_sword", "stone_sword", "iron_sword", "golden_sword", "diamond_sword", "netherite_sword",
  "iron_pickaxe", "diamond_pickaxe", "netherite_pickaxe", "iron_axe", "diamond_axe", "netherite_axe",
  "iron_shovel", "diamond_shovel", "iron_hoe", "diamond_hoe", "netherite_hoe", "mace", "trident", "bow", "crossbow", "shield",
  "stick", "blaze_rod", "enchanted_book", "book", "nether_star", "ender_eye", "heart_of_the_sea", "amethyst_shard", "echo_shard",
];

export type ProjectRow = { id: number; name: string; kind: string; width: number; height: number; thumbnail: string | null; updatedAt: string };

export default function ExportPanel({ e, set, onDownload, projects, onSave, onSaveNew, onLoad, onDelete, currentId, busy, onImport, frames, elements }: {
  e: ExportState; set: (p: Partial<ExportState>) => void;
  onDownload: (what: "png" | "strip" | "mcmeta" | "model" | "zip" | "obj" | "glb" | "stl") => void;
  projects: ProjectRow[]; onSave: () => void; onSaveNew: () => void; onLoad: (id: number) => void; onDelete: (id: number) => void; currentId: number | null; busy: boolean;
  onImport: () => void; frames: Pix[]; elements: MCElement[];
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const target = targetFor(e.versionTarget, e.packFormat);
  const frameCount = frames.length;
  const checks = useMemo(() => validateForMinecraft(elements, frames, e.mode3d), [elements, frames, e.mode3d]);
  const errors = checks.filter((c) => c.level === "error").length;
  const warns = checks.filter((c) => c.level === "warn").length;
  const cmds = {
    modern: giveCommandModern(e.baseItem, e.name),
    floats: giveCommandFloats(e.baseItem, e.name, e.customModelData),
    nbt: giveCommandNBT(e.baseItem, e.name, e.customModelData),
  };
  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => undefined);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1400);
  };
  const baseNote = BASE_ITEM_NOTES[e.baseItem];
  const pickTarget = (id: string) => {
    const t = targetFor(id);
    set({ versionTarget: t.id, packFormat: t.packFormat });
  };

  return (
    <div className="space-y-2">
      <Section
        title="マイクラ互換性チェック"
        right={<span className={`text-[10px] font-bold ${errors ? "text-rose-300" : warns ? "text-amber-300" : "text-emerald-300"}`}>{errors ? `${errors}件の問題` : warns ? `${warns}件の注意` : "すべてOK"}</span>}
      >
        <div className="space-y-1">
          {checks.map((c, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[11px]">
              <span className={c.level === "error" ? "text-rose-400" : c.level === "warn" ? "text-amber-300" : "text-emerald-400"}>
                {c.level === "error" ? "✕" : c.level === "warn" ? "⚠" : "✓"}
              </span>
              <div>
                <div className="text-slate-200">{c.label}</div>
                {c.detail && <div className="text-[10px] text-slate-500">{c.detail}</div>}
              </div>
            </div>
          ))}
        </div>
        {errors > 0 && <div className="text-[10px] text-rose-300">赤い項目を直さないとゲーム内で紫黒表示や読み込み失敗になります。3Dタブで再構築設定の見直しを。</div>}
      </Section>

      <Section title="アイテム設定">
        <label className="block text-[11px] text-slate-300">アイテム名
          <input className="w-full rounded bg-slate-900 border border-white/10 px-2 py-1 text-xs" value={e.name} onChange={(ev) => set({ name: ev.target.value })} />
          <div className="text-[10px] text-slate-500">id: {slug(e.name)}（giveコマンドの strings と一致します）</div>
        </label>
        <Select label="ベースアイテム（見た目を乗せる元の道具）" value={e.baseItem} onChange={(v) => set({ baseItem: v })} options={BASE_ITEMS.map((b) => ({ value: b, label: b }))} />
        {baseNote && <div className="text-[10px] text-amber-300/90 leading-relaxed">⚠ {baseNote}</div>}
        <Slider label="custom_model_data（1.20.5〜1.21.3の数値 / 旧NBT用）" value={e.customModelData} min={1} max={9999} step={1} onChange={(v) => set({ customModelData: v })} />
        <Select label="対象バージョン（pack_format）" value={target.id} onChange={pickTarget} options={VERSION_TARGETS.map((t) => ({ value: t.id, label: `${t.label} ／ format ${t.packFormat}` }))} />
        {target.note && <div className="text-[10px] text-slate-500">{target.note}</div>}
        <Toggle label="3Dモデル（elements）として出力" checked={e.mode3d} onChange={(v) => set({ mode3d: v })} />
        {!e.mode3d && <div className="text-[10px] text-slate-500">OFFだと確実に表示される平面モデル（handheld継承）になります。</div>}
      </Section>

      <Section title="ダウンロード">
        <div className="grid grid-cols-2 gap-1">
          <Btn onClick={() => onDownload("png")}>PNG（現在フレーム）</Btn>
          <Btn onClick={() => onDownload("strip")} disabled={frameCount < 2}>PNGストリップ（全フレーム）</Btn>
          <Btn onClick={() => onDownload("mcmeta")} disabled={frameCount < 2}>.png.mcmeta</Btn>
          <Btn onClick={() => onDownload("model")}>MCモデルJSON</Btn>
          <Btn onClick={() => onDownload("glb")} disabled={busy}>GLB（実3Dメッシュ）</Btn>
          <Btn onClick={() => onDownload("obj")} disabled={busy}>OBJ（UV/法線付き）</Btn>
          <Btn onClick={() => onDownload("stl")} disabled={busy}>STL（3Dプリント）</Btn>
        </div>
        <Btn variant="primary" className="w-full py-2" onClick={() => onDownload("zip")} disabled={busy || errors > 0}>
          📦 リソースパックZIPをダウンロード
        </Btn>
        {errors > 0
          ? <div className="text-[10px] text-rose-300">互換性エラーを解消すると出力できます。</div>
          : <div className="text-[10px] text-slate-400">1.21.4+用 items/ 定義と旧 overrides を同梱した万能ZIPです。resourcepacks に入れて有効化。</div>}
      </Section>

      <Section title="導入手順（Java版）" defaultOpen={false}>
        <ol className="text-[11px] text-slate-300 space-y-1 list-decimal list-inside">
          <li>上のボタンでZIPをダウンロード。</li>
          <li>ZIPのまま <span className="font-mono text-[10px]">resourcepacks</span> フォルダへ（Win: <span className="font-mono text-[10px]">%appdata%\.minecraft\resourcepacks</span>／Mac: ライブラリ/Application Support/minecraft/resourcepacks）。</li>
          <li>マイクラ → 設定 → リソースパック → 有効化。</li>
          <li>チートONのワールドで下の give コマンドを実行（自分のバージョンに合うものをコピー）。</li>
          <li>反映されない時は <span className="font-mono text-[10px]">F3+T</span> で再読込→それでもダメなら再ログイン。</li>
        </ol>
        <div className="text-[10px] text-slate-500">紫黒チェック柄＝モデルJSONかテクス参照の問題／見た目が変わらない＝コマンドの値とパックのwhen/floats不一致か、パック未適用が原因です。</div>
      </Section>

      <Section title="/give コマンド（自分のバージョン用をコピー）">
        <div className="text-[10px] text-slate-500">1.21.4 以降（strings 照合・推奨）</div>
        <textarea readOnly className="w-full h-16 rounded bg-slate-900 border border-white/10 p-1 text-[10px] font-mono text-emerald-200" value={cmds.modern} />
        <Btn onClick={() => copy("modern", cmds.modern)}>コピー{copied === "modern" && " ✓"}</Btn>
        <div className="text-[10px] text-slate-500 mt-1">1.20.5 – 1.21.3（floats 照合）</div>
        <textarea readOnly className="w-full h-14 rounded bg-slate-900 border border-white/10 p-1 text-[10px] font-mono text-emerald-200" value={cmds.floats} />
        <Btn onClick={() => copy("floats", cmds.floats)}>コピー{copied === "floats" && " ✓"}</Btn>
        <div className="text-[10px] text-slate-500 mt-1">1.9 – 1.20.4（旧NBT）</div>
        <textarea readOnly className="w-full h-14 rounded bg-slate-900 border border-white/10 p-1 text-[10px] font-mono text-emerald-200" value={cmds.nbt} />
        <Btn onClick={() => copy("nbt", cmds.nbt)}>コピー{copied === "nbt" && " ✓"}</Btn>
        <div className="text-[10px] text-slate-500">1.21.4+ では数値ではなく strings（上のid）が照合されます。数値を変えても見た目は変わりません。</div>
      </Section>

      <Section title="画像インポート">
        <Btn onClick={onImport} className="w-full">📥 PNG/JPG を読み込み（2D→編集/アニメ/3D）</Btn>
      </Section>

      <Section title={`保存済みプロジェクト (${projects.length})`}>
        <div className="flex gap-1">
          <Btn variant="primary" onClick={onSave} disabled={busy}>{currentId ? "上書き保存" : "保存"}</Btn>
          {currentId && <Btn onClick={onSaveNew} disabled={busy}>別名で保存</Btn>}
        </div>
        <div className="space-y-1 max-h-72 overflow-auto">
          {projects.map((p) => (
            <div key={p.id} className={`flex items-center gap-2 rounded border p-1 ${p.id === currentId ? "border-amber-300/60 bg-amber-400/5" : "border-white/10"}`}>
              {p.thumbnail ? <img src={p.thumbnail} alt="" className="w-8 h-8" style={{ imageRendering: "pixelated" }} /> : <div className="w-8 h-8 bg-white/5" />}
              <div className="flex-1 min-w-0">
                <div className="text-xs truncate">{p.name}</div>
                <div className="text-[9px] text-slate-500">{p.kind} ・ {p.width}px ・ {new Date(p.updatedAt).toLocaleString()}</div>
              </div>
              <Btn onClick={() => onLoad(p.id)}>開く</Btn>
              <Btn variant="ghost" onClick={() => onDelete(p.id)}>✕</Btn>
            </div>
          ))}
          {projects.length === 0 && <div className="text-[10px] text-slate-500">まだ保存されていません</div>}
        </div>
      </Section>
    </div>
  );
}
