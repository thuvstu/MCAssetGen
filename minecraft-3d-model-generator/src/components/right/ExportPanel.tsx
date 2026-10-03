"use client";
import { useState } from "react";
import { bbmodel, download, javaModel } from "@/lib/export/formats";
import { exportGlb } from "@/lib/export/glb";
import { CLIPS, RANKS } from "@/lib/forge";
import { slug } from "@/lib/forge/util";
import { useForge } from "@/lib/store";
import { useDerived } from "../ForgeProvider";
import { Btn, Choice, Readout, Section, Toggle } from "../ui";

export default function ExportPanel() {
  const { gen, atlas, canvas } = useDerived();
  const p = useForge((s) => s.params);
  const set = useForge((s) => s.set);
  const say = useForge((s) => s.say);
  const [busy, setBusy] = useState(false);
  const name = slug(p.name);
  const clipCount = CLIPS.filter((c) => gen.groups.some((g) => (g.clips[c.id] ?? []).length) || (gen.rootClips[c.id] ?? []).length || (c.id === "idle" && (p.anim.spin || p.anim.bob))).length;
  const animated = gen.groups.filter((g) => Object.values(g.clips).some((v) => v.length)).length + 1;

  const doBb = () => {
    if (!canvas) return;
    const json = bbmodel(p, gen, atlas, canvas.toDataURL("image/png"));
    download(`${name}.bbmodel`, new Blob([JSON.stringify(json)], { type: "application/json" }));
    say(`.bbmodel を書き出しました（ボーン ${gen.groups.length + 1}・クリップ ${clipCount}）`);
  };
  const doJava = () => {
    download(`${name}.json`, new Blob([JSON.stringify(javaModel(p, gen, atlas), null, 2)], { type: "application/json" }));
    say("Java モデル JSON を書き出しました");
  };
  const doPng = () => {
    canvas?.toBlob((b) => b && download(`${name}_atlas.png`, b), "image/png");
    say(`アトラス PNG（${atlas.size}px）を書き出しました`);
  };
  const doGlb = async () => {
    setBusy(true);
    try {
      const n = await exportGlb(p, gen, atlas, canvas);
      say(`GLB を書き出しました（アニメーション ${n} 本）`);
    } catch (e) {
      say(`GLB の書き出しに失敗：${String(e).slice(0, 60)}`);
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(javaModel(p, gen, atlas), null, 2));
      say("Java モデル JSON をコピーしました");
    } catch {
      say("クリップボードへコピーできませんでした");
    }
  };

  return (
    <>
      <Section no="11" title="素材とUV" en="TEXTURE / UV">
        <div>
          <div className="mb-1 text-[12px] text-ink/80">テクスチャ解像度</div>
          <Choice
            cols={5}
            value={p.tex}
            onChange={(v) => set({ tex: v })}
            options={[
              { value: 0, label: "自動", sub: "AUTO" },
              { value: 32, label: "32", sub: "PX" },
              { value: 64, label: "64", sub: "PX" },
              { value: 128, label: "128", sub: "PX" },
              { value: 256, label: "256", sub: "PX" },
            ]}
          />
        </div>
        <div>
          <div className="mb-1 text-[12px] text-ink/80">展開図の割付</div>
          <Choice
            cols={3}
            value={p.layout}
            onChange={(v) => set({ layout: v })}
            options={[
              { value: "dense", label: "等密度", sub: "DENSE" },
              { value: "strip", label: "生成順", sub: "ORDERED" },
              { value: "grid", label: "均等枠", sub: "GRID" },
            ]}
          />
        </div>
        <Toggle label="同形・同色の要素でUVを共有" checked={p.share} onChange={(v) => set({ share: v })} />
        <p className="text-[10px] leading-[1.7] text-ink/60">
          等密度＝全要素を同じ px/unit で詰める（MC標準は 1px/unit）。自動は 2px/unit 以上を満たす最小サイズを選びます。
        </p>
      </Section>

      <Section no="12" title="書き出し" en="EXPORT">
        <button
          type="button"
          onClick={doBb}
          className="group flex w-full items-center gap-3 border border-ink bg-ink px-3 py-2.5 text-left text-paper transition-colors duration-100 hover:border-vermilion hover:bg-vermilion"
        >
          <span className="font-mono text-[10px] tracking-[0.1em] text-vermilion group-hover:text-paper">.bbmodel</span>
          <span className="flex-1">
            <span className="block text-[12px] tracking-[0.1em]">Blockbench プロジェクト</span>
            <span className="block text-[10px] text-paper/60">テクスチャ同梱・ボーン階層・アニメーション</span>
          </span>
          <span aria-hidden>↓</span>
        </button>
        <div className="grid grid-cols-3 gap-1.5">
          <Btn onClick={doJava}>Java JSON</Btn>
          <Btn onClick={doGlb} disabled={busy}>
            {busy ? "…" : "GLB"}
          </Btn>
          <Btn onClick={doPng}>PNG</Btn>
        </div>
        <Btn full onClick={copy}>
          Java JSON をコピー
        </Btn>
        <div className="space-y-1 pt-2">
          <Readout k="ELEMENTS" v={`${gen.boxes.length}（本体 ${gen.bodyCount}）`} />
          <Readout k="BONES / MOVING" v={`${gen.groups.length + 1} / ${animated}`} />
          <Readout k="CLIPS" v={CLIPS.filter((c) => gen.groups.some((g) => (g.clips[c.id] ?? []).length) || (gen.rootClips[c.id] ?? []).length).map((c) => c.name).join("・") || "待機"} />
          <Readout k="TIER" v={`${RANKS[p.tier].no}・${RANKS[p.tier].name}${p.overdrive ? " 極" : ""}`} />
          <Readout k="TEXTURE" v={`${atlas.size}×${atlas.size}`} />
        </div>
        {gen.boxes.length > 1200 && (
          <p className="border-l-2 border-vermilion bg-vermilion/8 py-1 pl-2 text-[10px] leading-[1.6] text-ink/75">
            要素 {gen.boxes.length} 個。表示が重い場合は効果の密度を下げるか、段階・限界突破を一段戻してください。
          </p>
        )}
        <p className="pt-1 text-[10px] leading-[1.75] text-ink/60">
          Java JSON は静止モデル（要素回転は 22.5° 刻み・単軸で互換）。テクスチャは <span className="font-mono">item/{name}</span> を参照するので、
          同名の PNG を <span className="font-mono">assets/…/textures/item/</span> に置いてください。
        </p>
      </Section>
    </>
  );
}
