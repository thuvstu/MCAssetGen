import { useEffect, useMemo, useState } from "react";
import { ALL_FX, CAT_ORDER, CATS, FX_BY_ID, makeInst, type Cat, type Inst } from "../lib/pipeline";
import type { ParamSpec } from "../lib/effects";
import { Icon, Btn, Slider, Toggle, Select, ColorField, Chip } from "./ui";
import { cn } from "../utils/cn";

interface Props {
  insts: Inst[];
  onChange: (next: Inst[]) => void;
  onRandom: () => void;
  focusUid?: string | null;
}

export default function EffectStack({ insts, onChange, onRandom, focusUid }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [browser, setBrowser] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  // 追加した行へ自動スクロール
  useEffect(() => {
    if (!focusUid) return;
    const el = document.querySelector(`[data-uid="${focusUid}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [focusUid, insts.length]);

  const update = (uidStr: string, patch: Partial<Inst>) =>
    onChange(insts.map((i) => (i.uid === uidStr ? { ...i, ...patch } : i)));
  const updateValue = (uidStr: string, key: string, val: any) =>
    onChange(insts.map((i) => (i.uid === uidStr ? { ...i, values: { ...i.values, [key]: val } } : i)));
  const remove = (uidStr: string) => onChange(insts.filter((i) => i.uid !== uidStr));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= insts.length || from === to) return;
    const n = [...insts];
    const [x] = n.splice(from, 1);
    n.splice(to, 0, x);
    onChange(n);
  };
  const duplicate = (i: Inst) => {
    const idx = insts.findIndex((x) => x.uid === i.uid);
    const n = [...insts];
    n.splice(idx + 1, 0, { ...makeInst(i.id, i.values), amount: i.amount, on: i.on });
    onChange(n);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-2.5">
        <div className="min-w-0">
          <h2 className="font-pixel text-[15px] leading-none text-[var(--ink)]">エフェクトスタック</h2>
          <p className="mt-1 font-bit text-[9px] uppercase tracking-[0.16em] text-[var(--ink3)]">
            LAYER STACK · {insts.filter((i) => i.on).length}/{insts.length} ACTIVE
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Btn size="sm" onClick={onRandom} title="ランダムにエフェクトを積む" accent="#b6e14f">
            <Icon name="dice" className="h-3.5 w-3.5" />
          </Btn>
          <Btn size="sm" onClick={() => onChange([])} title="全て削除" disabled={!insts.length}>
            <Icon name="trash" className="h-3.5 w-3.5" />
          </Btn>
          <Btn size="sm" active onClick={() => setBrowser(true)} accent="#f5a63c">
            <Icon name="plus" className="h-3.5 w-3.5" />追加
          </Btn>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {!insts.length && (
          <button
            onClick={() => setBrowser(true)}
            className="group mt-4 flex w-full flex-col items-center gap-2 rounded-[4px] border border-dashed border-[var(--line2)] px-4 py-10 text-center transition-colors hover:border-[var(--amber)]/60 hover:bg-white/[0.02]"
          >
            <span className="relative flex h-12 w-12 items-center justify-center rounded-[4px] border border-[var(--line2)] bg-[#141922] text-[var(--amber)] transition-transform group-hover:scale-110">
              <Icon name="wand" className="h-6 w-6" />
            </span>
            <span className="font-pixel text-[14px] text-[var(--ink2)] group-hover:text-[var(--ink)]">エフェクトを追加</span>
            <span className="max-w-[190px] text-[10.5px] leading-relaxed text-[var(--ink3)]">
              {ALL_FX.length} 種類のエフェクトを自由に重ね掛け。順序も入れ替え可能です。
            </span>
          </button>
        )}

        {insts.map((inst, idx) => {
          const d = FX_BY_ID.get(inst.id)!;
          if (!d) return null;
          const cat = CATS[d.cat];
          const isOpen = open[inst.uid] ?? false;
          return (
            <div
              key={inst.uid}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => { e.preventDefault(); setOverIdx(idx); }}
              onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
              onDrop={(e) => { e.preventDefault(); if (dragIdx !== null) move(dragIdx, idx); setDragIdx(null); setOverIdx(null); }}
              data-uid={inst.uid}
              className={cn(
                "reveal group relative mb-1.5 rounded-[4px] border bg-[#151a23] transition-all",
                inst.on ? "border-[var(--line)]" : "border-transparent opacity-55",
                overIdx === idx && dragIdx !== null && dragIdx !== idx && "border-[var(--amber)]",
                focusUid === inst.uid && "ring-1 ring-[var(--amber)]",
              )}
              style={{ boxShadow: inst.on ? `inset 2px 0 0 ${cat.color}` : undefined }}
            >
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <span className="cursor-grab text-[var(--ink3)] opacity-40 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
                  <Icon name="sort" className="h-3.5 w-3.5" />
                </span>
                <span className="font-bit text-[9px] text-[var(--ink3)] tabular w-4">{String(idx + 1).padStart(2, "0")}</span>
                <button
                  onClick={() => setOpen({ ...open, [inst.uid]: !isOpen })}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] border transition-colors"
                    style={{ borderColor: `${cat.color}55`, background: `${cat.color}18`, color: cat.color }}>
                    <Icon name={d.icon} className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium text-[var(--ink)]">{d.name}</span>
                    <span className="block truncate font-bit text-[8.5px] uppercase tracking-[0.12em] text-[var(--ink3)]">
                      {d.en}{d.animated ? " · ANIM" : ""}
                    </span>
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-0.5">
                  <IconBtn title="上に移動" onClick={() => move(idx, idx - 1)} disabled={idx === 0}><Icon name="arrowUp" className="h-3.5 w-3.5" /></IconBtn>
                  <IconBtn title="下に移動" onClick={() => move(idx, idx + 1)} disabled={idx === insts.length - 1}><Icon name="arrowDown" className="h-3.5 w-3.5" /></IconBtn>
                  <IconBtn title={inst.on ? "無効化" : "有効化"} onClick={() => update(inst.uid, { on: !inst.on })} accent={inst.on ? cat.color : undefined}>
                    <Icon name={inst.on ? "eye" : "eyeOff"} className="h-3.5 w-3.5" />
                  </IconBtn>
                  <IconBtn title="複製" onClick={() => duplicate(inst)}><Icon name="copy" className="h-3.5 w-3.5" /></IconBtn>
                  <IconBtn title="削除" onClick={() => remove(inst.uid)} danger><Icon name="trash" className="h-3.5 w-3.5" /></IconBtn>
                </div>
              </div>

              <div className="px-2 pb-1.5">
                <Slider label="効き" value={inst.amount} min={0} max={100} step={1} unit="%"
                  accent={cat.color} onChange={(v) => update(inst.uid, { amount: v })} />
              </div>

              {isOpen && (
                <div className="pop border-t border-[var(--line)] bg-[#121721] px-2.5 py-2">
                  <p className="mb-2 text-[10.5px] leading-relaxed text-[var(--ink3)]">{d.desc}</p>
                  <div className="space-y-1.5">
                    {d.params.map((p) => (
                      <ParamRow key={p.key} p={p} value={inst.values[p.key]} accent={cat.color}
                        onChange={(val) => updateValue(inst.uid, p.key, val)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* フッター: 全エフェクト網羅メーター */}
      <div className="border-t border-[var(--line)] bg-[#0f131a] px-3 py-2">
        <div className="mb-1.5 flex items-center justify-between font-bit text-[9px] uppercase tracking-[0.14em] text-[var(--ink3)]">
          <span>CATALOGUE 網羅率</span>
          <span className="tabular text-[var(--amber)]">{new Set(insts.map((i) => i.id)).size} / {ALL_FX.length}</span>
        </div>
        <div className="mb-2 h-1 overflow-hidden rounded-full bg-[#1c232e]">
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(new Set(insts.map((i) => i.id)).size / ALL_FX.length) * 100}%`,
              background: "linear-gradient(90deg,#f5a63c,#ef5f8c,#37d6c4)",
            }} />
        </div>
        <div className="flex gap-1.5">
          <Btn size="sm" className="flex-1" onClick={() => {
            const missing = ALL_FX.filter((d) => !insts.some((i) => i.id === d.id));
            onChange([...insts, ...missing.map((d) => ({ ...makeInst(d.id), amount: 60 }))]);
          }}>
            <Icon name="layers" className="h-3.5 w-3.5" />未使用を全部追加
          </Btn>
          <Btn size="sm" onClick={() => onChange(insts.map((i) => ({ ...i, on: !i.on })))} title="全切り替え">
            <Icon name="eye" className="h-3.5 w-3.5" />
          </Btn>
        </div>
      </div>

      {browser && (
        <Browser
          onClose={() => setBrowser(false)}
          onAdd={(id) => onChange([...insts, makeInst(id)])}
          onAddAll={(ids) => onChange([...insts, ...ids.map((id) => makeInst(id))])}
        />
      )}
    </div>
  );
}

function IconBtn({ children, onClick, title, disabled, danger, accent }: {
  children: React.ReactNode; onClick: () => void; title: string; disabled?: boolean; danger?: boolean; accent?: string;
}) {
  return (
    <button type="button" title={title} disabled={disabled} onClick={onClick}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-[3px] text-[var(--ink3)] transition-all",
        "hover:bg-white/8 hover:text-[var(--ink)]",
        disabled && "pointer-events-none opacity-25",
        danger && "hover:bg-[#3a1620] hover:text-[var(--rose)]",
      )}
      style={accent ? { color: accent } : undefined}
    >
      {children}
    </button>
  );
}

function ParamRow({ p, value, onChange, accent }: { p: ParamSpec; value: any; onChange: (v: any) => void; accent: string }) {
  if (p.type === "range")
    return <Slider label={p.label} value={value} min={p.min} max={p.max} step={p.step} unit={p.unit} accent={accent} onChange={onChange} />;
  if (p.type === "color") return <ColorField label={p.label} value={value} onChange={onChange} />;
  if (p.type === "toggle") return <Toggle label={p.label} value={!!value} onChange={onChange} accent={accent} />;
  return <Select label={p.label} value={value} options={p.options} onChange={onChange} accent={accent} />;
}

// ============================================================
//  エフェクトブラウザ
// ============================================================
function Browser({ onClose, onAdd, onAddAll }: { onClose: () => void; onAdd: (id: string) => void; onAddAll: (ids: string[]) => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat | "all">("all");
  const [added, setAdded] = useState<string[]>([]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return ALL_FX.filter((d) => (cat === "all" || d.cat === cat))
      .filter((d) => !s || d.name.includes(s) || d.en.toLowerCase().includes(s) || d.id.includes(s) || d.desc.includes(s));
  }, [q, cat]);

  const grouped = useMemo(() => {
    const m = new Map<Cat, typeof list>();
    for (const d of list) {
      if (!m.has(d.cat)) m.set(d.cat, []);
      m.get(d.cat)!.push(d);
    }
    return m;
  }, [list]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog">
      <div className="absolute inset-0 bg-[#070a0f]/82 backdrop-blur-[3px]" onClick={onClose} />
      <div className="reveal relative flex h-full max-h-[860px] w-full max-w-5xl flex-col overflow-hidden rounded-[6px] border border-[var(--line2)] bg-[#12161f] shadow-[0_40px_120px_-40px_#000]">
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-[var(--amber)]/40 bg-[#1b1710] text-[var(--amber)]">
            <Icon name="wand" className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-pixel text-[17px] leading-none">エフェクトを追加</h3>
            <p className="mt-1 font-bit text-[9px] uppercase tracking-[0.16em] text-[var(--ink3)]">
              {ALL_FX.length} EFFECTS · {ALL_FX.filter((f) => f.animated).length} ANIMATED
            </p>
          </div>
          <div className="relative w-full max-w-[240px]">
            <Icon name="search" className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink3)]" />
            <input
              autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="名前・説明で検索"
              className="w-full rounded-[3px] border border-[var(--line2)] bg-[#0f131a] py-1.5 pl-7 pr-2 text-[12px] text-[var(--ink)] outline-none placeholder:text-[var(--ink3)] focus:border-[var(--amber)]"
            />
          </div>
          <Btn onClick={onClose} accent="#37d6c4" active={added.length > 0}>
            {added.length ? `完了 (${added.length})` : "閉じる"}
          </Btn>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-[var(--line)] bg-[#10141c] px-4 py-2">
          <Chip active={cat === "all"} onClick={() => setCat("all")} accent="#e9eef7">全て</Chip>
          {CAT_ORDER.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)} accent={CATS[c].color}>
              {CATS[c].label} <span className="ml-1 font-bit text-[8.5px] opacity-70">{ALL_FX.filter((f) => f.cat === c).length}</span>
            </Chip>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {!list.length && <p className="py-16 text-center text-[12px] text-[var(--ink3)]">該当するエフェクトがありません</p>}
          {CAT_ORDER.filter((c) => grouped.has(c)).map((c) => (
            <div key={c} className="mb-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-[1px]" style={{ background: CATS[c].color }} />
                <h4 className="font-pixel text-[13px]" style={{ color: CATS[c].color }}>{CATS[c].label}</h4>
                <span className="font-bit text-[9px] uppercase tracking-[0.18em] text-[var(--ink3)]">{CATS[c].en}</span>
                <span className="h-px flex-1 bg-[var(--line)]" />
                <Btn size="sm" onClick={() => { grouped.get(c)!.forEach((d) => { onAdd(d.id); setAdded((a) => [...a, d.id]); }); }}
                  accent={CATS[c].color}>
                  <Icon name="layers" className="h-3 w-3" />全て追加
                </Btn>
              </div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {grouped.get(c)!.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => { onAdd(d.id); setAdded((a) => [...a, d.id]); }}
                    className="group relative flex items-start gap-2.5 overflow-hidden rounded-[4px] border border-[var(--line)] bg-[#151a23] p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--line2)] hover:bg-[#1a212c]"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] border transition-transform group-hover:scale-110"
                      style={{ borderColor: `${CATS[c].color}44`, background: `${CATS[c].color}14`, color: CATS[c].color }}>
                      <Icon name={d.icon} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[12.5px] font-medium text-[var(--ink)]">{d.name}</span>
                        {d.animated && <span className="shrink-0 rounded-[2px] bg-[#0f2a2a] px-1 font-bit text-[8px] text-[var(--teal)]">ANIM</span>}
                      </span>
                      <span className="mt-0.5 block truncate font-bit text-[8.5px] uppercase tracking-[0.12em] text-[var(--ink3)]">{d.en}</span>
                      <span className="mt-1 block truncate text-[10.5px] text-[var(--ink3)]">{d.desc}</span>
                    </span>
                    <span className="absolute -right-6 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full opacity-0 blur-xl transition-opacity group-hover:opacity-100"
                      style={{ background: CATS[c].color }} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--line)] bg-[#0f131a] px-4 py-2.5">
          <p className="flex-1 font-bit text-[9px] uppercase tracking-[0.14em] text-[var(--ink3)]">
            {list.length} 件表示中 · クリックでスタック末尾に追加
          </p>
          <Btn size="sm" onClick={() => onAddAll(list.map((d) => d.id))} accent="#ef5f8c">
            <Icon name="layers" className="h-3.5 w-3.5" />表示中の {list.length} 種を一括追加
          </Btn>
          <Btn size="sm" active accent="#37d6c4" onClick={onClose}>完了</Btn>
        </div>
      </div>
    </div>
  );
}
