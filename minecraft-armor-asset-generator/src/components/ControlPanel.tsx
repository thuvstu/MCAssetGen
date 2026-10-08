import { useRef } from "react";
import {
  COLOR_PRESETS, HELMET_PROFILES, PART_LABELS, STYLES,
  type ArmorParams, type HelmetProfile, type PartId, type VisorMode,
} from "../lib/armorTypes";
import { Button, ColorField, Section, Slider, TextField, Toggle } from "./ui";

interface Props {
  params: ArmorParams;
  update: (patch: Partial<ArmorParams>) => void;
  onBrightness: (part: PartId, value: number) => void;
  onRandomSeed: () => void;
  onRandomPalette: () => void;
  onUpload: (layer: 1 | 2 | "geo", file: File) => void;
  uploaded: { layer1: boolean; layer2: boolean; geo: boolean };
  onResetUpload: () => void;
  onExport: () => void;
  exporting: boolean;
}

export function ControlPanel({
  params, update, onBrightness, onRandomSeed, onRandomPalette,
  onUpload, uploaded, onResetUpload, onExport, exporting,
}: Props) {
  const file1 = useRef<HTMLInputElement>(null);
  const file2 = useRef<HTMLInputElement>(null);
  const fileGeo = useRef<HTMLInputElement>(null);

  return (
    <div className="px-5 py-7 lg:px-7">
      <div className="mb-8">
        <div className="eyebrow mb-2">WORKBENCH / 001</div>
        <h2 className="text-[26px] font-semibold tracking-[-0.05em] text-[#f1ede5]">造形から、変える。</h2>
        <p className="mt-2 max-w-[290px] text-[11px] leading-[1.8] text-[#a0a49c]">
          角、面頬、額飾り。まずシルエットを決めてから、素材を塗る。
        </p>
      </div>

      <Section title="01 / ヘルメット造形" hint="MODEL">
        <div className="space-y-2">
          {HELMET_PROFILES.map((profile) => (
            <button
              type="button" key={profile.id}
              onClick={() => update({ helmetProfile: profile.id as HelmetProfile })}
              className={`flex w-full items-center justify-between border px-3.5 py-3 text-left transition-colors ${
                params.helmetProfile === profile.id
                  ? "border-[#c8a06d] bg-[#343126] text-[#f4e2c3]"
                  : "border-[#3b403c] bg-[#242926] text-[#cccfc6] hover:border-[#85816e]"
              }`}
            >
              <span className="font-mono text-[11px] tracking-[0.12em]">{profile.name}</span>
              <span className="text-[10px] text-[#999f94]">{profile.description}</span>
            </button>
          ))}
        </div>
        <div className="pt-1">
          <p className="mb-2 text-[11px] text-[#b8b8ae]">バイザー</p>
          <div className="grid grid-cols-2 gap-1 border border-[#444942] bg-[#181c1a] p-1">
            {([[
              "embers", "発光する眼差し"
            ], ["open", "顔を見せる"]] as [VisorMode, string][]).map(([id, label]) => (
              <button
                key={id} type="button" onClick={() => update({ visorMode: id })}
                className={`py-2 text-[11px] transition-colors ${params.visorMode === id ? "bg-[#d5ab76] text-[#201b16]" : "text-[#a3a89e] hover:text-white"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <Slider label="角 / 稜線の長さ" value={params.hornLength} min={0} max={3} onChange={(value) => update({ hornLength: value })} format={(value) => ["追加なし", "短い", "標準", "長い"][value]} />
      </Section>

      <Section title="02 / 素材" hint="SURFACE">
        <div className="grid grid-cols-4 gap-1.5">
          {STYLES.map((style) => (
            <button
              type="button" key={style.id} title={style.desc}
              onClick={() => update({ style: style.id })}
              className={`min-h-10 border text-[11px] transition-colors ${params.style === style.id
                ? "border-[#d3ac77] bg-[#39352b] text-[#f3dcb8]"
                : "border-[#414740] bg-[#252a27] text-[#b6b8ae] hover:border-[#8b8472]"}`}
            >
              {style.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] leading-relaxed text-[#848b82]">
          {STYLES.find((style) => style.id === params.style)?.desc}。UVとGeoテクスチャの両方に反映します。
        </p>
      </Section>

      <Section title="03 / 調色" hint="PALETTE">
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.name} type="button" title={preset.name} aria-label={`${preset.name}を適用`}
              onClick={() => update({ primary: preset.primary, secondary: preset.secondary, accent: preset.accent })}
              className="group flex h-7 w-7 overflow-hidden border border-[#757266] p-[2px] transition-transform hover:scale-110"
            >
              <span className="h-full w-1/2" style={{ background: preset.primary }} />
              <span className="flex h-full w-1/2 flex-col">
                <span className="h-1/2" style={{ background: preset.secondary }} />
                <span className="h-1/2" style={{ background: preset.accent }} />
              </span>
            </button>
          ))}
          <button type="button" onClick={onRandomPalette} className="ml-auto text-[10px] tracking-wider text-[#dcb581] hover:text-white">
            RANDOMIZE +
          </button>
        </div>
        <ColorField label="主素材" value={params.primary} onChange={(value) => update({ primary: value })} />
        <ColorField label="陰影" value={params.secondary} onChange={(value) => update({ secondary: value })} />
        <ColorField label="装飾 / 発光色" value={params.accent} onChange={(value) => update({ accent: value })} />
      </Section>

      <Section title="04 / 仕上げ" hint="FINISH">
        <Slider label="鱗・模様の間隔" value={params.detail} min={2} max={8} onChange={(value) => update({ detail: value })} />
        <Slider label="粒子感" value={params.noise} min={0} max={60} onChange={(value) => update({ noise: value })} format={(value) => `${value}%`} />
        <Toggle label="面の縁に陰影をつける（バニラUV）" checked={params.edgeShade} onChange={(value) => update({ edgeShade: value })} />
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <TextField label="パターンシード" value={String(params.seed)} onChange={(value) => update({ seed: Number(value.replace(/\D/g, "")) || 0 })} />
          </div>
          <Button onClick={onRandomSeed} title="シードを変更">NEW</Button>
        </div>
        <details className="group border-t border-[#373c37] pt-3">
          <summary className="cursor-pointer text-[11px] text-[#bdbeb4] marker:text-[#cda16b]">パーツ別の明るさ（バニラ・Geo両方に反映）</summary>
          <div className="space-y-4 pt-4">
            {(Object.keys(PART_LABELS) as PartId[]).map((part) => (
              <Slider
                key={part} label={PART_LABELS[part]} value={params.brightness[part]} min={-60} max={60}
                onChange={(value) => onBrightness(part, value)} format={(value) => `${value > 0 ? "+" : ""}${value}%`}
              />
            ))}
          </div>
        </details>
      </Section>

      <Section title="05 / 手描きテクスチャ" hint="IMPORT">
        <p className="text-[10px] leading-[1.7] text-[#92988d]">
          PNGを読み込むと自動生成より優先。バニラ用64×32とGeo用UVアトラスは独立しています（Geoは各キューブを自動展開）。
        </p>
        {([[
          1, file1, "HUMANOID / 64x32", uploaded.layer1
        ], [2, file2, "LEGGINGS / 64x32", uploaded.layer2], ["geo", fileGeo, "GEO / UV ATLAS", uploaded.geo]] as const).map(([layer, input, label, active]) => (
          <div key={layer}>
            <input
              ref={input} type="file" accept="image/png" className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(layer, file);
                event.target.value = "";
              }}
            />
            <button type="button" onClick={() => input.current?.click()}
              className="flex w-full justify-between border-b border-[#373c37] py-2 text-[10px] font-mono tracking-wider text-[#b7bcb2] hover:text-[#f0cd9b]">
              <span>{label}</span><span className={active ? "text-[#dab177]" : "text-[#72796f]"}>{active ? "LOADED" : "IMPORT +"}</span>
            </button>
          </div>
        ))}
        {(uploaded.layer1 || uploaded.layer2 || uploaded.geo) && (
          <Button variant="danger" className="w-full" onClick={onResetUpload}>読み込みをすべて解除</Button>
        )}
      </Section>

      <Section title="06 / 書き出し" hint="EXPORT">
        <div className="grid grid-cols-2 gap-3">
          <TextField label="防具 ID" value={params.armorId} placeholder="dragon_scale" onChange={(value) => update({ armorId: value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} />
          <TextField label="MOD ID" value={params.namespace} placeholder="mymod" onChange={(value) => update({ namespace: value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} />
        </div>
        <TextField label="表示名" value={params.displayName} placeholder="ドラゴンスケール" onChange={(value) => update({ displayName: value })} />
        <label className="flex items-center justify-between text-[11px] text-[#b8b8ae]">
          <span>アイコン解像度</span>
          <select
            value={params.iconSize}
            onChange={(event) => update({ iconSize: Number(event.target.value) as 16 | 32 | 64 })}
            className="border border-[#3f453f] bg-[#171b19] px-2 py-1.5 font-mono text-[11px] text-[#e7e5dc]"
          >
            <option value={16}>16 x 16</option><option value={32}>32 x 32</option><option value={64}>64 x 64</option>
          </select>
        </label>
        <Toggle label="Geoモデル + テクスチャを含める" checked={params.includeGeckolib} onChange={(value) => update({ includeGeckolib: value })} />
        <Toggle label={params.includeGeckolib ? "Fabric / GeckoLib Java例を含める" : "Fabric Java例を含める"} checked={params.includeJava} onChange={(value) => update({ includeJava: value })} />
        <Button variant="primary" className="mt-1 w-full py-3" onClick={onExport} disabled={exporting}>
          {exporting ? "書き出し中..." : "アセット一式を ZIP で保存  ↗"}
        </Button>
      </Section>
    </div>
  );
}