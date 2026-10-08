import { Layer, applyStack, isLayerAnimated } from './effects';
import * as G from './geometry';
import { Tex, clamp, cloneTex, createTex, hexToRgb } from './tex';

export type PartKind =
  | 'blade-length' | 'blade-width' | 'crossguard' | 'gem' | 'pommel' | 'grip-wrap'
  | 'runes' | 'serrations' | 'second-blade' | 'ghost-wings' | 'charm' | 'crystal-spikes'
  | 'edge-inlay' | 'aura-shell';

export interface PartDef { type: PartKind; name: string; desc: string; material: 'shape' | 'detail' | 'magic'; color: string; size: number; position: number }
export interface PartLayer extends PartDef { id: string; enabled: boolean; offset: number; rotation: number; opacity: number }

export const PART_LIBRARY: PartDef[] = [
  { type: 'blade-length', name: '刃を延長', desc: '元の刃のピクセルを切っ先方向へ複製', material: 'shape', color: '#d6e7dd', size: 2, position: 100 },
  { type: 'blade-width', name: '厚刃にする', desc: '元の刃の幅を太くする', material: 'shape', color: '#a9c3b5', size: 1, position: 65 },
  { type: 'crossguard', name: '護拳・鍔', desc: '柄と刃の間に十字ガードを追加', material: 'shape', color: '#c69c49', size: 2, position: 25 },
  { type: 'second-blade', name: '反対刃', desc: '柄の反対側に、同じ刃を追加', material: 'shape', color: '#d6e7dd', size: 1, position: 100 },
  { type: 'gem', name: '宝石', desc: '護拳に立体的な宝石をはめる', material: 'detail', color: '#59d7bd', size: 2, position: 23 },
  { type: 'pommel', name: '柄頭', desc: 'グリップ端に装飾を付ける', material: 'detail', color: '#e4bf68', size: 2, position: 3 },
  { type: 'grip-wrap', name: '柄巻き', desc: '持ち手に交差した巻き模様', material: 'detail', color: '#9c6039', size: 1, position: 10 },
  { type: 'runes', name: 'ルーン刻印', desc: '刃の面に光る刻印を並べる', material: 'magic', color: '#a88bff', size: 2, position: 62 },
  { type: 'serrations', name: 'ノコギリ状の棘', desc: '刃の片側に歯を付ける', material: 'shape', color: '#d8ded9', size: 4, position: 68 },
  { type: 'ghost-wings', name: '残像の翼', desc: '後方に同じ刃の残像を重ねる', material: 'magic', color: '#b8a0ff', size: 2, position: 40 },
  { type: 'charm', name: 'チャーム', desc: '柄にぶら下がる鎖飾り', material: 'detail', color: '#f0d88b', size: 2, position: -8 },
  { type: 'crystal-spikes', name: '結晶の破片', desc: '刃のまわりに結晶の突起を足す', material: 'magic', color: '#82ecff', size: 4, position: 70 },
  { type: 'edge-inlay', name: '刃の象嵌', desc: '刃のエッジだけ別金属で縁取る', material: 'detail', color: '#f3d17b', size: 1, position: 85 },
  { type: 'aura-shell', name: '発光シェル', desc: '外周に薄いオーラのピクセルを足す', material: 'magic', color: '#9c7cff', size: 2, position: 100 },
];

let sequence = 0;
export function createPart(type: PartKind, overrides: Partial<PartLayer> = {}): PartLayer {
  const def = PART_LIBRARY.find((p) => p.type === type) || PART_LIBRARY[0];
  return { ...def, id: `part-${Date.now().toString(36)}-${(sequence++).toString(36)}`, enabled: true, offset: 0, rotation: 0, opacity: 100, ...overrides };
}

function px(t: Tex) { return Math.max(1, Math.round(Math.max(t.w, t.h) / 16)); }
function pixel(t: Tex, x: number, y: number, hex: string, shade = 1, alpha = 255) {
  if (x < 0 || y < 0 || x >= t.w || y >= t.h) return;
  const i = (y * t.w + x) * 4, c = hexToRgb(hex);
  for (let q = 0; q < 3; q++) t.d[i + q] = Math.max(0, Math.min(255, c[q] * shade));
  t.d[i + 3] = alpha;
}
function blend(base: Tex, overlay: Tex, amount: number): Tex {
  const out = cloneTex(base), k = amount / 100;
  for (let i = 0; i < out.d.length; i += 4) {
    const a = overlay.d[i + 3] / 255 * k;
    if (a <= 0) continue;
    const oldA = out.d[i + 3] / 255, nextA = a + oldA * (1 - a);
    for (let q = 0; q < 3; q++) out.d[i + q] = nextA ? (overlay.d[i + q] * a + out.d[i + q] * oldA * (1 - a)) / nextA : 0;
    out.d[i + 3] = nextA * 255;
  }
  return out;
}
function line(out: Tex, x0: number, y0: number, x1: number, y1: number, color: string, weight = 1) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let i = 0; i < 512; i++) {
    for (let yy = 0; yy < weight; yy++) for (let xx = 0; xx < weight; xx++) pixel(out, x0 + xx, y0 + yy, color);
    if (x0 === x1 && y0 === y1) break;
    const e = 2 * err;
    if (e >= dy) { err += dy; x0 += sx; }
    if (e <= dx) { err += dx; y0 += sy; }
  }
}
function jewel(out: Tex, x: number, y: number, size: number, color: string) {
  for (let row = -size; row <= size; row++) {
    const span = size - Math.abs(row);
    for (let col = -span; col <= span; col++) {
      const highlight = row < 0 || (row === 0 && col < 0), shadow = row > 0 || (row === 0 && col > 0);
      pixel(out, x + col, y + row, color, highlight ? 1.28 : shadow ? 0.56 : 0.92);
    }
  }
  pixel(out, x, y - size, '#ffffff', 1, 245);
}
function localPoint(src: Tex, u: number, v: number, rotation: number): [number, number] {
  const a = G.axis(src), r = rotation * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  const ax = a.ax * c - a.ay * s, ay = a.ax * s + a.ay * c;
  const px = a.px * c - a.py * s, py = a.px * s + a.py * c;
  return [a.hx + ax * a.len * u + px * v, a.hy + ay * a.len * u + py * v];
}
function rotatedBasis(src: Tex, rotation: number) {
  const a = G.axis(src), r = rotation * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  return { ...a, rx: a.ax * c - a.ay * s, ry: a.ax * s + a.ay * c, rpx: a.px * c - a.py * s, rpy: a.px * s + a.py * c };
}

function drawPart(source: Tex, current: Tex, part: PartLayer, time: number, seed: number): Tex {
  const out = createTex(source.w, source.h), unit = px(source), size = Math.max(1, Math.round(part.size * unit));
  const [cx, cy] = localPoint(source, part.position / 100, part.offset * unit, part.rotation);
  const rounded = (v: number) => Math.round(v);
  switch (part.type) {
    case 'blade-length': return G.extendBlade(current, size);
    case 'blade-width': return G.thickenBlade(current, size);
    case 'second-blade': {
      const a = G.axis(source), mx = (a.hx + a.tx) / 2, my = (a.hy + a.ty) / 2;
      const cloneScale = clamp(0.68 + part.size * 0.04, 0.68, 1.08);
      return G.composite(current, G.rotateAbout(source, 180, mx, my, cloneScale));
    }
    case 'grip-wrap': return G.wrapHandle(current, hexToRgb(part.color), seed + Math.round(part.size));
    case 'runes': return G.bladeRunes(current, hexToRgb(part.color), seed, Math.max(1, Math.round(part.size * 1.4)));
    case 'serrations': return G.addSpikes(current, Math.max(2, Math.round(part.size * 1.5)), hexToRgb(part.color), seed, 1);
    case 'gem': {
      jewel(out, rounded(cx), rounded(cy), Math.min(4, size), part.color);
      pixel(out, rounded(cx), rounded(cy), '#ffffff', 1, 255);
      break;
    }
    case 'pommel': {
      const p = localPoint(source, Math.min(0.12, part.position / 100), part.offset * unit, part.rotation);
      jewel(out, rounded(p[0]), rounded(p[1]), Math.min(4, size), part.color);
      line(out, rounded(p[0]), rounded(p[1]) + size, rounded(p[0]), rounded(p[1]) + size * 2, '#c3a76d', unit);
      break;
    }
    case 'crossguard': {
      const a = rotatedBasis(source, part.rotation), span = Math.max(2, size * 2.2), weight = Math.max(1, unit);
      line(out, rounded(cx - a.rpx * span), rounded(cy - a.rpy * span), rounded(cx + a.rpx * span), rounded(cy + a.rpy * span), part.color, weight);
      line(out, rounded(cx - a.rpx * span), rounded(cy - a.rpy * span), rounded(cx - a.rpx * span * 0.62 + a.rx * size), rounded(cy - a.rpy * span * 0.62 + a.ry * size), part.color, weight);
      line(out, rounded(cx + a.rpx * span), rounded(cy + a.rpy * span), rounded(cx + a.rpx * span * 0.62 - a.rx * size), rounded(cy + a.rpy * span * 0.62 - a.ry * size), part.color, weight);
      jewel(out, rounded(cx), rounded(cy), Math.max(1, unit), '#f0d985');
      break;
    }
    case 'edge-inlay': {
      const a = G.axis(source);
      for (let y = 0; y < source.h; y++) for (let x = 0; x < source.w; x++) {
      if (G.alphaAt(source, x, y) < 128 || G.along(source, x, y) < part.position / 100 - 0.25) continue;
        const ex = x + Math.round(a.px), ey = y + Math.round(a.py);
      if (G.alphaAt(source, ex, ey) < 128) for (let band = 0; band < Math.max(1, part.size); band++) {
        const bx = x + Math.round(a.px * band), by = y + Math.round(a.py * band);
        if (G.alphaAt(source, bx, by) >= 128) pixel(out, bx, by, part.color, band === 0 ? 1.12 : 0.84);
      }
      }
      break;
    }
    case 'ghost-wings': {
      const [hx, hy] = G.handleOf(source), a = G.axis(source);
      let ghost = createTex(source.w, source.h);
      const wingScale = clamp(0.52 + part.size * 0.045, 0.55, 0.98);
      const spread = 14 + part.size * 2.4;
      const alongShift = a.len * (part.position / 100 - 0.4);
      for (const angle of [-spread, spread, -spread * 1.65, spread * 1.65]) {
        const c = hexToRgb(part.color);
        ghost = G.composite(ghost, G.silhouette(G.rotateAbout(source, angle + part.rotation, hx, hy, wingScale, rounded(a.ax * alongShift + a.px * part.offset * unit), rounded(a.ay * alongShift + a.py * part.offset * unit)), c, 0.38));
      }
      return G.composite(current, ghost);
    }
    case 'charm': {
      const p = localPoint(source, part.position / 100, (part.offset + 2) * unit, part.rotation);
      const chain = localPoint(source, part.position / 100, (part.offset + 1) * unit, part.rotation);
      line(out, rounded(chain[0]), rounded(chain[1]), rounded(p[0]), rounded(p[1]), '#b39756', unit);
      jewel(out, rounded(p[0]), rounded(p[1]), Math.max(1, Math.min(3, size)), part.color);
      break;
    }
    case 'crystal-spikes': {
      let crystal = G.addSpikes(current, Math.max(3, Math.round(part.size * 2)), hexToRgb(part.color), seed, 1);
      crystal = G.bladeRunes(crystal, hexToRgb('#eaffff'), seed + 29, Math.max(2, part.size));
      return crystal;
    }
    case 'aura-shell': {
      const shell = G.silhouette(G.dilate(source, size, 1), hexToRgb(part.color), 0.55 + 0.2 * Math.sin(time * Math.PI * 2));
      return G.composite(G.composite(current, shell), source);
    }
  }
  return G.composite(current, out);
}

export function renderParts(base: Tex, parts: PartLayer[], time = 0): Tex {
  let current = cloneTex(base);
  parts.forEach((part, i) => { if (part.enabled) current = blend(current, drawPart(base, current, part, time, i * 43 + 17), part.opacity); });
  return current;
}

export function renderWeaponFrame(base: Tex, parts: PartLayer[], effects: Layer[], time: number, pose: { angle: number; x: number; y: number; scale: number }, motion: string, frameIndex: number, accent: string): Tex {
  const decorated = renderParts(base, parts, time);
  let effected = effects.length ? applyStack(decorated, effects, time) : decorated;
  const [hx, hy] = G.handleOf(base);
  const sx = effected.w / base.w, sy = effected.h / base.h, unit = Math.max(1, G.px(effected));
  let frame = G.rotateAbout(effected, pose.angle, hx * sx, hy * sy, pose.scale, pose.x * sx, pose.y * sy);
  const a = G.axis(base), tipX = base.w * 0.38 + a.ax * a.len * 0.55, tipY = base.h * 0.7 + a.ay * a.len * 0.55;
  if (motion === 'slash' && [3, 4, 5].includes(frameIndex)) {
    frame = G.drawArc(frame, base.w * sx * 0.38, base.h * sy * 0.72, a.len * sx * 0.46, -Math.PI * 0.88, -Math.PI * 0.16, hexToRgb(accent), 0.55, unit, true);
  }
  if (motion === 'smash' && frameIndex >= 4 && frameIndex <= 6) {
    frame = G.drawSparks(frame, tipX * sx + pose.x * sx, tipY * sy + pose.y * sy, 8, unit * (2 + frameIndex % 3), [238, 222, 180], frameIndex + 42, 0.85);
  }
  if (motion === 'cast' && frameIndex >= 2 && frameIndex <= 6) {
    frame = G.drawArc(frame, effected.w / 2, effected.h / 2, Math.min(effected.w, effected.h) * 0.36, time * Math.PI * 2, time * Math.PI * 2 + Math.PI * 1.35, hexToRgb(accent), 0.5, unit);
  }
  return frame;
}

export function hasAnimatedParts(parts: PartLayer[]) { return parts.some((p) => p.enabled && ['aura-shell'].includes(p.type)); }
export const hasAnimatedEffects = (effects: Layer[]) => effects.some((l) => isLayerAnimated(l));