import { Box, Crown, Grid3x3, Hand, RotateCw, Sparkles, Star, Trash2, Undo2, Redo2 } from "lucide-react";
import { ELEMENTS, RARITIES, STAFF_TYPES, ARTIFACT_FORMS, GEM_CUTS, ORNAMENTS, FLOATER_PATHS, MATERIALS, type Config } from "../engine/data";
import { CATEGORY_LABELS, type Category } from "../engine/labels";
import type { Atelier, Favorite } from "../state/useAtelier";
import type { Masterpiece } from "../state/masterpieces";
import { AnimatedCanvas, StaticThumb, Tooltip, type FrameCache } from "./Preview";
import type { Bg } from "../state/viewPrefs";

/* ------------------------------------------------------------------ atelier bar */

export function MasterpieceBar({ pieces, activeId, onSelect }: { pieces: Masterpiece[]; activeId: string; onSelect: (piece: Masterpiece) => void }) {
  return (
    <div className="masterpiece-bar">
      <span className="mp-label"><Crown size={12} />CURATED ATELIER</span>
      <div className="mp-list">
        {pieces.map((piece) => (
          <button
            key={piece.id}
            className={activeId === piece.id ? "mp-chip on" : "mp-chip"}
            style={{ ["--accent" as string]: piece.accent }}
            onClick={() => onSelect(piece)}
          >
            <b>{piece.title}</b>
            <small>{piece.subtitle}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ history rail */

export function HistoryRail({ atelier }: { atelier: Atelier }) {
  const { rail, undo, redo, past, future, jumpTo, config } = atelier;
  return (
    <div className="history-rail">
      <div className="hr-controls">
        <button onClick={undo} disabled={!past.length} title="元に戻す (Ctrl+Z)"><Undo2 size={13} /></button>
        <button onClick={redo} disabled={!future.length} title="やり直す (Ctrl+Shift+Z)"><Redo2 size={13} /></button>
      </div>
      <div className="hr-strip">
        {rail.map((entry, index) => {
          const active = entry.config.seed === config.seed && entry.config.name === config.name && entry.config.type === config.type;
          return (
            <button
              key={`${entry.at}-${index}`}
              className={active ? "hr-cell on" : "hr-cell"}
              style={{ ["--rc" as string]: RARITIES[entry.config.rarity].color }}
              title={entry.config.name || STAFF_TYPES[entry.config.type].label}
              onClick={() => jumpTo(entry.config)}
            >
              <StaticThumb cfg={{ ...entry.config, size: 32, frames: 1 }} className="px" />
            </button>
          );
        })}
      </div>
      <span className="hr-count">{past.length + 1} / {past.length + future.length + 1}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ favorites */

export function FavoriteRail({ favorites, onOpen, onRemove }: { favorites: Favorite[]; onOpen: (config: Config) => void; onRemove: (id: string) => void }) {
  if (!favorites.length) {
    return (
      <div className="fav-empty">
        <Star size={13} />
        <span>お気に入りは未登録です。気に入った構成で <kbd>F</kbd> を押すとここに保存されます。</span>
      </div>
    );
  }
  return (
    <div className="fav-rail">
      {favorites.map((favorite) => (
        <div className="fav-cell" key={favorite.id} style={{ ["--rc" as string]: RARITIES[favorite.config.rarity].color }}>
          <button className="fav-thumb" onClick={() => onOpen(favorite.config)} title={`${favorite.config.name} を開く`}>
            <StaticThumb cfg={{ ...favorite.config, size: 32, frames: 1 }} className="px" />
          </button>
          <button className="fav-remove" onClick={() => onRemove(favorite.id)} aria-label="お気に入りから削除"><Trash2 size={11} /></button>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ dossier */

export function Dossier({ config }: { config: Config }) {
  const rarity = RARITIES[config.rarity];
  const element = ELEMENTS[config.element];
  return (
    <div className="dossier" style={{ ["--rc" as string]: rarity.color }}>
      <div className="dos-left">
        <span className="dos-kicker">ATELIER SPELLFORGE · HAUTE JOAILLERIE RELIC</span>
        <h1 className="dos-name" style={{ color: rarity.color }}>{config.name || STAFF_TYPES[config.type].label}</h1>
        <div className="dos-pills">
          <span className="dos-pill"><i aria-hidden="true">{element.icon}</i>{element.label}属性</span>
          <span className="dos-pill">{STAFF_TYPES[config.type].label}</span>
          <span className="dos-pill">{ARTIFACT_FORMS[config.form]}</span>
          <span className="dos-pill">{GEM_CUTS[config.gemCut]}</span>
          <span className="dos-pill">{ORNAMENTS[config.ornament]}</span>
          <span className="dos-pill">{FLOATER_PATHS[config.floaterPath]}</span>
        </div>
      </div>
      <div className="dos-right">
        <div className="dos-stat"><b style={{ color: rarity.color }}>{rarity.label}</b><small>TIER {rarity.tier}</small></div>
        <div className="dos-stat"><b>{config.size}×{config.size}</b><small>{config.frames} FRAME{config.frames > 1 ? "S" : ""}</small></div>
        <div className="dos-stat"><b>#{config.seed.toString(36).toUpperCase().slice(0, 6)}</b><small>SERIAL</small></div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ stage */

const ASTROLABE_PATHS = (
  <>
    <circle cx="100" cy="100" r="86" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="2 4" />
    <circle cx="100" cy="100" r="74" fill="none" stroke="currentColor" strokeWidth="0.35" />
    <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1 3" />
    <polygon points="100,16 118,82 184,100 118,118 100,184 82,118 16,100 82,82" fill="none" stroke="currentColor" strokeWidth="0.3" />
    <line x1="100" y1="6" x2="100" y2="194" stroke="currentColor" strokeWidth="0.25" strokeDasharray="2 6" />
    <line x1="6" y1="100" x2="194" y2="100" stroke="currentColor" strokeWidth="0.25" strokeDasharray="2 6" />
  </>
);

type StageProps = {
  config: Config;
  cache: FrameCache;
  emissiveCache: FrameCache;
  showEmissive: boolean;
  playing: boolean;
  bg: Bg;
  revision: number;
};

export function StageView({ config, cache, emissiveCache, showEmissive, playing, bg, revision }: StageProps) {
  const active = showEmissive ? emissiveCache : cache;
  return (
    <div key={revision} className={`stage bg-${bg}`} style={{ ["--ec" as string]: config.energyColor }}>
      <div className="stage-glow" style={{ background: config.energyColor }} aria-hidden="true" />
      <svg className="stage-astrolabe" viewBox="0 0 200 200" aria-hidden="true">{ASTROLABE_PATHS}</svg>
      <AnimatedCanvas cache={active} frametime={config.frametime} playing={playing} className="big px" />
      <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
      <div className="stage-meta">
        <span>{showEmissive ? "OPTIFINE / IRIS EMISSIVE (_e.png)" : `${config.size}×${config.size}px · ${config.frames}f`}</span>
        <span>{MATERIALS[config.shaftMaterial].label} × {MATERIALS[config.trimMaterial].label}</span>
      </div>
    </div>
  );
}

export function SideInfo({ config, cache, emissiveCache, playing }: StageProps) {
  return (
    <div className="side-info">
      <Tooltip cfg={config} />
      <div className="mini-previews">
        <div><AnimatedCanvas cache={cache} frametime={config.frametime} playing={playing} className="px s1" /><small>1× 等倍</small></div>
        <div><AnimatedCanvas cache={cache} frametime={config.frametime} playing={playing} className="px s2" /><small>2× 拡大</small></div>
        <div className="dark-cell"><AnimatedCanvas cache={emissiveCache} frametime={config.frametime} playing={playing} className="px s2" /><small>_e 発光</small></div>
      </div>
      <div className="hotbar" aria-label="ホットバー表示">
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className={index === 4 ? "slot sel" : "slot"}>
            {index === 4 && <AnimatedCanvas cache={cache} frametime={config.frametime} playing={playing} className="px" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ in-game previews */

export function InGamePreview({ config, cache, playing, variations }: { config: Config; cache: FrameCache; playing: boolean; variations: Config[] }) {
  return (
    <div className="ingame">
      <div className="ingame-head">
        <span><Hand size={13} />ゲーム内ビュー</span>
        <small>手持ち角度・ドロップ浮遊・インベントリでの視認性</small>
      </div>
      <div className="ingame-grid">
        <figure className="ig-card">
          <figcaption><Hand size={11} />手持ち（一人称）</figcaption>
          <div className="ig-view ig-firstperson">
            <span className="ig-sky" /><span className="ig-ground" />
            <AnimatedCanvas cache={cache} frametime={config.frametime} playing={playing} className="px ig-hand" />
          </div>
        </figure>
        <figure className="ig-card">
          <figcaption><Box size={11} />ドロップアイテム</figcaption>
          <div className="ig-view ig-drop">
            <span className="ig-floor" /><span className="ig-shadow" />
            <AnimatedCanvas cache={cache} frametime={config.frametime} playing={playing} className="px ig-item" />
          </div>
        </figure>
        <figure className="ig-card ig-wide">
          <figcaption><Grid3x3 size={11} />インベントリ視認性</figcaption>
          <div className="ig-view ig-inv">
            <span className="ig-title">Crafting &amp; Inventory</span>
            <div className="ig-grid">
              {Array.from({ length: 27 }).map((_, index) => {
                const variant = variations[(index + 1) % Math.max(1, variations.length)];
                return (
                  <div key={index} className="slot">
                    {index === 4
                      ? <StaticThumb cfg={{ ...config, frames: 1 }} className="px" />
                      : variant && <StaticThumb cfg={variant} className="px dim" />}
                  </div>
                );
              })}
            </div>
            <div className="ig-grid ig-hotrow">
              {Array.from({ length: 9 }).map((_, index) => {
                const variant = variations[(index + 5) % Math.max(1, variations.length)];
                return (
                  <div key={index} className={index === 0 ? "slot sel" : "slot"}>
                    {index === 0
                      ? <StaticThumb cfg={{ ...config, frames: 1 }} className="px" />
                      : variant && <StaticThumb cfg={variant} className="px dim" />}
                  </div>
                );
              })}
            </div>
          </div>
        </figure>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ lineage + variations */

export function LineageStrip({ stages, onAdopt, onAddAll }: {
  stages: { label: string; subtitle: string; config: Config }[];
  onAdopt: (config: Config) => void;
  onAddAll: () => void;
}) {
  const hints = ["素体・素材", "金具・主石", "彫金・衛星石", "光彩・浮遊物"];
  return (
    <div className="lineage">
      <div className="lineage-head">
        <span>RELIC LINEAGE <small>同一アイテムの進化系列</small></span>
        <button onClick={onAddAll}>4段階をコレクションへ</button>
      </div>
      <div className="lineage-grid">
        {stages.map((stage, index) => (
          <button key={stage.subtitle} className="lineage-stage" style={{ ["--rc" as string]: RARITIES[stage.config.rarity].color }} onClick={() => onAdopt(stage.config)}>
            <span className="lineage-numeral">0{index + 1} / {stage.subtitle.toUpperCase()}</span>
            <StaticThumb cfg={stage.config} className="px" />
            <b style={{ color: RARITIES[stage.config.rarity].color }}>{stage.label}</b>
            <small>{hints[index] ?? ""}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

export function VariationGrid({ variations, seed, count, lockedOnly, lockedKeepCount, onCountChange, onReseed, onAdopt }: {
  variations: Config[];
  seed: number;
  count: number;
  lockedOnly: Category | null;
  lockedKeepCount: number;
  onCountChange: (value: number) => void;
  onReseed: () => void;
  onAdopt: (config: Config) => void;
}) {
  const caption = lockedOnly
    ? `「${CATEGORY_LABELS[lockedOnly]}」だけ変えて試作`
    : lockedKeepCount ? `${lockedKeepCount}項目を固定して試作` : "クリックでステージに採用";
  return (
    <div className="variations">
      <div className="var-head">
        <span><Sparkles size={13} />アトリエ・バリエーション</span>
        <small>{caption}</small>
        <div className="var-count">{[4, 8, 12, 16].map((value) => (
          <button key={value} className={count === value ? "on" : ""} onClick={() => onCountChange(value)}>{value}</button>
        ))}</div>
        <button className="mini" onClick={onReseed}><RotateCw size={11} />再試作</button>
      </div>
      <div className="var-grid">
        {variations.map((variant, index) => (
          <button
            key={`${seed}-${index}`}
            style={{ ["--d" as string]: `${index * 42}ms` }}
            onClick={() => onAdopt(variant)}
            title={`${variant.name} · ${STAFF_TYPES[variant.type].label}`}
          >
            <StaticThumb cfg={variant} className="px" />
            <span style={{ color: RARITIES[variant.rarity].color }}>{variant.name}</span>
            <small>{ELEMENTS[variant.element].icon} {STAFF_TYPES[variant.type].label}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
