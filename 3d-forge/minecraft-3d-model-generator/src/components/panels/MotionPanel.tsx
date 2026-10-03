"use client";
import { useForge } from "@/lib/store";
import { Section, Slider, Toggle } from "../ui";

export default function MotionPanel() {
  const p = useForge((s) => s.params);
  const setDeep = useForge((s) => s.setDeep);
  return (
    <>
      <Section no="08" title="動き" en="ANIMATION">
        <Toggle label="アニメーション（Space）" checked={p.anim.on} onChange={(v) => setDeep("anim", { on: v })} />
        <Slider label="ループ長" value={p.anim.loop} min={2} max={8} step={0.5} unit="秒" onChange={(v) => setDeep("anim", { loop: v })} />
        <Slider label="プレビュー速度" value={p.anim.speed} min={0.25} max={3} step={0.25} unit="×" onChange={(v) => setDeep("anim", { speed: v })} />
        <Slider label="本体の自転（周/ループ）" value={p.anim.spin} min={-3} max={3} step={1} unit="周" onChange={(v) => setDeep("anim", { spin: v })} />
        <Slider label="本体の上下動" value={p.anim.bob} min={0} max={12} unit="/8" onChange={(v) => setDeep("anim", { bob: v })} />
        <p className="text-[10px] leading-[1.75] text-ink/60">
          すべての動きは「ループ内の整数周期」で定義されるため、書き出した .bbmodel / GLB は継ぎ目なく循環します。
          自転を 0 にすると本体は静止し、効果だけが動きます。
        </p>
      </Section>
      <Section no="09" title="幻影" en="PHANTOM">
        <Slider label="残像の本数" value={p.view.phantom} min={0} max={5} unit="本" onChange={(v) => setDeep("view", { phantom: v })} />
        <Slider label="残像の間隔" value={p.view.phantomGap} min={2} max={12} unit="F" onChange={(v) => setDeep("view", { phantomGap: v })} />
        <p className="text-[10px] leading-[1.75] text-ink/60">
          残像は同一ジオメトリを共有したゴーストリグで、数フレーム前の姿勢を追います。攻撃クリップと同時に再生すると、
          振り抜かれた軌跡そのものが幻影として残ります。要素数 900 超では自動的にオフになります。
        </p>
      </Section>
      <Section no="10" title="表示" en="VIEW">
        <Slider label="発光の滲み（ブルーム）" value={p.view.bloom} min={0} max={2} step={0.1} onChange={(v) => setDeep("view", { bloom: v })} />
        <Slider label="発光の強さ" value={p.view.emissive} min={0} max={3} step={0.1} onChange={(v) => setDeep("view", { emissive: v })} />
        <Toggle label="シーム（要素の輪郭線）" checked={p.view.wire} onChange={(v) => setDeep("view", { wire: v })} />
        <Toggle label="床のグリッド" checked={p.view.grid} onChange={(v) => setDeep("view", { grid: v })} />
      </Section>
    </>
  );
}
