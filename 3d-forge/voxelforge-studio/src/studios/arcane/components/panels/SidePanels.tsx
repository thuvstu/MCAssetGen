import React from 'react';
import {
  Download, Maximize2, FileJson, Copy, Check, ImageDown, Sparkles, Crown, ChevronRight, Box,
  WandSparkles, Dices, Lock, LockOpen, Target, History, Info, Palette, Shapes, Layers, Wand2,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useForge } from '../../hooks/useForge';
import { ELEMENTS } from '../../lib/catalog/elements';
import { ITEM_TYPES } from '../../lib/catalog/itemTypes';
import { EFFECT_PRESETS, PRESETS, STYLE_DNA } from '../../lib/catalog/presets';
import { RARITIES } from '../../lib/catalog/rarity';
import { ALL_ADORNMENTS, ALL_FINISHES, ALL_GEM_CUTS, ALL_HEADS, ALL_MOD_ESSENCES, ALL_ORBITERS, ALL_TIPS, Resolution } from '../../lib/types';
import { COLOR_KEYS, DECOR_KEYS, FX_KEYS, KEY_LABELS, LOCK_GROUPS, SHAPE_KEYS, lockedKeys } from '../../lib/locks';
import { downloadAnimationZip, downloadPng } from '../../lib/export';
import { MinecraftPackTarget, VANILLA_BASE_ITEMS, downloadMinecraftPack, suggestedBaseItem } from '../../lib/minecraftPack';
import { ServerPackEntry, downloadServerPack } from '../../lib/serverPack';
import type { StaffConfig } from '../../lib/types';
import { GENERIC_ICONS, HEAD_ICONS, HEAD_LABELS, ORB_ICONS, ORB_LABELS, TIP_ICONS, TIP_LABELS } from '../icons';
import { Chip, Slider, Toggle } from '../controls';
import { StaffCanvas } from '../Preview';

/* ═══════════════ Export ═══════════════ */
export function ExportPanel() {
  const { config, anim, isAnimated, update, flash } = useForge();
  const [copied, setCopied] = React.useState(false);
  const copy = (text: string, msg: string) => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); flash(msg); };
  return (
    <div className="panel-luxe p-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-amber-100">出力 / Export</h2>
        <ImageDown className="h-4 w-4 text-amber-300/70" />
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-stone-500">実物大のピクセル解像度で書き出し。透明背景PNGはそのままリソースパックへ。</p>
      <span className="mb-1.5 block text-xs font-medium text-stone-400">解像度</span>
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-black/40 p-1">
        {([16, 32, 64, 128] as Resolution[]).map((r) => (
          <button key={r} onClick={() => update({ resolution: r })}
            className={cn('rounded-lg py-2 font-mono text-xs font-bold transition-all',
              config.resolution === r ? 'bg-gradient-to-b from-amber-300/30 to-amber-500/15 text-amber-100 ring-1 ring-amber-300/40' : 'text-stone-500 hover:bg-white/5 hover:text-stone-300')}>
            {r}
          </button>
        ))}
      </div>
      <p className="mb-3 mt-1.5 text-[10px] leading-relaxed text-stone-600">
        {config.resolution === 16 ? 'バニラ標準サイズ。大胆で読みやすい。' : config.resolution === 32 ? 'Skyblock パック標準。軽量で高密度。' : config.resolution === 64 ? 'HD。線刻や輝きが豊かに。' : '最高精細。ギャラリー品質の造形。'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => { downloadPng(config, 1); flash('PNG を保存しました'); }} className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-2 py-2.5 text-xs font-bold text-[#1a1206] transition hover:brightness-110">
          <Download className="h-3.5 w-3.5" /> 1× PNG
        </button>
        <button onClick={() => { downloadPng(config, 4); flash('4× PNG を保存しました'); }} className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300/30 bg-amber-400/10 px-2 py-2.5 text-xs font-bold text-amber-200 transition hover:bg-amber-400/20">
          <Maximize2 className="h-3.5 w-3.5" /> 4× HD
        </button>
      </div>
      {isAnimated && (
        <button onClick={async () => { const n = await downloadAnimationZip(config); flash(`ZIP に ${n} フレーム書き出し`); }}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-500 px-2 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(236,72,153,0.35)] transition hover:brightness-110">
          <WandSparkles className="h-3.5 w-3.5" /> アニメーションZIP ({anim.frames}f / {anim.fps}fps)
        </button>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button onClick={() => copy(JSON.stringify(config), '設定JSONをコピーしました')} className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-medium text-stone-300 transition hover:bg-white/10">
          <FileJson className="h-3.5 w-3.5" /> 設定JSON
        </button>
        <button onClick={() => copy(String(config.seed), 'シードをコピーしました')} className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-medium text-stone-300 transition hover:bg-white/10">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} シード
        </button>
      </div>
    </div>
  );
}

/* ═══════════════ Minecraft resource pack ═══════════════ */
export function MinecraftPackPanel() {
  const { config, flash } = useForge();
  const [target, setTarget] = React.useState<MinecraftPackTarget>('java-1.21.4');
  const [base, setBase] = React.useState('auto');
  const [cmd, setCmd] = React.useState(731004);
  const [citName, setCitName] = React.useState('');
  const [modId, setModId] = React.useState('arcane_forge');
  const [busy, setBusy] = React.useState(false);
  const baseItem = base === 'auto' ? suggestedBaseItem(config.itemType) : base;

  const resolvedCitName = citName.trim() || `${config.rarity ? config.rarity.toUpperCase() : 'MAGIC'} ${config.element.toUpperCase()} ${config.itemType.toUpperCase()}`;

  const command = target === 'optifine-cit'
    ? `/give @s minecraft:${baseItem}{display:{Name:'{"text":"${resolvedCitName}","color":"gold"}'},CustomModelData:${cmd}}`
    : target === 'java-1.20.4'
      ? `/give @s minecraft:${baseItem}{CustomModelData:${cmd}}`
      : target === 'mod-fabric-neoforge'
        ? `/give @s ${modId || 'arcane_forge'}:${config.itemType}_${config.element}_${config.seed}`
        : `/give @s minecraft:${baseItem}[minecraft:custom_model_data={floats:[${cmd}.0]}]`;

  const exportPack = async () => {
    setBusy(true);
    try {
      const result = await downloadMinecraftPack(config, {
        target,
        baseItem,
        customModelData: cmd,
        itemNameMatcher: resolvedCitName,
        modId: modId.trim() || 'arcane_forge',
      });
      flash(`Minecraftパッケージを書き出しました · ${result.slug}`);
    } catch (error) {
      console.error(error);
      flash('ZIPの書き出しに失敗しました');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel-luxe p-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.16em] text-emerald-100">Minecraft Packager</h2>
        <Box className="h-4 w-4 text-emerald-300/80" />
      </div>
      <p className="mb-3 text-[10px] leading-relaxed text-stone-400">
        マルチサーバー (CIT/金床リネーム)、バニラ最新版 (1.21.4+)、Mod 開発用テンプレート (Fabric/NeoForge) まで、目的に合った Minecraft パッケージを即座に出力します。
      </p>

      <span className="mb-1.5 block text-xs font-medium text-stone-400">出力形式 (Edition / Framework)</span>
      <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-black/40 p-1">
        {([
          ['java-1.21.4', '1.21.4+ (最新)', 'Item Definition'],
          ['optifine-cit', 'OptiFine / CIT', '金床名 / Hypixel流'],
          ['java-1.20.4', '1.14 - 1.20.4', 'Legacy CMD'],
          ['mod-fabric-neoforge', 'Mod 開発資産', 'Fabric / NeoForge'],
        ] as const).map(([value, label, sub]) => (
          <button key={value} onClick={() => setTarget(value)}
            className={cn('flex flex-col rounded-lg px-2.5 py-2 text-left transition', target === value ? 'bg-emerald-500/25 text-emerald-100 ring-1 ring-emerald-400/40 shadow-sm' : 'text-stone-500 hover:bg-white/5 hover:text-stone-300')}>
            <span className="text-[11px] font-bold">{label}</span>
            <span className="text-[9px] uppercase tracking-wider opacity-65">{sub}</span>
          </button>
        ))}
      </div>

      {target !== 'mod-fabric-neoforge' && (
        <label className="mt-3 block">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">置換するバニラアイテム</span>
            <span className="font-mono text-[9px] text-emerald-300">layer0 parent</span>
          </div>
          <select value={base} onChange={(e) => setBase(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#100d1a] px-3 py-2 text-xs text-stone-200 outline-none transition focus:border-emerald-400/50">
            <option value="auto">自動推奨: {suggestedBaseItem(config.itemType)}</option>
            {VANILLA_BASE_ITEMS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      )}

      {target === 'optifine-cit' && (
        <label className="mt-3 block">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">金床リネーム判定名 (CIT)</span>
            <span className="text-[9px] text-amber-300">Anvil Name</span>
          </div>
          <input type="text" value={citName} placeholder={resolvedCitName} onChange={(e) => setCitName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#100d1a] px-3 py-2 font-mono text-xs text-stone-200 outline-none transition focus:border-emerald-400/50" />
          <p className="mt-1 text-[9px] text-stone-500">※ この名前を金床でアイテムにつけると自動でテクスチャが切り替わります（大文字小文字不問・部分一致対応）。</p>
        </label>
      )}

      {target === 'mod-fabric-neoforge' && (
        <label className="mt-3 block">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">Mod ID (Namespace)</span>
            <span className="font-mono text-[9px] text-emerald-300">assets/{modId || 'modid'}/</span>
          </div>
          <input type="text" value={modId} placeholder="arcane_forge" onChange={(e) => setModId(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#100d1a] px-3 py-2 font-mono text-xs text-stone-200 outline-none transition focus:border-emerald-400/50" />
        </label>
      )}

      {target !== 'mod-fabric-neoforge' && (
        <label className="mt-3 block">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">Custom Model Data 番号</span>
            <span className="font-mono text-[9px] text-emerald-300">CMD</span>
          </div>
          <input type="number" min={1} max={2147483647} value={cmd} onChange={(e) => setCmd(Math.max(1, Number(e.target.value) || 1))}
            className="w-full rounded-xl border border-white/10 bg-[#100d1a] px-3 py-2 font-mono text-xs text-emerald-100 outline-none transition focus:border-emerald-400/50" />
        </label>
      )}

      <div className="mt-3 rounded-xl border border-white/8 bg-black/35 p-2.5">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            {target === 'optifine-cit' ? '入手コマンド / 金床名' : target === 'mod-fabric-neoforge' ? 'Mod アイテム取得' : 'テスト用 give コマンド'}
          </span>
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-emerald-300">
            {target === 'optifine-cit' ? 'CIT regex' : target === 'java-1.21.4' ? '1.21.4 component' : target === 'mod-fabric-neoforge' ? 'Mod Identifier' : 'NBT tag'}
          </span>
        </div>
        <code className="block break-all font-mono text-[10px] leading-relaxed text-stone-300">{command}</code>
      </div>

      <button disabled={busy} onClick={exportPack}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-3 py-2.5 text-xs font-bold text-[#06241d] shadow-[0_0_18px_rgba(16,185,129,0.23)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">
        <Download className="h-3.5 w-3.5" />
        {busy ? 'パッケージを構築中…' : target === 'mod-fabric-neoforge' ? 'Mod 資産テンプレート ZIP を出力' : 'Minecraft リソースパック (.zip) を出力'}
      </button>

      <p className="mt-2 text-[9px] leading-relaxed text-stone-500">
        {target === 'optifine-cit' && '※ OptiFine / CIT Resewn 用 .properties、テクスチャ、pack.mcmeta、pack.png、金床リネームガイドを同封。'}
        {target === 'java-1.21.4' && '※ 1.21.4 の新アイテム定義 (/assets/minecraft/items/*.json)、モデル、pack.png、giveコマンドを完全同封。'}
        {target === 'java-1.20.4' && '※ 1.14〜1.20.4 の legacy overrides 形式、CMD 紐付けモデル、pack.mcmeta を同封。'}
        {target === 'mod-fabric-neoforge' && '※ src/main/resources 構造、アイテムモデル、1.21.4+ 定義、lang (en_us/ja_jp)、Java登録コード雛形を同封。'}
      </p>
    </div>
  );
}

/* ═══════════════ 🔒 固定 / 🎯 指定 ═══════════════ */
export function RandomRulesPanel() {
  const { locks, rules, setRules, lockedCount, clearLocks, toggleLock, setLocks, randomizeOnly, randomAll } = useForge();
  const togglePool = <T extends string>(key: 'elements' | 'itemTypes' | 'modEssences' | 'headShapes' | 'finishes' | 'rarities' | 'tipStyles' | 'orbiterStyles' | 'gemCuts' | 'adornments', v: T) => {
    const cur = rules[key] as unknown as T[];
    setRules({ [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] } as never);
  };
  const locked = lockedKeys(locks);
  return (
    <div className="panel-luxe p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-[13px] font-bold uppercase tracking-[0.16em] text-fuchsia-100">
          <Target className="h-4 w-4 text-fuchsia-300" /> ランダム条件
        </h2>
        <span className="rounded-md bg-black/40 px-2 py-0.5 font-mono text-[10px] text-fuchsia-300">🔒 {lockedCount}</span>
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-stone-500">
        各項目の <Lock className="inline h-3 w-3 text-amber-300" /> で<span className="text-amber-200">固定</span>、ここで候補を<span className="text-fuchsia-200">指定</span>。ランダム生成は両方を尊重します。
      </p>

      {/* quick actions */}
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">この要素だけランダム</span>
      <div className="mb-3 grid grid-cols-2 gap-1.5">
        <QuickBtn icon={<Palette className="h-3.5 w-3.5" />} label="色だけ" onClick={() => randomizeOnly(COLOR_KEYS, { colorsFollowElement: false })} />
        <QuickBtn icon={<Shapes className="h-3.5 w-3.5" />} label="形だけ" onClick={() => randomizeOnly(SHAPE_KEYS)} />
        <QuickBtn icon={<Layers className="h-3.5 w-3.5" />} label="装飾だけ" onClick={() => randomizeOnly(DECOR_KEYS)} />
        <QuickBtn icon={<Sparkles className="h-3.5 w-3.5" />} label="仕上げだけ" onClick={() => randomizeOnly(FX_KEYS)} />
        <QuickBtn icon={<Wand2 className="h-3.5 w-3.5" />} label="アニメだけ" onClick={() => randomizeOnly(['animation'], { randomizeAnimation: true })} />
        <QuickBtn icon={<Dices className="h-3.5 w-3.5" />} label="全部（固定を尊重）" onClick={randomAll} accent />
      </div>

      {/* group locks */}
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">区画ごとの固定</span>
      <div className="mb-3 flex flex-wrap gap-1">
        {LOCK_GROUPS.map((g) => {
          const n = g.keys.filter((k) => locks[k]).length;
          const all = n === g.keys.length;
          return (
            <button key={g.id} onClick={() => setLocks(g.keys, !all)}
              className={cn('flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition',
                all ? 'border-amber-300/50 bg-amber-400/20 text-amber-100' : n > 0 ? 'border-amber-300/30 bg-amber-400/10 text-amber-200/80' : 'border-white/10 text-stone-500 hover:border-white/25 hover:text-stone-300')}>
              {all || n > 0 ? <Lock className="h-2.5 w-2.5" /> : <LockOpen className="h-2.5 w-2.5 opacity-60" />}
              {g.label}{n > 0 && n < g.keys.length && <span className="font-mono opacity-70">{n}/{g.keys.length}</span>}
            </button>
          );
        })}
      </div>

      {/* locked list */}
      {locked.length > 0 && (
        <div className="mb-3 rounded-xl border border-amber-300/20 bg-amber-400/5 p-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-amber-200">固定中の項目（クリックで解除）</span>
            <button onClick={clearLocks} className="text-[10px] font-semibold text-stone-400 underline-offset-2 hover:text-amber-200 hover:underline">全解除</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {locked.map((k) => (
              <button key={k} onClick={() => toggleLock(k)} className="flex items-center gap-1 rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[10px] text-amber-100 transition hover:bg-red-500/20 hover:text-red-200">
                <Lock className="h-2.5 w-2.5" /> {KEY_LABELS[k] ?? k}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* pools */}
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">候補を指定（未選択 = 全て）</span>
      <PoolRow label="属性" count={rules.elements.length} onClear={() => setRules({ elements: [] })}>
        {ELEMENTS.filter((e) => e.id !== 'none').map((e) => (
          <Chip key={e.id} active={rules.elements.includes(e.id)} onClick={() => togglePool('elements', e.id)} color={e.gem}>{e.name}</Chip>
        ))}
      </PoolRow>
      <PoolRow label="型" count={rules.itemTypes.length} onClear={() => setRules({ itemTypes: [] })}>
        {ITEM_TYPES.map((t) => (
          <Chip key={t.id} active={rules.itemTypes.includes(t.id)} onClick={() => togglePool('itemTypes', t.id)}>
            <span className="[&>svg]:h-3 [&>svg]:w-3">{GENERIC_ICONS[t.icon]}</span>{t.name}
          </Chip>
        ))}
      </PoolRow>
      <PoolRow label="Mod エッセンス" count={rules.modEssences.length} onClear={() => setRules({ modEssences: [] })}>
        {ALL_MOD_ESSENCES.map((m) => (
          <Chip key={m} active={rules.modEssences.includes(m)} onClick={() => togglePool('modEssences', m)}>
            {m === 'none' ? '標準' : m.split('-')[0]}
          </Chip>
        ))}
      </PoolRow>
      <PoolRow label="レアリティ" count={rules.rarities.length} onClear={() => setRules({ rarities: [] })}>
        {RARITIES.map((r) => (
          <Chip key={r.id} active={rules.rarities.includes(r.id)} onClick={() => togglePool('rarities', r.id)} color={r.color}>
            {r.name}
          </Chip>
        ))}
      </PoolRow>
      <PoolRow label="頭部" count={rules.headShapes.length} onClear={() => setRules({ headShapes: [] })}>
        {ALL_HEADS.map((h) => (
          <Chip key={h} active={rules.headShapes.includes(h)} onClick={() => togglePool('headShapes', h)}>
            <span className="[&>svg]:h-3 [&>svg]:w-3">{HEAD_ICONS[h]}</span>{HEAD_LABELS[h]}
          </Chip>
        ))}
      </PoolRow>
      <PoolRow label="先端フィニアル" count={rules.tipStyles.length} onClear={() => setRules({ tipStyles: [] })}>
        {ALL_TIPS.map((t) => (
          <Chip key={t} active={rules.tipStyles.includes(t)} onClick={() => togglePool('tipStyles', t)}>
            <span className="[&>svg]:h-3 [&>svg]:w-3">{TIP_ICONS[t]}</span>{TIP_LABELS[t] ?? t}
          </Chip>
        ))}
      </PoolRow>
      <PoolRow label="浮遊レリック" count={rules.orbiterStyles.length} onClear={() => setRules({ orbiterStyles: [] })}>
        {ALL_ORBITERS.map((o) => (
          <Chip key={o} active={rules.orbiterStyles.includes(o)} onClick={() => togglePool('orbiterStyles', o)}>
            <span className="[&>svg]:h-3 [&>svg]:w-3">{ORB_ICONS[o]}</span>{ORB_LABELS[o]}
          </Chip>
        ))}
      </PoolRow>
      <PoolRow label="宝石カット" count={rules.gemCuts.length} onClear={() => setRules({ gemCuts: [] })}>
        {ALL_GEM_CUTS.map((cut) => (
          <Chip key={cut} active={rules.gemCuts.includes(cut)} onClick={() => togglePool('gemCuts', cut)}>
            <span className="h-1.5 w-1.5 rotate-45 bg-cyan-300" />{cut}
          </Chip>
        ))}
      </PoolRow>
      <PoolRow label="工芸装飾" count={rules.adornments.length} onClear={() => setRules({ adornments: [] })}>
        {ALL_ADORNMENTS.map((style) => (
          <Chip key={style} active={rules.adornments.includes(style)} onClick={() => togglePool('adornments', style)}>{style}</Chip>
        ))}
      </PoolRow>
      <PoolRow label="表面" count={rules.finishes.length} onClear={() => setRules({ finishes: [] })}>
        {ALL_FINISHES.map((f) => (
          <Chip key={f} active={rules.finishes.includes(f)} onClick={() => togglePool('finishes', f)}>{f}</Chip>
        ))}
      </PoolRow>

      {/* behaviour */}
      <div className="mt-3 space-y-1 border-t border-white/8 pt-3">
        <Toggle label="属性に色を従わせる" hint="OFF で完全ランダムなパレット" value={rules.colorsFollowElement} onChange={(v) => setRules({ colorsFollowElement: v })} />
        <Toggle label="型の比率を維持" hint="ロッドは細く、セプターは短く…を保つ" value={rules.keepTypeGeometry} onChange={(v) => setRules({ keepTypeGeometry: v })} />
        <Toggle label="アニメーションもランダム" hint="全体ランダム時にモードも変える" value={rules.randomizeAnimation} onChange={(v) => setRules({ randomizeAnimation: v })} />
        <Toggle label="レアリティが華やかさを支配" hint="階層に応じ輝き・粒子・装飾を自動調整" value={rules.rarityDrivesOrnate} onChange={(v) => setRules({ rarityDrivesOrnate: v })} />
        <Toggle label="カラーハーモニーを使う" hint="色相環の法則で全色を導出" value={rules.useHarmony} onChange={(v) => setRules({ useHarmony: v })} />
        <Slider label="ばらつき" value={rules.jitter} min={0} max={1} onChange={(v) => setRules({ jitter: v })} format={(v) => `${Math.round(v * 100)}%`} />
      </div>
    </div>
  );
}

function QuickBtn({ icon, label, onClick, accent }: { icon: React.ReactNode; label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button onClick={onClick}
      className={cn('flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition',
        accent ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:brightness-110' : 'border border-white/10 bg-black/30 text-stone-300 hover:border-fuchsia-300/40 hover:bg-fuchsia-500/10 hover:text-fuchsia-100')}>
      {icon}{label}
    </button>
  );
}

function PoolRow({ label, count, onClear, children }: { label: string; count: number; onClear: () => void; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-medium text-stone-400">{label}{count > 0 && <span className="ml-1 font-mono text-fuchsia-300">{count}</span>}</span>
        {count > 0 && <button onClick={onClear} className="text-[10px] text-stone-500 hover:text-fuchsia-200">クリア</button>}
      </div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

/* ═══════════════ Effect presets ═══════════════ */
export function EffectPresetsPanel() {
  const { applyEffect } = useForge();
  return (
    <div className="panel-luxe p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.16em] text-fuchsia-100">エフェクトプリセット</h2>
        <Sparkles className="h-4 w-4 text-fuchsia-300/70" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {EFFECT_PRESETS.map((p, i) => (
          <button key={p.name} onClick={() => applyEffect(i)}
            className="flex flex-col gap-1 rounded-xl border border-white/8 bg-black/30 p-2.5 text-left transition hover:border-fuchsia-300/40 hover:bg-fuchsia-500/10">
            <span className="flex items-center gap-1.5 text-fuchsia-200">{GENERIC_ICONS[p.icon]}<span className="text-[11px] font-bold text-stone-200">{p.name}</span></span>
            <span className="text-[9px] uppercase tracking-wider text-stone-600">{p.nameEn}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ Master presets ═══════════════ */
export function MasterPresetsPanel() {
  const { applyPreset } = useForge();
  return (
    <div className="panel-luxe p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.16em] text-stone-200">マスターコレクション</h2>
        <Crown className="h-4 w-4 text-amber-300/70" />
      </div>
      <div className="space-y-2">
        {PRESETS.map((p, i) => (
          <button key={p.name} onClick={() => applyPreset(i)}
            className="group flex w-full items-center gap-3 rounded-xl border border-white/8 bg-black/30 p-2 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-white/15" style={{ background: `linear-gradient(135deg, ${p.accent}44, ${p.accent}11)`, color: p.accent }}>
              {GENERIC_ICONS[p.icon]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-stone-200">{p.name}</span>
              <span className="block truncate text-[11px] text-stone-500">{p.tagline}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-stone-600 transition group-hover:translate-x-0.5 group-hover:text-amber-300" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ Guide / DNA / History ═══════════════ */
export function GuidePanel() {
  return (
    <div className="panel-luxe p-4">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-violet-200"><Box className="h-3.5 w-3.5" /> Minecraft への導入</h3>
      <ol className="space-y-1.5 text-[11px] leading-relaxed text-stone-400">
        <li><span className="font-mono text-amber-300/90">1.</span> 上の Packager で Java 版と土台アイテムを選び、ZIP を作成。</li>
        <li><span className="font-mono text-amber-300/90">2.</span> ZIP を <span className="font-mono text-stone-300">.minecraft/resourcepacks/</span> に入れて有効化。</li>
        <li><span className="font-mono text-amber-300/90">3.</span> ZIP 内 <span className="font-mono text-stone-300">give-command.txt</span> のコマンドで表示を確認。</li>
        <li><span className="font-mono text-amber-300/90">4.</span> サーバー配布は pack ZIP をホストし、resource-pack URL と SHA-1 をサーバー設定へ。</li>
      </ol>
      <p className="mt-2 border-t border-white/5 pt-2 text-[9px] leading-relaxed text-stone-600">
        1.20.4 は CustomModelData NBT、1.21.4 は新しいアイテム定義 / float component に対応。選択した土台アイテムのモデルをパックで置換するため、他パックと共有するサーバーでは専用IDを割り当ててください。
      </p>
    </div>
  );
}

export function StyleDnaPanel() {
  return (
    <div className="panel-luxe p-4">
      <div className="mb-3 flex items-center gap-2">
        <Info className="h-4 w-4 text-amber-300/80" />
        <h3 className="font-display text-[12px] font-bold uppercase tracking-[0.16em] text-stone-200">Style DNA — 有名パックのエッセンス</h3>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {STYLE_DNA.map((d) => (
          <div key={d.en} className="rounded-xl border border-white/6 bg-black/25 p-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-bold text-amber-100">{d.title}</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-stone-600">{d.en}</span>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-stone-500">{d.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HistoryPanel() {
  const { history, replace } = useForge();
  if (history.length === 0) return null;
  return (
    <div className="panel-luxe p-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <History className="h-3.5 w-3.5 text-stone-500" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">生成履歴 — クリックで復元</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {history.map((h, i) => (
          <button key={`${h.seed}-${i}`} onClick={() => replace(h)}
            className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#141022] transition hover:border-amber-300/50 hover:shadow-[0_0_16px_rgba(251,191,36,0.25)]">
            <StaffCanvas config={h} className="h-full w-full" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ Multiplayer server pack (curated collection) ═══════════════ */
const PACK_TARGETS: Array<{ value: MinecraftPackTarget; label: string; sub: string }> = [
  { value: 'java-1.21.4', label: '1.21.4+', sub: 'item definitions' },
  { value: 'java-1.20.4', label: '1.14–1.20.4', sub: 'legacy overrides' },
  { value: 'optifine-cit', label: 'OptiFine / CIT', sub: 'anvil name match' },
];

export function ServerPackPanel() {
  const { collection, addToCollection, removeFromCollection, clearCollection, flash } = useForge();
  const [target, setTarget] = React.useState<MinecraftPackTarget>('java-1.21.4');
  const [packName, setPackName] = React.useState('Arcane Relics');
  const [packDesc, setPackDesc] = React.useState('Hand-forged magic items · Arcane Forge');
  const [namespace, setNamespace] = React.useState('arcane_forge');
  const [busy, setBusy] = React.useState(false);
  // base item / CMD / display name per collection slot, kept index-aligned
  const [meta, setMeta] = React.useState<Array<{ base: string; cmd: number; name: string }>>([]);

  React.useEffect(() => {
    setMeta((m) => collection.map((cfg, i) => m[i] ?? {
      base: suggestedBaseItem(cfg.itemType),
      cmd: 2 + i,
      name: `${cfg.rarity ?? 'arcane'} ${cfg.element} ${cfg.itemType}`,
    }));
  }, [collection]);

  const patchMeta = (i: number, patch: Partial<{ base: string; cmd: number; name: string }>) =>
    setMeta((m) => m.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const remove = (i: number) => { removeFromCollection(i); setMeta((m) => m.filter((_, idx) => idx !== i)); };

  const exportPack = async () => {
    if (collection.length === 0) { flash('コレクションが空です'); return; }
    setBusy(true);
    try {
      const entries: ServerPackEntry[] = collection.map((cfg: StaffConfig, i) => ({
        cfg,
        baseItem: meta[i]?.base ?? suggestedBaseItem(cfg.itemType),
        cmd: meta[i]?.cmd ?? 2 + i,
        name: meta[i]?.name,
      }));
      const res = await downloadServerPack({ target, packName, packDesc, entries, namespace });
      flash(`サーバーパック出力: ${res.count}点 / 土台${res.bases}種`);
    } catch (err) {
      console.error(err);
      flash('サーバーパックの出力に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  const bases = new Set(meta.map((m) => m?.base).filter(Boolean));

  return (
    <div className="panel-luxe p-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-cyan-100">サーバーパック</h2>
        <Layers className="h-4 w-4 text-cyan-300/70" />
      </div>
      <p className="mb-3 text-[10px] leading-relaxed text-stone-500">
        複数の作品を<span className="text-cyan-200">ひとつのリソースパック</span>に統合。同じ土台アイテムは 1 つのディスパッチャに束ね、CMD を自動で衝突回避します。
      </p>

      <button onClick={() => { addToCollection(); flash('コレクションに追加しました'); }}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-[11px] font-bold text-cyan-100 transition hover:bg-cyan-500/20">
        <Sparkles className="h-3.5 w-3.5" /> 現在のデザインを追加 ({collection.length}/12)
      </button>

      {collection.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {collection.map((cfg, i) => (
            <div key={`${cfg.seed}-${i}`} className="rounded-xl border border-white/8 bg-black/30 p-2">
              <div className="flex items-center gap-2">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#141022]">
                  <StaffCanvas config={cfg} className="h-full w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <input value={meta[i]?.name ?? ''} onChange={(e) => patchMeta(i, { name: e.target.value })}
                    className="w-full truncate rounded-md border border-white/10 bg-[#100d1a] px-2 py-1 text-[10px] text-stone-200 outline-none focus:border-cyan-400/50" />
                  <div className="mt-1 flex items-center gap-1">
                    <select value={meta[i]?.base ?? ''} onChange={(e) => patchMeta(i, { base: e.target.value })}
                      className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#100d1a] px-1.5 py-0.5 font-mono text-[9px] text-stone-300 outline-none focus:border-cyan-400/50">
                      {VANILLA_BASE_ITEMS.map((b) => <option key={b.id} value={b.id}>{b.id}</option>)}
                    </select>
                    <input type="number" min={1} value={meta[i]?.cmd ?? 0} onChange={(e) => patchMeta(i, { cmd: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-16 rounded-md border border-white/10 bg-[#100d1a] px-1.5 py-0.5 text-right font-mono text-[9px] text-cyan-200 outline-none focus:border-cyan-400/50" />
                    <button onClick={() => remove(i)} title="削除"
                      className="rounded-md p-1 text-stone-600 transition hover:bg-red-500/15 hover:text-red-300">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => { clearCollection(); setMeta([]); }} className="text-[10px] font-semibold text-stone-500 underline-offset-2 hover:text-red-300 hover:underline">
            コレクションを空にする
          </button>
        </div>
      )}

      <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-black/40 p-1">
        {PACK_TARGETS.map((t) => (
          <button key={t.value} onClick={() => setTarget(t.value)}
            className={cn('flex flex-col rounded-lg px-1.5 py-1.5 text-left transition',
              target === t.value ? 'bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/35' : 'text-stone-500 hover:bg-white/5 hover:text-stone-300')}>
            <span className="text-[10px] font-bold leading-tight">{t.label}</span>
            <span className="text-[8px] uppercase tracking-wider opacity-65">{t.sub}</span>
          </button>
        ))}
      </div>

      <div className="mb-2 space-y-1.5">
        <input value={packName} onChange={(e) => setPackName(e.target.value)} placeholder="パック名"
          className="w-full rounded-xl border border-white/10 bg-[#100d1a] px-3 py-1.5 text-[11px] text-stone-200 outline-none focus:border-cyan-400/50" />
        <input value={packDesc} onChange={(e) => setPackDesc(e.target.value)} placeholder="説明文（パック一覧に表示）"
          className="w-full rounded-xl border border-white/10 bg-[#100d1a] px-3 py-1.5 text-[11px] text-stone-200 outline-none focus:border-cyan-400/50" />
        {target !== 'optifine-cit' && (
          <input value={namespace} onChange={(e) => setNamespace(e.target.value)} placeholder="namespace"
            className="w-full rounded-xl border border-white/10 bg-[#100d1a] px-3 py-1.5 font-mono text-[11px] text-cyan-200 outline-none focus:border-cyan-400/50" />
        )}
      </div>

      <button disabled={busy || collection.length === 0} onClick={exportPack}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-500 px-3 py-2.5 text-xs font-bold text-[#04222a] shadow-[0_0_18px_rgba(34,211,238,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45">
        <Download className="h-3.5 w-3.5" />
        {busy ? '統合パックを構築中…' : `統合サーバーパック ZIP (${collection.length}点)`}
      </button>
      <p className="mt-2 text-[9px] leading-relaxed text-stone-600">
        同梱: pack.mcmeta（色付き説明）· pack.png · 各テクスチャ{collection.some((c) => (c.animation?.type ?? 'none') !== 'none') ? '（アニメは縦ストリップ + .mcmeta）' : ''} · モデル/アイテム定義 · 統合ディスパッチャ · commands.txt · サーバー導入手順 README
        {bases.size > 0 && <span className="mt-1 block text-stone-500">土台 {bases.size} 種: {[...bases].join(' / ')}</span>}
      </p>
    </div>
  );
}
