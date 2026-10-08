import { DECORATIONS, type Decoration } from './forms-sampler';
import { DEFAULT_DECOR_TWEAK, type DecorLayer, type DecorTweak, type ShapeOptions } from './s1-design';

/**
 * Decoration stacking model.
 *
 * The visual stack (bottom → top) is:
 *   [back decorations in list order] → BODY → [front decorations in list order]
 * `shape.decorations` order is the z-order inside a layer; the layer itself comes from
 * the per-decoration override, falling back to the decoration's natural layer.
 */

export const BODY = 'body' as const;
export type StackEntry = { id: Decoration; layer: DecorLayer } | { id: typeof BODY; layer: 'body' };

export function defaultLayer(id: Decoration): DecorLayer {
  return DECORATIONS.find((d) => d.id === id)?.layer ?? 'front';
}

export function tweakOf(shape: ShapeOptions, id: Decoration): DecorTweak {
  return { ...DEFAULT_DECOR_TWEAK, ...shape.decorTweaks[id] };
}

export function layerOf(shape: ShapeOptions, id: Decoration): DecorLayer {
  return shape.decorTweaks[id]?.layer ?? defaultLayer(id);
}

/** bottom → top, including the body as a fixed separator */
export function buildStack(shape: ShapeOptions): StackEntry[] {
  const back: StackEntry[] = [], front: StackEntry[] = [];
  for (const id of shape.decorations) (layerOf(shape, id) === 'back' ? back : front).push({ id, layer: layerOf(shape, id) });
  return [...back, { id: BODY, layer: 'body' }, ...front];
}

/** Rebuild `decorations` order + layer overrides from an edited stack. */
function applyStack(shape: ShapeOptions, stack: StackEntry[]): ShapeOptions {
  const bodyIndex = stack.findIndex((e) => e.id === BODY);
  const decorations: Decoration[] = [];
  const decorTweaks = { ...shape.decorTweaks };
  stack.forEach((entry, index) => {
    if (entry.id === BODY) return;
    const layer: DecorLayer = index < bodyIndex ? 'back' : 'front';
    decorations.push(entry.id);
    const current = { ...DEFAULT_DECOR_TWEAK, ...decorTweaks[entry.id] };
    // store the layer only when it differs from the natural one, keeping blueprints clean
    decorTweaks[entry.id] = { ...current, layer: layer === defaultLayer(entry.id) ? undefined : layer };
  });
  return { ...shape, decorations, decorTweaks };
}

export type StackMove = 'up' | 'down' | 'top' | 'bottom';

/** Move a decoration within the stack; stepping across the body flips it between back and front. */
export function moveInStack(shape: ShapeOptions, id: Decoration, move: StackMove): ShapeOptions {
  const stack = buildStack(shape);
  const from = stack.findIndex((e) => e.id === id);
  if (from < 0) return shape;
  const [entry] = stack.splice(from, 1);
  const to = move === 'top' ? stack.length
    : move === 'bottom' ? 0
      : move === 'up' ? Math.min(stack.length, from + 1)
        : Math.max(0, from - 1);
  stack.splice(to, 0, entry);
  return applyStack(shape, stack);
}

/** Put a decoration directly in front of / behind the body (top of back / bottom of front). */
export function setLayer(shape: ShapeOptions, id: Decoration, layer: DecorLayer): ShapeOptions {
  const stack = buildStack(shape).filter((e) => e.id !== id);
  const bodyIndex = stack.findIndex((e) => e.id === BODY);
  stack.splice(layer === 'back' ? bodyIndex : bodyIndex + 1, 0, { id, layer });
  return applyStack(shape, stack);
}

export function updateTweak(shape: ShapeOptions, id: Decoration, patch: Partial<DecorTweak>): ShapeOptions {
  return { ...shape, decorTweaks: { ...shape.decorTweaks, [id]: { ...tweakOf(shape, id), ...patch } } };
}

export function resetTweak(shape: ShapeOptions, id: Decoration): ShapeOptions {
  const decorTweaks = { ...shape.decorTweaks };
  const layer = decorTweaks[id]?.layer;
  decorTweaks[id] = { ...DEFAULT_DECOR_TWEAK, layer };
  return { ...shape, decorTweaks };
}

export function removeDecoration(shape: ShapeOptions, id: Decoration): ShapeOptions {
  const decorTweaks = { ...shape.decorTweaks };
  delete decorTweaks[id];
  return { ...shape, decorations: shape.decorations.filter((d) => d !== id), decorTweaks };
}

export function addDecoration(shape: ShapeOptions, id: Decoration): ShapeOptions {
  if (shape.decorations.includes(id)) return shape;
  return { ...shape, decorations: [...shape.decorations, id] };
}

/**
 * Tweaks in a canonical form for cache keys: offsets can be zeroed, and entries that are
 * equivalent to the defaults are dropped, so creating an entry by dragging never changes a key.
 */
export function canonicalTweaks(shape: ShapeOptions, zeroOffsets: boolean): Record<string, DecorTweak> {
  const out: Record<string, DecorTweak> = {};
  for (const id of Object.keys(shape.decorTweaks).sort() as Decoration[]) {
    const t = tweakOf(shape, id);
    const c: DecorTweak = zeroOffsets ? { ...t, x: 0, y: 0 } : t;
    const isDefault = c.x === 0 && c.y === 0 && c.scale === 1 && c.spread === 1 && !c.hidden && c.layer === undefined;
    if (!isDefault) out[id] = c;
  }
  return out;
}

