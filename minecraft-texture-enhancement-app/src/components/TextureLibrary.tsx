import { useEffect, useMemo, useRef, useState } from "react";
import { TEXTURES, TEX_GROUPS, generateTexture } from "../lib/textures";
import { PRESETS, type Preset } from "../lib/presets";
import { paintTo, renderPipeline, makeInst } from "../lib/pipeline";
import { Icon, Btn, Chip, SectionTitle } from "./ui";
import { cn } from "../utils/cn";

const SIZES = [16, 24, 32, 48, 64, 96, 128];

interface Props {
  texId: string | null;
  customName: string | null;
  size: number;
  seed: number;
  onPick: (id: string) => void;
  onSize: (s: number) => void;
  onSeed: (s: number) => void;
  onImport: (f: File) => void;
  onPreset: (p: Preset) => void;
  activePreset: string | null;
}

function Thumb({ id, seed, active, onClick }: { id: string; size?: number; seed: number; active: boolean; onClick: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const tex = useMemo(() => generateTexture(id, 48, seed), [id, seed]);
  useEffect(() => { if (ref.current) paintTo(ref.current, tex); }, [tex]);
  const t = TEXTURES.find((x) => x.id === id)!;
  return (
    <button
      onClick={onClick}
      title={`${t.name} / ${t.en}`}
      className={cn(
        "group relative flex flex-col items-center gap-1 rounded-[4px] border p-1.5 transition-all duration-150",
        active
          ? "border-[var(--amber)] bg-[#221c12] shadow-[0_0_20px_-8px_var(--amber)]"
          : "border-[var(--line)] bg-[#141922] hover:-translate-y-0.5 hover:border-[var(--line2)] hover:bg-[#1a2029]",
      )}
    >
      <span className={cn("checker relative flex h-[46px] w-[46px] items-center justify-center overflow-hidden rounded-[2px]")}>
        <canvas ref={ref} width={48} height={48} className="pixelated h-full w-full" />
      </span>
      <span className={cn("w-full truncate text-center text-[9.5px] leading-tight", active ? "text-[var(--amber)]" : "text-[var(--ink3)] group-hover:text-[var(--ink2)]")}>
        {t.name}
      </span>
    </button>
  );
}

export default function TextureLibrary(props: Props) {
  const { texId, customName, size, seed, onPick, onSize, onSeed, onImport, onPreset, activePreset } = props;
  const [tab, setTab] = useState<"tex" | "preset">("tex");
  const [group, setGroup] = useState<string>("全て");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const groups = ["全て", ...TEX_GROUPS];
  const list = group === "全て" ? TEXTURES : TEXTURES.filter((t) => t.group === group);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-1 border-b border-[var(--line)] px-2.5 py-2">
        <button onClick={() => setTab("tex")}
          className={cn("flex-1 rounded-[3px] px-2 py-1.5 font-pixel text-[13px] transition-colors",
            tab === "tex" ? "bg-[#221c12] text-[var(--amber)]" : "text-[var(--ink3)] hover:text-[var(--ink2)]")}>
          テクスチャ
        </button>
        <button onClick={() => setTab("preset")}
          className={cn("flex-1 rounded-[3px] px-2 py-1.5 font-pixel text-[13px] transition-colors",
            tab === "preset" ? "bg-[#101f22] text-[var(--teal)]" : "text-[var(--ink3)] hover:text-[var(--ink2)]")}>
          プリセット
        </button>
      </div>

      {tab === "tex" ? (
        <div className="min-h-0 flex-1 overflow-y-auto pb-6">
          {/* インポート */}
          <div className="px-2.5 pt-2.5">
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault(); setDrag(false);
                const f = e.dataTransfer.files?.[0];
                if (f) onImport(f);
              }}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "group relative flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-[4px] border border-dashed px-3 py-2.5 transition-all",
                drag ? "drop-ok border-[var(--teal)] bg-[#0f2226]" : "border-[var(--line2)] bg-[#141922] hover:border-[var(--teal)]/60 hover:bg-[#131c22]",
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[3px] border border-[var(--teal)]/40 bg-[#0e2226] text-[var(--teal)] transition-transform group-hover:scale-110">
                <Icon name="upload" className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-medium text-[var(--ink)]">画像を取り込む</span>
                <span className="block truncate text-[10px] text-[var(--ink3)]">
                  {customName ? `読込中: ${customName}` : "PNG / JPG をドロップ (任意サイズ自動整形)"}
                </span>
              </span>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ""; }} />
            </div>
          </div>

          {/* サイズ */}
          <SectionTitle right={<span className="font-bit text-[9px] text-[var(--ink3)]">16–128px</span>}>解像度</SectionTitle>
          <div className="flex flex-wrap gap-1 px-2.5">
            {SIZES.map((s) => (
              <Chip key={s} active={size === s} onClick={() => onSize(s)} accent="#59a7ff">
                <span className="font-bit text-[10px]">{s}</span>
              </Chip>
            ))}
          </div>
          <div className="px-2.5 pt-2">
            <input type="range" min={16} max={128} step={1} value={size}
              onChange={(e) => onSize(parseInt(e.target.value, 10))}
              style={{ ["--acc" as any]: "#59a7ff", ["--fill" as any]: `${((size - 16) / 112) * 100}%` }} />
            <div className="mt-0.5 flex items-center justify-between font-bit text-[9px] uppercase tracking-[0.14em] text-[var(--ink3)]">
              <span>CUSTOM {size}×{size}</span>
              <span>{size * size}px</span>
            </div>
          </div>

          {/* シード */}
          <SectionTitle>生成シード</SectionTitle>
          <div className="flex items-center gap-1.5 px-2.5">
            <input
              type="number" value={seed} onChange={(e) => onSeed(parseInt(e.target.value || "0", 10))}
              className="w-full rounded-[3px] border border-[var(--line2)] bg-[#0f131a] px-2 py-1.5 font-bit text-[11px] text-[var(--ink)] outline-none focus:border-[var(--amber)]"
            />
            <Btn onClick={() => onSeed(Math.floor(Math.random() * 9999))} title="ランダムシード" accent="#f5a63c">
              <Icon name="dice" className="h-4 w-4" />
            </Btn>
          </div>

          {/* テクスチャ一覧 */}
          <SectionTitle right={<span className="font-bit text-[9px] text-[var(--ink3)]">{list.length}</span>}>素材ライブラリ</SectionTitle>
          <div className="flex flex-wrap gap-1 px-2.5 pb-2">
            {groups.map((g) => (
              <Chip key={g} active={group === g} onClick={() => setGroup(g)} accent="#b6e14f">
                <span className="text-[10px]">{g}</span>
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5 px-2.5">
            {list.map((t) => (
              <Thumb key={t.id} id={t.id} size={size} seed={seed} active={texId === t.id} onClick={() => onPick(t.id)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2.5 pb-6">
          <p className="mb-2.5 text-[10.5px] leading-relaxed text-[var(--ink3)]">
            プロ仕様の仕上がりをワンクリックで。適用後も全パラメータを編集できます。
          </p>
          {PRESETS.map((p) => (
            <button key={p.id} onClick={() => onPreset(p)}
              className={cn(
                "group relative mb-1.5 flex w-full items-center gap-2.5 overflow-hidden rounded-[4px] border p-2 text-left transition-all hover:-translate-y-0.5",
                activePreset === p.id ? "border-transparent" : "border-[var(--line)] bg-[#141922] hover:border-[var(--line2)] hover:bg-[#1a2029]",
              )}
              style={activePreset === p.id ? { background: `${p.accent}1f`, borderColor: p.accent } : undefined}
            >
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[3px] border border-black/40">
                <PresetThumb preset={p} />
                <span className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle at 30% 20%, ${p.accent}66, transparent 70%)` }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-1.5">
                  <span className="truncate font-pixel text-[13px]" style={{ color: activePreset === p.id ? p.accent : "var(--ink)" }}>{p.name}</span>
                  <span className="font-bit text-[8px] uppercase tracking-[0.12em] text-[var(--ink3)]">{p.en}</span>
                </span>
                <span className="mt-0.5 block truncate text-[10px] leading-tight text-[var(--ink3)]">{p.desc}</span>
                <span className="mt-1 flex gap-1">
                  {p.fx.slice(0, 4).map((f) => (
                    <span key={f.id} className="rounded-[2px] bg-black/35 px-1 py-px font-bit text-[8px] text-[var(--ink2)]">{f.id}</span>
                  ))}
                  {p.fx.length > 4 && <span className="font-bit text-[8px] text-[var(--ink3)]">+{p.fx.length - 4}</span>}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function presetToInsts(preset: Preset) {
  return preset.fx.map((f) => {
    const inst = makeInst(f.id, f.values || {});
    inst.amount = f.amount ?? 100;
    return inst;
  });
}

function PresetThumb({ preset }: { preset: Preset }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const base = useMemo(() => generateTexture(preset.tex, 36, 7), [preset.tex]);
  useEffect(() => {
    if (!ref.current) return;
    try {
      const insts = presetToInsts(preset);
      paintTo(ref.current, renderPipeline(base, insts, 0, 3));
    } catch {
      paintTo(ref.current, base);
    }
  }, [preset, base]);
  return <canvas ref={ref} width={36} height={36} className="pixelated h-full w-full" />;
}
