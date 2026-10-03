import { GeneratorConfig, ColorPalette, GroupKey, MaterialKey, VoxelElement } from "../types";
import { VoxelBuilder } from "../voxel";
import { shadeColor } from "../color";

export interface GenCtx {
  cfg: GeneratorConfig;
  palette: ColorPalette;
  b: VoxelBuilder;
  rng: () => number;
}

const HILT: GroupKey = "Hilt";
const GUARD: GroupKey = "Guard";
const BLADE: GroupKey = "Blade";
const SHAFT: GroupKey = "Shaft";
const CORE: GroupKey = "Core";

/* ------------------------------------------------------------------ */
/* shared sub-structures                                              */
/* ------------------------------------------------------------------ */

/** Pommel cap + optional gem + a wrapped grip of alternating materials. */
export function buildHilt(
  ctx: GenCtx,
  opts: { grip: number; width?: number; startY?: number; wrapColor?: MaterialKey }
): number {
  const { cfg, b } = ctx;
  const w = opts.width ?? 3;
  let y = opts.startY ?? 1.5;

  b.cxBox("pommel_cap", y, w + 1.2, 2.4, w + 1.2, "secondary", { group: HILT, tint: -8 });
  b.spike("pommel_bezel", b.centerX, y + 2.4, b.centerZ, w * 0.7, 1.6, "accent", {
    group: HILT,
    layers: 2,
  });
  if (cfg.hasPommelGem) {
    b.cxBox("pommel_gem", y + 0.4, 2, 1.6, 2, "gem", { group: HILT });
  }
  y += 2.4;

  const grip = opts.grip;
  for (let i = 0; i < grip; i += 2) {
    const even = i % 4 === 0;
    b.cxBox(`grip_${i}`, y, w, 2, w, even ? "wood" : "cloth", {
      group: HILT,
      tint: even ? 0 : -10,
    });
    // wrap bands
    b.cxBox(`grip_band_${i}`, y + 0.6, w + 0.9, 0.9, w + 0.9, opts.wrapColor ?? "accent", {
      group: HILT,
      tint: -6,
    });
    y += 2;
  }
  return y;
}

/** Crossguard of 7 distinct styles. Returns the Y the blade should start at. */
export function buildGuard(ctx: GenCtx, y: number): number {
  const { cfg, b } = ctx;
  const gw = cfg.crossguardWidth;
  const thick = cfg.crossguardStyle === "minimal" ? 2 : 3;

  // central block
  b.cxBox("guard_heart", y, 5, 3, thick, "primary", { group: GUARD });
  b.cxBox("guard_inlay", y + 0.8, 5.4, 1.2, thick + 0.5, "accent", { group: GUARD });
  b.cxBox("guard_riser", y + 3, 3.4, 1.6, thick * 0.8, "secondary", { group: GUARD, tint: -6 });

  if (cfg.crossguardStyle === "circular") {
    b.ring("guard_ring", y - 1.5, gw * 0.62, 2, "primary", {
      group: GUARD,
      segments: Math.max(12, Math.round(gw)),
      height: 2.6,
      yFn: (t) => Math.sin(t * Math.PI * 2) * 0,
    });
    b.ring("guard_ring_inlay", y - 0.6, gw * 0.62 + 0.6, 1, "accent", {
      group: GUARD,
      segments: Math.max(10, Math.round(gw)),
      height: 0.9,
    });
  } else {
    const steps = Math.max(2, Math.round(gw / 2.4));
    b.mirror((side) => {
      for (let s = 1; s <= steps; s++) {
        const x = b.centerX + side * (s * 1.7);
        let dy = 0;
        let armH = 2.6;
        let mat = "primary" as MaterialKey;

        switch (cfg.crossguardStyle) {
          case "winged":
            dy = s * 1.05;
            armH = 2.6 - s * 0.18;
            mat = s > steps - 2 ? "secondary" : "primary";
            break;
          case "horned":
            dy = s <= steps / 2 ? -s * 0.5 : (s - steps / 2) * 1.8;
            armH = 3 - s * 0.2;
            break;
          case "dragon":
            dy = s % 2 === 0 ? 1 : -0.6;
            armH = 3.2;
            mat = s % 3 === 0 ? "accent" : "primary";
            break;
          case "spiked":
            dy = s * 0.6;
            armH = Math.max(1, 3 - s * 0.45);
            mat = "secondary";
            break;
          case "runic":
            dy = s % 2 === 0 ? 0.4 : -0.2;
            armH = 2.4;
            mat = s % 2 === 0 ? "accent" : "primary";
            break;
          default: // minimal
            dy = s * 0.2;
            armH = 2.4;
            mat = "primary";
        }

        b.box(
          `guard_${cfg.crossguardStyle}_${side}_${s}`,
          [x - 0.9, y + dy, b.centerZ - thick / 2],
          [x + 0.9, y + dy + armH, b.centerZ + thick / 2],
          mat,
          { group: GUARD }
        );

        // runic studs along the guard
        if (cfg.hasRunicEngravings && cfg.crossguardStyle === "runic" && s % 2 === 1) {
          b.box(
            `guard_rune_${side}_${s}`,
            [x - 0.4, y + dy + 0.6, b.centerZ - thick / 2 - 0.3],
            [x + 0.4, y + dy + 1.6, b.centerZ + thick / 2 + 0.3],
            "gem",
            { group: GUARD }
          );
        }

        if (cfg.hasSpikesOrWings && s === steps) {
          if (cfg.crossguardStyle === "winged") {
            // feathered wing tip sweeping up
            for (let f = 0; f < 3; f++) {
              b.box(
                `wing_feather_${side}_${f}`,
                [
                  x + side * (0.6 + f * 1.4),
                  y + dy + f * 1.1,
                  b.centerZ - 1.1 + f * 0.35,
                ],
                [
                  x + side * (2.2 + f * 1.6),
                  y + dy + 1.6 + f * 1.3,
                  b.centerZ + 1.1 - f * 0.35,
                ],
                f === 2 ? "accent" : "bone",
                { group: GUARD, tint: -f * 8 }
              );
            }
          } else {
            b.spike(
              `guard_tip_${side}`,
              x + side * 1.6,
              y + dy + 1,
              b.centerZ,
              2.6,
              5,
              cfg.hasRunicEngravings ? "gem" : "accent",
              { group: GUARD }
            );
          }
        }
      }
    });
  }

  // core gem seated in the guard
  let top = y + 4.6;
  if (cfg.hasCoreGem) {
    const g = Math.max(2, cfg.coreGemSize * 0.85);
    b.cxBox("core_gem", y + 1.2, g, g, g, "gem", { group: CORE });
    b.box(
      "core_cage_l",
      [b.centerX - g / 2 - 0.7, y + 0.6, b.centerZ - g / 2 - 0.4],
      [b.centerX - g / 2, y + 1.2 + g, b.centerZ + g / 2 + 0.4],
      "accent",
      { group: CORE }
    );
    b.box(
      "core_cage_r",
      [b.centerX + g / 2, y + 0.6, b.centerZ - g / 2 - 0.4],
      [b.centerX + g / 2 + 0.7, y + 1.2 + g, b.centerZ + g / 2 + 0.4],
      "accent",
      { group: CORE }
    );
    top = y + 1.2 + g + 1;
  }
  return top;
}

export function buildChains(ctx: GenCtx, y: number): void {
  const { cfg, b } = ctx;
  if (!cfg.hasChainsOrRibbons) return;
  const reach = Math.max(4, Math.round(cfg.crossguardWidth * 0.45));
  b.mirror((side) => {
    const pts: [number, number, number][] = [];
    const x0 = b.centerX + side * cfg.crossguardWidth * 0.42;
    for (let i = 0; i < reach; i++) {
      const sway = Math.sin(i * 0.7) * 0.6;
      pts.push([x0 + side * sway, y - 1 - i * 1.5, b.centerZ + Math.cos(i * 0.6) * 0.7]);
    }
    b.strand(`chain_${side}`, pts, 1.1, side === 1 ? "accent" : "secondary", {
      group: "Ornament",
      emissive: false,
    });
  });
}

/** The main blade: segments, edges, profiles, runes, aura and a tip. */
export function buildBlade(ctx: GenCtx, startY: number, opts?: { leaf?: boolean }): number {
  const { cfg, b } = ctx;
  const len = cfg.bladeLength;
  const halfW = cfg.bladeWidth / 2;
  const segCount = Math.max(3, Math.round(len / 2));
  const segH = len / segCount;
  const depth = cfg.bladeProfile === "hexagonal" ? 2.4 : 2;

  for (let s = 0; s < segCount; s++) {
    const y = startY + s * segH;
    const t = s / (segCount - 1);
    // leaf shape swells then tapers; normal blades taper monotonically
    const shape = opts?.leaf
      ? Math.sin(Math.PI * (0.18 + t * 0.72)) * 1.15
      : 1 - t * 0.55;
    const w = Math.max(1.2, halfW * shape);
    const split = cfg.bladeEdgeStyle === "split" && s < segCount - 1;

    if (split) {
      // twin blades with a visible channel between them
      b.box(
        `blade_twin_L_${s}`,
        [b.centerX - w, y, b.centerZ - depth / 2],
        [b.centerX - 0.6, y + segH, b.centerZ + depth / 2],
        "primary",
        { group: BLADE, tint: s % 2 ? -6 : 4 }
      );
      b.box(
        `blade_twin_R_${s}`,
        [b.centerX + 0.6, y, b.centerZ - depth / 2],
        [b.centerX + w, y + segH, b.centerZ + depth / 2],
        "primary",
        { group: BLADE, tint: s % 2 ? -6 : 4 }
      );
      b.box(
        `blade_channel_${s}`,
        [b.centerX - 0.5, y, b.centerZ - depth / 2 + 0.4],
        [b.centerX + 0.5, y + segH, b.centerZ + depth / 2 - 0.4],
        cfg.hasEnergyBladeOutline ? "glow" : "accent",
        { group: BLADE }
      );
    } else {
      // spine
      b.box(
        `blade_spine_${s}`,
        [b.centerX - 0.9, y, b.centerZ - depth / 2],
        [b.centerX + 0.9, y + segH, b.centerZ + depth / 2],
        "primary",
        { group: BLADE, tint: s % 2 ? -4 : 3 }
      );

      // cutting edges
      b.mirror((side) => {
        const x0 = side === -1 ? b.centerX - w : b.centerX + 0.9;
        const x1 = side === -1 ? b.centerX - 0.9 : b.centerX + w;
        b.box(
          `blade_edge_${side}_${s}`,
          [x0, y, b.centerZ - depth / 2 + 0.3],
          [x1, y + segH, b.centerZ + depth / 2 - 0.3],
          cfg.bladeProfile === "fuller" ? "secondary" : "secondary",
          { group: BLADE, tint: 12 }
        );

        // edge treatments
        if (cfg.bladeEdgeStyle === "serrated" && s % 2 === 1) {
          b.box(
            `serration_${side}_${s}`,
            [side === -1 ? x0 - 1.3 : x1, y + segH * 0.2, b.centerZ - 0.5],
            [side === -1 ? x0 : x1 + 1.3, y + segH * 0.8, b.centerZ + 0.5],
            "accent",
            { group: BLADE }
          );
        }
        if (cfg.bladeEdgeStyle === "flame_wavy") {
          const off = Math.sin(s * 1.4) * 0.7;
          b.box(
            `flame_${side}_${s}`,
            [side === -1 ? x0 - 1 + off : x1 + off, y + 0.3, b.centerZ - 0.4],
            [side === -1 ? x0 + off : x1 + 1 + off, y + segH - 0.3, b.centerZ + 0.4],
            "glow",
            { group: BLADE }
          );
        }
        if (cfg.bladeEdgeStyle === "crystal_spikes" && s % 3 === 1) {
          b.spike(
            `crystal_spike_${side}_${s}`,
            side === -1 ? x0 - 1 : x1 + 1,
            y + segH * 0.25,
            b.centerZ,
            2,
            3.4,
            "gem",
            { group: BLADE }
          );
        }
      });

      // profile detail on the flat faces
      if (cfg.bladeProfile === "fuller" && s % 2 === 1) {
        b.box(
          `fuller_${s}`,
          [b.centerX - 0.5, y + 0.2, b.centerZ - depth / 2 - 0.15],
          [b.centerX + 0.5, y + segH - 0.2, b.centerZ + depth / 2 + 0.15],
          "primary",
          { group: BLADE, tint: -26 }
        );
      }
      if (cfg.bladeProfile === "bevel") {
        b.box(
          `bevel_${s}`,
          [b.centerX - 1.4, y + 0.1, b.centerZ + depth / 2 - 0.1],
          [b.centerX + 1.4, y + segH - 0.1, b.centerZ + depth / 2 + 0.35],
          "accent",
          { group: BLADE, tint: 8 }
        );
      }
      if (cfg.bladeProfile === "hexagonal") {
        b.box(
          `hex_ridge_${s}`,
          [b.centerX - 0.35, y, b.centerZ - depth / 2 - 0.35],
          [b.centerX + 0.35, y + segH, b.centerZ + depth / 2 + 0.35],
          "glow",
          { group: BLADE }
        );
      }

      // runic engravings
      if (cfg.hasRunicEngravings && s % 3 === 1) {
        b.box(
          `rune_${s}`,
          [b.centerX - 0.55, y + segH * 0.2, b.centerZ - depth / 2 - 0.3],
          [b.centerX + 0.55, y + segH * 0.8, b.centerZ + depth / 2 + 0.3],
          "gem",
          { group: BLADE }
        );
      }

      // energy aura outline (double-wide glowing silhouette)
      if (cfg.hasEnergyBladeOutline && s % 2 === 0) {
        b.box(
          `aura_${s}`,
          [b.centerX - w - 0.5, y + 0.15, b.centerZ - 0.5],
          [b.centerX + w + 0.5, y + segH - 0.15, b.centerZ + 0.5],
          "glow",
          { group: BLADE, tint: 6 }
        );
      }

      // second gem set into the upper blade
      if (cfg.hasSecondGem && s === Math.floor(segCount * 0.62)) {
        b.cxBox(`blade_gem_${s}`, y, 3, 3, depth + 1.4, "gem", { group: BLADE });
        b.cxBox(`blade_gem_collar_${s}`, y - 0.6, 4, 0.8, depth + 2, "accent", {
          group: BLADE,
        });
      }
    }
  }

  // tip
  const tipY = startY + len;
  b.cxBox("tip_block", tipY, Math.max(1.6, cfg.bladeWidth * 0.7), 1.6, depth, "secondary", {
    group: BLADE,
  });
  b.spike("tip_point", b.centerX, tipY + 1.6, b.centerZ, Math.max(2, cfg.bladeWidth * 0.85), 4.2, "accent", {
    group: BLADE,
    layers: 4,
  });
  b.cxBox("tip_crystal", tipY + 2.6, 1.4, 1.4, 1.4, "gem", { group: BLADE });
  return tipY + 5;
}

/* ------------------------------------------------------------------ */
/* categories                                                          */
/* ------------------------------------------------------------------ */

function buildSwordFamily(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const dagger = cfg.category === "dagger";
  const great = cfg.category === "greatsword";
  const grip = dagger
    ? Math.max(3, Math.round(cfg.handleLength * 0.7))
    : great
    ? Math.round(cfg.handleLength * 1.35)
    : cfg.handleLength;
  const width = great ? 3.6 : dagger ? 2.4 : 3;

  let y = buildHilt(ctx, { grip, width });
  y = buildGuard(ctx, y);
  buildBlade(ctx, y, { leaf: dagger });
  buildChains(ctx, y - 1);
}

function buildStaff(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const grip = Math.max(12, cfg.handleLength);

  // butt spike
  b.spike("staff_foot", b.centerX, -1, b.centerZ, 3, 3, "secondary", { group: SHAFT });
  let y = buildHilt(ctx, { grip: 6, width: 3, wrapColor: "accent" });

  // long shaft with collars
  const shaftStart = y;
  const shaftEnd = shaftStart + grip;
  for (let sy = shaftStart; sy < shaftEnd; sy += 3) {
    b.cxBox(`shaft_${sy}`, sy, 2.6, 3, 2.6, "wood", { group: SHAFT, tint: -6 });
    if (Math.round((sy - shaftStart) / 3) % 3 === 0) {
      b.cxBox(`shaft_collar_${sy}`, sy, 3.6, 1, 3.6, "accent", { group: SHAFT });
    }
  }
  y = shaftEnd;
  y = buildGuard(ctx, y);

  // crown prongs around the head
  const headY = y + 2;
  const reach = Math.max(5, Math.round(cfg.crossguardWidth * 0.55));
  for (let a = 0; a < 4; a++) {
    const ang = (a / 4) * Math.PI * 2 + Math.PI / 4;
    const px = b.centerX + Math.cos(ang) * reach;
    const pz = b.centerZ + Math.sin(ang) * reach;
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      const x = px + (b.centerX - px) * (t * 0.55);
      const z = pz + (b.centerZ - pz) * (t * 0.55);
      b.box(
        `prong_${a}_${i}`,
        [x - 0.8, headY + i * 1.9, z - 0.8],
        [x + 0.8, headY + i * 1.9 + 2.2, z + 0.8],
        i === 4 ? "accent" : "primary",
        { group: "Head", tint: -i * 3 }
      );
    }
    b.spike(
      `prong_tip_${a}`,
      b.centerX + Math.cos(ang) * reach * 0.45,
      headY + 9.2,
      b.centerZ + Math.sin(ang) * reach * 0.45,
      1.8,
      3,
      "gem",
      { group: "Head" }
    );
  }

  // arcane orb
  const orbR = Math.max(3, cfg.coreGemSize * 0.9 + 1.4);
  const orbY = headY + 6.5;
  b.cxBox("orb_outer", orbY, orbR * 1.6, orbR * 1.6, orbR * 1.6, "gem", { group: CORE });
  b.cxBox("orb_inner", orbY + orbR * 0.3, orbR, orbR, orbR, "glow", { group: CORE, tint: 10 });
  b.ring("orb_cage", orbY + orbR * 0.4, orbR * 0.95, 0.9, "accent", {
    group: CORE,
    segments: 10,
    height: orbR,
  });
  b.spike(
    "staff_spire",
    b.centerX,
    orbY + orbR * 1.6 + 1,
    b.centerZ,
    3,
    7,
    "accent",
    { group: "Head", layers: 5 }
  );
  if (cfg.hasRunicEngravings) {
    b.cxBox("staff_sigil", orbY + orbR * 1.6 + 8, 1.6, 1.6, 1.6, "gem", { group: "Head" });
  }
}

function buildScythe(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  let y = buildHilt(ctx, { grip: Math.max(8, cfg.handleLength), width: 3 });
  y = buildGuard(ctx, y);

  // curved blade sweeping out to -x
  const reach = Math.max(12, Math.round(cfg.bladeLength * 1.1));
  for (let i = 0; i < reach; i++) {
    const t = i / reach;
    const x = b.centerX - i * 1.15;
    const yy = y + Math.sin(t * Math.PI * 0.72) * 7 - t * 3.5;
    const w = 2.6 * (1 - t * 0.5);
    b.box(
      `scythe_spine_${i}`,
      [x - 1, yy, b.centerZ - 0.9],
      [x + 1, yy + w, b.centerZ + 0.9],
      "primary",
      { group: BLADE, tint: i % 2 ? -5 : 3 }
    );
    b.box(
      `scythe_edge_${i}`,
      [x - 0.85, yy - 2.4, b.centerZ - 0.35],
      [x + 0.85, yy, b.centerZ + 0.35],
      cfg.hasEnergyBladeOutline ? "glow" : "accent",
      { group: BLADE }
    );
    if (cfg.hasRunicEngravings && i % 5 === 2) {
      b.box(
        `scythe_rune_${i}`,
        [x - 0.6, yy + 0.4, b.centerZ - 1.2],
        [x + 0.6, yy + w - 0.4, b.centerZ + 1.2],
        "gem",
        { group: BLADE }
      );
    }
  }

  // counterweight spike on the opposite side
  b.spike("scythe_counter", b.centerX + 4, y, b.centerZ, 3.2, 7, "secondary", {
    group: BLADE,
    layers: 5,
  });
  if (cfg.hasCoreGem) {
    b.cxBox("scythe_soulgem", y + 3, cfg.coreGemSize, cfg.coreGemSize, cfg.coreGemSize, "gem", {
      group: CORE,
    });
  }
  buildChains(ctx, y);
}

function buildAxe(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const grip = Math.max(10, cfg.handleLength);

  b.spike("haft_foot", b.centerX, -1, b.centerZ, 2.6, 3.4, "secondary", { group: SHAFT });
  let y = buildHilt(ctx, { grip: Math.min(6, grip), width: 3 });
  const shaftEnd = y + grip;
  for (let sy = y; sy < shaftEnd; sy += 3) {
    b.cxBox(`haft_${sy}`, sy, 2.6, 3, 2.6, "wood", { group: SHAFT, tint: -8 });
  }
  y = shaftEnd;
  y = buildGuard(ctx, y);

  // axe head: layered plates that widen with height, mirrored
  const headY = y - 1;
  const reach = Math.max(3, Math.round(cfg.bladeWidth * 0.9));
  b.mirror((side) => {
    for (let i = 1; i <= reach; i++) {
      const x0 = b.centerX + side * (i * 2);
      const grow = 4 + i * 3.4;
      b.box(
        `axe_bit_${side}_${i}`,
        [side === -1 ? x0 - 2 : x0, headY - grow / 2, b.centerZ - 0.8],
        [side === -1 ? x0 : x0 + 2, headY + grow / 2, b.centerZ + 0.8],
        i === reach ? "accent" : "primary",
        { group: "Head", tint: i * 4 }
      );
    }
    // haft-side prong under the head
    b.spike(
      `axe_prong_${side}`,
      b.centerX + side * 3,
      headY - 7,
      b.centerZ,
      3,
      5,
      "secondary",
      { group: "Head", layers: 4 }
    );
  });

  // top spike
  b.spike("axe_top_spike", b.centerX, headY + 8, b.centerZ, 3.4, 8, "secondary", {
    group: "Head",
    layers: 6,
  });
  if (cfg.hasCoreGem) {
    b.cxBox(
      "axe_rune_stone",
      headY - cfg.coreGemSize / 2,
      cfg.coreGemSize + 1,
      cfg.coreGemSize,
      3.4,
      "gem",
      { group: CORE }
    );
  }
}

function buildSpear(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const grip = Math.max(14, cfg.handleLength);

  // butt cap
  b.spike("spear_butt", b.centerX, -2, b.centerZ, 3, 4, "secondary", { group: SHAFT });
  let y = buildHilt(ctx, { grip: Math.min(6, grip), width: 3 });
  const shaftEnd = y + grip;
  for (let sy = y; sy < shaftEnd; sy += 4) {
    b.cxBox(`spear_shaft_${sy}`, sy, 2.4, 4, 2.4, "wood", { group: SHAFT, tint: -6 });
    b.cxBox(`spear_band_${sy}`, sy, 3.4, 1, 3.4, "accent", { group: SHAFT });
  }
  y = shaftEnd;
  y = buildGuard(ctx, y);
  buildBlade(ctx, y + 1, { leaf: true });
}

function buildBow(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const len = Math.max(14, cfg.bladeLength);
  const half = len;
  const bend = cfg.crossguardWidth * 0.75;

  // riser / grip at the middle
  let gy = 8;
  b.cxBox("bow_riser", gy, 3.6, 8, 3.6, "wood", { group: HILT });
  b.cxBox("bow_riser_inlay", gy + 2.4, 4.4, 2.6, 4.4, "accent", { group: HILT });
  if (cfg.hasCoreGem) {
    b.cxBox(
      "bow_riser_gem",
      gy + 1.6,
      cfg.coreGemSize * 0.8,
      cfg.coreGemSize * 0.8,
      4.6,
      "gem",
      { group: CORE }
    );
  }

  const tipPoints: [number, number, number][] = [];
  const limbSteps = 12;
  b.mirror((side) => {
    for (let i = 0; i < limbSteps; i++) {
      const t = i / (limbSteps - 1);
      const y = gy + 4 + t * (half - 4) * side;
      // limbs curve outward toward the tips
      const x = b.centerX + Math.sin(t * Math.PI * 0.72) * bend * side * -1;
      const w = 3 * (1 - t * 0.55);
      b.box(
        `bow_limb_${side}_${i}`,
        [x - w, y, b.centerZ - 1.4],
        [x + w, y + (half - 4) / limbSteps + 0.4, b.centerZ + 1.4],
        i % 3 === 0 ? "accent" : "primary",
        { group: BLADE, tint: -i }
      );
      if (cfg.hasRunicEngravings && i % 4 === 1) {
        b.box(
          `bow_rune_${side}_${i}`,
          [x - 1, y + 0.6, b.centerZ - 1.7],
          [x + 1, y + 2, b.centerZ + 1.7],
          "gem",
          { group: BLADE }
        );
      }
      if (i === limbSteps - 1) {
        tipPoints.push([x, y + 2, b.centerZ]);
        b.spike(
          `bow_tip_${side}`,
          x,
          y + 1.4,
          b.centerZ,
          3,
          4,
          "secondary",
          { group: "Head", layers: 3 }
        );
      }
    }
  });

  // string between the two tips
  const tipA = tipPoints[0];
  const tipB = tipPoints[1];
  if (tipA && tipB) {
    const steps = 14;
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      pts.push([
        b.centerX,
        tipA[1] * (1 - t) + tipB[1] * t,
        b.centerZ + 0.1,
      ]);
    }
    b.strand("bow_string", pts, 0.6, "glow", { group: "Ornament" });
    // nocked arrow
    b.cxBox("arrow_shaft", gy + 6, 1, 14, 1, "wood", { group: "Ornament" });
    b.spike("arrow_head", b.centerX, gy + 20, b.centerZ, 2.4, 3.4, "accent", {
      group: "Ornament",
      layers: 3,
    });
    for (let f = 0; f < 3; f++) {
      b.box(
        `arrow_fletch_${f}`,
        [b.centerX - 2.4, gy + 17 + f * 1.4, b.centerZ - 0.4],
        [b.centerX + 2.4, gy + 18.2 + f * 1.4, b.centerZ + 0.4],
        "cloth",
        { group: "Ornament", tint: 10 }
      );
    }
  }
}

function buildShield(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const w = Math.max(9, cfg.crossguardWidth);
  const h = Math.max(12, cfg.bladeLength + 6);
  const baseY = 4;
  const rows = Math.max(5, Math.round(h / 2.4));

  for (let r = 0; r < rows; r++) {
    const t = r / (rows - 1);
    // octagonal outline: narrow at top and bottom
    const shrink = Math.abs(t - 0.5) > 0.34 ? 0.62 : 1;
    const rowW = w * shrink;
    const y = baseY + r * (h / rows);
    b.box(
      `shield_plate_${r}`,
      [b.centerX - rowW / 2, y, b.centerZ - 1.6],
      [b.centerX + rowW / 2, y + h / rows, b.centerZ + 1.6],
      r % 2 === 0 ? "primary" : "secondary",
      { group: "Shell", tint: r % 2 ? 0 : -8 }
    );
    // horizontal ridge bands
    if (r % 2 === 1) {
      b.box(
        `shield_ridge_${r}`,
        [b.centerX - rowW / 2 - 0.6, y + h / rows * 0.3, b.centerZ + 1.6],
        [b.centerX + rowW / 2 + 0.6, y + h / rows * 0.7, b.centerZ + 2.1],
        "accent",
        { group: "Shell" }
      );
    }
    // rim studs
    b.box(
      `shield_rim_l_${r}`,
      [b.centerX - rowW / 2 - 1.4, y + 0.4, b.centerZ - 1],
      [b.centerX - rowW / 2, y + h / rows - 0.4, b.centerZ + 1],
      "bone",
      { group: "Shell", tint: -12 }
    );
    b.box(
      `shield_rim_r_${r}`,
      [b.centerX + rowW / 2, y + 0.4, b.centerZ - 1],
      [b.centerX + rowW / 2 + 1.4, y + h / rows - 0.4, b.centerZ + 1],
      "bone",
      { group: "Shell", tint: -12 }
    );
  }

  // central boss + gem
  const midY = baseY + h / 2;
  b.cxBox("shield_boss", midY, 6, 6, 3.4, "primary", { group: CORE });
  if (cfg.hasCoreGem) {
    const g = Math.max(3, cfg.coreGemSize);
    b.cxBox("shield_gem", midY - 1, g, g, 4.2, "gem", { group: CORE });
  }
  b.ring("shield_boss_ring", midY - 1, 5, 1.4, "accent", {
    group: CORE,
    segments: 14,
    height: 6,
  });

  // top spike / crown
  b.spike("shield_crest", b.centerX, baseY + h - 1, b.centerZ, 4, 6, "accent", {
    group: "Shell",
    layers: 4,
  });
  if (cfg.hasSpikesOrWings) {
    b.mirror((side) => {
      b.spike(
        `shield_horn_${side}`,
        b.centerX + side * (w / 2 + 1),
        midY + 2,
        b.centerZ,
        3,
        7,
        "bone",
        { group: "Shell", layers: 4 }
      );
    });
  }
}

export const WEAPON_BUILDERS: Partial<
  Record<string, (ctx: GenCtx) => void>
> = {
  sword: buildSwordFamily,
  greatsword: buildSwordFamily,
  dagger: buildSwordFamily,
  scythe: buildScythe,
  axe: buildAxe,
  staff: buildStaff,
  spear: buildSpear,
  bow: buildBow,
  shield: buildShield,
};
