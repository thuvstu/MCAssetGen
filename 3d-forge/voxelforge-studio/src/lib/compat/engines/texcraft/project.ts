import { useCallback, useRef, useState } from 'react';
import { EFFECT_MAP, Layer, defaultParams, newLayer } from './effects';
import { SAMPLES } from './samples';
import { Tex, fitTex } from './tex';
import { PartLayer, PART_LIBRARY, createPart } from './weaponParts';
import { KeyPose, WorkshopState, defaultWorkshopState } from './workshopTypes';

export interface EditorDoc {
  name: string;
  sources: Tex[];
  layers: Layer[];
  sampleId: string | null;
  animation: { frameCount: number; fps: number };
  workshop: WorkshopState;
}
export const STORAGE_KEY = 'texcraft-project-v3';

function encodeTex(t: Tex) {
  let data = '';
  for (let i = 0; i < t.d.length; i += 8192) data += String.fromCharCode(...t.d.subarray(i, i + 8192));
  return { w: t.w, h: t.h, data: btoa(data) };
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

function decodeTex(value: unknown, maxResolution = 128): Tex {
  if (!object(value)) throw new Error('画像データがありません。');
  const { w, h, data } = value;
  if (typeof w !== 'number' || typeof h !== 'number' || !Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || Math.max(w, h) > maxResolution || (maxResolution === 128 && Math.max(w, h) < 16) || typeof data !== 'string' || data.length > maxResolution * maxResolution * 16 / 3 + 4) {
    throw new Error('画像は16〜128pxの範囲で指定してください。');
  }
  const decoded = atob(data);
  if (decoded.length !== w * h * 4) throw new Error('画像データのサイズが一致しません。');
  const d = Uint8ClampedArray.from(decoded, (c) => c.charCodeAt(0));
  return { w, h, d };
}

export function serializeProject(doc: EditorDoc) {
  return JSON.stringify({ version: 3, name: doc.name, sources: doc.sources.map(encodeTex), layers: doc.layers, sampleId: doc.sampleId, animation: doc.animation, workshop: doc.workshop });
}

function parseLayer(entry: unknown): Layer {
  if (!object(entry) || typeof entry.type !== 'string' || !EFFECT_MAP[entry.type]) throw new Error('未対応のエフェクトが含まれています。');
  const def = EFFECT_MAP[entry.type], params = defaultParams(def);
  if (object(entry.params)) for (const p of def.params) {
    const v = entry.params[p.key];
    if (p.type === 'range' && typeof v === 'number' && Number.isFinite(v)) {
      const step = p.step || 1;
      params[p.key] = Math.min(p.max, Math.max(p.min, Math.round(v / step) * step));
    } else if (p.type === 'color' && typeof v === 'string' && /^#[\da-f]{6}$/i.test(v)) params[p.key] = v;
    else if (p.type === 'bool' && typeof v === 'boolean') params[p.key] = v;
    else if (p.type === 'select' && typeof v === 'string' && p.options.some(([option]) => option === v)) params[p.key] = v;
  }
  const layer = newLayer(entry.type, params, typeof entry.seed === 'number' ? entry.seed : 1);
  layer.enabled = entry.enabled !== false;
  layer.opacity = typeof entry.opacity === 'number' && Number.isFinite(entry.opacity) ? Math.min(100, Math.max(0, entry.opacity)) : 100;
  if (typeof entry.blend === 'string' && ['normal', 'multiply', 'screen', 'overlay', 'add'].includes(entry.blend)) layer.blend = entry.blend as Layer['blend'];
  return layer;
}

function parseWorkshop(value: unknown): WorkshopState {
  const base = defaultWorkshopState();
  if (!object(value)) return base;
  const validTypes = new Set(PART_LIBRARY.map((part) => part.type));
  const parts: PartLayer[] = Array.isArray(value.parts) ? value.parts.slice(0, 48).flatMap((entry) => {
    if (!object(entry) || typeof entry.type !== 'string' || !validTypes.has(entry.type as PartLayer['type'])) return [];
    const part = createPart(entry.type as PartLayer['type']);
    part.enabled = entry.enabled !== false;
    if (typeof entry.id === 'string' && entry.id.length < 100) part.id = entry.id;
    if (typeof entry.color === 'string' && /^#[\da-f]{6}$/i.test(entry.color)) part.color = entry.color;
    for (const key of ['size', 'position', 'offset', 'rotation', 'opacity'] as const) {
      const valueForKey = entry[key];
      if (typeof valueForKey === 'number' && Number.isFinite(valueForKey)) {
        const range = { size: [1, 10], position: [-15, 115], offset: [-8, 8], rotation: [-90, 90], opacity: [0, 100] }[key];
        part[key] = Math.min(range[1], Math.max(range[0], valueForKey));
      }
    }
    return [part];
  }) : [];
  const effects = Array.isArray(value.effects) ? value.effects.slice(0, 32).map(parseLayer) : [];
  const keyframes: KeyPose[] = Array.isArray(value.keyframes) ? value.keyframes.slice(0, 16).flatMap((entry, i) => {
    if (!object(entry)) return [];
    const number = (key: string, fallback: number, min: number, max: number) => typeof entry[key] === 'number' && Number.isFinite(entry[key]) ? Math.min(max, Math.max(min, entry[key] as number)) : fallback;
    return [{
      id: typeof entry.id === 'string' && entry.id.length < 100 ? entry.id : `pose-${i}`,
      time: number('time', i / 5, 0, 1), label: typeof entry.label === 'string' ? entry.label.slice(0, 24) : `Pose ${i + 1}`,
      angle: number('angle', 0, -180, 360), x: number('x', 0, -8, 8), y: number('y', 0, -8, 8), scale: number('scale', 0.76, 0.5, 1.15),
    }];
  }) : base.keyframes;
  return {
    parts,
    effects,
    motion: typeof value.motion === 'string' && ['idle', 'slash', 'combo', 'thrust', 'smash', 'spin', 'guard', 'cast', 'custom'].includes(value.motion) ? value.motion : base.motion,
    keyframes: keyframes.length >= 2 ? keyframes : base.keyframes,
    frameCount: typeof value.frameCount === 'number' && [4, 6, 8, 12, 16, 24, 32].includes(value.frameCount) ? value.frameCount : base.frameCount,
    motionEnabled: value.motionEnabled !== false,
  };
}

export function parseProject(text: string): EditorDoc {
  if (text.length > 8_000_000) throw new Error('プロジェクトファイルは8MBまでです。');
  const value: unknown = JSON.parse(text);
  if (!object(value) || !Array.isArray(value.sources) || value.sources.length < 1 || value.sources.length > 64 || !Array.isArray(value.layers) || value.layers.length > 64) {
    throw new Error('TexCraftのプロジェクトファイルを選択してください。');
  }
  const sources = value.sources.map((source) => decodeTex(source));
  if (sources.some((s) => s.w !== sources[0].w || s.h !== sources[0].h)) throw new Error('すべてのフレームは同じサイズにしてください。');
  const layers = value.layers.map(parseLayer);
  const animation = { frameCount: 16, fps: 10 };
  if (object(value.animation)) {
    if (typeof value.animation.frameCount === 'number' && [4, 8, 12, 16, 24, 32, 64].includes(value.animation.frameCount)) animation.frameCount = value.animation.frameCount;
    if (typeof value.animation.fps === 'number' && [2, 4, 5, 10, 20].includes(value.animation.fps)) animation.fps = value.animation.fps;
  }
  animation.frameCount = [4, 8, 12, 16, 24, 32, 64].find((n) => n >= Math.max(animation.frameCount, sources.length)) || 64;
  return { sources, layers, name: typeof value.name === 'string' ? value.name.slice(0, 100) : 'texture', sampleId: typeof value.sampleId === 'string' ? value.sampleId : null, animation, workshop: parseWorkshop(value.workshop) };
}

export function initialDocument(): EditorDoc {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return parseProject(saved);
  } catch { /* An invalid cache must not prevent opening the editor. */ }
  try {
    const raw = localStorage.getItem('mc-texforge-v1');
    const legacy: unknown = raw ? JSON.parse(raw) : null;
    if (object(legacy) && legacy.base && Array.isArray(legacy.layers)) {
      const base = decodeTex(legacy.base, 1024);
      const source = fitTex(base, Math.min(128, Math.max(16, base.w, base.h)));
      return parseProject(JSON.stringify({ name: legacy.name, sources: [encodeTex(source)], layers: legacy.layers, sampleId: null }));
    }
  } catch { /* Keep legacy storage untouched if migration is not possible. */ }
  return { name: 'diamond_sword', sources: [fitTex(SAMPLES.find((s) => s.id === 'sword')!.make(), 16)], layers: [], sampleId: 'sword', animation: { frameCount: 8, fps: 10 }, workshop: defaultWorkshopState() };
}

export function useDocHistory() {
  const [state, setState] = useState(() => ({ past: [] as EditorDoc[], doc: initialDocument(), future: [] as EditorDoc[] }));
  const last = useRef({ key: '', at: 0 });
  const update = useCallback((fn: (doc: EditorDoc) => EditorDoc, key = '') => {
    const now = Date.now();
    const coalesce = !!key && last.current.key === key && now - last.current.at < 1400;
    last.current = { key, at: now };
    setState((s) => {
      const doc = fn(s.doc);
      if (doc === s.doc) return s;
      return { past: coalesce ? s.past : [...s.past.slice(-39), s.doc], doc, future: [] };
    });
  }, []);
  const undo = useCallback(() => {
    last.current.key = '';
    setState((s) => s.past.length ? { past: s.past.slice(0, -1), doc: s.past[s.past.length - 1], future: [s.doc, ...s.future] } : s);
  }, []);
  const redo = useCallback(() => {
    last.current.key = '';
    setState((s) => s.future.length ? { past: [...s.past, s.doc], doc: s.future[0], future: s.future.slice(1) } : s);
  }, []);
  return { doc: state.doc, update, undo, redo, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}