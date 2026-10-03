"use client";

import { useState } from "react";
import {
  MAGIC_AURAS,
  MAGIC_PARTICLES,
  MODEL_TYPE_ICONS,
  MODEL_TYPE_LABELS,
  STYLE_PRESETS,
  defaultSpec,
} from "@/lib/spec";
import type { ModelSpec, StylePreset, Tier } from "@/lib/spec";

interface Props {
  currentPreset: StylePreset;
  onSaved: (count: number) => void;
}

const SET_TYPES = ["sword", "spear", "mace", "grimoire"] as const;
const SET_TIERS: Tier[] = [3, 3, 4, 4];

export default function SetGenerator({ currentPreset, onSaved }: Props) {
  const [preset, setPreset] = useState<StylePreset>(currentPreset);
  const [working, setWorking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const generate = async () => {
    setWorking(true);
    setMsg(null);
    try {
      const p = STYLE_PRESETS[preset];
      const base = defaultSpec();
      p.apply(base);
      const seed = Math.floor(Math.random() * 1e6);
      const specs: ModelSpec[] = SET_TYPES.map((type, i) => {
        const s = { ...base };
        s.type = type;
        s.magic = p.magic;
        s.stylePreset = preset;
        s.name = `【${p.label}セット】${MODEL_TYPE_LABELS[type]}`;
        s.seed = seed + i * 101;
        s.tier = SET_TIERS[i];
        s.limitBreak = i === SET_TYPES.length - 1 ? 1 : 0;
        s.particles = MAGIC_PARTICLES[p.magic];
        s.aura = MAGIC_AURAS[p.magic];
        s.floating = i % 2 === 0 ? "shards" : "ring";
        s.animation = i % 2 === 0 ? "bob" : "pulse";
        s.decorations = ["gem", "runes", "wings", "halo"];
        s.glowIntensity = 0.7;
        return s;
      });

      await Promise.all(
        specs.map((s) =>
          fetch("/api/models", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: s.name, modelType: s.type, seed: s.seed, spec: s }),
          }),
        ),
      );
      setMsg(`${SET_TYPES.length} 種の${p.label}セットを保存しました`);
      onSaved(specs.length);
      window.setTimeout(() => setMsg(null), 2600);
    } catch {
      setMsg("セット生成に失敗しました");
      window.setTimeout(() => setMsg(null), 2600);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="border-b-2 border-[var(--color-line)] p-3">
      <h3 className="mb-2 font-pixel text-sm tracking-widest text-[var(--color-xp)]">テーマセット生成</h3>
      <p className="mb-2 text-[10px] leading-snug text-[var(--color-fog)]">
        同じテーマの {SET_TYPES.map((t) => MODEL_TYPE_LABELS[t]).join("・")} を T3〜T4 で一括生成しギャラリーに保存。
      </p>
      <select className="mb-2 w-full" value={preset} onChange={(e) => setPreset(e.target.value as StylePreset)}>
        {(Object.keys(STYLE_PRESETS) as StylePreset[]).map((p) => (
          <option key={p} value={p}>
            {STYLE_PRESETS[p].label} — {STYLE_PRESETS[p].blurb}
          </option>
        ))}
      </select>
      <button className="pixel-btn w-full bg-[var(--color-gold)] px-2 py-2 text-xs text-black" onClick={() => void generate()} disabled={working}>
        {working ? "生成中…" : `⚔ ${SET_TYPES.map((t) => MODEL_TYPE_ICONS[t]).join(" ")} 4種生成 & 保存`}
      </button>
      {msg ? (
        <div className="toast-pop mt-2 border-2 border-[var(--color-xp)] bg-[rgba(110,224,106,0.12)] px-2 py-1.5 text-center font-pixel text-xs text-[var(--color-xp)]">
          {msg}
        </div>
      ) : null}
    </div>
  );
}