"use client";
import { useState } from "react";
import { exportSet } from "@/lib/export/set";
import { FORM_LABELS, MODES, RANKS, SETS, kindById, themeById } from "@/lib/forge";
import { useForge } from "@/lib/store";
import { Section } from "../ui";

function TierLadder() {
  const p = useForge((s) => s.params);
  const morph = useForge((s) => s.morph);
  const rank = RANKS[p.tier];
  return (
    <>
      <div className="flex items-stretch gap-px border border-ink/25 bg-ink/20">
        {RANKS.map((r, i) => {
          const on = i === p.tier;
          const reached = i <= p.tier;
          return (
            <button
              key={r.no}
              type="button"
              onClick={() => morph({ tier: i, overdrive: i >= 5 && p.overdrive }, `段階 ${r.no}・${r.name} へ`)}
              aria-pressed={on}
              title={`${r.name} ${r.en}`}
              className={`relative flex-1 py-1.5 outline-none transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vermilion ${
                on ? "bg-ink text-paper" : reached ? "bg-brass/25 text-ink hover:bg-brass/40" : "bg-paper text-ink/45 hover:bg-paper2"
              }`}
            >
              <span className="block font-mono text-[13px] leading-none tabular-nums">{r.no}</span>
              <span className="mt-0.5 block font-display text-[11px] leading-none">{r.name}</span>
              {on && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-vermilion" />}
            </button>
          );
        })}
      </div>
      <p className="border-l-2 border-brass pl-2 text-[11px] leading-[1.7] text-ink/70">
        <span className="font-mono text-[10px] text-brass">{rank.en}</span>　{rank.note}
      </p>
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={p.tier >= 5}
          onClick={() => morph({ tier: p.tier + 1 }, `段階 ${RANKS[Math.min(5, p.tier + 1)].no}・${RANKS[Math.min(5, p.tier + 1)].name} へ強化`)}
          className="flex-1 border border-ink bg-ink px-3 py-2 text-[12px] tracking-[0.14em] text-paper transition-colors hover:border-brass hover:bg-brass hover:text-ink disabled:opacity-35 disabled:hover:bg-ink disabled:hover:text-paper"
        >
          ▲ 強化する
        </button>
        <button
          type="button"
          disabled={p.tier <= 0}
          onClick={() => morph({ tier: p.tier - 1, overdrive: false })}
          className="border border-ink/40 px-3 py-2 text-[12px] text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-35"
        >
          ▼
        </button>
      </div>
      <button
        type="button"
        disabled={p.tier < 5}
        onClick={() => morph({ overdrive: !p.overdrive }, p.overdrive ? "限界突破を解除しました" : "限界突破 ── 器が砕け、光が溢れる")}
        aria-pressed={p.overdrive}
        className={`relative w-full overflow-hidden border px-3 py-2.5 text-left transition-colors duration-150 disabled:opacity-40 ${
          p.overdrive ? "border-vermilion bg-vermilion text-white" : "border-vermilion/60 text-vermilion hover:bg-vermilion/10"
        }`}
      >
        <span className="flex items-baseline gap-2">
          <span className="font-display text-[15px] tracking-[0.18em]">限界突破</span>
          <span className="font-mono text-[9px] tracking-[0.2em] opacity-80">OVERDRIVE</span>
          <span className="ml-auto font-mono text-[10px]">{p.overdrive ? "● 発動中" : p.tier < 5 ? "段階V で解放" : "○ 待機"}</span>
        </span>
        <span className={`mt-0.5 block text-[10px] leading-snug ${p.overdrive ? "text-white/80" : "text-ink/55"}`}>
          亀裂・極環・昇る灰。配色は白熱し、効果は三割増しになる。
        </span>
      </button>
    </>
  );
}

export default function LineagePanel() {
  const p = useForge((s) => s.params);
  const morph = useForge((s) => s.morph);
  const applySetPiece = useForge((s) => s.applySetPiece);
  const activeSet = useForge((s) => s.activeSet);
  const say = useForge((s) => s.say);
  const [busy, setBusy] = useState<string | null>(null);
  const k = kindById(p.kind);
  const forms = FORM_LABELS[k.family];

  return (
    <>
      <Section no="05" title="段階強化" en={`TIER ${RANKS[p.tier].no}`}>
        <TierLadder />
      </Section>

      <Section no="06" title="形態変化" en="FORM">
        <div className="grid grid-cols-3 gap-px border border-ink/20 bg-ink/20">
          {forms.map((f, i) => {
            const on = i === p.form;
            return (
              <button
                key={f.sub}
                type="button"
                onClick={() => morph({ form: i }, `${f.label}形態へ`)}
                aria-pressed={on}
                className={`px-1 py-2 outline-none transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vermilion ${
                  on ? "bg-ink text-paper" : "bg-paper text-ink/75 hover:bg-paper2"
                }`}
              >
                <span className="block font-display text-[16px] leading-none">{f.label}</span>
                <span className={`mt-0.5 block font-mono text-[8px] tracking-[0.12em] ${on ? "text-paper/60" : "text-ink/45"}`}>{f.sub}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] leading-[1.7] text-ink/65">{forms[p.form].note}</p>
      </Section>

      <Section no="07" title="一時的モード" en="MODE">
        <div className="grid grid-cols-5 gap-px border border-ink/20 bg-ink/20">
          {MODES.map((m) => {
            const on = m.id === p.mode;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => morph({ mode: m.id }, m.id === "none" ? "通常状態へ" : `${m.name}モード`)}
                aria-pressed={on}
                title={`${m.name} — ${m.note}`}
                className={`py-2 outline-none transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vermilion ${
                  on ? "bg-vermilion text-white" : "bg-paper text-ink/70 hover:bg-paper2"
                }`}
              >
                <span className="block font-display text-[17px] leading-none">{m.glyph}</span>
                <span className={`mt-0.5 block font-mono text-[7px] tracking-[0.06em] ${on ? "text-white/70" : "text-ink/45"}`}>{m.en.slice(0, 6)}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] leading-[1.7] text-ink/65">
          <span className="font-display text-[13px] text-ink">{MODES.find((m) => m.id === p.mode)?.name}</span>　
          {MODES.find((m) => m.id === p.mode)?.note}
        </p>
      </Section>

      <Section no="08" title="一式" en={`SETS · ${SETS.length}`}>
        <p className="text-[11px] leading-[1.7] text-ink/65">
          同じ配色・段階・効果で揃えた別型の群。型を押すと、その一式の中で持ち替えます。
        </p>
        <div className="space-y-1.5">
          {SETS.map((s) => {
            const t = themeById(s.theme);
            const on = activeSet === s.id;
            return (
              <div key={s.id} className={`border transition-colors duration-100 ${on ? "border-ink bg-paper shadow-[2px_2px_0_rgba(21,19,15,0.8)]" : "border-ink/25"}`}>
                <button type="button" onClick={() => applySetPiece(s)} className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-paper2/70">
                  <span className="flex h-7 w-7 shrink-0 flex-wrap">
                    <span className="h-1/2 w-1/2" style={{ background: t.palette.base }} />
                    <span className="h-1/2 w-1/2" style={{ background: t.palette.metal }} />
                    <span className="h-1/2 w-1/2" style={{ background: t.palette.shade }} />
                    <span className="h-1/2 w-1/2" style={{ background: t.palette.glow }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-1.5">
                      <span className="font-display text-[14px] text-ink">{s.name}</span>
                      <span className="font-mono text-[8px] tracking-[0.14em] text-ink/45">{s.en}</span>
                      <span className="ml-auto font-mono text-[9px] text-brass">段階{RANKS[s.tier].no}</span>
                    </span>
                    <span className="block truncate text-[10px] text-ink/55">{s.caption}</span>
                  </span>
                </button>
                <div className="flex gap-px border-t border-ink/15 bg-ink/15">
                  {s.kinds.map((kid) => {
                    const kk = kindById(kid);
                    const cur = on && p.kind === kid;
                    return (
                      <button
                        key={kid}
                        type="button"
                        onClick={() => applySetPiece(s, kid)}
                        className={`flex-1 py-1 text-center transition-colors duration-100 ${cur ? "bg-vermilion text-white" : "bg-paper text-ink/70 hover:bg-paper2"}`}
                      >
                        <span className="block font-display text-[13px] leading-none">{kk.name}</span>
                        <span className={`font-mono text-[7px] tracking-[0.1em] ${cur ? "text-white/70" : "text-ink/40"}`}>{kk.en}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={async () => {
                      setBusy(s.id);
                      try {
                        const n = await exportSet(p, s, (nm, i, t) => say(`一式を書き出し中 ${i}/${t} — ${nm}`));
                        say(`「${s.name}」${n} 点を .bbmodel で書き出しました`);
                      } finally {
                        setBusy(null);
                      }
                    }}
                    title={`${s.name} の全 ${s.kinds.length} 点を .bbmodel で書き出す`}
                    className="shrink-0 bg-ink px-2 text-[10px] tracking-[0.1em] text-paper transition-colors hover:bg-brass hover:text-ink disabled:opacity-50"
                  >
                    {busy === s.id ? "…" : "一括↓"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}
