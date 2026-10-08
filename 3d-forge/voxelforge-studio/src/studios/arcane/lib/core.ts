/* ═══════════════════════════════════════════════════════
   Core barrel — stable public API surface.

   Re-exports are ordered by dependency so that every module
   only depends on things declared above it.
   The renderer (./render) is *not* re-exported here on
   purpose: consumers import it directly to stay tree-shakeable.
   ═══════════════════════════════════════════════════════ */

// ── pure types & enumerations (zero runtime) ──
export * from './types';

// ── colour math & RNG ──
export * from './color';

// ── static defaults ──
export * from './defaults';

// ── data catalogues ──
export * from './catalog/palettes';
export * from './catalog/rarity';
export * from './catalog/elements';
export * from './catalog/itemTypes';
export * from './catalog/modEssences';
export * from './catalog/finials';
export * from './catalog/presets';

// ── mutation / policy helpers ──
export * from './harmony';
export * from './locks';
export * from './random';