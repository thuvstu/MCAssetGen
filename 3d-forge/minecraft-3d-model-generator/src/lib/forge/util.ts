export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const TAU = Math.PI * 2;

/** mulberry32 */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Object.assign(next, {
    range: (lo: number, hi: number) => lo + next() * (hi - lo),
    int: (lo: number, hi: number) => Math.floor(lo + next() * (hi - lo + 1)),
    pick: <T,>(arr: readonly T[]) => arr[Math.floor(next() * arr.length)],
  });
}
export type Rng = ReturnType<typeof rng>;

export const hashStr = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/* ── color ── */
export const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h.slice(0, 6), 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const rgbToHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");
export const mix = (a: string, b: string, t: number) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
};
export const darken = (hex: string, t: number) => mix(hex, "#000000", t);
export const lighten = (hex: string, t: number) => mix(hex, "#ffffff", t);
export const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

export const uuid = (() => {
  let n = 0;
  return (seedStr: string) => {
    const h1 = hashStr(seedStr + ":" + n++).toString(16).padStart(8, "0");
    const h2 = hashStr(h1 + seedStr).toString(16).padStart(8, "0");
    const h3 = hashStr(h2 + "x").toString(16).padStart(8, "0");
    const h4 = hashStr(h3 + "y").toString(16).padStart(8, "0");
    return `${h1}-${h2.slice(0, 4)}-4${h2.slice(5, 8)}-a${h3.slice(1, 4)}-${h3.slice(4)}${h4}`;
  };
})();

export const slug = (s: string) => s.trim().replace(/\s+/g, "_").replace(/[^\w\-一-龠ぁ-んァ-ヶー]/g, "") || "model";
