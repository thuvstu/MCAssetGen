import { useEffect, useMemo, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { ARCHETYPES, getArchetype } from "@/data/archetypes";
import {
  ABILITIES,
  BEHAVIORS,
  BIOME_TAGS,
  BIOMES,
  CATEGORY_LABEL,
  DIMENSIONS,
  GROUP_LABEL,
  ITEMS,
  PALETTES,
  PARTICLES,
  RARITY_LABEL,
  SOUND_SETS,
  TEMPERAMENT_LABEL,
} from "@/data/catalog";
import {
  EXPORT_TABS,
  REALITY_REPORT,
  buildMcaddon,
  buildPack,
  renderExport,
  type ExportKind,
} from "@/lib/export";
import { BattleArena } from "@/components/BattleArena";
import { TexturePainter } from "@/components/TexturePainter";
import { soundSynth } from "@/lib/audio";
import {
  abilityTuning,
  applyArchetype,
  applyPalette,
  applyVariant,
  completeness,
  estimateHitbox,
  isPartOn,
  isValidId,
  isValidModId,
  rankOf,
  rankTone,
  combatScore,
  vanillaNote,
  warningsOf,
} from "@/lib/model";
import { drawBoxUVTexture } from "@/lib/boxuv";
import { buildFabric12111Zip } from "@/lib/fabric12111";
import type { Category, MobDraft, Rarity, Temperament, Vec3 } from "@/types";
import { SpawnEgg } from "@/components/SpawnEgg";
import { cn } from "@/utils/cn";

export type TabId = "form" | "look" | "paint" | "combat" | "arena" | "mind" | "spawn" | "loot" | "export";

const TABS: { id: TabId; label: string }[] = [
  { id: "form", label: "型紙" },
  { id: "look", label: "外見" },
  { id: "paint", label: "ペイント" },
  { id: "combat", label: "戦闘" },
  { id: "arena", label: "実戦模擬" },
  { id: "mind", label: "知能" },
  { id: "spawn", label: "出現" },
  { id: "loot", label: "報酬・音" },
  { id: "export", label: "出力" },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium text-cream/80">{label}</span>
        {hint && <span className="font-mono text-[10px] text-muted">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

function Slider({
  value,
  min,
  max,
  step,
  onChange,
  digits = 2,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  digits?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        className="mf-range flex-1"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="w-12 text-right font-mono text-[11px] text-gold">{value.toFixed(digits)}</span>
    </div>
  );
}

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] transition",
        on ? "border-emerald/50 bg-emerald/15 text-emerald" : "border-line bg-ink/40 text-muted hover:text-cream",
      )}
    >
      {label}
    </button>
  );
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-md border border-line bg-ink/70 px-2 py-1.5 text-sm text-cream outline-none placeholder:text-muted/60 focus:border-emerald/60",
        props.className,
      )}
    />
  );
}

export function Inspector({
  mob,
  onChange,
  tab,
  setTab,
  selectedPart,
  onSelectPart,
  onToast,
}: {
  mob: MobDraft;
  onChange: (patch: Partial<MobDraft>) => void;
  tab: TabId;
  setTab: (t: TabId) => void;
  selectedPart: string | null;
  onSelectPart: (id: string) => void;
  onToast: (s: string) => void;
}) {
  const score = combatScore(mob);
  const rank = rankOf(score);
  const done = completeness(mob);
  const [pendingArch, setPendingArch] = useState<string | null>(null);
  const [partQuery, setPartQuery] = useState("");

  useEffect(() => {
    if (!selectedPart) return;
    document.getElementById(`part-${selectedPart}`)?.scrollIntoView({ block: "nearest" });
  }, [selectedPart, tab]);

  const setNum = (key: keyof MobDraft, n: number) => onChange({ [key]: n } as Partial<MobDraft>);

  return (
    <div className="flex h-full min-h-0 flex-col bg-panel">
      <div className="border-b border-line p-3">
        <div className="flex items-start gap-3">
          <SpawnEgg base={mob.eggBase} spots={mob.eggSpots} size={42} />
          <div className="min-w-0 flex-1">
            <input
              value={mob.displayName}
              onChange={(e) => onChange({ displayName: e.target.value })}
              className="w-full bg-transparent text-lg font-black tracking-tight text-cream outline-none"
            />
            <input
              value={mob.displayNameEn}
              onChange={(e) => onChange({ displayNameEn: e.target.value })}
              placeholder="English name"
              className="mt-0.5 w-full bg-transparent text-xs text-muted outline-none"
            />
          </div>
          <div className={cn("rounded-md px-2 py-1 text-center font-mono text-xs ring-1", rankTone(rank))}>
            <div className="text-sm font-black">{rank}</div>
            <div className="text-[9px] opacity-80">{score}</div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1 font-mono text-[11px]">
          <input
            value={mob.modId}
            onChange={(e) => onChange({ modId: e.target.value.toLowerCase() })}
            className={cn("w-24 rounded bg-ink/70 px-1.5 py-1 outline-none", isValidModId(mob.modId) ? "text-cream" : "text-rose")}
          />
          <span className="text-muted">:</span>
          <input
            value={mob.entityId}
            onChange={(e) => onChange({ entityId: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
            className={cn("min-w-0 flex-1 rounded bg-ink/70 px-1.5 py-1 outline-none", isValidId(mob.entityId) ? "text-cream" : "text-rose")}
          />
        </div>
        <textarea
          value={mob.summary}
          onChange={(e) => onChange({ summary: e.target.value })}
          placeholder="このモブは何者で、プレイヤーに何をさせるか。"
          rows={2}
          className="mt-2 w-full resize-none rounded-md border border-line bg-ink/50 px-2 py-1.5 text-xs leading-relaxed text-cream outline-none focus:border-emerald/50"
        />
        <div className="mt-2 flex items-center gap-2 text-[10px] text-muted">
          <span>完成度 {done.score}%</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink">
            <div className="h-full bg-emerald" style={{ width: `${done.score}%` }} />
          </div>
          {done.missing.length > 0 && <span>残り {done.missing.slice(0, 3).join("・")}</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-line px-2 py-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md px-2 py-1 text-[11px]",
              tab === t.id ? "bg-emerald text-ink font-bold" : "text-muted hover:bg-white/5 hover:text-cream",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mf-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "form" && (
          <FormTab
            mob={mob}
            onChange={onChange}
            selectedPart={selectedPart}
            onSelectPart={onSelectPart}
            partQuery={partQuery}
            setPartQuery={setPartQuery}
            pendingArch={pendingArch}
            setPendingArch={setPendingArch}
          />
        )}
        {tab === "look" && <LookTab mob={mob} onChange={onChange} />}
        {tab === "paint" && <TexturePainter mob={mob} onChange={onChange} />}
        {tab === "combat" && <CombatTab mob={mob} onChange={onChange} setNum={setNum} />}
        {tab === "arena" && <BattleArena mob={mob} />}
        {tab === "mind" && <MindTab mob={mob} onChange={onChange} />}
        {tab === "spawn" && <SpawnTab mob={mob} onChange={onChange} />}
        {tab === "loot" && <LootTab mob={mob} onChange={onChange} />}
        {tab === "export" && <ExportTab mob={mob} onToast={onToast} />}
      </div>
    </div>
  );
}

function FormTab({
  mob,
  onChange,
  selectedPart,
  onSelectPart,
  partQuery,
  setPartQuery,
  pendingArch,
  setPendingArch,
}: {
  mob: MobDraft;
  onChange: (p: Partial<MobDraft>) => void;
  selectedPart: string | null;
  onSelectPart: (id: string) => void;
  partQuery: string;
  setPartQuery: (s: string) => void;
  pendingArch: string | null;
  setPendingArch: (s: string | null) => void;
}) {
  const arch = getArchetype(mob.archetype);
  const parts = arch.parts.filter((p) => !partQuery || p.name.includes(partQuery) || p.id.includes(partQuery));
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-[11px] text-muted">型を変えると部位構成が初期化されます。名前と色は残します。</div>
        <div className="grid grid-cols-4 gap-1">
          {ARCHETYPES.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => (a.id === mob.archetype ? null : setPendingArch(a.id))}
              className={cn(
                "rounded-md border px-1 py-1.5 text-[11px]",
                a.id === mob.archetype ? "border-emerald/60 bg-emerald/10 text-emerald" : "border-line text-muted hover:text-cream",
              )}
            >
              <span className="mr-1 font-black text-gold">{a.mark}</span>
              {a.name}
            </button>
          ))}
        </div>
        {pendingArch && (
          <div className="mt-2 rounded-md border border-gold/40 bg-gold/10 p-2 text-xs text-cream">
            「{getArchetype(pendingArch as MobDraft["archetype"]).name}」に変えますか。部位と数値は型の初期値に戻り、名前と色は残します。
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="rounded bg-gold px-2 py-1 text-[11px] font-bold text-ink"
                onClick={() => {
                  onChange(applyArchetype(mob, pendingArch as MobDraft["archetype"]));
                  setPendingArch(null);
                }}
              >
                変更する
              </button>
              <button type="button" className="text-[11px] text-muted" onClick={() => setPendingArch(null)}>
                やめる
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-1 text-[11px] font-medium text-cream/80">変種</div>
        <p className="mb-2 text-[10px] text-muted">選ぶと部位のオンオフと比率、全体スケールが型の値に戻ります。</p>
        <div className="space-y-1.5">
          {arch.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onChange(applyVariant(mob, v.id))}
              className={cn(
                "flex w-full items-start justify-between rounded-md border px-2 py-2 text-left",
                mob.variant === v.id ? "border-emerald/50 bg-emerald/10" : "border-line hover:border-white/20",
              )}
            >
              <span>
                <span className="text-sm font-bold text-cream">{v.name}</span>
                <span className="mt-0.5 block text-[11px] text-muted">{v.blurb}</span>
              </span>
              <span className="font-mono text-[10px] text-gold">×{v.scale}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <TextInput value={partQuery} onChange={(e) => setPartQuery(e.target.value)} placeholder="部位を検索" />
        <button
          type="button"
          className="shrink-0 rounded-md border border-line px-2 py-1.5 text-[11px] text-muted hover:text-cream"
          onClick={() => onChange(applyVariant(mob, mob.variant))}
        >
          比率を戻す
        </button>
      </div>

      <div className="space-y-2">
        {(["head", "body", "arm", "leg", "wing", "tail", "extra"] as const).map((group) => {
          const list = parts.filter((p) => p.group === group);
          if (!list.length) return null;
          return (
            <div key={group}>
              <div className="mb-1 text-[10px] tracking-widest text-muted">{GROUP_LABEL[group]}</div>
              <div className="space-y-1">
                {list.map((part) => {
                  const on = isPartOn(mob, part);
                  const scale = mob.partScale[part.id] ?? [1, 1, 1];
                  const open = selectedPart === part.id;
                  return (
                    <div
                      id={`part-${part.id}`}
                      key={part.id}
                      className={cn("rounded-md border", open ? "border-emerald/50 bg-emerald/5" : "border-line bg-ink/30")}
                    >
                      <div className="flex items-center gap-2 px-2 py-1.5">
                        <button
                          type="button"
                          className="h-4 w-4 rounded-sm border border-white/20"
                          style={{ background: mob.partTint[part.id] || mob.colors[part.slot] }}
                          onClick={() => onSelectPart(part.id)}
                        />
                        <button type="button" className="min-w-0 flex-1 truncate text-left text-xs text-cream" onClick={() => onSelectPart(part.id)}>
                          {part.name}
                          {part.optional && <span className="ml-1 text-[9px] text-gold">任意</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => onChange({ partEnabled: { ...mob.partEnabled, [part.id]: !on } })}
                          className={cn("text-[10px]", on ? "text-emerald" : "text-muted")}
                        >
                          {on ? "ON" : "OFF"}
                        </button>
                      </div>
                      {open && (
                        <div className="space-y-2 border-t border-line px-2 py-2">
                          <Field label="色の上書き" hint={part.slot}>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={mob.partTint[part.id] || mob.colors[part.slot]}
                                onChange={(e) => onChange({ partTint: { ...mob.partTint, [part.id]: e.target.value } })}
                                className="h-7 w-8 cursor-pointer bg-transparent"
                              />
                              <button
                                type="button"
                                className="text-[10px] text-muted"
                                onClick={() => {
                                  const next = { ...mob.partTint };
                                  delete next[part.id];
                                  onChange({ partTint: next });
                                }}
                              >
                                スロット色に戻す
                              </button>
                            </div>
                          </Field>
                          {(["幅", "高さ", "奥行"] as const).map((label, i) => (
                            <Field key={label} label={label}>
                              <Slider
                                value={scale[i]}
                                min={0.35}
                                max={2.2}
                                step={0.05}
                                digits={2}
                                onChange={(n) => {
                                  const next: Vec3 = [...scale] as Vec3;
                                  next[i] = n;
                                  onChange({ partScale: { ...mob.partScale, [part.id]: next } });
                                }}
                              />
                            </Field>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LookTab({ mob, onChange }: { mob: MobDraft; onChange: (p: Partial<MobDraft>) => void }) {
  const slots = [
    ["primary", "主色"],
    ["secondary", "副色"],
    ["accent", "差し色"],
    ["skin", "地色"],
    ["eye", "目"],
    ["detail", "陰影"],
  ] as const;
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-[11px] text-muted">パレットは 6 色と卵色をまとめて置き、部位ごとの上書きを消します。</div>
        <div className="flex flex-wrap gap-1.5">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(applyPalette(mob, p.id))}
              className="flex items-center gap-1 rounded-full border border-line px-2 py-1 text-[11px] text-cream hover:border-emerald/40"
            >
              <span className="h-3 w-3 rounded-full" style={{ background: p.primary }} />
              <span className="h-3 w-3 rounded-full" style={{ background: p.accent }} />
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {slots.map(([key, label]) => (
          <Field key={key} label={label}>
            <div className="flex items-center gap-2 rounded-md border border-line bg-ink/60 px-2 py-1">
              <input
                type="color"
                value={mob.colors[key]}
                onChange={(e) => onChange({ colors: { ...mob.colors, [key]: e.target.value } })}
                className="h-6 w-6 cursor-pointer bg-transparent"
              />
              <input
                value={mob.colors[key]}
                onChange={(e) => onChange({ colors: { ...mob.colors, [key]: e.target.value } })}
                className="w-full bg-transparent font-mono text-[11px] uppercase text-cream outline-none"
              />
            </div>
          </Field>
        ))}
      </div>
      <div className="flex items-center gap-3 rounded-md border border-line bg-ink/40 p-2">
        <SpawnEgg base={mob.eggBase} spots={mob.eggSpots} size={48} />
        <div className="grid flex-1 grid-cols-2 gap-2">
          <Field label="卵の地">
            <input type="color" value={mob.eggBase} onChange={(e) => onChange({ eggBase: e.target.value })} className="h-7 w-full cursor-pointer bg-transparent" />
          </Field>
          <Field label="卵の斑">
            <input type="color" value={mob.eggSpots} onChange={(e) => onChange({ eggSpots: e.target.value })} className="h-7 w-full cursor-pointer bg-transparent" />
          </Field>
        </div>
      </div>
      <Field label="全体スケール" hint="1 = 型の等倍">
        <Slider value={mob.scale} min={0.4} max={3} step={0.05} onChange={(n) => onChange({ scale: n })} />
      </Field>
      <div className="flex flex-wrap gap-1.5">
        <Toggle on={mob.glow} label="発光" onClick={() => onChange({ glow: !mob.glow })} />
        <Toggle on={mob.translucent} label="半透明" onClick={() => onChange({ translucent: !mob.translucent })} />
      </div>
      <div>
        <div className="mb-1 text-[11px] text-cream/80">パーティクル</div>
        <div className="flex flex-wrap gap-1">
          {PARTICLES.map((p) => (
            <Toggle key={p.id} on={mob.particles === p.id} label={p.name} onClick={() => onChange({ particles: p.id })} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CombatTab({
  mob,
  onChange,
  setNum,
}: {
  mob: MobDraft;
  onChange: (p: Partial<MobDraft>) => void;
  setNum: (k: keyof MobDraft, n: number) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted">{vanillaNote(mob)}。数値は属性そのものです。</p>
      <div className="flex flex-wrap gap-1">
        {(Object.keys(TEMPERAMENT_LABEL) as Temperament[]).map((t) => (
          <Toggle key={t} on={mob.temperament === t} label={TEMPERAMENT_LABEL[t]} onClick={() => onChange({ temperament: t })} />
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
          <Toggle key={c} on={mob.category === c} label={CATEGORY_LABEL[c]} onClick={() => onChange({ category: c })} />
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {(Object.keys(RARITY_LABEL) as Rarity[]).map((r) => (
          <Toggle key={r} on={mob.rarity === r} label={RARITY_LABEL[r]} onClick={() => onChange({ rarity: r })} />
        ))}
      </div>
      <Field label="体力" hint="HP">
        <Slider value={mob.health} min={1} max={500} step={1} digits={0} onChange={(n) => setNum("health", n)} />
      </Field>
      <Field label="攻撃力">
        <Slider value={mob.attackDamage} min={0} max={40} step={0.5} digits={1} onChange={(n) => setNum("attackDamage", n)} />
      </Field>
      <Field label="攻撃間隔" hint="秒">
        <Slider value={mob.attackInterval} min={0.4} max={3} step={0.05} onChange={(n) => setNum("attackInterval", n)} />
      </Field>
      <Field label="防具">
        <Slider value={mob.armor} min={0} max={30} step={0.5} digits={1} onChange={(n) => setNum("armor", n)} />
      </Field>
      <Field label="防具強度">
        <Slider value={mob.armorToughness} min={0} max={20} step={0.5} digits={1} onChange={(n) => setNum("armorToughness", n)} />
      </Field>
      <Field label="移動速度" hint="属性値">
        <Slider value={mob.movementSpeed} min={0.05} max={0.6} step={0.01} onChange={(n) => setNum("movementSpeed", n)} />
      </Field>
      <Field label="飛行速度">
        <Slider value={mob.flyingSpeed} min={0} max={0.8} step={0.01} onChange={(n) => setNum("flyingSpeed", n)} />
      </Field>
      <Field label="索敵距離">
        <Slider value={mob.followRange} min={4} max={64} step={1} digits={0} onChange={(n) => setNum("followRange", n)} />
      </Field>
      <Field label="ノックバック">
        <Slider value={mob.attackKnockback} min={0} max={3} step={0.1} digits={1} onChange={(n) => setNum("attackKnockback", n)} />
      </Field>
      <Field label="ノックバック耐性">
        <Slider value={mob.knockbackResistance} min={0} max={1} step={0.05} onChange={(n) => setNum("knockbackResistance", n)} />
      </Field>
      <div className="flex flex-wrap gap-1.5 pt-1">
        <Toggle on={mob.canFly} label="飛行" onClick={() => onChange({ canFly: !mob.canFly })} />
        <Toggle on={mob.canSwim} label="遊泳" onClick={() => onChange({ canSwim: !mob.canSwim })} />
        <Toggle on={mob.canClimb} label="登攀" onClick={() => onChange({ canClimb: !mob.canClimb })} />
        <Toggle on={mob.fireImmune} label="火炎耐性" onClick={() => onChange({ fireImmune: !mob.fireImmune })} />
        <Toggle on={mob.breathesWater} label="水呼吸" onClick={() => onChange({ breathesWater: !mob.breathesWater })} />
        <Toggle on={mob.undead} label="アンデッド" onClick={() => onChange({ undead: !mob.undead })} />
        <Toggle on={mob.arthropod} label="節足" onClick={() => onChange({ arthropod: !mob.arthropod })} />
        <Toggle on={mob.bossBar} label="ボスバー" onClick={() => onChange({ bossBar: !mob.bossBar })} />
        <Toggle on={mob.tameable} label="手懐け可" onClick={() => onChange({ tameable: !mob.tameable })} />
      </div>
    </div>
  );
}

function MindTab({ mob, onChange }: { mob: MobDraft; onChange: (p: Partial<MobDraft>) => void }) {
  const toggleB = (id: string) => {
    const has = mob.behaviors.includes(id);
    onChange({ behaviors: has ? mob.behaviors.filter((b) => b !== id) : [...mob.behaviors, id] });
  };
  const toggleA = (id: string) => {
    const cur = mob.abilities.find((a) => a.id === id);
    onChange({ abilities: cur ? mob.abilities.filter((a) => a.id !== id) : [...mob.abilities, { id, power: 2 }] });
  };
  return (
    <div className="space-y-4">
      <Field label="餌・手懐けアイテム" hint="ID">
        <TextInput value={mob.foodItem} onChange={(e) => onChange({ foodItem: e.target.value.trim() })} />
      </Field>
      <div>
        <div className="mb-1 text-[11px] font-medium text-cream/80">行動</div>
        <div className="space-y-1">
          {BEHAVIORS.map((b) => {
            const on = mob.behaviors.includes(b.id);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => toggleB(b.id)}
                className={cn("block w-full rounded-md border px-2 py-1.5 text-left", on ? "border-emerald/40 bg-emerald/10" : "border-line")}
              >
                <div className="text-xs font-bold text-cream">{b.name}</div>
                <div className="text-[10px] text-muted">{b.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="mb-1 text-[11px] font-medium text-cream/80">特殊能力</div>
        <div className="space-y-1">
          {ABILITIES.map((a) => {
            const cur = mob.abilities.find((x) => x.id === a.id);
            return (
              <div key={a.id} className={cn("rounded-md border px-2 py-1.5", cur ? "border-gold/40 bg-gold/5" : "border-line")}>
                <div className="flex items-center justify-between gap-2">
                  <button type="button" className="text-left" onClick={() => toggleA(a.id)}>
                    <div className="text-xs font-bold text-cream">{a.name}</div>
                    <div className="text-[10px] text-muted">{a.desc}</div>
                  </button>
                  {cur && <span className="font-mono text-[10px] text-gold">P{cur.power}</span>}
                </div>
                {cur && (
                  <div className="mt-1">
                    <Slider
                      value={cur.power}
                      min={1}
                      max={5}
                      step={1}
                      digits={0}
                      onChange={(n) =>
                        onChange({ abilities: mob.abilities.map((x) => (x.id === a.id ? { ...x, power: n } : x)) })
                      }
                    />
                    <div className="text-[10px] text-muted">{abilityTuning(cur.power, a.id)}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SpawnTab({ mob, onChange }: { mob: MobDraft; onChange: (p: Partial<MobDraft>) => void }) {
  const [q, setQ] = useState("");
  const spawn = mob.spawn;
  const patch = (p: Partial<MobDraft["spawn"]>) => onChange({ spawn: { ...spawn, ...p } });
  const biomes = useMemo(() => {
    const query = q.trim();
    return [...BIOME_TAGS, ...BIOMES].filter((b) => !query || b.name.includes(query) || b.id.includes(query));
  }, [q]);
  const toggleBiome = (id: string) => {
    const has = spawn.biomes.includes(id);
    patch({ biomes: has ? spawn.biomes.filter((b) => b !== id) : [...spawn.biomes, id] });
  };
  const toggleDim = (id: string) => {
    const has = spawn.dimensions.includes(id);
    patch({ dimensions: has ? spawn.dimensions.filter((d) => d !== id) : [...spawn.dimensions, id] });
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {DIMENSIONS.map((d) => (
          <Toggle key={d.id} on={spawn.dimensions.includes(d.id)} label={d.name} onClick={() => toggleDim(d.id)} />
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {(["any", "day", "night"] as const).map((t) => (
          <Toggle key={t} on={spawn.time === t} label={t === "any" ? "時間不問" : t === "day" ? "昼" : "夜"} onClick={() => patch({ time: t })} />
        ))}
        {(["any", "clear", "rain"] as const).map((t) => (
          <Toggle key={t} on={spawn.weather === t} label={t === "any" ? "天候不問" : t === "clear" ? "晴れ" : "雨"} onClick={() => patch({ weather: t })} />
        ))}
      </div>
      <Field label="明るさ 下限〜上限" hint={`${spawn.minLight}–${spawn.maxLight}`}>
        <Slider value={spawn.minLight} min={0} max={15} step={1} digits={0} onChange={(n) => patch({ minLight: n })} />
        <Slider value={spawn.maxLight} min={0} max={15} step={1} digits={0} onChange={(n) => patch({ maxLight: n })} />
      </Field>
      <Field label="Y 範囲" hint={`${spawn.minY} → ${spawn.maxY}`}>
        <Slider value={spawn.minY} min={-64} max={320} step={1} digits={0} onChange={(n) => patch({ minY: n })} />
        <Slider value={spawn.maxY} min={-64} max={320} step={1} digits={0} onChange={(n) => patch({ maxY: n })} />
      </Field>
      <Field label="群れ" hint={`${spawn.groupMin}–${spawn.groupMax}`}>
        <Slider value={spawn.groupMin} min={1} max={8} step={1} digits={0} onChange={(n) => patch({ groupMin: n })} />
        <Slider value={spawn.groupMax} min={1} max={8} step={1} digits={0} onChange={(n) => patch({ groupMax: n })} />
      </Field>
      <Field label="重み" hint="weight">
        <Slider value={spawn.weight} min={1} max={100} step={1} digits={0} onChange={(n) => patch({ weight: n })} />
      </Field>
      <Field label="バイオーム検索">
        <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="森、海、ネザー…" />
      </Field>
      <div className="flex flex-wrap gap-1">
        {biomes.slice(0, 40).map((b) => (
          <Toggle key={b.id} on={spawn.biomes.includes(b.id)} label={b.name} onClick={() => toggleBiome(b.id)} />
        ))}
      </div>
      <Field label="追加バイオーム ID" hint="カンマ区切り">
        <TextInput
          value={spawn.customBiomes}
          onChange={(e) => patch({ customBiomes: e.target.value })}
          placeholder="modid:crystal_caves"
        />
      </Field>
    </div>
  );
}

function LootTab({ mob, onChange }: { mob: MobDraft; onChange: (p: Partial<MobDraft>) => void }) {
  const [q, setQ] = useState("");
  const [custom, setCustom] = useState("");
  const add = (item: string) => {
    if (mob.drops.some((d) => d.item === item)) return;
    onChange({ drops: [...mob.drops, { item, chance: 0.5, min: 0, max: 2 }] });
  };
  return (
    <div className="space-y-3">
      <Field label="経験値">
        <Slider value={mob.xp} min={0} max={200} step={1} digits={0} onChange={(n) => onChange({ xp: n })} />
      </Field>
      <div>
        <div className="mb-1 text-[11px] text-cream/80">サウンドセット</div>
        <div className="flex flex-wrap gap-1">
          {SOUND_SETS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="rounded-full border border-line px-2 py-1 text-[11px] text-muted hover:text-cream"
              onClick={() => onChange({ sounds: { ambient: s.ambient, hurt: s.hurt, death: s.death, step: s.step } })}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="mt-2 space-y-2">
          {(
            [
              ["ambient", "環境音 (Ambient)", () => soundSynth.playAmbient(1.0, mob.temperament === "hostile", mob.undead, mob.scale < 0.9)],
              ["hurt", "被弾音 (Hurt)", () => soundSynth.playHurt(1.0, mob.armor > 8)],
              ["death", "死亡音 (Death)", () => soundSynth.playDeath(1.0)],
              ["step", "足音 (Step)", () => soundSynth.playStep(1.0)],
            ] as const
          ).map(([k, label, playFn]) => (
            <div key={k} className="flex items-center gap-2">
              <button
                type="button"
                onClick={playFn}
                className="rounded border border-line bg-panel px-2 py-1 text-[11px] text-gold hover:border-gold/40 flex items-center gap-1 shrink-0"
              >
                <span>🔊</span> 試聴
              </button>
              <div className="flex-1">
                <TextInput
                  value={mob.sounds[k]}
                  placeholder={label}
                  onChange={(e) => onChange({ sounds: { ...mob.sounds, [k]: e.target.value } })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {mob.drops.map((d, i) => (
          <div key={d.item + i} className="rounded-md border border-line p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-[11px] text-cream">{d.item}</span>
              <button
                type="button"
                className="text-[10px] text-rose"
                onClick={() => onChange({ drops: mob.drops.filter((_, j) => j !== i) })}
              >
                削除
              </button>
            </div>
            <Field label="確率">
              <Slider
                value={d.chance}
                min={0.01}
                max={1}
                step={0.01}
                onChange={(n) => onChange({ drops: mob.drops.map((x, j) => (j === i ? { ...x, chance: n } : x)) })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="最小">
                <Slider value={d.min} min={0} max={16} step={1} digits={0} onChange={(n) => onChange({ drops: mob.drops.map((x, j) => (j === i ? { ...x, min: n } : x)) })} />
              </Field>
              <Field label="最大">
                <Slider value={d.max} min={0} max={16} step={1} digits={0} onChange={(n) => onChange({ drops: mob.drops.map((x, j) => (j === i ? { ...x, max: n } : x)) })} />
              </Field>
            </div>
          </div>
        ))}
      </div>
      <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="ドロップを検索" />
      <div className="flex flex-wrap gap-1">
        {ITEMS.filter((it) => !q || it.name.includes(q) || it.id.includes(q))
          .slice(0, 18)
          .map((it) => (
            <button key={it.id} type="button" onClick={() => add(it.id)} className="rounded-full border border-line px-2 py-1 text-[11px] text-muted hover:text-cream">
              {it.name}
            </button>
          ))}
      </div>
      <div className="flex gap-1">
        <TextInput value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="modid:custom_item" />
        <button
          type="button"
          className="rounded-md bg-emerald px-2 text-[11px] font-bold text-ink"
          onClick={() => {
            if (custom.includes(":")) {
              add(custom.trim());
              setCustom("");
            }
          }}
        >
          追加
        </button>
      </div>
      <Field label="実装メモ">
        <textarea
          value={mob.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={4}
          className="w-full resize-none rounded-md border border-line bg-ink/60 px-2 py-1.5 text-xs leading-relaxed text-cream outline-none"
          placeholder="ゴールの優先度、例外、構造物限定、地形破壊の有無。"
        />
      </Field>
    </div>
  );
}

function ExportTab({ mob, onToast }: { mob: MobDraft; onToast: (s: string) => void }) {
  const [kind, setKind] = useState<ExportKind>("f11_entity");
  const [texUrl, setTexUrl] = useState<string>("");
  const [texSize, setTexSize] = useState<number>(64);
  const text = useMemo(() => renderExport(mob, kind), [mob, kind]);
  const warns = warningsOf(mob);
  const box = estimateHitbox(mob);
  const meta = EXPORT_TABS.find((t) => t.id === kind);

  useEffect(() => {
    const { canvas, atlas } = drawBoxUVTexture(mob);
    setTexUrl(canvas.toDataURL("image/png"));
    setTexSize(atlas.size);
  }, [mob]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      onToast("コピーしました");
    } catch {
      onToast("コピーに失敗しました");
    }
  };
  const download = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${mob.entityId}-${meta?.file ?? "export.txt"}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const pack = async () => {
    onToast("パックをまとめています…");
    try {
      const blob = await buildPack(mob);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${mob.modId}-${mob.entityId}-mobforge.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      onToast("ZIP を保存しました");
    } catch {
      onToast("ZIP の作成に失敗しました");
    }
  };
  const fabricZip = async () => {
    onToast("Fabric 1.21.11 プロジェクトを生成しています…");
    try {
      const blob = await buildFabric12111Zip(mob);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${mob.modId}-fabric-1.21.11.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      onToast("保存しました。gradle.properties のバージョンだけ確認してください");
    } catch {
      onToast("生成に失敗しました");
    }
  };
  const mcaddon = async () => {
    onToast(".mcaddon を生成しています…");
    try {
      const blob = await buildMcaddon(mob);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${mob.entityId}.mcaddon`;
      a.click();
      URL.revokeObjectURL(a.href);
      onToast(".mcaddon を保存しました。統合版にインポートして試せます");
    } catch {
      onToast(".mcaddon の作成に失敗しました");
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-line bg-ink/40 p-2 text-[11px] leading-relaxed text-muted">
        当たり判定 {box.width} × {box.height}、目の高さ {box.eye}。正面は -Z、1 ブロック = 16。
      </div>
      <div className="rounded-md border border-line bg-ink/40 p-2">
        <div className="mb-1.5 text-[10px] font-bold tracking-widest text-cream/70">現実度レポート — どこまで「そのまま」使えるか</div>
        <ul className="space-y-1">
          {REALITY_REPORT.map((r) => (
            <li key={r.target} className="flex items-start gap-1.5 text-[10px] leading-relaxed">
              <span
                className={cn(
                  "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                  r.level === "green" ? "bg-emerald" : r.level === "yellow" ? "bg-gold" : "bg-rose",
                )}
              />
              <span>
                <span className="font-bold text-cream">{r.target}</span>
                <span className="ml-1 text-muted">{r.note}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      {warns.length > 0 && (
        <ul className="space-y-1">
          {warns.map((w) => (
            <li key={w.text} className={cn("rounded px-2 py-1 text-[11px]", w.level === "warn" ? "bg-rose/10 text-rose" : "bg-gold/10 text-gold")}>
              {w.text}
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-3">
        {texUrl && (
          <img
            src={texUrl}
            alt="テクスチャ"
            className="h-24 w-24 shrink-0 border border-line bg-[#1a120c]"
            style={{ imageRendering: "pixelated" }}
          />
        )}
        <div className="text-[11px] leading-relaxed text-muted">
          <span className="font-bold text-cream">box UV テクスチャ {texSize}×{texSize}</span>
          <br />
          Minecraft 標準の展開図で詰めてあるので、生成される <span className="font-mono text-cream">texOffs</span> とピクセル単位で一致します。そのまま塗り替えられます。
        </div>
      </div>
      {["Fabric 1.21.11", "共通", "統合版", "旧版"].map((group) => (
        <div key={group}>
          <div className="mb-1 text-[10px] tracking-widest text-muted">{group}</div>
          <div className="flex flex-wrap gap-1">
            {EXPORT_TABS.filter((t) => t.group === group).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setKind(t.id)}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px]",
                  kind === t.id ? "bg-gold text-ink font-bold" : "bg-ink text-muted hover:text-cream",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={fabricZip}
          className="rounded-md bg-emerald px-2.5 py-1 text-[11px] font-bold text-ink hover:bg-emerald/90"
        >
          ☕ Fabric 1.21.11 プロジェクト一式
        </button>
        <button type="button" onClick={copy} className="rounded-md border border-line px-2.5 py-1 text-[11px] text-cream hover:bg-white/5">
          📋 コピー
        </button>
        <button type="button" onClick={download} className="rounded-md border border-line px-2.5 py-1 text-[11px] text-cream hover:bg-white/5">
          💾 {meta?.file}
        </button>
        <button type="button" onClick={pack} className="rounded-md border border-gold/40 px-2.5 py-1 text-[11px] text-gold hover:bg-gold/10">
          📦 全データZIP
        </button>
        <button type="button" onClick={mcaddon} className="rounded-md border border-sky/40 px-2.5 py-1 text-[11px] text-sky hover:bg-sky/10">
          🧪 統合版 .mcaddon
        </button>
      </div>
      <pre className="mf-scroll max-h-80 overflow-auto rounded-md border border-line bg-ink p-2 font-mono text-[10px] leading-relaxed text-cream/90">
        {text}
      </pre>
    </div>
  );
}
