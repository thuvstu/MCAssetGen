// ============================================================================
// VOXELFORGE — Procedural voxel model generator
// ============================================================================
import type {
  AuraKind,
  Decoration,
  FloatingMode,
  ModelSpec,
  ModeKind,
  ParticleKind,
  TexturePattern,
  TrailKind,
} from "./spec";
import { Rng } from "./rng";
import { makeExtraBuilders } from "./weapons";

// --- Types -------------------------------------------------------------------
export type GroupName = "root" | "blade" | "head" | "floating" | "particles" | "wings" | "aura" | "trail" | "mode" | "phantom" | "circle";

export interface VoxelPart {
  name: string;
  group: GroupName;
  from: [number, number, number];
  to: [number, number, number];
  tile: number;
  emissive: boolean;
}

export interface GeneratedModel {
  parts: VoxelPart[];
  palette: string[];
  radius: number;
}

// --- Palette tile indices ----------------------------------------------------
export const TILE = {
  primary: 0,
  secondary: 1,
  accent: 2,
  glow: 3,
  handle: 4,
  gem: 5,
  trim: 6,
  dark: 7,
  aura1: 8,
  aura2: 9,
} as const;

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.replace("#", ""), 16);
  const pb = parseInt(b.replace("#", ""), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
  const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
  const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
}

/** Higher tiers / limit break shift the palette towards the magic glow. */
export function paletteFor(spec: ModelSpec): string[] {
  const tier = spec.tier ?? 1;
  const lb = spec.limitBreak ?? 0;
  const boost = (tier - 1) * 0.07 + lb * 0.12;
  const primary = mixHex(spec.primaryColor, spec.accentColor, Math.min(0.45, boost));
  const secondary = mixHex(spec.secondaryColor, spec.accentColor, Math.min(0.35, boost * 0.8));
  const accent = mixHex(spec.accentColor, spec.glowColor, lb * 0.18);
  return [
    primary,
    secondary,
    accent,
    spec.glowColor,
    spec.handleColor,
    spec.gemColor,
    "#e8e8e0",
    "#14141a",
    spec.glowColor,
    spec.accentColor,
  ];
}

export function effectiveTextureNoise(spec: ModelSpec): number {
  return Math.max(0, Math.min(1, spec.textureNoise * (1 - spec.blockiness * 0.6)));
}

// --- Context (shared helpers for all builders) ------------------------------
export interface Ctx {
  parts: VoxelPart[];
  rng: Rng;
  spec: ModelSpec;
  rd: (v: number) => number;
  has(d: Decoration): boolean;
  box(name: string, group: GroupName, cx: number, y0: number, w: number, h: number, d: number, tile: number, emissive?: boolean): void;
  glow(name: string, group: GroupName, cx: number, cy: number, cz: number, s: number): void;
  shards(count: number, group: GroupName, cx: number, cy: number, cz: number, radius: number, size: number): void;
  ring(radius: number, cy: number, group: GroupName, size: number, count: number): void;
  particles(count: number, sx: number, y0: number, y1: number, sz: number, size: number): void;
  spiral(steps: number, group: GroupName, cx: number, y0: number, y1: number, radius: number, size: number, tile: number): void;
  helix(steps: number, group: GroupName, cx: number, y0: number, y1: number, radius: number, size: number, tile: number): void;
}

function makeCtx(spec: ModelSpec): Ctx {
  const parts: VoxelPart[] = [];
  const rng = new Rng(spec.seed);
  const rd: Ctx["rd"] = spec.blockiness > 0.66 ? (v) => Math.round(v) : (v) => Math.round(v * 4) / 4;

  const box: Ctx["box"] = (name, group, cx, y0, w, h, d, tile, emissive = false) => {
    parts.push({
      name, group, tile, emissive,
      from: [rd(cx - w / 2), rd(y0), rd(-d / 2)],
      to: [rd(cx + w / 2), rd(y0 + h), rd(d / 2)],
    });
  };
  const glow: Ctx["glow"] = (name, group, cx, cy, cz, s) =>
    box(name, group, cx, cy - s / 2, s, s, s, TILE.glow, true);

  const shards: Ctx["shards"] = (count, group, cx, cy, cz, radius, size) => {
    for (let i = 0; i < count; i++) {
      const a = rng.range(0, Math.PI * 2);
      const r = radius * rng.range(0.7, 1.15);
      const s = size * rng.range(0.6, 1.3);
      const x = cx + Math.cos(a) * r;
      const z = cz + Math.sin(a) * r;
      const y = cy + rng.range(-2.5, 2.5);
      parts.push({
        name: `shard_${i}`, group,
        from: [rd(x - s / 2), rd(y - s / 2), rd(z - s / 2)],
        to: [rd(x + s / 2), rd(y + s / 2), rd(z + s / 2)],
        tile: rng.chance(0.6) ? TILE.accent : TILE.glow,
        emissive: true,
      });
    }
  };

  const ring: Ctx["ring"] = (radius, cy, group, size, count) => {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      glow(`ring_${i}`, group, Math.cos(a) * radius, cy, Math.sin(a) * radius, size);
    }
  };

  const particles: Ctx["particles"] = (count, sx, y0, y1, sz, size) => {
    for (let i = 0; i < count; i++) {
      const x = rng.range(-sx, sx);
      const y = rng.range(y0, y1);
      const z = rng.range(-sz, sz);
      const s = size * rng.range(0.5, 1.1);
      parts.push({
        name: `particle_${i}`, group: "particles",
        from: [rd(x - s / 2), rd(y - s / 2), rd(z - s / 2)],
        to: [rd(x + s / 2), rd(y + s / 2), rd(z + s / 2)],
        tile: rng.chance(0.5) ? TILE.glow : TILE.accent,
        emissive: true,
      });
    }
  };

  const spiral: Ctx["spiral"] = (steps, group, cx, y0, y1, radius, size, tile) => {
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const a = t * Math.PI * 4;
      const r = radius * (0.3 + t * 0.7);
      const y = y0 + t * (y1 - y0);
      glow(`spiral_${i}`, group, cx + Math.cos(a) * r, y, Math.sin(a) * r, size);
    }
  };

  const helix: Ctx["helix"] = (steps, group, cx, y0, y1, radius, size, tile) => {
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const a = t * Math.PI * 6;
      const y = y0 + t * (y1 - y0);
      box(`helix_${i}`, group, cx + Math.cos(a) * radius, y, size, size, size, tile, true);
    }
  };

  return { parts, rng, spec, rd, has: (d) => spec.decorations.includes(d), box, glow, shards, ring, particles, spiral, helix };
}

// ============================================================================
// Shared helpers
// ============================================================================

export function addFloating(ctx: Ctx, cx: number, cy: number, cz: number): void {
  const { spec, rng } = ctx;
  const size = 1.5 + spec.width;
  switch (spec.floating) {
    case "orb":
      ctx.glow("floating_orb", "floating", cx, cy, cz, size);
      ctx.ring(3, cy, "floating", 0.75, 8);
      break;
    case "shards": {
      ctx.shards(4 + Math.floor(spec.detail * 4), "floating", cx, cy, cz, 3.5 + spec.width * 2, 1 + spec.width);
      break;
    }
    case "ring":
      ctx.ring(4 + spec.width * 2, cy, "floating", 1, 12);
      ctx.glow("floating_core", "floating", cx, cy, cz, 1.25);
      break;
    case "satellite": {
      const n = 3 + Math.floor(spec.detail * 2);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const r = 4 + spec.width * 2;
        ctx.glow(`sat_${i}`, "floating", cx + Math.cos(a) * r, cy + Math.sin(a * 2) * 1.5, cz + Math.sin(a) * r, 1.25);
      }
      break;
    }
    case "cascade": {
      const n = 5 + Math.floor(spec.detail * 3);
      for (let i = 0; i < n; i++) {
        const y = cy + (i / n) * -8;
        const a = (i / n) * Math.PI * 3;
        const r = 2 + (i / n) * 2;
        ctx.glow(`cascade_${i}`, "floating", cx + Math.cos(a) * r, y, cz + Math.sin(a) * r, 0.8 + (1 - i / n) * 0.6);
      }
      break;
    }
    case "vortex": {
      const n = 8 + Math.floor(spec.detail * 4);
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const a = t * Math.PI * 5;
        const r = 2 + t * 3;
        const y = cy + t * 3 - 1.5;
        const s = 0.6 + (1 - t) * 0.8;
        ctx.glow(`vortex_${i}`, "floating", cx + Math.cos(a) * r, y, cz + Math.sin(a) * r, s);
      }
      break;
    }
    case "orbit": {
      for (let ring = 0; ring < 3; ring++) {
        const radius = 3 + ring * 2;
        const count = 4 + ring * 2;
        const yOff = (ring - 1) * 2;
        ctx.ring(radius, cy + yOff, "floating", 0.8, count);
      }
      ctx.glow("orbit_core", "floating", cx, cy, cz, 1.5);
      break;
    }
    default:
      break;
  }
}

export function addParticles(ctx: Ctx, y0: number, y1: number, spreadX: number, spreadZ: number): void {
  const { spec } = ctx;
  const count = Math.round(4 + spec.detail * 10);
  const map: Record<ParticleKind, number> = {
    none: 0, embers: 1, snow: 1.2, sparks: 0.7, runes: 0.5, petals: 0.8,
    bubbles: 0.6, dust: 1.1, souls: 0.9, slime: 0.7, smoke: 0.8, stardust: 0.9,
    blood: 1.1, oil: 0.8, glyphs: 0.6, shrapnel: 0.9,
  };
  const mult = map[spec.particles] ?? 0;
  if (mult === 0) return;
  const sc = Math.round(count * mult);
  const yScale = ["snow", "bubbles", "dust"].includes(spec.particles) ? 1.4 : 1;
  ctx.particles(sc, spreadX * (mult > 1 ? 1.2 : 0.9), y0 * 0.4 * yScale, y1 * yScale, spreadZ * (mult > 1 ? 1.2 : 0.9), 0.8);
}

export function addAura(ctx: Ctx, height: number): void {
  const { spec } = ctx;
  const k = spec.aura;
  if (k === "none") return;
  const base = height * 0.3;
  switch (k) {
    case "flame":
      ctx.spiral(8, "aura", 0, 0, height, 5, 1.5, TILE.aura1);
      ctx.particles(6, 5, -2, height + 3, 5, 1.2);
      break;
    case "frost":
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.glow(`frost_${i}`, "aura", Math.cos(a) * 5, base + Math.sin(i) * 2, Math.sin(a) * 5, 1.5);
      }
      break;
    case "voidField":
      for (let i = 0; i < 5; i++) {
        const y = (i / 4) * height;
        ctx.ring(6, y, "aura", 0.7, 6);
      }
      break;
    case "lightRays":
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        for (let j = 0; j < 5; j++) {
          const y = (j / 4) * height;
          const r = 3.5 - j * 0.3;
          ctx.glow(`ray_${i}_${j}`, "aura", Math.cos(a) * r, y, Math.sin(a) * r, 0.8);
        }
      }
      break;
    case "shadowSmoke":
      ctx.particles(10, 4, -3, height * 0.6, 4, 1.5);
      break;
    case "prismatic":
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r = 5 + (i % 2) * 1.5;
        ctx.glow(`prism_${i}`, "aura", Math.cos(a) * r, base + (i % 3) * 2, Math.sin(a) * r, 1.2);
      }
      break;
    case "bloodMist":
      ctx.particles(12, 6, -2, height, 6, 1.3);
      break;
    case "machineHeat":
      ctx.spiral(8, "aura", 0, 0, height, 4, 1, TILE.aura1);
      break;
    case "curseVeil":
      ctx.helix(10, "aura", 0, -2, height, 5, 0.9, TILE.aura2);
      break;
    case "magicCircle":
      addMagicCircle(ctx, 0, 7);
      break;
  }
}

export function addTrail(ctx: Ctx, height: number): void {
  const { spec } = ctx;
  const k = spec.trail;
  if (k === "none") return;
  switch (k) {
    case "sparkle":
      ctx.helix(6, "trail", 0, -2, height + 2, 3, 0.8, TILE.glow);
      break;
    case "fireTrail":
      for (let i = 0; i < 8; i++) {
        const y = (i / 7) * height;
        ctx.glow(`ftrail_${i}`, "trail", (i % 2) * 1.2 - 0.6, y, 0, 0.8 + (1 - i / 7) * 0.5);
      }
      break;
    case "iceTrail":
      ctx.spiral(8, "trail", 0, -2, height, 2.5, 0.9, TILE.glow);
      break;
    case "darkTrail":
      ctx.particles(8, 3, -2, height * 0.8, 3, 1.2);
      break;
    case "leafTrail":
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const a = t * Math.PI * 2;
        ctx.glow(`leaf_${i}`, "trail", Math.cos(a) * 2.5, t * height, Math.sin(a) * 2.5, 0.9);
      }
      break;
    case "phantom":
      // ghost wisps ascending in a narrow spiral
      for (let i = 0; i < 12; i++) {
        const t = i / 11;
        const a = t * Math.PI * 3;
        const r = 1.5 + t * 2;
        const s = 1.2 - t * 0.6;
        ctx.glow(`phantom_wisp_${i}`, "trail", Math.cos(a) * r, t * height, Math.sin(a) * r, s);
      }
      break;
    case "afterimage":
      for (let i = 0; i < 10; i++) {
        const t = i / 9;
        const s = 1.4 - t * 1.0;
        ctx.box(`afterimg_${i}`, "trail", -1.5 - t * 3, t * height * 0.6, 0.4, s, 0.4, TILE.glow, true);
      }
      break;
    case "bloodTrail":
      for (let i = 0; i < 8; i++) {
        const t = i / 7;
        ctx.box(`btrail_${i}`, "trail", (i % 2) * 1.4 - 0.7, t * height, 0.5, 1.2 - t * 0.6, 0.5, TILE.gem, true);
      }
      break;
    case "railBeam":
      ctx.box("rail_beam", "trail", 0, 0, 0.6, height + 6, 0.6, TILE.glow, true);
      ctx.glow("rail_tip", "trail", 0, height + 7, 0, 1.6);
      break;
    case "sawDust":
      ctx.particles(10, 5, 0, height, 5, 0.7);
      break;
  }
}

// ============================================================================
// Decoration helpers
// ============================================================================
export function addDecor(ctx: Ctx, guardW: number, hy: number, cluster: number): void {
  const { spec, box } = ctx;
  if (ctx.has("crown")) {
    for (let i = 0; i < 3; i++) {
      box(`crown_t${i}`, "head", (i - 1) * 2, hy + cluster + 1, 1.2, 2.5, 1.2, TILE.accent);
    }
  }
  if (ctx.has("scales")) {
    for (let i = 0; i < 4; i++) {
      box(`scale_${i}`, "root", (i - 1.5) * 2, hy - 2 - i * 0.5, 1.5, 1, 0.5, TILE.secondary);
    }
  }
  if (ctx.has("thorns")) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      box(`thorn_${i}`, "root", Math.cos(a) * (guardW / 2 + 0.5), hy - 1, 0.8, 1.8, 0.8, TILE.secondary);
    }
  }
  if (ctx.has("prongs")) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      box(`prong_${i}`, "head", Math.cos(a) * (cluster / 2 + 0.75), hy + cluster + 0.5, 1, 1.5, 1, TILE.accent);
    }
  }
  if (ctx.has("hood")) {
    box("hood_back", "head", 0, hy + cluster * 0.3, cluster + 2, cluster * 0.8, 0.8, TILE.secondary);
    box("hood_top", "head", 0, hy + cluster * 0.8, cluster + 1, 1.2, cluster + 1, TILE.secondary);
  }
  if (ctx.has("shoulder")) {
    for (const s of [-1, 1]) {
      box(`shoulder_${s}`, "root", s * (guardW / 2 + 1.2), hy + 1, 3.5, 2.5, 3.5, TILE.primary);
      box(`shoulder_top_${s}`, "root", s * (guardW / 2 + 1.2), hy + 3.5, 4, 1.2, 4, TILE.accent);
    }
  }
  if (ctx.has("tassels")) {
    for (let i = 0; i < 3; i++) {
      box(`tassel_${i}`, "root", -2 + i * 2, hy - 3 - i * 0.8, 0.6, 2, 0.6, TILE.accent);
    }
  }
  if (ctx.has("claws")) {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI - Math.PI / 2;
      box(`claw_${i}`, "head", Math.cos(a) * (cluster / 2 + 0.5), hy - 1.5, 0.7, 2.2, 0.7, TILE.gem);
    }
  }
  if (ctx.has("fangs")) {
    for (const s of [-1, 1]) {
      box(`fang_${s}`, "head", s * (cluster / 2 - 0.5), hy - 1.5, 1, 2, 1, TILE.gem, true);
    }
  }
  if (ctx.has("gears")) {
    for (let i = 0; i < 3; i++) box(`gear_${i}`, "root", (i - 1) * 2.5, hy + 1, 2, 0.6, 2, TILE.secondary);
  }
  if (ctx.has("pipes")) {
    box("pipe_v", "root", guardW / 2 + 1, hy - 3, 0.7, 6, 0.7, TILE.dark);
    box("pipe_h", "root", 0, hy + 2, guardW + 2, 0.6, 0.6, TILE.dark);
  }
  if (ctx.has("circuits")) {
    for (let i = 0; i < 4; i++) box(`ckt_${i}`, "root", (i - 1.5) * 1.4, hy, 0.4, 0.4, 0.4, TILE.glow, true);
  }
  if (ctx.has("bloodDrips")) {
    for (let i = 0; i < 5; i++) box(`drip_${i}`, "blade", (i - 2) * 0.8, hy - 2 - i * 0.6, 0.5, 1.5, 0.5, TILE.gem, true);
  }
  if (ctx.has("bones")) {
    box("bone_l", "root", -guardW / 2, hy, 1, 4, 1, TILE.trim);
    box("bone_r", "root", guardW / 2, hy, 1, 4, 1, TILE.trim);
  }
  if (ctx.has("sigils")) {
    addMagicCircle(ctx, hy + cluster * 0.4, 3.5);
  }
  if (ctx.has("feathers")) {
    for (let i = 0; i < 3; i++) box(`feather_${i}`, "wings", -guardW / 2 - i, hy + i, 0.6, 2.5, 0.4, TILE.accent);
  }
  if (ctx.has("bolts")) {
    for (let i = 0; i < 4; i++) box(`bolt_${i}`, "root", (i - 1.5) * 1.5, hy - 1, 0.5, 0.5, 0.5, TILE.dark);
  }
}

export function addMagicCircle(ctx: Ctx, cy: number, radius: number): void {
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    ctx.glow(`circle_rune_${i}`, "circle", Math.cos(a) * radius, cy, Math.sin(a) * radius, 0.9);
  }
  ctx.ring(radius * 0.55, cy, "circle", 0.55, 8);
  ctx.glow("circle_core", "circle", 0, cy, 0, 1.2);
}

export function addWings(ctx: Ctx, x0: number, y0: number, count: number): void {
  const { box } = ctx;
  for (let i = 0; i < count; i++) {
    const w = count - i;
    box(`wing_l${i}`, "wings", x0 - 1 - i * 1.4, y0 + i * 1.1, 1.25, w, w, TILE.accent);
    box(`wing_r${i}`, "wings", -x0 + 1 + i * 1.4, y0 + i * 1.1, 1.25, w, w, TILE.accent);
  }
}

export function addChain(ctx: Ctx, x: number, y: number): void {
  const { box } = ctx;
  for (let i = 0; i < 3; i++) box(`chain_${i}`, "root", x, y - i * 1.2, 0.9, 0.9, 0.9, TILE.secondary);
}

export function addRunes(ctx: Ctx, count: number, x: number, y0: number, y1: number): void {
  const { box } = ctx;
  for (let i = 0; i < count; i++) {
    const y = y0 + (i / count) * (y1 - y0);
    const side = i % 2 === 0 ? 1 : -1;
    box(`rune_${i}`, "root", side * x, y, 0.5, 1.5, 0.5, TILE.glow, true);
  }
}

// ============================================================================
// Type builders
// ============================================================================

function buildSword(ctx: Ctx): number {
  const { spec, box, rng } = ctx;
  const handleH = 3 + spec.length * 3;
  const bladeH = 10 + spec.length * 12;
  const bladeW = 2 + Math.round(spec.width * 2);
  const tip = rng.pick(["point", "fang", "cleave"] as const);

  // pommel
  box("pommel", "root", 0, -handleH - 2.5, 3, 2.5, 3, TILE.gem, ctx.has("gem"));
  if (ctx.has("spikes")) for (const [dx, dz] of [[-1.5, 0], [1.5, 0], [0, -1.5], [0, 1.5]] as const) box("pommel_spike", "root", dx, -handleH - 3.5, 1, 1, 1, TILE.secondary);

  // handle
  box("handle", "root", 0, -handleH, 2, handleH, 2, TILE.handle);
  box("handle_wrap_a", "root", 0, -handleH + 0.5, 2.25, 1, 2.25, TILE.secondary);
  box("handle_wrap_b", "root", 0, -handleH + 2, 2.25, 1, 2.25, TILE.secondary);

  // guard
  const gw = 6 + spec.width * 4;
  box("guard", "root", 0, 0, gw, 2, 3, TILE.primary);
  box("guard_trim", "root", 0, 0, gw * 0.7, 2.5, 3.5, TILE.accent);
  if (ctx.has("gem")) {
    box("guard_gem", "root", 0, 2, 2, 1.5, 2, TILE.gem, true);
    box("guard_gem_l", "root", -gw / 2 + 1, 1, 1.5, 1.5, 1.5, TILE.gem, true);
    box("guard_gem_r", "root", gw / 2 - 1, 1, 1.5, 1.5, 1.5, TILE.gem, true);
  }
  if (ctx.has("wings")) addWings(ctx, gw / 2, 1, 3);
  if (ctx.has("chain")) { addChain(ctx, -gw / 2 + 0.5, -1.5); addChain(ctx, gw / 2 - 0.5, -1.5); }

  // blade
  const by = 2;
  box("blade_core", "blade", 0, by, 1, bladeH, 1, TILE.accent);
  box("blade_body", "blade", 0, by, bladeW, bladeH, 1, TILE.secondary);
  box("blade_edge_a", "blade", 0, by, bladeW, bladeH, 0.5, TILE.primary);
  box("blade_edge_b", "blade", 0, by, bladeW, bladeH, 0.5, TILE.primary);
  ctx.parts.forEach((p) => { if (p.name === "blade_edge_a") { p.from[2] = 0.25; p.to[2] = 0.75; } if (p.name === "blade_edge_b") { p.from[2] = -0.75; p.to[2] = -0.25; } });

  const tipY = by + bladeH;
  if (tip === "point") { box("tip", "blade", 0, tipY, Math.max(1, bladeW - 1), 2, 1, TILE.secondary); box("tip_light", "blade", 0, tipY + 2, 0.75, 1.5, 0.75, TILE.accent); }
  else if (tip === "fang") { box("tip", "blade", 0, tipY, bladeW - 1, 1.5, 1, TILE.secondary); box("tip_l", "blade", 1.2, tipY + 1, 1, 2.5, 1, TILE.accent); box("tip_r", "blade", -1.2, tipY + 1, 1, 2, 1, TILE.accent); }
  else { box("tip", "blade", 0, tipY, bladeW - 1, 1, 1, TILE.secondary); box("tip_light", "blade", 0, tipY + 1, 1, 3, 1, TILE.accent); }

  if (ctx.has("runes")) addRunes(ctx, 3 + Math.floor(spec.detail * 4), bladeW / 2 - 0.25, by + 2, by + bladeH - 1);
  if (ctx.has("ribbon")) { for (let i = 0; i < 8; i++) { const t = i / 7; box(`ribbon_${i}`, "blade", Math.sin(t * Math.PI * 2.5) * (bladeW / 2 + 0.75), by + 1 + t * (bladeH - 2), 1, 1, 0.5, TILE.accent); } }

  addFloating(ctx, 0, tipY + 5, 1);
  if (ctx.has("halo")) ctx.ring(4.5, tipY + 2.5, "floating", 1, 10);
  addDecor(ctx, gw, 0, 4);
  addParticles(ctx, bladeH * 0.5, bladeH, 8, 5);
  addAura(ctx, tipY + 8);
  addTrail(ctx, bladeH);
  return tipY + 8;
}

function buildStaff(ctx: Ctx): number {
  const { spec, box } = ctx;
  const sh = 12 + spec.length * 14;
  const sw = 2 + Math.round(spec.width * 1.5);

  box("shaft", "root", 0, -sh, sw, sh, sw, TILE.handle);
  for (let i = 0; i < 3; i++) { const y = -sh + ((i + 1) / 4) * sh; box(`band_${i}`, "root", 0, y, sw + 1, 1.5, sw + 1, TILE.secondary); }
  if (ctx.has("runes")) addRunes(ctx, 3 + Math.floor(spec.detail * 3), sw / 2, -sh + 2, -4);
  if (ctx.has("ribbon")) { for (let i = 0; i < 10; i++) { const t = i / 9; box(`ribbon_${i}`, "root", Math.cos(t * Math.PI * 4) * (sw / 2 + 0.6), -sh + 3 + t * (sh - 8), 0.75, 0.75, 0.75, TILE.accent); } }

  const hy = 0;
  const cl = 4 + spec.detail * 2;
  box("head_core", "head", 0, hy, cl, cl, cl, TILE.primary);
  box("head_top", "head", 0, hy + cl, cl - 1.5, 1.5, cl - 1.5, TILE.secondary);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; box(`arm_${i}`, "head", Math.cos(a) * (cl / 2 + 1.25), hy + cl / 2 - 1, 2, 2, 2, TILE.accent); }
  if (ctx.has("gem")) box("head_gem", "head", 0, hy + cl / 2, 2.5, 2.5, 2.5, TILE.gem, true);
  const crystals = 2 + Math.floor(spec.detail * 4);
  for (let i = 0; i < crystals; i++) { const a = (i / crystals) * Math.PI * 2; ctx.glow(`crystal_${i}`, "head", Math.cos(a) * (cl / 3), hy + cl + 1.5, Math.sin(a) * (cl / 3), 1.5); }
  ctx.glow("crystal_top", "head", 0, hy + cl + 3.5, 0, 2);
  if (ctx.has("spikes")) for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; box(`spike_${i}`, "head", Math.cos(a) * (cl / 2 + 0.5), hy - 1.5, 1, 2, 1, TILE.secondary); }
  if (ctx.has("wings")) addWings(ctx, cl / 2, hy + cl / 2, 3);
  if (ctx.has("chain")) addChain(ctx, cl / 2 + 0.5, hy - 1);

  const topY = hy + cl + 5;
  addFloating(ctx, 0, topY, 1.2);
  if (ctx.has("halo")) ctx.ring(cl, topY - 1, "floating", 1, 10);
  addDecor(ctx, cl, hy, cl);
  addParticles(ctx, sh * 0.4, topY + 2, 8, 4);
  addAura(ctx, topY + 4);
  addTrail(ctx, sh);
  return topY + 4;
}

function buildBow(ctx: Ctx): number {
  const { spec, box } = ctx;
  const reach = 6 + spec.length * 6;
  const lw = 2 + spec.width * 1.5;

  box("grip", "root", 0, -3, 2.5, 6, 2.5, TILE.handle);
  box("grip_wrap", "root", 0, -1, 2.75, 2, 2.75, TILE.secondary);
  if (ctx.has("gem")) box("grip_gem", "root", 0, 2.5, 2, 1.5, 2, TILE.gem, true);
  if (ctx.has("runes")) for (let i = 0; i < 3; i++) { box(`rune_l${i}`, "root", 1.4, -2 + i * 2, 0.5, 1, 0.5, TILE.glow, true); box(`rune_r${i}`, "root", -1.4, -2 + i * 2, 0.5, 1, 0.5, TILE.glow, true); }
  if (ctx.has("spikes")) { box("spike_top", "root", 0, 3, 1, 2, 1, TILE.secondary); box("spike_bot", "root", 0, -5, 1, 2, 1, TILE.secondary); }

  const segs = 4;
  for (const s of [-1, 1]) { for (let i = 0; i < segs; i++) { const y = 3 + i * (reach / segs); box(`limb_${s > 0 ? "r" : "l"}_${i}`, "root", s * (1.5 + i * 1.6), y, lw, reach / segs + 1, 1.5, TILE.primary); } box(`limb_tip_${s > 0 ? "r" : "l"}`, "root", s * (1.5 + segs * 1.6), 3 + reach, 1.5, 2, 1.5, TILE.accent); }
  const tipX = 1.5 + segs * 1.6;
  box("string_top", "root", 0, 3 + reach + 1, tipX * 2 + 2, 0.5, 0.5, TILE.glow, true);
  box("string_l", "root", -(tipX / 2 + 0.5), 3 + reach / 2 + 0.5, 0.5, reach, 0.5, TILE.glow, true);
  box("string_r", "root", tipX / 2 + 0.5, 3 + reach / 2 + 0.5, 0.5, reach, 0.5, TILE.glow, true);

  const ah = 8 + spec.length * 8;
  box("arrow", "root", 0, -ah / 2, 1, ah, 1, TILE.handle);
  box("arrow_head", "root", 0, ah / 2, 2, 2.5, 2, TILE.accent);
  ctx.glow("arrow_glow", "root", 0, ah / 2 + 3, 0, 1.25);
  for (let i = 0; i < 3; i++) box(`fletch_${i}`, "root", i % 2 === 0 ? 1 : -1, -ah / 2 + i * 1.2, 0.75, 1.5, 0.4, TILE.secondary);

  if (ctx.has("wings")) addWings(ctx, tipX, 3 + reach, 2);
  if (ctx.has("chain")) { addChain(ctx, -tipX, 3 + reach - 1); addChain(ctx, tipX, 3 + reach - 1); }
  addDecor(ctx, tipX * 2, 3, 4);

  const topY = 3 + reach + 4;
  addFloating(ctx, 0, topY, 1.2);
  if (ctx.has("halo")) ctx.ring(5, topY - 2, "floating", 1, 10);
  addParticles(ctx, ah * 0.4, topY + 2, 8, 5);
  addAura(ctx, topY + 4);
  addTrail(ctx, reach);
  return topY + 4;
}

function buildShield(ctx: Ctx): number {
  const { spec, box } = ctx;
  const bw = 7 + spec.width * 3;
  const bh = 10 + spec.length * 4;

  box("board", "root", 0, -bh / 2, bw, bh, 1, TILE.primary);
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) box(`corner_${sx}_${sy}`, "root", sx * (bw / 2 - 1.5), sy * (bh / 2 - 1.5) - (sy > 0 ? 0 : 3), 3, 3, 1, TILE.primary);
  box("rim_t", "root", 0, bh / 2 - 1, bw, 1, 1.5, TILE.accent);
  box("rim_b", "root", 0, -bh / 2, bw, 1, 1.5, TILE.accent);
  box("rim_l", "root", -bw / 2 + 0.5, -bh / 2 + 1, 1, bh - 2, 1.5, TILE.accent);
  box("rim_r", "root", bw / 2 - 0.5, -bh / 2 + 1, 1, bh - 2, 1.5, TILE.accent);
  box("boss", "root", 0, 0, 3, 3, 2, TILE.secondary);
  if (ctx.has("gem")) box("boss_gem", "root", 0, 1.5, 2, 1.5, 2, TILE.gem, true);
  if (ctx.has("runes")) { const n = 4 + Math.floor(spec.detail * 4); for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const r = Math.min(bw, bh) / 4; box(`rune_${i}`, "root", Math.cos(a) * r, Math.sin(a) * r * 1.4, 0.5, 1.2, 0.5, TILE.glow, true); } }
  if (ctx.has("ribbon")) { for (let i = 0; i < 7; i++) { const t = i / 6; box(`ribbon_${i}`, "root", -bw / 2 + 1 + t * (bw - 2), Math.sin(t * Math.PI) * (bh / 2 - 2) - bh / 2 + 1, 1, 1, 0.6, TILE.accent); } }
  if (ctx.has("wings")) addWings(ctx, bw / 2, bh / 2 - 3, 3);
  if (ctx.has("chain")) addChain(ctx, -1, -bh / 2 - 1);
  if (ctx.has("spikes")) for (let i = 0; i < 3; i++) box(`spike_${i}`, "root", -bw / 2 + 2 + i * ((bw - 4) / 2), bh / 2 + 0.5, 1, 2, 1, TILE.secondary);
  addDecor(ctx, bw, -bh / 2, bh);

  const topY = bh / 2 + 4;
  addFloating(ctx, 0, topY, 1.4);
  if (ctx.has("halo")) ctx.ring(bw * 0.7, topY - 1, "floating", 1, 12);
  addParticles(ctx, bh * 0.3, bh * 0.5, 7, 5);
  addAura(ctx, topY + 4);
  addTrail(ctx, bh);
  return topY + 4;
}

function buildArmor(ctx: Ctx): number {
  const { spec, box } = ctx;
  const tw = 7 + spec.width * 3;
  const th = 8 + spec.length * 3;

  box("torso", "root", 0, -2, tw, th, 3, TILE.primary);
  box("torso_trim", "root", 0, -4.5, tw + 0.5, 1.5, 3.5, TILE.secondary);
  box("collar", "root", 0, th - 3, tw - 2, 1.5, 3, TILE.secondary);
  if (ctx.has("gem")) box("chest_gem", "root", 0, 1, 3, 3, 1.5, TILE.gem, true);
  if (ctx.has("runes")) for (let i = 0; i < 3; i++) box(`rune_${i}`, "root", (i - 1) * 2, -2.5, 0.5, 1.5, 0.5, TILE.glow, true);
  if (ctx.has("ribbon")) { box("ribbon_v", "root", 0, -2, 1, th - 3, 0.6, TILE.accent); box("ribbon_h", "root", 0, 2, tw - 2, 1, 0.6, TILE.accent); }

  for (const s of [-1, 1]) {
    const px = s * (tw / 2 + 1.5);
    box(`pauldron_${s}_base`, "root", px, th - 5, 4, 3, 4, TILE.primary);
    box(`pauldron_${s}_mid`, "root", px * 1.05, th - 3, 5, 2, 5, TILE.secondary);
    box(`pauldron_${s}_top`, "root", px * 1.1, th - 1, 5.5, 1.5, 5.5, TILE.accent);
    if (ctx.has("spikes")) box(`pauldron_spike_${s}`, "root", px * 1.1, th + 0.5, 1, 2, 1, TILE.secondary);
    if (ctx.has("gem")) box(`pauldron_gem_${s}`, "root", px * 1.05, th - 2, 1.5, 1.5, 1.5, TILE.gem, true);
  }
  if (ctx.has("wings")) addWings(ctx, tw / 2, th / 2 - 2, 3);
  if (ctx.has("chain")) addChain(ctx, 1.5, -5);
  addDecor(ctx, tw, 0, th);

  const topY = th + 2;
  addFloating(ctx, tw / 2 - 1, topY + 2, 1.2);
  if (ctx.has("halo")) ctx.ring(tw * 0.8, topY, "floating", 1, 10);
  addParticles(ctx, th * 0.4, th * 0.6, 7, 5);
  addAura(ctx, topY + 4);
  addTrail(ctx, th);
  return topY + 4;
}

function buildAxe(ctx: Ctx): number {
  const { spec, box } = ctx;
  const hH = 4 + spec.length * 4;
  const bladeH = 8 + spec.length * 8;
  const bladeW = 5 + spec.width * 4;

  box("handle", "root", 0, -hH, 2, hH, 2, TILE.handle);
  box("handle_wrap_a", "root", 0, -hH + 1, 2.3, 1, 2.3, TILE.secondary);
  box("handle_wrap_b", "root", 0, -hH + 3, 2.3, 1, 2.3, TILE.secondary);
  box("pommel", "root", 0, -hH - 2, 2.5, 2, 2.5, TILE.secondary);

  // axe head: main blade (x offset)
  box("axe_eye", "root", 0, 1, 2.5, 3, 3, TILE.primary);
  box("axe_blade_outer", "root", bladeW / 2, 0, bladeW, bladeH, 1.5, TILE.secondary);
  box("axe_blade_inner", "root", bladeW / 2, 0, bladeW * 0.7, bladeH, 2, TILE.accent);
  box("axe_edge", "root", bladeW, 0.5, 1, bladeH - 1, 1.5, TILE.primary);
  // bevel
  box("axe_bevel_top", "root", bladeW / 2, bladeH, bladeW * 0.6, 1.5, 1.2, TILE.secondary);
  box("axe_bevel_bot", "root", bladeW / 2, -1, bladeW * 0.5, 1.5, 1.2, TILE.secondary);

  // back spike
  box("back_spike", "root", -2, 2, 1.5, 4, 1.5, TILE.accent);
  box("back_spike_tip", "root", -2.5, 6, 1, 2, 1, TILE.secondary);

  if (ctx.has("gem")) { box("eye_gem", "root", 0, 2.5, 2.5, 2, 2.5, TILE.gem, true); box("blade_gem", "root", bladeW / 2, bladeH * 0.5, 2, 2, 2, TILE.gem, true); }
  if (ctx.has("runes")) addRunes(ctx, 3 + Math.floor(spec.detail * 3), bladeW / 2, 1, bladeH - 1);
  if (ctx.has("spikes")) { box("axe_spike_top", "root", bladeW, bladeH + 0.5, 1, 2, 1, TILE.secondary); box("axe_spike_bot", "root", bladeW, -1.5, 1, 1.5, 1, TILE.secondary); }
  if (ctx.has("wings")) addWings(ctx, bladeW / 2, bladeH * 0.5, 2);
  if (ctx.has("chain")) addChain(ctx, 0, -hH + 0.5);
  addDecor(ctx, bladeW, 0, bladeH);

  const topY = bladeH + 3;
  addFloating(ctx, bladeW / 2, topY, 1.2);
  if (ctx.has("halo")) ctx.ring(5, topY - 2, "floating", 1, 10);
  addParticles(ctx, bladeH * 0.4, topY, 8, 5);
  addAura(ctx, topY + 3);
  addTrail(ctx, bladeH);
  return topY + 3;
}

function buildTrident(ctx: Ctx): number {
  const { spec, box } = ctx;
  const sh = 14 + spec.length * 12;
  const sw = 2 + Math.round(spec.width);
  const prongs = 3;

  box("shaft", "root", 0, -sh, sw, sh, sw, TILE.handle);
  for (let i = 0; i < 3; i++) box(`shaft_ring_${i}`, "root", 0, -sh + ((i + 1) / 4) * sh, sw + 0.8, 1, sw + 0.8, TILE.secondary);

  // crossbar
  const cw = 4 + spec.width * 3;
  box("crossbar", "root", 0, 0, cw, 1.5, 1.5, TILE.secondary);
  box("crossbar_center", "root", 0, 0, 3, 2.5, 2, TILE.accent);

  // three prongs
  const prongH = 5 + spec.length * 4;
  const offsets = [-cw / 2, 0, cw / 2];
  offsets.forEach((x, i) => {
    box(`prong_${i}`, "root", x, 1, 1.5, prongH, 1.5, TILE.primary);
    box(`prong_tip_${i}`, "root", x, 1 + prongH, 1.2, 2, 1.2, TILE.accent);
    ctx.glow(`prong_glow_${i}`, "root", x, 1 + prongH + 2, 0, 1);
  });

  if (ctx.has("gem")) { box("center_gem", "root", 0, 1.5, 2, 2, 2, TILE.gem, true); offsets.forEach((x, i) => box(`prong_gem_${i}`, "root", x, 1 + prongH * 0.6, 1.2, 1.2, 1.2, TILE.gem, true)); }
  if (ctx.has("runes")) addRunes(ctx, 4 + Math.floor(spec.detail * 3), sw / 2, -sh + 3, -3);
  if (ctx.has("ribbon")) for (let i = 0; i < 8; i++) { const t = i / 7; box(`ribbon_${i}`, "root", Math.sin(t * Math.PI * 3) * (sw + 0.5), -sh + 2 + t * (sh - 4), 0.7, 0.7, 0.7, TILE.accent); }
  if (ctx.has("wings")) addWings(ctx, cw / 2, prongH + 1, 2);
  if (ctx.has("chain")) addChain(ctx, cw / 2 + 0.5, -1);

  const topY = prongH + 5;
  addFloating(ctx, 0, topY, 1.2);
  if (ctx.has("halo")) ctx.ring(5, topY - 1, "floating", 1, 10);
  addDecor(ctx, cw, 0, prongH);
  addParticles(ctx, prongH * 0.5, topY, 7, 5);
  addAura(ctx, topY + 3);
  addTrail(ctx, sh);
  return topY + 3;
}

function buildDagger(ctx: Ctx): number {
  const { spec, box } = ctx;
  const hH = 2 + spec.length * 2;
  const bH = 5 + spec.length * 6;
  const bW = 1.5 + spec.width * 1.5;

  box("pommel", "root", 0, -hH - 1.5, 2, 1.5, 2, TILE.secondary);
  box("handle", "root", 0, -hH, 1.5, hH, 1.5, TILE.handle);
  box("handle_wrap", "root", 0, -hH + 0.5, 1.8, 1, 1.8, TILE.secondary);

  const gw = 4 + spec.width * 2;
  box("guard", "root", 0, 0, gw, 1.5, 2, TILE.primary);
  if (ctx.has("gem")) box("guard_gem", "root", 0, 1, 1.5, 1, 1.5, TILE.gem, true);

  const by = 1.5;
  box("blade", "blade", 0, by, bW, bH, 0.8, TILE.secondary);
  box("blade_core", "blade", 0, by, 0.8, bH, 0.8, TILE.accent);
  box("tip", "blade", 0, by + bH, bW - 0.5, 1.5, 0.8, TILE.accent);

  if (ctx.has("runes")) addRunes(ctx, 2 + Math.floor(spec.detail * 2), bW / 2, by + 1, by + bH - 1);
  if (ctx.has("ribbon")) for (let i = 0; i < 4; i++) { const t = i / 3; box(`ribbon_${i}`, "blade", Math.sin(t * Math.PI * 2) * (bW / 2 + 0.5), by + 0.5 + t * (bH - 1), 0.7, 0.7, 0.4, TILE.accent); }
  if (ctx.has("wings")) addWings(ctx, gw / 2, 1, 2);
  if (ctx.has("spikes")) { box("spike_l", "root", -gw / 2, 0.5, 0.7, 1.5, 0.7, TILE.secondary); box("spike_r", "root", gw / 2, 0.5, 0.7, 1.5, 0.7, TILE.secondary); }

  const topY = by + bH + 3;
  addFloating(ctx, 0, topY, 1);
  if (ctx.has("halo")) ctx.ring(3.5, topY - 2, "floating", 0.8, 8);
  addDecor(ctx, gw, 0, bH);
  addParticles(ctx, bH * 0.4, topY, 6, 4);
  addAura(ctx, topY + 3);
  addTrail(ctx, bH);
  return topY + 3;
}

function buildTome(ctx: Ctx): number {
  const { spec, box } = ctx;
  const pw = 6 + spec.width * 3;
  const ph = 8 + spec.length * 3;
  const pd = 3 + spec.detail * 2;

  // book body
  box("cover_back", "root", 0, 0, pw, ph, 1, TILE.primary);
  box("cover_front", "root", 0, 0, pw, ph, 1, TILE.secondary);
  box("pages", "root", 0, 0, pw - 1, ph - 1, pd, TILE.trim);
  box("spine", "root", -pw / 2, 0, 1.5, ph, pd + 1, TILE.secondary);
  box("spine_cap_top", "root", -pw / 2, ph / 2, 2, 1, pd + 1.5, TILE.accent);
  box("spine_cap_bot", "root", -pw / 2, -ph / 2, 2, 1, pd + 1.5, TILE.accent);

  // clasp
  box("clasp", "root", pw / 2 + 0.5, 0, 1.5, 2, pd + 1.5, TILE.accent);
  if (ctx.has("gem")) box("clasp_gem", "root", pw / 2 + 1, 0.5, 2, 2, 2, TILE.gem, true);

  // cover decoration
  if (ctx.has("runes")) {
    const n = 4 + Math.floor(spec.detail * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = Math.min(pw, ph) / 4;
      box(`cover_rune_${i}`, "root", 0, 0, 0.5, 1.2, 0.5, TILE.glow, true);
      // adjust after push
      const p = ctx.parts[ctx.parts.length - 1];
      p.from = [ctx.rd(Math.cos(a) * r - 0.25), ctx.rd(Math.sin(a) * r * 1.3 - 0.6), ctx.rd(pd / 2 + 0.5)];
      p.to = [ctx.rd(Math.cos(a) * r + 0.25), ctx.rd(Math.sin(a) * r * 1.3 + 0.6), ctx.rd(pd / 2 + 1)];
    }
  }

  // floating symbol on top
  ctx.glow("book_sigil", "head", 0, ph / 2 + 2, 0, 2);
  if (ctx.has("chain")) addChain(ctx, pw / 2 + 0.5, -ph / 2 + 1);
  addMagicCircle(ctx, -ph / 2 - 2.5, 5.5);

  const topY = ph / 2 + 5;
  addFloating(ctx, 0, topY, 1.5);
  if (ctx.has("halo")) ctx.ring(4.5, topY - 1, "floating", 1, 10);
  addParticles(ctx, ph * 0.3, topY, 7, 5);
  addAura(ctx, topY + 3);
  addTrail(ctx, ph);
  return topY + 3;
}

function buildAmulet(ctx: Ctx): number {
  const { spec, box } = ctx;
  const pR = 3 + spec.width * 2;
  const chainR = 5 + spec.length * 2;
  const chainSegments = 8;

  // chain links (around a circle)
  for (let i = 0; i < chainSegments; i++) {
    const a = (i / chainSegments) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * chainR;
    const y = Math.sin(a) * chainR * 0.8;
    box(`chain_${i}`, "root", x, y, 1.2, 1.2, 1.2, TILE.secondary);
  }

  // pendant base (centered at bottom of chain arc)
  const py = -chainR * 0.8;
  box("pendant_outer", "root", 0, py, pR * 2, pR * 2, 1.2, TILE.primary);
  box("pendant_inner", "root", 0, py, pR * 1.4, pR * 1.4, 1.5, TILE.secondary);
  if (ctx.has("gem")) box("pendant_gem", "root", 0, py, 2.5, 2.5, 2.5, TILE.gem, true);

  // decorative frame around pendant
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    box(`frame_${i}`, "root", Math.cos(a) * pR, py + Math.sin(a) * pR, 1.5, 1.5, 1.5, TILE.accent);
  }

  if (ctx.has("runes")) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const r = pR * 0.6;
      box(`rune_${i}`, "root", Math.cos(a) * r, py + Math.sin(a) * r, 0.5, 1, 0.5, TILE.glow, true);
    }
  }
  if (ctx.has("ribbon")) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const r = pR + 1;
      box(`ribbon_${i}`, "root", Math.cos(a) * r, py + Math.sin(a) * r, 0.7, 0.7, 0.7, TILE.accent);
    }
  }
  if (ctx.has("spikes")) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const r = pR + 1;
      box(`spike_${i}`, "root", Math.cos(a) * r, py + Math.sin(a) * r, 0.8, 2.5, 0.8, TILE.secondary);
    }
  }
  if (ctx.has("wings")) addWings(ctx, pR, py + 1, 2);
  if (ctx.has("crown")) {
    for (let i = 0; i < 3; i++) box(`crown_${i}`, "root", (i - 1) * 1.5, py + pR + 1, 1, 2, 1, TILE.accent);
  }
  if (ctx.has("halo")) ctx.ring(pR + 1, py, "floating", 0.8, 10);

  // central glow orb
  ctx.glow("pendant_glow", "root", 0, py, 1.5, 2);

  const topY = py + pR + 5;
  addFloating(ctx, 0, py - pR - 3, 1.2);
  addParticles(ctx, py - pR * 2, py + pR * 2, pR * 2, pR * 2);
  addAura(ctx, topY);
  addTrail(ctx, pR * 3);
  return topY;
}

// ============================================================================
// Enhancement pipeline: morph -> tier -> limit break
// ============================================================================

/** 形態変化 — transforms blade/head groups. */
function applyMorph(parts: VoxelPart[], spec: ModelSpec): void {
  const m = spec.morph ?? "standard";
  if (m === "standard") return;
  const srcGroups = parts.filter((p) => p.group === "blade" || p.group === "head");
  if (srcGroups.length === 0) return;

  if (m === "great") {
    for (const p of srcGroups) {
      const cx = (p.from[0] + p.to[0]) / 2;
      const cy = (p.from[1] + p.to[1]) / 2;
      const cz = (p.from[2] + p.to[2]) / 2;
      const s = 1.5;
      p.from = [cx - (cx - p.from[0]) * s, cy - (cy - p.from[1]) * s, cz - (cz - p.from[2]) * s];
      p.to = [cx + (p.to[0] - cx) * s, cy + (p.to[1] - cy) * s, cz + (p.to[2] - cz) * s];
    }
    // bulk plates at the joint
    const minY = Math.min(...srcGroups.map((p) => p.from[1]));
    parts.push(
      { name: "great_plate_l", group: "root", from: [-4.5, minY - 0.5, -1], to: [-2.5, minY + 2.5, 1], tile: TILE.secondary, emissive: false },
      { name: "great_plate_r", group: "root", from: [2.5, minY - 0.5, -1], to: [4.5, minY + 2.5, 1], tile: TILE.secondary, emissive: false },
      { name: "great_core", group: "root", from: [-0.75, minY, 0.5], to: [0.75, minY + 3, 1.5], tile: TILE.glow, emissive: true },
    );
  } else if (m === "fragment") {
    const bladeParts = parts.filter((p) => p.group === "blade");
    const target = bladeParts.length > 0 ? bladeParts : srcGroups;
    const minY = Math.min(...target.map((p) => p.from[1]));
    const maxY = Math.max(...target.map((p) => p.to[1]));
    const h = maxY - minY;
    const w = 1 + spec.width * 1.5;
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i].group === (bladeParts.length > 0 ? "blade" : "head")) parts.splice(i, 1);
    }
    const offsets = [-2.6, 0, 2.6];
    const dyps = [-0.8, 0, 0.8];
    offsets.forEach((x, i) => {
      const dy = dyps[i];
      parts.push(
        { name: `fragment_${i}`, group: "blade", from: [x - w / 2, minY + dy, -0.7], to: [x + w / 2, minY + h + dy, 0.7], tile: TILE.secondary, emissive: false },
        { name: `fragment_core_${i}`, group: "blade", from: [x - 0.4, minY + 1 + dy, -0.7], to: [x + 0.4, maxY - 1 + dy, 0.7], tile: TILE.accent, emissive: true },
      );
    });
    // energy slivers between shards
    parts.push(
      { name: "frag_sliver_l", group: "floating", from: [-1.5, minY + h * 0.35, -0.15], to: [-0.9, minY + h * 0.65, 0.15], tile: TILE.glow, emissive: true },
      { name: "frag_sliver_r", group: "floating", from: [0.9, minY + h * 0.35, -0.15], to: [1.5, minY + h * 0.65, 0.15], tile: TILE.glow, emissive: true },
    );
  } else if (m === "twin") {
    const bladeParts = parts.filter((p) => p.group === "blade");
    const src = bladeParts.length > 0 ? bladeParts : srcGroups;
    const off = 7 + spec.width * 2;
    for (const p of src) {
      parts.push({
        name: `${p.name}_twin`,
        group: p.group,
        from: [p.from[0] + off, p.from[1] - 1, p.from[2]],
        to: [p.to[0] + off, p.to[1] - 1, p.to[2]],
        tile: p.tile,
        emissive: p.emissive,
      });
    }
  }
}

/** 段階強化 — adds tier bonus parts. */
function applyTier(ctx: Ctx, spec: ModelSpec): void {
  const t = spec.tier ?? 1;
  if (t < 2) return;
  const cy = 4;
  if (t >= 2) {
    ctx.ring(7, cy + 5, "floating", 1, 14);
    for (let i = 0; i < 3; i++) ctx.glow(`tier_rune_${i}`, "root", (i - 1) * 3.2, cy, 2.4, 0.8);
  }
  if (t >= 3) {
    ctx.spiral(6, "aura", 0, cy - 2, cy + 10, 6, 1, TILE.aura1);
    for (const s of [-1, 1]) {
      for (let i = 0; i < 2; i++) {
        ctx.box(`tier_wing_${s}_${i}`, "wings", s * (5 + i * 1.5), cy + i * 1.1, 1.2, 3 - i, 3 - i, TILE.accent);
      }
    }
  }
  if (t >= 4) {
    ctx.ring(9.5, cy + 10, "floating", 1.2, 16);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.box(`tier_spike_${i}`, "root", Math.cos(a) * 8, cy + 6 + Math.sin(a) * 3, 1, 2.5, 1, TILE.accent);
    }
    ctx.shards(6, "floating", 0, cy + 14, 0, 5, 1.2);
  }
}

/** 限界突破 — overcharged core, wings, halos. */
function applyLimitBreak(ctx: Ctx, spec: ModelSpec): void {
  const lb = spec.limitBreak ?? 0;
  if (lb < 1) return;
  const cy = 6;
  ctx.glow("lb_core", "floating", 0, cy, 2.5, 2.5 + lb * 0.8);
  const n = 4 + lb * 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 4.5 + lb;
    ctx.glow(`lb_orb_${i}`, "floating", Math.cos(a) * r, cy + Math.sin(a * 2) * 2, Math.sin(a) * r, 1 + lb * 0.3);
  }
  ctx.ring(5.5 + lb, cy, "floating", 1, 12);
  if (lb >= 2) {
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        ctx.box(`lb_wing_${s}_${i}`, "wings", s * (5 + i * 1.6), cy + i * 1.2, 1.3, 3.5 - i, 3.5 - i, TILE.glow);
      }
    }
    ctx.spiral(8, "aura", 0, cy - 4, cy + 12, 7, 1.2, TILE.aura1);
  }
  if (lb >= 3) {
    ctx.ring(8.5, cy + 5, "floating", 1.2, 16);
    ctx.ring(8.5, cy - 5, "floating", 1.2, 16);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.box(`lb_beam_${i}`, "aura", Math.cos(a) * 9, cy - 1.5, 0.9, 3, 0.9, TILE.glow, true);
    }
    ctx.shards(10, "floating", 0, cy + 9, 0, 6, 1.4);
  }
}

/** 一時モード — temporary overlay parts (charge / focus). Not baked into the spec. */
export function generateModeOverlay(spec: ModelSpec, mode: ModeKind, parts: VoxelPart[]): VoxelPart[] {
  if (mode === "idle" || parts.length === 0) return [];
  const out: VoxelPart[] = [];
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of parts) {
    minY = Math.min(minY, p.from[1]);
    maxY = Math.max(maxY, p.to[1]);
  }
  const cy = (minY + maxY) / 2;

  if (mode === "charge") {
    out.push({ name: "charge_core", group: "mode", from: [-2, cy - 2, -2], to: [2, cy + 2, 2], tile: TILE.glow, emissive: true });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = 5;
      out.push({ name: `charge_seg_${i}`, group: "mode", from: [Math.cos(a) * r - 0.6, cy - 0.6, Math.sin(a) * r - 0.6], to: [Math.cos(a) * r + 0.6, cy + 0.6, Math.sin(a) * r + 0.6], tile: TILE.accent, emissive: true });
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = 2.8 + (i % 3);
      const y = cy + (i % 2) * 1.5;
      out.push({ name: `charge_spk_${i}`, group: "mode", from: [Math.cos(a) * r - 0.35, y - 0.35, Math.sin(a) * r - 0.35], to: [Math.cos(a) * r + 0.35, y + 0.35, Math.sin(a) * r + 0.35], tile: TILE.glow, emissive: true });
    }
  } else if (mode === "focus") {
    for (const s of [-1, 1]) {
      out.push({ name: `focus_beam_${s}`, group: "mode", from: [s * 6 - 0.4, cy - 8, -0.4], to: [s * 6 + 0.4, cy + 8, 0.4], tile: TILE.glow, emissive: true });
    }
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const r = 7;
      out.push({ name: `focus_ring_${i}`, group: "mode", from: [Math.cos(a) * r - 0.5, cy + 8, Math.sin(a) * r - 0.5], to: [Math.cos(a) * r + 0.5, cy + 8.8, Math.sin(a) * r + 0.5], tile: TILE.accent, emissive: true });
    }
    out.push({ name: "focus_eye", group: "mode", from: [-1.5, cy, 1.8], to: [1.5, cy + 1.5, 2.6], tile: TILE.glow, emissive: true });
  }
  return out;
}

// ============================================================================
// Entry point
// ============================================================================

export function generateModel(spec: ModelSpec): GeneratedModel {
  const ctx = makeCtx(spec);
  let radius = 16;
  const builders: Record<string, (c: Ctx) => number> = {
    sword: buildSword, staff: buildStaff, bow: buildBow, shield: buildShield,
    armor: buildArmor, axe: buildAxe, trident: buildTrident, dagger: buildDagger,
    tome: buildTome, amulet: buildAmulet,
    ...makeExtraBuilders({
      addAura, addChain, addDecor, addFloating, addMagicCircle, addParticles, addRunes, addTrail, addWings,
    }),
  };
  radius = (builders[spec.type] ?? buildSword)(ctx);
  applyMorph(ctx.parts, spec);
  applyTier(ctx, spec);
  applyLimitBreak(ctx, spec);
  return { parts: ctx.parts, palette: paletteFor(spec), radius: Math.max(12, radius) };
}

// ============================================================================
// Phantom afterimages (幻影分身)
// ============================================================================

/**
 * Creates ghost afterimages of the primary weapon shape.
 * Returns transparent, glow-tinted copies positioned as mirrors / spirals / orbits.
 */
export function applyPhantom(spec: ModelSpec, parts: VoxelPart[]): VoxelPart[] {
  const mode = spec.phantom;
  if (mode === "none") return [];
  const out: VoxelPart[] = [];
  const srcParts = parts.filter((p) => p.group === "blade" || p.group === "head" || p.group === "root");
  if (srcParts.length === 0) return out;

  let minY = Infinity, maxY = -Infinity;
  for (const p of srcParts) {
    minY = Math.min(minY, p.from[1]);
    maxY = Math.max(maxY, p.to[1]);
  }
  const cy = (minY + maxY) / 2;
  const h = maxY - minY;

  // sample a subset of the source shape to keep the ghost light
  const step = Math.max(1, Math.floor(srcParts.length / 28));
  const sampled = srcParts.filter((_, i) => i % step === 0);

  const makeGhost = (x: number, y: number, z: number, rot: number, scale: number, tag: string): VoxelPart[] => {
    const res: VoxelPart[] = [];
    for (const p of sampled) {
      const cx0 = ((p.from[0] + p.to[0]) / 2) * scale;
      const cz0 = ((p.from[2] + p.to[2]) / 2) * scale;
      const cy0 = ((p.from[1] + p.to[1]) / 2) * scale;
      const cosR = Math.cos(rot), sinR = Math.sin(rot);
      const rx = cx0 * cosR - cz0 * sinR;
      const rz = cx0 * sinR + cz0 * cosR;
      const halfW = (p.to[0] - p.from[0]) / 2 * scale;
      const halfH = (p.to[1] - p.from[1]) / 2 * scale;
      const halfD = (p.to[2] - p.from[2]) / 2 * scale;
      res.push({
        name: `phantom_${tag}_${p.name}`,
        group: "phantom",
        from: [rx + x - halfW, cy0 + y - halfH, rz + z - halfD],
        to: [rx + x + halfW, cy0 + y + halfH, rz + z + halfD],
        tile: TILE.glow,
        emissive: true,
      });
    }
    return res;
  };

  if (mode === "mirror") {
    // one dim ghost behind and to the side
    out.push(...makeGhost(4, 0, -2, 0.35, 0.85, "mirror"));
  } else if (mode === "spiral") {
    // 3 ghosts ascending in a helix
    for (let i = 1; i <= 3; i++) {
      const t = i / 3;
      const a = t * Math.PI * 1.2;
      const r = 4 + i * 2;
      out.push(...makeGhost(Math.cos(a) * r, t * 3, Math.sin(a) * r, a * 0.5, 0.6 + t * 0.15, `spiral${i}`));
    }
  } else if (mode === "orbit") {
    // 4 ghosts around the model at different phases
    const n = 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = 6 + spec.width * 2;
      out.push(...makeGhost(Math.cos(a) * r, (i % 2) * 1.5 - 0.5, Math.sin(a) * r, a, 0.55, `orb${i}`));
    }
  }
  return out;
}

/**
 * Extended model output including phantom parts (for both viewer and .bbmodel export).
 */
export function generateModelWithPhantom(spec: ModelSpec): GeneratedModel {
  const base = generateModel(spec);
  const phantom = applyPhantom(spec, base.parts);
  return { parts: [...base.parts, ...phantom], palette: base.palette, radius: base.radius };
}