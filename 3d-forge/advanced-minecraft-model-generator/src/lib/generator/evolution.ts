import { GeneratorConfig, VoxelElement } from "../types";
import { GenCtx } from "./weapons";
import { shadeColor } from "../color";

/**
 * Computes the effective generator config for the current Upgrade Tier (I..V)
 * so Tier I feels like a raw apprentice-forged blank and Tier V feels like a
 * fully awakened mythic artifact — all derived from the same base weapon.
 */
export function resolveTieredConfig(cfg: GeneratorConfig): GeneratorConfig {
  const tier = cfg.upgradeTier ?? 3;

  if (tier === 1) {
    return {
      ...cfg,
      bladeLength: Math.max(6, Math.round(cfg.bladeLength * 0.68)),
      bladeWidth: Math.max(2, Math.round(cfg.bladeWidth * 0.85)),
      crossguardWidth: Math.max(4, Math.round(cfg.crossguardWidth * 0.62)),
      crossguardStyle: "minimal",
      bladeEdgeStyle: "straight",
      bladeProfile: "flat",
      hasCoreGem: false,
      hasSecondGem: false,
      hasPommelGem: false,
      hasChainsOrRibbons: false,
      hasSpikesOrWings: false,
      hasRunicEngravings: false,
      hasEnergyBladeOutline: false,
      floatingType: "none",
      floatingCount: 0,
      bloomIntensity: Math.min(0.6, cfg.bloomIntensity * 0.5),
    };
  }

  if (tier === 2) {
    return {
      ...cfg,
      bladeLength: Math.max(8, Math.round(cfg.bladeLength * 0.84)),
      crossguardWidth: Math.max(5, Math.round(cfg.crossguardWidth * 0.82)),
      bladeEdgeStyle: cfg.bladeEdgeStyle === "split" ? "straight" : cfg.bladeEdgeStyle,
      hasCoreGem: false,
      hasSecondGem: false,
      hasPommelGem: true,
      hasChainsOrRibbons: false,
      hasSpikesOrWings: false,
      hasRunicEngravings: false,
      hasEnergyBladeOutline: false,
      floatingCount: 0,
      bloomIntensity: Math.min(0.9, cfg.bloomIntensity * 0.75),
    };
  }

  if (tier === 3) {
    return cfg;
  }

  if (tier === 4) {
    return {
      ...cfg,
      bladeLength: Math.min(40, Math.round(cfg.bladeLength * 1.14)),
      crossguardWidth: Math.min(26, Math.round(cfg.crossguardWidth * 1.16)),
      coreGemSize: Math.min(9, cfg.coreGemSize + 1),
      hasCoreGem: true,
      hasSecondGem: true,
      hasPommelGem: true,
      hasRunicEngravings: true,
      hasChainsOrRibbons: true,
      floatingType: cfg.floatingType === "none" ? "runes" : cfg.floatingType,
      floatingCount: Math.max(4, cfg.floatingCount),
      bloomIntensity: Math.min(2.4, cfg.bloomIntensity * 1.2),
    };
  }

  // Tier 5 (Mythic)
  return {
    ...cfg,
    bladeLength: Math.min(44, Math.round(cfg.bladeLength * 1.26)),
    bladeWidth: Math.min(10, cfg.bladeWidth + 1),
    crossguardWidth: Math.min(28, Math.round(cfg.crossguardWidth * 1.28)),
    coreGemSize: Math.min(10, cfg.coreGemSize + 2),
    hasCoreGem: true,
    hasSecondGem: true,
    hasPommelGem: true,
    hasChainsOrRibbons: true,
    hasSpikesOrWings: true,
    hasRunicEngravings: true,
    hasEnergyBladeOutline: true,
    floatingType: cfg.floatingType === "none" ? "crystals" : cfg.floatingType,
    floatingCount: Math.max(6, cfg.floatingCount + 2),
    bloomIntensity: Math.min(2.5, cfg.bloomIntensity * 1.35),
  };
}

/**
 * Assigns left/right blade elements to `BladeL` and `BladeR` bone groups so
 * animations and the Liberated form can slide the two halves apart!
 */
export function partitionSplitBones(elements: VoxelElement[], cx = 8): void {
  for (const el of elements) {
    if (el.group !== "Blade" && el.group !== "Shell") continue;
    const midX = (el.from[0] + el.to[0]) / 2;
    if (midX < cx - 0.35) {
      el.group = "BladeL";
    } else if (midX > cx + 0.35) {
      el.group = "BladeR";
    }
  }
}

/**
 * Adds Tier IV & Tier V structural embellishments (shoulder fins, mythic crest,
 * sub-guard collars).
 */
export function buildTierAdditions(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const tier = cfg.upgradeTier ?? 3;
  if (tier < 4) return;

  const guardY = 2 + cfg.handleLength + 1.5;
  const gw = cfg.crossguardWidth * 0.55;

  // Tier IV+: Floating shoulder fin-guards flanking the lower blade
  b.mirror((side) => {
    for (let i = 0; i < 3; i++) {
      const x = b.centerX + side * (gw * 0.65 + i * 1.3);
      const y = guardY + 3.5 + i * 2.4;
      b.box(
        `tier4_fin_${side}_${i}`,
        [x - 0.7, y, b.centerZ - 0.9],
        [x + 0.7, y + 3.4, b.centerZ + 0.9],
        i === 2 ? "gem" : "accent",
        { group: side === -1 ? "BladeL" : "BladeR", tint: i * 6 }
      );
    }
  });

  if (tier >= 5) {
    // Tier V Mythic: Lower pommel wings + Ascended crown halo around guard
    b.mirror((side) => {
      b.spike(
        `tier5_pommel_wing_${side}`,
        b.centerX + side * 3.2,
        1.2,
        b.centerZ,
        2.2,
        4.5,
        "accent",
        { group: "Hilt", layers: 3 }
      );
      b.spike(
        `tier5_crest_horn_${side}`,
        b.centerX + side * (gw * 0.85),
        guardY + 5,
        b.centerZ,
        2.6,
        7.5,
        "glow",
        { group: "Guard", layers: 5 }
      );
    });

    b.ring("tier5_guard_corona", guardY + 2, gw * 0.7, 1.1, "gem", {
      group: "Halo",
      segments: 16,
      height: 1.1,
    });
  }
}

/**
 * Applies the selected Weapon Form (`standard`, `sealed`, `liberated`,
 * `twin_fang`, `colossus`).
 */
export function buildWeaponForm(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const form = cfg.weaponForm ?? "standard";
  if (form === "standard") return;

  const guardY = 2 + cfg.handleLength + 2;
  const bladeTopY = guardY + cfg.bladeLength;
  const halfW = Math.max(2.2, cfg.bladeWidth * 0.65);

  if (form === "sealed") {
    // Heavy obsidian/dark-iron restraint cage clamping the blade + criss-cross chains
    const clampCount = 4;
    for (let i = 0; i < clampCount; i++) {
      const t = (i + 0.5) / clampCount;
      const y = guardY + 2 + t * (cfg.bladeLength - 3);
      // Heavy iron shackle collar
      b.cxBox(`seal_shackle_${i}`, y, halfW * 2.7, 2.2, 3.6, "primary", {
        group: "Seal",
        tint: -22,
      });
      // Blood/Rune lock pins on sides
      b.mirror((side) => {
        b.box(
          `seal_bolt_${side}_${i}`,
          [b.centerX + side * (halfW * 1.45) - 0.6, y + 0.4, b.centerZ - 1.9],
          [b.centerX + side * (halfW * 1.45) + 0.6, y + 1.8, b.centerZ + 1.9],
          "accent",
          { group: "Seal", tint: -10 }
        );
      });
    }

    // Vertical containment bars locking the edge
    b.mirror((side) => {
      b.box(
        `seal_bar_${side}`,
        [b.centerX + side * (halfW + 0.8) - 0.55, guardY + 1, b.centerZ - 1.2],
        [b.centerX + side * (halfW + 0.8) + 0.55, bladeTopY + 1, b.centerZ + 1.2],
        "secondary",
        { group: "Seal", tint: -18 }
      );
    });

    // Seal lock sigil over the core
    b.cxBox("seal_core_lock", guardY + 0.8, 4.4, 4.4, 4.2, "primary", {
      group: "Seal",
      tint: -25,
    });
    b.cxBox("seal_core_glyph", guardY + 1.8, 2.6, 2.4, 4.6, "gem", {
      group: "Seal",
    });
    return;
  }

  if (form === "liberated") {
    // Shift BladeL and BladeR outward to open a central energy chasm
    const splitOffset = 1.85;
    for (const el of b.elements) {
      if (el.group === "BladeL") {
        el.from[0] = Number((el.from[0] - splitOffset).toFixed(2));
        el.to[0] = Number((el.to[0] - splitOffset).toFixed(2));
      } else if (el.group === "BladeR") {
        el.from[0] = Number((el.from[0] + splitOffset).toFixed(2));
        el.to[0] = Number((el.to[0] + splitOffset).toFixed(2));
      }
    }

    // Build an exposed blazing plasma conduit & floating reactor prisms in the gap
    const nodes = Math.max(4, Math.round(cfg.bladeLength / 4));
    for (let i = 0; i < nodes; i++) {
      const y = guardY + 2 + (i / nodes) * cfg.bladeLength;
      b.cxBox(`liberated_reactor_${i}`, y, 2.1, 2.1, 2.1, i % 2 === 0 ? "gem" : "glow", {
        group: "Core",
      });
      // Energy arcs bridging the split halves
      b.box(
        `liberated_bridge_${i}`,
        [b.centerX - splitOffset - 0.8, y + 0.6, b.centerZ - 0.45],
        [b.centerX + splitOffset + 0.8, y + 1.4, b.centerZ + 0.45],
        "glow",
        { group: "Core" }
      );
    }
    // Extended plasma spearhead shooting out of the chasm
    b.spike("liberated_plasma_tip", b.centerX, bladeTopY + 1, b.centerZ, 3.2, 7.5, "glow", {
      group: "Core",
      layers: 5,
    });
    return;
  }

  if (form === "twin_fang") {
    // Double-ended symmetrical twin-blade / switch-glaive extending below the hilt
    const pommelY = 1.5;
    const twinLen = Math.max(10, Math.round(cfg.bladeLength * 0.75));
    const segs = Math.max(4, Math.round(twinLen / 2.5));
    const segH = twinLen / segs;

    // Lower secondary crossguard at the bottom of the grip
    b.cxBox("twin_lower_guard", pommelY - 1.5, cfg.crossguardWidth * 0.75, 2.2, 2.4, "accent", {
      group: "Guard",
    });

    for (let s = 0; s < segs; s++) {
      const t = s / segs;
      const w = Math.max(1.1, halfW * (1 - t * 0.55));
      const y = pommelY - 2 - (s + 1) * segH;
      b.box(
        `twin_blade_L_${s}`,
        [b.centerX - w, y, b.centerZ - 0.8],
        [b.centerX - 0.3, y + segH, b.centerZ + 0.8],
        s % 2 === 0 ? "primary" : "secondary",
        { group: "BladeL" }
      );
      b.box(
        `twin_blade_R_${s}`,
        [b.centerX + 0.3, y, b.centerZ - 0.8],
        [b.centerX + w, y + segH, b.centerZ + 0.8],
        s % 2 === 0 ? "primary" : "secondary",
        { group: "BladeR" }
      );
      b.cxBox(`twin_core_${s}`, y + 0.2, 0.9, segH - 0.3, 1.8, "gem", {
        group: "Core",
      });
    }
    return;
  }

  if (form === "colossus") {
    // Giant Astral Over-Blade enveloping the weapon
    const colossusLen = cfg.bladeLength * 1.32;
    const colossusW = halfW * 2.2 + 2.5;
    const segs = 7;
    const segH = colossusLen / segs;

    for (let s = 0; s < segs; s++) {
      const t = s / (segs - 1);
      const y = guardY + 1 + s * segH;
      const w = colossusW * (1 - t * 0.42);

      b.mirror((side) => {
        b.box(
          `colossus_edge_${side}_${s}`,
          [
            side === -1 ? b.centerX - w - 1.3 : b.centerX + w,
            y + 0.2,
            b.centerZ - 0.6,
          ],
          [
            side === -1 ? b.centerX - w : b.centerX + w + 1.3,
            y + segH - 0.25,
            b.centerZ + 0.6,
          ],
          s % 2 === 0 ? "glow" : "gem",
          { group: "Astral", tint: 10 }
        );
      });
    }

    // Giant Astral Tip Crown
    b.spike(
      "colossus_apex",
      b.centerX,
      guardY + 1 + colossusLen,
      b.centerZ,
      colossusW * 1.1,
      8.5,
      "glow",
      { group: "Astral", layers: 5 }
    );
  }
}

/**
 * Builds Limit Break (★ OVERLIMIT / ★★ GENESIS) structures:
 * - Floating Funnel / Bit Sub-Blades (`Funnel` bone group)
 * - Back-mounted Counter-Rotating Arcane Halo (`Halo` bone group)
 * - Level 2 Genesis Seraphic/Abyssal Wings & Overhead Starburst (`Astral` bone group)
 */
export function buildLimitBreak(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const lb = cfg.limitBreak ?? 0;
  if (lb <= 0) return;

  const midY = 6 + cfg.handleLength + cfg.bladeLength * 0.45;
  const spanX = Math.max(8, cfg.crossguardWidth * 0.75 + 4);

  // 1. Back-mounted Arcane Halo Ring (z offset behind the weapon)
  const haloZ = b.centerZ - 3.2;
  const haloRad = Math.max(6.5, cfg.crossguardWidth * 0.65);
  const haloSegs = 16;
  for (let i = 0; i < haloSegs; i++) {
    const a = (i / haloSegs) * Math.PI * 2;
    const hx = b.centerX + Math.cos(a) * haloRad;
    const hy = midY - 2 + Math.sin(a) * haloRad;
    b.box(
      `lb_halo_${i}`,
      [hx - 0.7, hy - 0.7, haloZ - 0.4],
      [hx + 0.7, hy + 0.7, haloZ + 0.4],
      i % 2 === 0 ? "gem" : "glow",
      { group: "Halo" }
    );
    if (i % 4 === 0) {
      const sx = b.centerX + Math.cos(a) * (haloRad + 2.2);
      const sy = midY - 2 + Math.sin(a) * (haloRad + 2.2);
      b.box(
        `lb_halo_ray_${i}`,
        [sx - 0.9, sy - 0.9, haloZ - 0.3],
        [sx + 0.9, sy + 0.9, haloZ + 0.3],
        "accent",
        { group: "Halo" }
      );
    }
  }

  // 2. Floating Funnel / Bit Sub-Blades flanking the weapon
  const funnelPairs = lb === 2 ? 4 : 2;
  for (let p = 0; p < funnelPairs; p++) {
    const fy = midY - 6 + p * 6.5;
    const fxDist = spanX + (p % 2) * 3.2;
    const fz = b.centerZ + (p % 2 === 0 ? 1.5 : -1.5);

    b.mirror((side) => {
      const fx = b.centerX + side * fxDist;
      // Funnel core node
      b.box(
        `funnel_core_${side}_${p}`,
        [fx - 1.1, fy - 1.2, fz - 0.9],
        [fx + 1.1, fy + 1.2, fz + 0.9],
        "secondary",
        { group: "Funnel" }
      );
      b.box(
        `funnel_gem_${side}_${p}`,
        [fx - 0.7, fy - 0.7, fz - 1.1],
        [fx + 0.7, fy + 0.7, fz + 1.1],
        "gem",
        { group: "Funnel" }
      );
      // Funnel blade body
      b.box(
        `funnel_blade_${side}_${p}`,
        [fx - 0.65, fy + 1.2, fz - 0.5],
        [fx + 0.65, fy + 6.4, fz + 0.5],
        "primary",
        { group: "Funnel" }
      );
      b.box(
        `funnel_edge_${side}_${p}`,
        [fx - 0.9, fy + 1.6, fz - 0.25],
        [fx + 0.9, fy + 7.8, fz + 0.25],
        "glow",
        { group: "Funnel" }
      );
    });
  }

  // 3. Level 2 GENESIS: Astral Energy Wings + Overhead Crown Starburst
  if (lb >= 2) {
    const guardY = 2 + cfg.handleLength + 3;
    b.mirror((side) => {
      for (let w = 0; w < 5; w++) {
        const wx = b.centerX + side * (5 + w * 2.8);
        const wy = guardY + 2 + w * 2.4;
        const wz = b.centerZ - 2.2;
        b.box(
          `genesis_wing_${side}_${w}`,
          [wx - 1.1, wy - 3.5 - w * 0.9, wz - 0.4],
          [wx + 1.1, wy + 2.5, wz + 0.4],
          w % 2 === 0 ? "glow" : "gem",
          { group: "Astral", tint: 14 }
        );
      }
    });

    // Overhead Genesis Starburst above the weapon apex
    const starY = 6 + cfg.handleLength + cfg.bladeLength + 7;
    b.box(
      "genesis_star_v",
      [b.centerX - 0.7, starY - 4, b.centerZ - 0.7],
      [b.centerX + 0.7, starY + 4, b.centerZ + 0.7],
      "glow",
      { group: "Halo" }
    );
    b.box(
      "genesis_star_h",
      [b.centerX - 4, starY - 0.7, b.centerZ - 0.7],
      [b.centerX + 4, starY + 0.7, b.centerZ + 0.7],
      "gem",
      { group: "Halo" }
    );
  }
}

/**
 * Builds Temporary Tactical Mode (`overdrive`, `soul_devour`, `absolute_zero`,
 * `thunder_clad`, `divine_aegis`) 3D effects in the `ModeVFX` bone group.
 */
export function buildTacticalMode(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const mode = cfg.tacticalMode ?? "normal";
  if (mode === "normal") return;

  const guardY = 2 + cfg.handleLength + 2;
  const topY = guardY + cfg.bladeLength;

  if (mode === "overdrive") {
    // Diagonal plasma exhaust jets erupting from the guard & core
    b.mirror((side) => {
      for (let j = 1; j <= 4; j++) {
        const x = b.centerX + side * (2.5 + j * 1.9);
        const y = guardY - j * 1.1;
        b.box(
          `overdrive_jet_${side}_${j}`,
          [x - 0.85, y - 0.85, b.centerZ - 0.85],
          [x + 0.85, y + 0.85, b.centerZ + 0.85],
          j % 2 === 0 ? "glow" : "gem",
          { group: "ModeVFX", emissive: true }
        );
      }
    });
    // Core reactor flare ring
    b.ring("overdrive_flare", guardY + 1.5, 5.5, 1.1, "glow", {
      group: "ModeVFX",
      segments: 12,
      height: 1.2,
      emissive: true,
    });
    return;
  }

  if (mode === "soul_devour") {
    // Spiraling soul siphon tendrils & orbiting cursed skulls
    const steps = 14;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const a = t * Math.PI * 4;
      const rad = 4.2 + Math.sin(t * Math.PI) * 2.5;
      const x = b.centerX + Math.cos(a) * rad;
      const z = b.centerZ + Math.sin(a) * rad;
      const y = guardY + t * cfg.bladeLength;
      b.box(
        `soul_tendril_${i}`,
        [x - 0.75, y - 0.75, z - 0.75],
        [x + 0.75, y + 0.75, z + 0.75],
        i % 3 === 0 ? "gem" : "accent",
        { group: "ModeVFX", emissive: true }
      );
    }
    return;
  }

  if (mode === "absolute_zero") {
    // Jagged glacial crystal formations erupting along the weapon + ground frost ring
    b.mirror((side) => {
      for (let i = 0; i < 4; i++) {
        const y = guardY + 2 + i * (cfg.bladeLength * 0.24);
        const x = b.centerX + side * (cfg.bladeWidth * 0.6 + 1.4 + (i % 2) * 0.8);
        b.spike(
          `zero_ice_${side}_${i}`,
          x,
          y,
          b.centerZ,
          2.4,
          5.2,
          i % 2 === 0 ? "gem" : "glow",
          { group: "ModeVFX", layers: 4, emissive: true }
        );
      }
    });
    b.ring("zero_frost_circle", 1, 9.5, 1.2, "glow", {
      group: "ModeVFX",
      segments: 12,
      height: 0.6,
      emissive: true,
    });
    return;
  }

  if (mode === "thunder_clad") {
    // Zig-zagging lightning bolts bridging from hilt to tip
    b.mirror((side) => {
      let lx = b.centerX + side * 2;
      let lz = b.centerZ;
      for (let i = 0; i < 8; i++) {
        const ly = 3 + i * ((topY - 2) / 8);
        const nx = b.centerX + side * (2.5 + ((i * 3) % 4) * 1.2);
        const nz = b.centerZ + ((i % 2 === 0 ? 1 : -1) * 1.6);
        b.box(
          `thunder_arc_${side}_${i}`,
          [Math.min(lx, nx) - 0.45, ly, Math.min(lz, nz) - 0.45],
          [Math.max(lx, nx) + 0.45, ly + 2.8, Math.max(lz, nz) + 0.45],
          "glow",
          { group: "ModeVFX", emissive: true }
        );
        lx = nx;
        lz = nz;
      }
    });
    return;
  }

  if (mode === "divine_aegis") {
    // 6 Floating hexagonal sacred shield plates around the weapon
    const count = 6;
    const rad = Math.max(8, cfg.crossguardWidth * 0.7 + 3);
    const shieldY = guardY + cfg.bladeLength * 0.35;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const sx = b.centerX + Math.cos(a) * rad;
      const sz = b.centerZ + Math.sin(a) * rad;
      b.box(
        `aegis_plate_${i}`,
        [sx - 1.6, shieldY - 3.2, sz - 0.45],
        [sx + 1.6, shieldY + 3.2, sz + 0.45],
        "glow",
        { group: "ModeVFX", emissive: true }
      );
      b.box(
        `aegis_frame_${i}`,
        [sx - 2, shieldY - 0.6, sz - 0.6],
        [sx + 2, shieldY + 0.6, sz + 0.6],
        "accent",
        { group: "ModeVFX", emissive: true }
      );
    }
    return;
  }

  if (mode === "overclock") {
    // Radiator fins thrown wide open + rising exhaust plumes + spinning flywheels
    b.mirror((side) => {
      for (let f = 0; f < 4; f++) {
        const fy = guardY + 1 + f * 2.6;
        b.box(
          `oc_fin_${side}_${f}`,
          [b.centerX + side * 2.2, fy, b.centerZ - 2.6],
          [b.centerX + side * (5.6 + f * 0.5), fy + 1.1, b.centerZ + 2.6],
          f % 2 === 0 ? "accent" : "glow",
          { group: "ModeVFX", emissive: true }
        );
      }
      // exhaust plume rising from the vents
      for (let p = 0; p < 4; p++) {
        const s = 1.5 - p * 0.22;
        b.box(
          `oc_plume_${side}_${p}`,
          [b.centerX + side * 5 - s, guardY + 10 + p * 2.4, b.centerZ - s],
          [b.centerX + side * 5 + s, guardY + 11.6 + p * 2.4, b.centerZ + s],
          p % 2 === 0 ? "glow" : "gem",
          { group: "ModeVFX", emissive: true }
        );
      }
    });
    // glowing flywheel at the core
    b.ring("oc_flywheel", guardY + 2, 4.6, 1, "gem", {
      group: "ModeVFX",
      segments: 12,
      height: 1.3,
      emissive: true,
    });
    return;
  }

  if (mode === "hemorrhage") {
    // Pooling blood ring on the floor + dripping columns + fleshy barbs
    b.ring("hem_pool", 0.6, 10.5, 2.2, "gem", {
      group: "ModeVFX",
      segments: 16,
      height: 0.5,
      emissive: true,
    });
    b.ring("hem_pool_inner", 0.9, 6.4, 1.6, "accent", {
      group: "ModeVFX",
      segments: 12,
      height: 0.4,
      emissive: true,
    });
    // dripping columns falling from the blade
    b.mirror((side) => {
      for (let d = 0; d < 4; d++) {
        const dx = b.centerX + side * (2.4 + d * 1.5);
        const dy = guardY + 2 + d * (cfg.bladeLength * 0.18);
        const len = 3 + (d % 2) * 2.5;
        b.box(
          `hem_drip_${side}_${d}`,
          [dx - 0.52, dy - len, b.centerZ - 0.52],
          [dx + 0.52, dy, b.centerZ + 0.52],
          "gem",
          { group: "ModeVFX", emissive: true }
        );
        b.box(
          `hem_bead_${side}_${d}`,
          [dx - 0.85, dy - len - 1.3, b.centerZ - 0.85],
          [dx + 0.85, dy - len, b.centerZ + 0.85],
          "accent",
          { group: "ModeVFX", emissive: true }
        );
      }
      // fleshy barbs erupting from the blade spine
      for (let s = 0; s < 3; s++) {
        b.spike(
          `hem_barb_${side}_${s}`,
          b.centerX + side * (cfg.bladeWidth * 0.55 + 1),
          guardY + 4 + s * (cfg.bladeLength * 0.26),
          b.centerZ,
          2,
          3.8,
          "gem",
          { group: "ModeVFX", layers: 3, emissive: true }
        );
      }
    });
  }
}

/**
 * Adjusts the palette when Limit Break or a Tactical Mode is active so the
 * visual transformation is immediately felt in the materials as well.
 */
export function resolveModePalette<T extends { gem: string; glow: string; accent: string }>(
  palette: T,
  cfg: GeneratorConfig
): T {
  const out = { ...palette };
  if (cfg.limitBreak === 2) {
    out.glow = shadeColor(out.glow, 22);
    out.gem = shadeColor(out.gem, 14);
  }
  if (cfg.tacticalMode === "overdrive") {
    out.glow = "#ffe46b";
  } else if (cfg.tacticalMode === "absolute_zero") {
    out.glow = "#e8fdff";
  } else if (cfg.tacticalMode === "thunder_clad") {
    out.glow = "#fff380";
  } else if (cfg.tacticalMode === "overclock") {
    out.glow = "#ffd66b";
    out.gem = shadeColor(out.gem, 10);
  } else if (cfg.tacticalMode === "hemorrhage") {
    out.glow = "#ff6b84";
    out.gem = "#d61f3a";
  }
  return out;
}
