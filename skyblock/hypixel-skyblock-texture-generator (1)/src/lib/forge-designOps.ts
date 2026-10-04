import { ARCHES, type Design, type PartTransform } from './forge-archetypes';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : 0));
const angle = (v: number) => ((clamp(v, -3600, 3600) + 180) % 360 + 360) % 360 - 180;

/** Normalize old saves and hand-edited JSON before it reaches the rasterizer. */
export function normalizeDesign(source: Design): Design {
  const arch = ARCHES[source.arch] ? source.arch : 'sword';
  const A = ARCHES[arch];
  const cleanParts: Record<string, PartTransform> = {};
  for (const [id, p] of Object.entries(source.partTransforms ?? {})) {
    if (!id || !p) continue;
    const value: PartTransform = {
      x: clamp(p.x ?? 0, -32, 32),
      y: clamp(p.y ?? 0, -32, 32),
      scale: clamp(p.scale ?? 1, 0.2, 3),
      rotation: angle(p.rotation ?? 0),
      flipX: !!p.flipX,
      flipY: !!p.flipY,
    };
    if (value.x || value.y || value.scale !== 1 || value.rotation || value.flipX || value.flipY) cleanParts[id] = value;
  }
  const groups = (source.mergeParts ?? [])
    .map((g) => [...new Set(g.filter(Boolean))])
    .filter((g) => g.length > 1);
  return {
    ...source,
    arch,
    a: Math.round(clamp(source.a, 0, A.A.length - 1)),
    b: Math.round(clamp(source.b, 0, A.B.length - 1)),
    len: clamp(source.len, 0, 1),
    wid: clamp(source.wid, 0, 1),
    orn: clamp(source.orn, 0, 1),
    offsetX: clamp(source.offsetX ?? 0, -28, 28),
    offsetY: clamp(source.offsetY ?? 0, -28, 28),
    scaleX: clamp(source.scaleX ?? 1, 0.2, 3),
    scaleY: clamp(source.scaleY ?? 1, 0.2, 3),
    rotation: angle(source.rotation ?? 0),
    flipX: !!source.flipX,
    flipY: !!source.flipY,
    autoFit: source.autoFit !== false,
    partTransforms: cleanParts,
    mergeParts: groups,
    coreMode: Math.round(clamp(source.coreMode ?? 0, 0, 3)),
    pull: source.pull === undefined ? undefined : Math.round(clamp(source.pull, 0, 3)),
  };
}

export function nativePixelUnit(n: number) {
  return 64 / n;
}

export function nudgeCanvas(d: Design, n: number, dx: number, dy: number): Design {
  const u = nativePixelUnit(n);
  return normalizeDesign({ ...d, offsetX: (d.offsetX ?? 0) + dx * u, offsetY: (d.offsetY ?? 0) + dy * u });
}

export function updatePartTransform(d: Design, id: string, patch: Partial<PartTransform>): Design {
  const parts = { ...(d.partTransforms ?? {}) };
  const next: PartTransform = { ...parts[id], ...patch };
  if ((next.x ?? 0) === 0 && (next.y ?? 0) === 0 && (next.scale ?? 1) === 1 && (next.rotation ?? 0) === 0 && !next.flipX && !next.flipY) delete parts[id];
  else parts[id] = next;
  return normalizeDesign({ ...d, partTransforms: parts });
}

export function mergeDesignParts(d: Design, a: string, b: string): Design {
  if (!a || !b || a === b) return d;
  const old = d.mergeParts ?? [];
  const touching = old.filter((g) => g.includes(a) || g.includes(b));
  const rest = old.filter((g) => !touching.includes(g));
  const group = [...new Set([a, b, ...touching.flat()])];
  return normalizeDesign({ ...d, mergeParts: [...rest, group] });
}

export function splitDesignPart(d: Design, id: string): Design {
  const groups: string[][] = [];
  for (const g of d.mergeParts ?? []) {
    if (!g.includes(id)) groups.push(g);
    else {
      const rest = g.filter((x) => x !== id);
      if (rest.length > 1) groups.push(rest);
    }
  }
  return normalizeDesign({ ...d, mergeParts: groups });
}

export function resetDesignTransform(d: Design): Design {
  return normalizeDesign({ ...d, offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false, autoFit: true, partTransforms: {}, mergeParts: [] });
}