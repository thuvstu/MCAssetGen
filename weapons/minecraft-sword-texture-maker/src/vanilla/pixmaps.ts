/**
 * Vanilla-accurate 16×16 pixel geometry & layouts.
 *
 * In Mojang's 16×16 item textures, weapons and tools are aligned to the main
 * anti-diagonal `x + y = 15` (running from the pommel at `(0, 15)` to the tip
 * at `(15, 0)`) and are mirror-symmetric under `T(x, y) = (15 - y, 15 - x)`.
 *
 * Palette indices (resolved by `renderer.resolveColor`):
 *  0 = transparent
 *  1 = blade highlight (lit upper-left edge)
 *  2 = blade mid (center body along x + y = 15)
 *  3 = blade dark (lower-right core shadow)
 *  4 = blade / head outer dark outline
 *  5 = handle light (wood / grip highlight)
 *  6 = handle dark (wood / grip shadow & border)
 *  7 = guard / pommel bright face
 *  8 = guard / pommel dark outline
 *  9 = accent (bowstring, fishing line, heavy-core glint, shield boss)
 */

export const VANILLA_GRID = 16;

// ─── Sword (Mojang 16×16 wooden/stone/iron/golden/diamond_sword) ────
export const SWORD: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4],
  [0,0,0,0,0,0,0,0,0,0,0,0,4,1,2,4],
  [0,0,0,0,0,0,0,0,0,0,0,4,1,2,3,4],
  [0,0,0,0,0,0,0,0,0,0,4,1,2,3,4,0],
  [0,0,0,0,0,0,0,0,0,4,1,2,3,4,0,0],
  [0,0,0,0,0,0,0,0,4,1,2,3,4,0,0,0],
  [0,4,8,0,0,0,0,4,1,2,3,4,0,0,0,0],
  [0,8,7,8,0,0,4,1,2,3,4,0,0,0,0,0],
  [0,0,8,7,8,4,1,2,3,4,0,0,0,0,0,0],
  [0,0,0,8,7,7,2,3,4,0,0,0,0,0,0,0],
  [0,0,0,0,8,7,7,8,0,0,0,0,0,0,0,0],
  [0,0,0,6,5,8,7,7,8,0,0,0,0,0,0,0],
  [0,0,6,5,6,0,8,7,8,0,0,0,0,0,0,0],
  [8,8,5,6,0,0,0,8,7,8,0,0,0,0,0,0],
  [8,7,8,0,0,0,0,0,8,4,0,0,0,0,0,0],
  [8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// ─── Netherite Sword (1.16+ broadened guard & spine fuller) ─────────
export const NETHERITE_SWORD: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4],
  [0,0,0,0,0,0,0,0,0,0,0,0,4,1,2,4],
  [0,0,0,0,0,0,0,0,0,0,0,4,1,2,3,4],
  [0,0,0,0,0,0,0,0,0,0,4,1,2,3,4,0],
  [0,0,0,0,0,0,0,0,0,4,1,3,2,4,0,0],
  [0,4,8,0,0,0,0,0,4,1,3,2,4,0,0,0],
  [0,8,7,8,0,0,0,4,1,3,2,4,0,0,0,0],
  [0,0,8,7,8,0,4,1,3,2,4,0,0,0,0,0],
  [0,0,0,8,7,8,1,2,3,4,0,0,0,0,0,0],
  [0,0,0,8,7,7,2,3,4,0,0,0,0,0,0,0],
  [0,0,0,0,8,7,7,8,0,0,0,0,0,0,0,0],
  [0,0,0,6,5,8,7,7,8,0,0,0,0,0,0,0],
  [0,0,6,5,6,0,8,7,8,0,0,0,0,0,0,0],
  [8,8,5,6,0,0,0,8,7,8,0,0,0,0,0,0],
  [8,7,8,0,0,0,0,0,8,7,8,0,0,0,0,0],
  [8,8,8,0,0,0,0,0,0,8,4,0,0,0,0,0],
];

// ─── PvP Short Blade (1.8.9 competitive short sword) ────────────────
// Keeps the exact vanilla pommel, grip, and crossguard while shortening
// the blade by 3 steps for clear screen visibility.
export const DAGGER: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,4,4,4,0,0,0],
  [0,0,0,0,0,0,0,0,0,4,1,2,4,0,0,0],
  [0,0,0,0,0,0,0,0,4,1,2,3,4,0,0,0],
  [0,4,8,0,0,0,0,4,1,2,3,4,0,0,0,0],
  [0,8,7,8,0,0,4,1,2,3,4,0,0,0,0,0],
  [0,0,8,7,8,4,1,2,3,4,0,0,0,0,0,0],
  [0,0,0,8,7,7,2,3,4,0,0,0,0,0,0,0],
  [0,0,0,0,8,7,7,8,0,0,0,0,0,0,0,0],
  [0,0,0,6,5,8,7,7,8,0,0,0,0,0,0,0],
  [0,0,6,5,6,0,8,7,8,0,0,0,0,0,0,0],
  [8,8,5,6,0,0,0,8,7,8,0,0,0,0,0,0],
  [8,7,8,0,0,0,0,0,8,4,0,0,0,0,0,0],
  [8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// ─── Axe (Mojang 16×16 Axe) ─────────────────────────────────────────
export const AXE: number[][] = [
  [0,0,0,0,0,0,0,0,4,4,4,0,0,0,0,0],
  [0,0,0,0,0,0,0,4,1,1,2,4,0,0,0,0],
  [0,0,0,0,0,0,4,1,2,2,3,3,4,0,0,0],
  [0,0,0,0,0,4,1,2,2,3,6,5,3,4,0,0],
  [0,0,0,0,0,4,1,2,3,6,5,6,2,4,0,0],
  [0,0,0,0,0,0,4,1,3,5,6,4,4,0,0,0],
  [0,0,0,0,0,0,0,4,5,6,0,0,0,0,0,0],
  [0,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0],
  [0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0],
  [0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0],
  [0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0],
  [0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0],
  [0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0],
  [6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// ─── Pickaxe (Mojang 16×16 Pickaxe) ─────────────────────────────────
export const PICKAXE: number[][] = [
  [0,0,0,0,0,0,0,4,4,4,4,4,0,0,0,0],
  [0,0,0,0,0,0,4,1,1,2,2,3,4,4,0,0],
  [0,0,0,0,0,4,1,2,3,4,4,2,1,3,4,0],
  [0,0,0,0,0,4,3,4,0,0,6,5,2,3,4,0],
  [0,0,0,0,0,0,0,0,0,6,5,6,4,2,3,4],
  [0,0,0,0,0,0,0,0,6,5,6,0,4,2,3,4],
  [0,0,0,0,0,0,0,6,5,6,0,0,0,4,3,4],
  [0,0,0,0,0,0,6,5,6,0,0,0,0,4,3,4],
  [0,0,0,0,0,6,5,6,0,0,0,0,0,0,4,0],
  [0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0],
  [0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0],
  [0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0],
  [0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0],
  [6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// ─── Shovel (Mojang 16×16 Shovel) ───────────────────────────────────
export const SHOVEL: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,4,4,4,0,0],
  [0,0,0,0,0,0,0,0,0,0,4,1,1,2,4,0],
  [0,0,0,0,0,0,0,0,0,4,1,2,2,3,2,4],
  [0,0,0,0,0,0,0,0,0,4,1,2,2,3,2,4],
  [0,0,0,0,0,0,0,0,0,4,3,2,3,3,4,0],
  [0,0,0,0,0,0,0,0,6,5,4,3,4,4,0,0],
  [0,0,0,0,0,0,0,6,5,6,0,0,0,0,0,0],
  [0,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0],
  [0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0],
  [0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0],
  [0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0],
  [0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0],
  [0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0],
  [6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// ─── Hoe (Mojang 16×16 Hoe) ─────────────────────────────────────────
export const HOE: number[][] = [
  [0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0],
  [0,0,0,0,0,0,4,1,1,2,2,4,0,0,0,0],
  [0,0,0,0,0,4,1,2,3,4,6,5,4,0,0,0],
  [0,0,0,0,0,4,3,4,0,6,5,6,0,0,0,0],
  [0,0,0,0,0,0,0,0,6,5,6,0,0,0,0,0],
  [0,0,0,0,0,0,0,6,5,6,0,0,0,0,0,0],
  [0,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0],
  [0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0],
  [0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0],
  [0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0],
  [0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0],
  [0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0],
  [6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// ─── Trident (Mojang 16×16 Trident) ─────────────────────────────────
export const TRIDENT: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,1,4,0,1,4],
  [0,0,0,0,0,0,0,0,0,1,4,1,2,1,2,4],
  [0,0,0,0,0,0,0,0,1,2,4,2,3,2,3,4],
  [0,0,0,0,0,0,0,1,2,3,2,3,4,3,4,0],
  [0,0,0,0,0,0,1,2,3,7,7,3,2,4,0,0],
  [0,0,0,0,0,0,4,3,7,7,8,3,4,0,0,0],
  [0,0,0,0,0,0,0,4,7,5,8,4,0,0,0,0],
  [0,0,0,0,0,0,0,6,5,6,8,0,0,0,0,0],
  [0,0,0,0,0,0,6,5,6,0,0,0,0,0,0,0],
  [0,0,0,0,0,6,5,6,0,0,0,0,0,0,0,0],
  [0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0],
  [0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0],
  [0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0],
  [0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0],
  [6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// ─── Bow (Mojang 16×16 bow.png — curved stave + taut string) ────────
export const BOW: number[][] = [
  [0,0,0,0,0,0,0,0,6,6,6,6,0,0,0,0],
  [0,0,0,0,0,0,6,6,5,5,1,6,9,0,0,0],
  [0,0,0,0,6,6,5,5,6,0,0,9,0,0,0,0],
  [0,0,0,6,5,5,6,0,0,0,9,0,0,0,0,0],
  [0,0,6,5,5,6,0,0,0,9,0,0,0,0,0,0],
  [0,0,6,5,6,0,0,0,9,0,0,0,0,0,0,0],
  [0,6,5,6,0,0,0,9,0,0,0,0,0,0,0,0],
  [0,6,5,6,0,0,9,0,0,0,0,0,0,0,0,0],
  [6,5,6,0,0,9,0,0,0,0,0,0,0,0,0,0],
  [6,5,6,0,9,0,0,0,0,0,0,0,0,0,0,0],
  [6,5,6,9,0,0,0,0,0,0,0,0,0,0,0,0],
  [6,1,6,9,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,6,9,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// ─── Crossbow (Mojang 16×16 crossbow_standby.png) ───────────────────
export const CROSSBOW: number[][] = [
  [0,0,0,0,0,6,6,6,6,0,0,0,0,0,0,0],
  [0,0,0,0,6,5,5,7,8,6,0,0,0,4,4,0],
  [0,0,0,6,5,6,0,0,8,7,6,0,4,1,2,4],
  [0,0,0,6,9,0,0,0,0,8,7,6,1,2,4,0],
  [0,0,0,0,9,0,0,0,0,0,8,5,6,4,0,0],
  [0,0,0,0,0,9,0,0,0,6,5,6,8,0,0,0],
  [0,0,0,0,0,0,9,0,6,5,6,0,8,7,0,0],
  [0,0,0,0,0,0,0,7,5,6,0,0,0,8,7,0],
  [0,0,0,0,0,0,6,5,7,9,0,0,0,8,5,6],
  [0,0,0,0,0,6,5,6,0,0,9,0,0,8,5,6],
  [0,0,0,0,6,5,6,0,0,0,0,9,6,5,6,0],
  [0,0,0,6,5,6,0,0,0,0,0,0,6,6,0,0],
  [0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0],
  [0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// ─── Mace (Mojang 1.21 Heavy Core + Breeze Rod) ─────────────────────
export const MACE: number[][] = [
  [0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0],
  [0,0,0,0,0,0,0,0,4,1,1,2,3,4,0,0],
  [0,0,0,0,0,0,0,4,1,2,9,9,2,3,4,0],
  [0,0,0,0,0,0,4,1,2,9,7,7,9,2,3,4],
  [0,0,0,0,0,0,4,1,9,7,8,8,7,2,3,4],
  [0,0,0,0,0,0,4,2,9,7,8,8,7,3,4,0],
  [0,0,0,0,0,0,0,4,2,3,7,7,3,4,0,0],
  [0,0,0,0,0,0,6,5,4,3,3,4,4,0,0,0],
  [0,0,0,0,0,6,5,6,8,4,0,0,0,0,0,0],
  [0,0,0,0,6,5,6,0,0,0,0,0,0,0,0,0],
  [0,0,0,6,5,6,0,0,0,0,0,0,0,0,0,0],
  [0,0,6,5,6,0,0,0,0,0,0,0,0,0,0,0],
  [0,6,5,6,0,0,0,0,0,0,0,0,0,0,0,0],
  [6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [5,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// ─── Fishing Rod (Mojang 16×16 fishing_rod.png) ─────────────────────
export const FISHING_ROD: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,6,6,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,6,5,6,9,0],
  [0,0,0,0,0,0,0,0,0,0,6,5,6,0,9,0],
  [0,0,0,0,0,0,0,0,0,6,5,6,0,0,9,0],
  [0,0,0,0,0,0,0,0,6,5,6,0,0,0,9,0],
  [0,0,0,0,0,0,0,6,5,6,0,0,0,0,9,0],
  [0,0,0,0,0,0,6,5,6,0,0,0,0,9,0,0],
  [0,0,0,0,0,6,5,6,0,0,0,0,0,9,0,0],
  [0,0,0,0,6,5,6,0,0,0,0,0,9,7,0,0],
  [0,0,0,6,5,6,8,0,0,0,0,0,0,7,0,0],
  [0,0,6,5,6,7,8,0,0,0,0,0,0,0,0,0],
  [0,6,5,6,8,8,0,0,0,0,0,0,0,0,0,0],
  [6,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// ─── Shield (Mojang 16×16 shield.png) ───────────────────────────────
export const SHIELD: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,8,8,8,8,8,8,8,8,8,8,0,0,0],
  [0,0,8,7,7,7,7,7,7,7,7,7,7,8,0,0],
  [0,0,8,7,5,5,5,6,6,5,5,5,7,8,0,0],
  [0,0,8,7,5,5,6,6,6,6,5,5,7,8,0,0],
  [0,0,8,7,5,6,6,9,9,6,6,5,7,8,0,0],
  [0,0,8,7,5,6,9,1,2,9,6,5,7,8,0,0],
  [0,0,8,7,5,6,9,2,3,9,6,5,7,8,0,0],
  [0,0,8,7,5,6,6,9,9,6,6,5,7,8,0,0],
  [0,0,0,8,7,5,5,6,6,5,5,7,8,0,0,0],
  [0,0,0,8,7,5,5,5,5,5,5,7,8,0,0,0],
  [0,0,0,0,8,7,5,5,5,5,7,8,0,0,0,0],
  [0,0,0,0,0,8,7,7,7,7,8,0,0,0,0,0],
  [0,0,0,0,0,0,8,7,7,8,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,8,8,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

export type VanillaWeaponId =
  | "dagger"
  | "sword" | "axe" | "pickaxe" | "shovel" | "hoe"
  | "trident" | "bow" | "crossbow" | "mace"
  | "fishing_rod" | "shield" | "netherite_sword";

export interface WeaponDef {
  id: VanillaWeaponId;
  label: string;
  emoji: string;
  map: number[][];
  /**
   * Base item name WITHOUT the material prefix, e.g. "sword", "pickaxe".
   * For non-tiered items this is the full vanilla name, e.g. "trident".
   */
  baseName: string;
  /** True when Minecraft ships one texture per material (sword, axe, …) */
  tiered: boolean;
  /** Vanilla texture file used as the fallback / model layer0 */
  vanillaFile: string;
}

export const WEAPON_DEFS: WeaponDef[] = [
  { id: "sword",           label: "Sword",           emoji: "🗡️",  map: SWORD,           baseName: "sword",           tiered: true,  vanillaFile: "diamond_sword" },
  { id: "dagger",          label: "Short Blade",     emoji: "🔪",  map: DAGGER,          baseName: "sword",           tiered: true,  vanillaFile: "diamond_sword" },
  { id: "axe",             label: "Axe",             emoji: "🪓",  map: AXE,             baseName: "axe",             tiered: true,  vanillaFile: "diamond_axe" },
  { id: "pickaxe",         label: "Pickaxe",         emoji: "⛏️",  map: PICKAXE,         baseName: "pickaxe",         tiered: true,  vanillaFile: "diamond_pickaxe" },
  { id: "shovel",          label: "Shovel",          emoji: "🪣",  map: SHOVEL,          baseName: "shovel",          tiered: true,  vanillaFile: "diamond_shovel" },
  { id: "hoe",             label: "Hoe",             emoji: "🌾",  map: HOE,             baseName: "hoe",             tiered: true,  vanillaFile: "diamond_hoe" },
  { id: "trident",         label: "Trident",         emoji: "🔱",  map: TRIDENT,         baseName: "trident",         tiered: false, vanillaFile: "trident" },
  { id: "bow",             label: "Bow",             emoji: "🏹",  map: BOW,             baseName: "bow",             tiered: false, vanillaFile: "bow" },
  { id: "crossbow",        label: "Crossbow",        emoji: "🔧",  map: CROSSBOW,        baseName: "crossbow_standby", tiered: false, vanillaFile: "crossbow_standby" },
  { id: "mace",            label: "Mace (1.21)",     emoji: "🔨",  map: MACE,            baseName: "mace",            tiered: false, vanillaFile: "mace" },
  { id: "fishing_rod",     label: "Fishing Rod",     emoji: "🎣",  map: FISHING_ROD,     baseName: "fishing_rod",     tiered: false, vanillaFile: "fishing_rod" },
  { id: "shield",          label: "Shield",          emoji: "🛡️", map: SHIELD,          baseName: "shield",          tiered: false, vanillaFile: "shield" },
  { id: "netherite_sword", label: "Netherite Sword", emoji: "⬛",  map: NETHERITE_SWORD, baseName: "netherite_sword", tiered: false, vanillaFile: "netherite_sword" },
];

/**
 * Minecraft's material prefixes are irregular: gold → "golden", wood → "wooden".
 * Non-vanilla tiers (copper, emerald, …) have no vanilla texture, so they can
 * only be shipped as CustomModelData / CIT items.
 */
export const VANILLA_TIER_PREFIX: Record<string, string | null> = {
  wood: "wooden",
  stone: "stone",
  iron: "iron",
  gold: "golden",
  diamond: "diamond",
  netherite: "netherite",
  copper: null,
  emerald: null,
  amethyst: null,
  prismarine: null,
  breeze: null,
};

/**
 * Resolve the real vanilla texture path for a weapon + tier, or null when
 * the combination does not exist in the game (e.g. an emerald sword, or a
 * tiered prefix on a non-tiered item like the trident).
 */
export function vanillaTexturePath(weapon: WeaponDef, tierKey: string): string | null {
  if (!weapon.tiered) {
    return weapon.vanillaFile;
  }
  const prefix = VANILLA_TIER_PREFIX[tierKey];
  if (!prefix) return null;
  return `${prefix}_${weapon.baseName}`;
}

/** Item id used in commands / CIT matching */
export function vanillaItemId(weapon: WeaponDef, tierKey: string): string {
  if (!weapon.tiered) return weapon.baseName === "crossbow_standby" ? "crossbow" : weapon.baseName;
  const prefix = VANILLA_TIER_PREFIX[tierKey] ?? "diamond";
  return `${prefix}_${weapon.baseName}`;
}
