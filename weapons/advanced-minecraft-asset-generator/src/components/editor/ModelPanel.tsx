"use client";
import {
  CrossSection, DepthMode, Layering, ModelSettings, ReconstructMode, depthToHeat,
} from "@/lib/pixel/model3d";
import { Pix } from "@/lib/pixel/core";
import type { PreviewOpts, PreviewQuality, PreviewView } from "./Preview3D";
import { Btn, PixThumb, Section, Select, Slider, Toggle } from "./ui";

export default function ModelPanel({
  m, set, elementCount, hasRoles, onImportClick, depth, pix, preview, setPreview,
}: {
  m: ModelSettings;
  set: (p: Partial<ModelSettings>) => void;
  elementCount: number;
  hasRoles: boolean;
  onImportClick: () => void;
  depth: Float32Array;
  pix: Pix;
  preview: PreviewOpts;
  setPreview: (p: Partial<PreviewOpts>) => void;
}) {
  const heat = depthToHeat(depth, pix);
  return (
    <div className="space-y-2">
      <Section title="再構築モード">
        <div className="text-[10px] text-slate-400 leading-relaxed">
          ボクセルではなく、<b className="text-slate-200">形状を読み取って立体として再構築</b>します。
          生成データがあるときは刃・柄・宝石をそれぞれダイヤモンド断面 / 円柱 / 球として組み立て、
          画像のみのときはシルエットと深度マップから浮き彫りメッシュを作ります。
        </div>
        <Select<ReconstructMode>
          label="ジオメトリ"
          value={m.reconstruct}
          onChange={(v) => set({ reconstruct: v })}
          options={[
            { value: "auto", label: "自動 (パーツ優先 → 押し出し)" },
            { value: "parts", label: "パーツ再構築 (刃・柄・宝石の実体)" },
            { value: "extrude", label: "画像押し出し (2D→浮き彫り)" },
          ]}
        />
        <Select<PreviewQuality>
          label="プレビュー品質"
          value={preview.quality}
          onChange={(v) => setPreview({ quality: v })}
          options={[
            { value: "sculpt", label: "スカルプト (滑らかな再現・推奨)" },
            { value: "boxes", label: "Minecraft JSON 実機相当 (boxes)" },
          ]}
        />
      </Section>

      <Section title="断面 / 厚み">
        <Select<CrossSection>
          label="断面形状"
          value={m.crossSection}
          onChange={(v) => set({ crossSection: v })}
          options={[
            { value: "auto", label: "自動 (刃=ダイヤ / 柄=円 / 他=平板)" },
            { value: "diamond", label: "ダイヤモンド (刀身向き)" },
            { value: "round", label: "円・八角 (柄・筒)" },
            { value: "flat", label: "平板" },
          ]}
        />
        <Slider label="最大厚み" value={m.thickness} min={0.4} max={8} step={0.1} onChange={(v) => set({ thickness: v })} />
        <Slider label="丸み / 断面の立体感" value={m.roundness} min={0} max={1} onChange={(v) => set({ roundness: v })} />
        <Slider label="発光シェル" value={m.glowShell} min={0} max={1.2} onChange={(v) => set({ glowShell: v })} />
      </Section>

      <Section title="スカルプト詳細 (実メッシュ)">
        <div className="text-[10px] text-slate-400 leading-relaxed">
          刃はダイヤモンド断面(平＋しのぎ＋刃先ベベル)、柄は多角柱、宝石はファセット付きの立体として構築します。値はGLB/OBJ/STLとプレビューの両方に反映されます。
        </div>
        <Slider label="刃の研ぎ(ベベル)" value={m.bladeBevel} min={0} max={1} onChange={(v) => set({ bladeBevel: v })} />
        <Slider label="先端の鋭さ(テーパー)" value={m.tipTaper} min={0} max={1} onChange={(v) => set({ tipTaper: v })} />
        <Slider label="しのぎ(棟)の高さ" value={m.ridge} min={0} max={0.6} onChange={(v) => set({ ridge: v })} />
        <Slider label="血溝(フラー)" value={m.fuller} min={0} max={0.6} onChange={(v) => set({ fuller: v })} />
        <Slider label="柄の丸み" value={m.gripRound} min={0} max={1} onChange={(v) => set({ gripRound: v })} />
        <Slider label="柄の角数" value={m.gripSides} min={4} max={20} step={1} onChange={(v) => set({ gripSides: v })} />
        <Slider label="宝石のファセット数" value={m.gemFacets} min={4} max={16} step={1} onChange={(v) => set({ gemFacets: v })} />
      </Section>

      <Section title="画像押し出し (extrude時)" defaultOpen={m.reconstruct === "extrude"}>
        <Select<DepthMode>
          label="深度推定"
          value={m.depthMode}
          onChange={(v) => set({ depthMode: v })}
          options={[
            { value: "auto", label: "自動 (役割+ベベル+輝度)" },
            { value: "roles", label: hasRoles ? "パーツ役割" : "パーツ役割 (データなし→ベベル)" },
            { value: "bevel", label: "ベベル (縁→中心で厚く)" },
            { value: "luminance", label: "輝度" },
            { value: "uniform", label: "均一" },
          ]}
        />
        <Select<Layering>
          label="レイヤー方式"
          value={m.layering}
          onChange={(v) => set({ layering: v })}
          options={[
            { value: "exclusive", label: "排他 (段差の浮き彫り)" },
            { value: "nested", label: "入れ子 (内側が隆起)" },
          ]}
        />
        <Slider label="深度段階数" value={m.levels} min={1} max={8} step={1} onChange={(v) => set({ levels: v })} />
        <Slider label="最小厚み比" value={m.minThickness} min={0.05} max={1} onChange={(v) => set({ minThickness: v })} />
        <Slider label="ベベル半径 (px)" value={m.bevelRadius} min={1} max={12} step={1} onChange={(v) => set({ bevelRadius: v })} />
        <Slider label="深度スムーズ" value={m.smooth} min={0} max={4} step={1} onChange={(v) => set({ smooth: v })} />
        <Toggle label="発光部分を隆起" checked={m.emissiveGlow} onChange={(v) => set({ emissiveGlow: v })} />
        <Toggle label="深度を反転" checked={m.invert} onChange={(v) => set({ invert: v })} />
        <div>
          <div className="text-[10px] text-slate-500 mb-1">深度マップ</div>
          <PixThumb pix={heat} size={96} checker={false} />
        </div>
      </Section>

      <Section title="3D プレビュー">
        <div className="flex flex-wrap gap-1">
          {([["iso", "斜め"], ["front", "正面"], ["side", "側面"], ["top", "上面"], ["hand", "手持ち"]] as [PreviewView, string][]).map(([v, l]) => (
            <Btn key={v} active={preview.view === v} onClick={() => setPreview({ view: v })}>{l}</Btn>
          ))}
        </div>
        <Toggle label="自動回転" checked={preview.autoRotate} onChange={(v) => setPreview({ autoRotate: v })} />
        <Toggle label="ブルーム (発光)" checked={preview.bloom} onChange={(v) => setPreview({ bloom: v })} />
        <Toggle label="パーティクル" checked={preview.particles} onChange={(v) => setPreview({ particles: v })} />
        <Toggle label="ワイヤーフレーム" checked={preview.wireframe} onChange={(v) => setPreview({ wireframe: v })} />
        <Toggle label="スタジオ照明" checked={preview.studio} onChange={(v) => setPreview({ studio: v })} />
      </Section>

      <Section title="表示設定 (display / ゲーム内)">
        <Toggle label="手持ち武器 (handheld) 向き" checked={m.handheld} onChange={(v) => set({ handheld: v })} />
        <Slider label="手持ちスケール" value={m.scale} min={0.5} max={2.5} step={0.05} onChange={(v) => set({ scale: v })} />
      </Section>

      <Section title="情報">
        <div className="text-[11px] text-slate-300">Minecraft 要素数: <b className="text-amber-300">{elementCount}</b></div>
        <div className="text-[10px] text-slate-500">目安: 300以下が軽量。パーツ再構築は押し出しより少なく、形がはっきりします。</div>
        <Btn onClick={onImportClick} className="w-full">📥 任意のPNGを読み込んで3D化</Btn>
      </Section>
    </div>
  );
}
