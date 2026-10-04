/** Small colour + pseudo random helpers shared by generator, atlas and UI. */

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  if (Number.isNaN(num)) return color;
  const amt = Math.round(2.55 * percent);
  const r = (num >> 16) + amt;
  const g = ((num >> 8) & 0xff) + amt;
  const b = (num & 0xff) + amt;
  const toHex = (c: number) => clamp(c, 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function mixColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.replace("#", ""), 16);
  const pb = parseInt(b.replace("#", ""), 16);
  if (Number.isNaN(pa) || Number.isNaN(pb)) return a;
  const ch = (sh: number) =>
    Math.round(((pa >> sh) & 0xff) * (1 - t) + ((pb >> sh) & 0xff) * t);
  return `#${[16, 8, 0]
    .map((sh) => ch(sh).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Deterministic PRNG so a given seed always yields the same model. */
export function mulberry32(seed: number): () => number {
  let a = (Math.floor(seed) % 2147483647) || 48271;
  if (a <= 0) a += 2147483646;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 99999);
}

/** Slugify a model name into a Minecraft-safe resource identifier. */
export function sanitizeIdentifier(name: string): string {
  const ascii = name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  if (ascii) return ascii;
  const jp = Array.from(name)
    .map((c) => c.charCodeAt(0).toString(16))
    .join("")
    .slice(0, 32);
  return `custom_${jp || "model"}`;
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
