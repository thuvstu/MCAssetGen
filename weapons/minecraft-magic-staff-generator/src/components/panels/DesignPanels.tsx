import { RefreshCw, Pin } from "lucide-react";
import {
  ARTIFACT_FORMS, CORES, DESIGN_MOTIFS, EFFECT_PRESETS, ELEMENTS, FLOATERS, FLOATER_PATHS, GEM_CUTS, GRIP_STYLES,
  MATERIALS, MOUNTS, ORNAMENTS, OUTLINES, PALETTES, PARTICLES, PATTERNS, POMMELS, RARITIES,
  SHAPES, STAFF_TYPES, TEXTURE_FINISHES,
  type ArtifactFormId, type Config, type CoreId, type DesignMotifId, type EffectPresetId, type ElementId, type FloaterId,
  type FloaterPathId, type GemCutId, type GripStyleId, type MaterialId, type MountId, type OrnamentId,
  type OutlineId, type PaletteId, type ParticleId, type PatternId, type PommelId, type RarityId,
  type ShaftShapeId, type StaffTypeId, type TextureFinishId,
} from "../../engine/data";
import { applyDesignMotif, applyEffect, applyElement, applyPalette, applyType, generateName } from "../../engine/generator";
import type { Atelier } from "../../state/useAtelier";
import { StaticThumb } from "../Preview";
import { Chips, ColorField, Section, Slider, Toggle } from "../ui";

const PALETTE_KEYS = Object.keys(PALETTES) as (keyof typeof PALETTES)[];
const TRIM_CHOICES: MaterialId[] = ["gold", "iron", "netherite", "amethyst", "quartz", "copper", "diamond", "emerald", "obsidian", "bone"];

type Props = {
  atelier: Atelier;
  typeThumbs: readonly (readonly [StaffTypeId, Config])[];
};

export function IdentityPanel({ atelier, typeThumbs }: Props) {
  const { config, commit, patch } = atelier;
  const element = ELEMENTS[config.element];
  return (
    <>
      <Section title={`スタッフの型 · ${Object.keys(STAFF_TYPES).length}種`}>
        <div className="type-grid">
          {typeThumbs.map(([type, thumb]) => (
            <button
              key={type}
              className={config.type === type ? "type-card on" : "type-card"}
              onClick={() => commit((prev) => { const next = applyType(prev, type); return { ...next, name: generateName(next) }; })}
            >
              <StaticThumb cfg={thumb} className="px" />
              <b>{STAFF_TYPES[type].label}</b>
              <small>{STAFF_TYPES[type].desc}</small>
            </button>
          ))}
        </div>
      </Section>

      <Section title={`属性 · ${Object.keys(ELEMENTS).length}種`}>
        <div className="element-grid">
          {(Object.keys(ELEMENTS) as ElementId[]).map((id) => (
            <button
              key={id}
              className={config.element === id ? "on" : ""}
              style={{ ["--c1" as string]: ELEMENTS[id].core, ["--c2" as string]: ELEMENTS[id].energy }}
              onClick={() => commit((prev) => { const next = applyElement(prev, id); return { ...next, name: generateName(next) }; })}
            >
              <span className="el-ico" aria-hidden="true">{ELEMENTS[id].icon}</span>
              <b>{ELEMENTS[id].label}</b>
            </button>
          ))}
        </div>
      </Section>

      <Section title="レアリティ">
        <div className="rarity-row">
          {(Object.keys(RARITIES) as RarityId[]).map((id) => (
            <button
              key={id}
              className={config.rarity === id ? "on" : ""}
              style={{ ["--rc" as string]: RARITIES[id].color }}
              onClick={() => commit((prev) => { const next = { ...prev, rarity: id }; return { ...next, name: generateName(next) }; })}
            >
              {RARITIES[id].label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="銘（アイテム名）" extra={<button className="mini" onClick={() => patch("name", generateName(config, Math.floor(Math.random() * 1e6)))}><RefreshCw size={11} />再命名</button>}>
        <input className="text-input" value={config.name} onChange={(event) => patch("name", event.target.value)} aria-label="アイテム名" />
        <p className="note">{element.stat} · {element.ability}</p>
      </Section>
    </>
  );
}

export function ShaftPanel({ atelier }: { atelier: Atelier }) {
  const { config, patch } = atelier;
  return (
    <>
      <Section title="シルエットと寸法">
        <Chips cols={3} value={config.shape} onChange={(v: ShaftShapeId) => patch("shape", v)} options={(Object.keys(SHAPES) as ShaftShapeId[]).map((s) => [s, SHAPES[s]])} />
        <Slider label="柄の太さ" value={config.thickness} min={1} max={6} onChange={(v) => patch("thickness", v)} format={(v) => (v === 1 ? "1px 極細" : v === 2 ? "2px 標準" : `${v}px`)} />
        <Slider label="全長" value={config.length} min={0.4} max={1} step={0.01} onChange={(v) => patch("length", v)} format={(v) => `${Math.round(v * 100)}%`} />
        <Toggle label="テーパー" hint="根元へ向けて細く絞る" value={config.taper} onChange={(v) => patch("taper", v)} />
      </Section>

      <Section title={`シャフト素材 · ${Object.keys(MATERIALS).length}種`}>
        <Chips cols={3} value={config.shaftMaterial} onChange={(v: MaterialId) => patch("shaftMaterial", v)} options={(Object.keys(MATERIALS) as MaterialId[]).map((m) => [m, <><i className="dot" style={{ background: MATERIALS[m].color }} />{MATERIALS[m].label}</>])} />
      </Section>

      <Section title={`表面の彫金・模様 · ${Object.keys(PATTERNS).length}種`}>
        <Chips cols={3} value={config.pattern} onChange={(v: PatternId) => patch("pattern", v)} options={(Object.keys(PATTERNS) as PatternId[]).map((p) => [p, PATTERNS[p]])} />
      </Section>

      <Section title="装飾金具とグリップ">
        <Slider label="装飾リング" value={config.bands} min={0} max={4} onChange={(v) => patch("bands", v)} />
        <Chips cols={3} value={config.trimMaterial} onChange={(v: MaterialId) => patch("trimMaterial", v)} options={TRIM_CHOICES.map((m) => [m, <><i className="dot" style={{ background: MATERIALS[m].color }} />{MATERIALS[m].label}</>])} />
        <Toggle label="グリップ" hint="握り部分の装飾を付ける" value={config.grip} onChange={(v) => patch("grip", v)} />
        {config.grip && (
          <>
            <Chips cols={5} value={config.gripStyle} onChange={(v: GripStyleId) => patch("gripStyle", v)} options={(Object.keys(GRIP_STYLES) as GripStyleId[]).map((g) => [g, GRIP_STYLES[g]])} />
            <ColorField label="グリップ色" value={config.gripColor} onChange={(v) => patch("gripColor", v)} />
          </>
        )}
      </Section>

      <Section title={`石突き · ${Object.keys(POMMELS).length}種`}>
        <Chips cols={4} value={config.pommel} onChange={(v: PommelId) => patch("pommel", v)} options={(Object.keys(POMMELS) as PommelId[]).map((p) => [p, POMMELS[p]])} />
      </Section>
    </>
  );
}

export function HeadPanel({ atelier }: { atelier: Atelier }) {
  const { config, commit, patch } = atelier;
  return (
    <>
      <Section title="デザインミックス">
        <div className="motif-grid">
          {(Object.keys(DESIGN_MOTIFS) as DesignMotifId[]).map((m) => (
            <button key={m} className={config.motif === m ? "on" : ""} onClick={() => { commit((prev: Config) => applyDesignMotif(prev, m)); }}>
              <b>{DESIGN_MOTIFS[m].label}</b>
              <small>{DESIGN_MOTIFS[m].desc}</small>
            </button>
          ))}
        </div>
        <p className="note">バニラの細い棒、微細な改変を足したバニラ＋、ルビー等の工具系まで一括で切り替わります。</p>
      </Section>

      <Section title="自由構成 · 型に囚われない輪郭">
        <Chips cols={2} value={config.form} onChange={(v: ArtifactFormId) => patch("form", v)} options={(Object.keys(ARTIFACT_FORMS) as ArtifactFormId[]).map((f) => [f, ARTIFACT_FORMS[f]])} />
      </Section>

      <Section title={`台座（マウント） · ${Object.keys(MOUNTS).length}種`}>
        <Chips cols={3} value={config.mount} onChange={(v: MountId) => patch("mount", v)} options={(Object.keys(MOUNTS) as MountId[]).map((m) => [m, MOUNTS[m]])} />
      </Section>

      <Section title={`先端コア · ${Object.keys(CORES).length}種`}>
        <Chips cols={3} value={config.core} onChange={(v: CoreId) => patch("core", v)} options={(Object.keys(CORES) as CoreId[]).map((c) => [c, CORES[c]])} />
        <Slider label="サイズ" value={config.coreSize} min={0.6} max={1.5} step={0.05} onChange={(v) => patch("coreSize", v)} format={(v) => `${Math.round(v * 100)}%`} />
        <Toggle label="浮遊" hint="台座から離れて上下に揺れる" value={config.floatingCore} onChange={(v) => patch("floatingCore", v)} />
      </Section>

      <Section title={`宝石カット · ${Object.keys(GEM_CUTS).length}種`}>
        <Chips cols={3} value={config.gemCut} onChange={(v: GemCutId) => patch("gemCut", v)} options={(Object.keys(GEM_CUTS) as GemCutId[]).map((g) => [g, GEM_CUTS[g]])} />
        <Slider label="副宝石（メレ石）" value={config.accentGems} min={0} max={7} onChange={(v) => patch("accentGems", v)} format={(v) => `${v}石`} />
      </Section>

      <Section title={`頭部フィニアル装飾 · ${Object.keys(ORNAMENTS).length}種`}>
        <Chips cols={3} value={config.ornament} onChange={(v: OrnamentId) => patch("ornament", v)} options={(Object.keys(ORNAMENTS) as OrnamentId[]).map((o) => [o, ORNAMENTS[o]])} />
        <Slider label="装飾の広がり" value={config.ornamentScale} min={0.65} max={1.45} step={0.05} onChange={(v) => patch("ornamentScale", v)} format={(v) => `${Math.round(v * 100)}%`} />
      </Section>

      <Section title={`浮遊物 · ${Object.keys(FLOATERS).length}種`}>
        <Chips cols={3} value={config.floater} onChange={(v: FloaterId) => patch("floater", v)} options={(Object.keys(FLOATERS) as FloaterId[]).map((f) => [f, FLOATERS[f]])} />
        {config.floater !== "none" && config.floater !== "halo" && (
          <>
            <Chips cols={4} value={config.floaterPath} onChange={(v: FloaterPathId) => patch("floaterPath", v)} options={(Object.keys(FLOATER_PATHS) as FloaterPathId[]).map((p) => [p, FLOATER_PATHS[p]])} />
            <Slider label="個数" value={config.floaterCount} min={1} max={8} onChange={(v) => patch("floaterCount", v)} />
            <Slider label="軌道半径" value={config.floaterRadius} min={0.6} max={1.8} step={0.05} onChange={(v) => patch("floaterRadius", v)} format={(v) => `${Math.round(v * 100)}%`} />
          </>
        )}
      </Section>
    </>
  );
}

export function ColorPanel({ atelier }: { atelier: Atelier }) {
  const { config, commit, patch } = atelier;
  const element = ELEMENTS[config.element];
  return (
    <>
      <Section title={`配色スキーム · ${PALETTE_KEYS.length + 1}種`}>
        <div className="palette-grid">
          <button className={config.palette === "element" ? "on" : ""} onClick={() => commit((prev) => applyPalette(prev, "element"))} style={{ ["--c1" as string]: element.core, ["--c2" as string]: element.energy }}>
            <span className="pg-swatch" /><b>属性連動</b>
          </button>
          {PALETTE_KEYS.map((key) => (
            <button key={key} className={config.palette === key ? "on" : ""} onClick={() => commit((prev) => applyPalette(prev, key as PaletteId))} style={{ ["--c1" as string]: PALETTES[key].core, ["--c2" as string]: PALETTES[key].energy }}>
              <span className="pg-swatch" /><b>{PALETTES[key].label}</b>
            </button>
          ))}
        </div>
      </Section>

      <Section title="個別カラー調合" extra={<button className="mini" onClick={() => commit((prev) => ({ ...prev, palette: "custom" }))}><Pin size={11} />カスタム固定</button>}>
        <ColorField label="コア（主石）" value={config.coreColor} onChange={(v) => commit((prev) => ({ ...prev, palette: "custom", coreColor: v }))} />
        <ColorField label="魔力（光彩）" value={config.energyColor} onChange={(v) => commit((prev) => ({ ...prev, palette: "custom", energyColor: v }))} />
      </Section>

      <Section title={`パーティクル · ${Object.keys(PARTICLES).length}種`}>
        <Chips cols={4} value={config.particle} onChange={(v: ParticleId) => patch("particle", v)} options={(Object.keys(PARTICLES) as ParticleId[]).map((p) => [p, PARTICLES[p]])} />
      </Section>
    </>
  );
}

export function EffectPanel({ atelier }: { atelier: Atelier }) {
  const { config, commit, patch } = atelier;
  const tune = <K extends keyof Config>(key: K, value: Config[K]) => commit((prev) => ({ ...prev, effectPreset: undefined, [key]: value }));
  return (
    <>
      <Section title={`エフェクトプリセット · ${Object.keys(EFFECT_PRESETS).length}種`}>
        <div className="preset-grid">
          {(Object.keys(EFFECT_PRESETS) as EffectPresetId[]).map((id) => (
            <button key={id} className={config.effectPreset === id ? "on" : ""} onClick={() => commit((prev) => applyEffect(prev, id))}>
              <b>{EFFECT_PRESETS[id].label}</b>
              <small>{EFFECT_PRESETS[id].desc}</small>
            </button>
          ))}
        </div>
      </Section>

      <Section title="ピクセル素材仕上げ">
        <div className="finish-grid">
          {(Object.keys(TEXTURE_FINISHES) as TextureFinishId[]).map((finish) => (
            <button key={finish} className={config.finish === finish ? "on" : ""} onClick={() => patch("finish", finish)}>
              <b>{TEXTURE_FINISHES[finish].label}</b>
              <small>{TEXTURE_FINISHES[finish].desc}</small>
            </button>
          ))}
        </div>
        <p className="note">色数・素材痕・刻線の密度をピクセル規則として制御します。ゲーム内での判別性に直結する項目です。</p>
      </Section>

      <Section title="発光と星芒">
        <Slider label="グロー強度" value={config.glow} min={0} max={100} onChange={(v) => tune("glow", v)} format={(v) => `${v}%`} />
        <Slider label="グロー半径" value={config.glowRadius} min={2} max={9} onChange={(v) => tune("glowRadius", v)} />
        <Toggle label="ディザリング" hint="4×4ベイヤーで滑らかに階調化" value={config.dither} onChange={(v) => patch("dither", v)} />
        <Toggle label="脈動・星芒スパークル" hint="宝石に十字と斜めのクロスフレア" value={config.pulse} onChange={(v) => patch("pulse", v)} />
      </Section>

      <Section title="プラスエフェクト（全体散布）">
        <Slider label="散布" value={config.scatter} min={0} max={100} onChange={(v) => tune("scatter", v)} format={(v) => `${v}%`} />
        <Slider label="煌めき" value={config.sparkle} min={0} max={100} onChange={(v) => tune("sparkle", v)} format={(v) => `${v}%`} />
        <Slider label="漂い" value={config.drift} min={0} max={100} onChange={(v) => tune("drift", v)} format={(v) => `${v}%`} />
        <p className="note">キャンバス全体に装飾・光・微塵を散らします。個別にオン/オフや強度調整が可能です。</p>
      </Section>

      <Section title="装飾エフェクト">
        <Toggle label="リムライト" hint="縁を魔力色で照らす" value={config.rimLight} onChange={(v) => patch("rimLight", v)} />
        <Toggle label="オーラ" hint="輪郭を薄くなぞる光" value={config.aura} onChange={(v) => patch("aura", v)} />
        <Toggle label="光線（レイ）" hint="宝石から伸びる短い光条" value={config.rays} onChange={(v) => patch("rays", v)} />
        <Toggle label="魔力の螺旋" hint="柄に巻き付くエネルギー" value={config.trail} onChange={(v) => patch("trail", v)} />
        <Toggle label="エンチャントグリント" hint="Minecraft風の光沢帯" value={config.glint} onChange={(v) => patch("glint", v)} />
        <Toggle label="魔法陣" hint="先端背後で回転する二重環" value={config.magicCircle} onChange={(v) => patch("magicCircle", v)} />
        <Toggle label="金属スペキュラ" hint="金具のハイライト反射" value={config.specular} onChange={(v) => patch("specular", v)} />
        <Toggle label="輪郭アンチエイリアス" hint="斜め線をなめらかに整える" value={config.aa} onChange={(v) => patch("aa", v)} />
        <Slider label="パーティクル量" value={config.particles} min={0} max={100} onChange={(v) => patch("particles", v)} format={(v) => `${v}%`} />
      </Section>

      <Section title="アウトライン">
        <Chips cols={4} value={config.outline} onChange={(v: OutlineId) => patch("outline", v)} options={(Object.keys(OUTLINES) as OutlineId[]).map((o) => [o, OUTLINES[o]])} />
      </Section>
    </>
  );
}
