import { GenCtx } from "./weapons";

/**
 * Modular part library — bolt-on attachments that can be layered onto ANY
 * category: gearworks, pistons, cables, heat vents, thorn crowns, skull
 * motifs, banners, prism arrays and blood tanks.
 */
export function buildPartLibrary(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const cx = b.centerX;
  const cz = b.centerZ;

  // Anchor heights derived from the weapon proportions
  const gripTop = 2 + cfg.handleLength;
  const midY = gripTop + cfg.bladeLength * 0.4;
  const spanX = Math.max(5, cfg.crossguardWidth * 0.5);

  /* ---------------- MACHINE: exposed gearworks ---------------- */
  if (cfg.hasGearworks) {
    const gearSpecs: [number, number, number][] = [
      [cx - spanX * 0.85, gripTop + 1.5, 3.1],
      [cx + spanX * 0.85, gripTop + 4.5, 2.3],
      [cx - spanX * 0.5, gripTop + 7.5, 1.7],
    ];
    gearSpecs.forEach(([gx, gy, r], gi) => {
      // toothed rim
      const teeth = Math.max(8, Math.round(r * 4));
      for (let t = 0; t < teeth; t++) {
        const a = (t / teeth) * Math.PI * 2;
        b.box(
          `gear_${gi}_tooth_${t}`,
          [cx + (gx - cx) + Math.cos(a) * r - 0.42, gy + Math.sin(a) * r - 0.42, cz - 1.5],
          [cx + (gx - cx) + Math.cos(a) * r + 0.42, gy + Math.sin(a) * r + 0.42, cz + 1.5],
          t % 2 === 0 ? "secondary" : "accent",
          { group: "Gear", tint: 6 }
        );
      }
      // hub + spokes
      b.box(
        `gear_${gi}_hub`,
        [gx - 0.8, gy - 0.8, cz - 1.7],
        [gx + 0.8, gy + 0.8, cz + 1.7],
        "primary",
        { group: "Gear", tint: -12 }
      );
      for (let s = 0; s < 4; s++) {
        const a = (s / 4) * Math.PI * 2 + 0.4;
        b.box(
          `gear_${gi}_spoke_${s}`,
          [gx + Math.cos(a) * r * 0.5 - 0.3, gy + Math.sin(a) * r * 0.5 - 0.3, cz - 1.1],
          [gx + Math.cos(a) * r * 0.5 + 0.3, gy + Math.sin(a) * r * 0.5 + 0.3, cz + 1.1],
          "bone",
          { group: "Gear", tint: -18 }
        );
      }
    });
  }

  /* ---------------- MACHINE: hydraulic pistons ---------------- */
  if (cfg.hasPistons) {
    b.mirror((side) => {
      for (let p = 0; p < 2; p++) {
        const px = cx + side * (spanX * 0.6 + p * 1.9);
        const py = gripTop - 1 + p * 5;
        // cylinder
        b.box(
          `piston_cyl_${side}_${p}`,
          [px - 1.05, py, cz - 1.05],
          [px + 1.05, py + 5.4, cz + 1.05],
          "primary",
          { group: "Piston", tint: -6 }
        );
        // polished rod
        b.box(
          `piston_rod_${side}_${p}`,
          [px - 0.42, py + 5.4, cz - 0.42],
          [px + 0.42, py + 9.2, cz + 0.42],
          "bone",
          { group: "Piston", tint: 16 }
        );
        // rod cap + glowing pressure ring
        b.box(
          `piston_cap_${side}_${p}`,
          [px - 1.2, py + 9.2, cz - 1.2],
          [px + 1.2, py + 10.4, cz + 1.2],
          "accent",
          { group: "Piston" }
        );
        b.box(
          `piston_seal_${side}_${p}`,
          [px - 1.25, py + 4.8, cz - 1.25],
          [px + 1.25, py + 5.5, cz + 1.25],
          "gem",
          { group: "Piston" }
        );
      }
    });
  }

  /* ---------------- MACHINE: power cables ---------------- */
  if (cfg.hasCables) {
    b.mirror((side) => {
      const pts: [number, number, number][] = [];
      const steps = 9;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // sagging catenary from the grip up to the head
        const sag = Math.sin(t * Math.PI) * 2.6;
        pts.push([
          cx + side * (spanX * 0.55 + Math.sin(t * 3) * 0.8),
          gripTop - 1 + t * (cfg.bladeLength * 0.75) - sag,
          cz - 2.4 - Math.sin(t * Math.PI) * 1.4,
        ]);
      }
      b.strand(`cable_${side}`, pts, 0.78, side === 1 ? "cloth" : "primary", {
        group: "Piston",
        emissive: false,
        tint: -16,
      });
      // glowing conduit nodes along the cable
      [2, 5, 8].forEach((i) => {
        const [px, py, pz] = pts[i];
        b.box(
          `cable_node_${side}_${i}`,
          [px - 0.65, py - 0.65, pz - 0.65],
          [px + 0.65, py + 0.65, pz + 0.65],
          "gem",
          { group: "Piston" }
        );
      });
    });
  }

  /* ---------------- MACHINE: heat vents / radiator fins ---------------- */
  if (cfg.hasVents) {
    b.mirror((side) => {
      for (let v = 0; v < 5; v++) {
        const vy = gripTop + 1 + v * 2.1;
        b.box(
          `vent_fin_${side}_${v}`,
          [cx + side * (spanX * 0.35), vy, cz - 2.2],
          [cx + side * (spanX * 0.35 + 2.6), vy + 1.2, cz + 2.2],
          v % 2 === 0 ? "secondary" : "primary",
          { group: "Shell", tint: v % 2 === 0 ? 12 : -8 }
        );
        // glowing slot between fins
        b.box(
          `vent_slot_${side}_${v}`,
          [cx + side * (spanX * 0.35 + 0.4), vy + 1.2, cz - 1.4],
          [cx + side * (spanX * 0.35 + 2.2), vy + 1.9, cz + 1.4],
          "glow",
          { group: "ModeVFX" }
        );
      }
    });
  }

  /* ---------------- MACHINE: mounted optic (universal) ---------------- */
  // guns / railguns / crossbows build their own integrated scope, so this
  // only fires for every OTHER category — a rail-mounted sight bolted on.
  const SELF_SCOPED = new Set(["gun", "railgun", "crossbow"]);
  if (cfg.hasScope && !SELF_SCOPED.has(cfg.category)) {
    const sy = gripTop + 1.5;
    // picatinny rail bed
    b.box(
      "optic_rail",
      [cx - 1.3, sy, cz + 1.4],
      [cx + 1.3, sy + 0.8, cz + 5.6],
      "primary",
      { group: "Breech", tint: -20 }
    );
    for (let n = 0; n < 5; n++) {
      b.box(
        `optic_rail_notch_${n}`,
        [cx - 1.4, sy + 0.8, cz + 1.8 + n * 0.8],
        [cx + 1.4, sy + 1.1, cz + 2.1 + n * 0.8],
        "secondary",
        { group: "Breech", tint: -10 }
      );
    }
    // scope tube on two rings
    b.box(
      "optic_tube",
      [cx - 1.35, sy + 1.1, cz + 1.2],
      [cx + 1.35, sy + 3.8, cz + 6.4],
      "primary",
      { group: "Breech", tint: -6 }
    );
    [2, 5].forEach((rz, i) => {
      b.box(
        `optic_ring_${i}`,
        [cx - 1.6, sy + 1.1, cz + rz],
        [cx + 1.6, sy + 4.1, cz + rz + 0.7],
        "secondary",
        { group: "Breech", tint: -16 }
      );
    });
    // objective lens + glowing reticle
    b.box(
      "optic_lens",
      [cx - 1.1, sy + 1.5, cz + 6.4],
      [cx + 1.1, sy + 3.5, cz + 7],
      "gem",
      { group: "Core" }
    );
    b.box(
      "optic_reticle",
      [cx - 0.22, sy + 1.6, cz + 7],
      [cx + 0.22, sy + 3.4, cz + 7.2],
      "glow",
      { group: "Core" }
    );
    // windage turret
    b.box(
      "optic_turret",
      [cx - 0.8, sy + 3.8, cz + 3],
      [cx + 0.8, sy + 5.2, cz + 4.4],
      "accent",
      { group: "Breech" }
    );
  }

  /* ---------------- CURSED: thorn crown / briar wrap ---------------- */
  if (cfg.hasThornCrown) {
    const turns = 3;
    const perTurn = 10;
    for (let i = 0; i < turns * perTurn; i++) {
      const t = i / (turns * perTurn);
      const a = t * Math.PI * 2 * turns;
      const r = 2.8 + Math.sin(t * Math.PI) * 1.4;
      const vx = cx + Math.cos(a) * r;
      const vz = cz + Math.sin(a) * r;
      const vy = gripTop - 2 + t * (cfg.bladeLength * 0.65);
      b.box(
        `briar_${i}`,
        [vx - 0.52, vy - 0.52, vz - 0.52],
        [vx + 0.52, vy + 0.52, vz + 0.52],
        i % 4 === 0 ? "accent" : "wood",
        { group: "Ornament", tint: -14 }
      );
      // thorn barb every third link
      if (i % 3 === 0) {
        b.spike(
          `briar_thorn_${i}`,
          vx + Math.cos(a) * 0.8,
          vy,
          vz + Math.sin(a) * 0.8,
          1,
          1.9,
          "bone",
          { group: "Ornament", layers: 2 }
        );
      }
    }
  }

  /* ---------------- CURSED: skull motif ---------------- */
  if (cfg.hasSkullMotif) {
    const skullY = gripTop + 0.5;
    // cranium
    b.cxBox("skull_cranium", skullY, 4.2, 3.4, 3.6, "bone", { group: "Ornament", tint: -4 });
    // brow ridge
    b.cxBox("skull_brow", skullY + 2.4, 4.6, 1, 3.9, "bone", { group: "Ornament", tint: -16 });
    // jaw
    b.cxBox("skull_jaw", skullY - 1.5, 3.2, 1.6, 2.8, "bone", { group: "Ornament", tint: -20 });
    // teeth
    for (let t = 0; t < 4; t++) {
      b.box(
        `skull_tooth_${t}`,
        [cx - 1.4 + t * 0.8, skullY - 1.6, cz + 1.3],
        [cx - 0.9 + t * 0.8, skullY - 0.5, cz + 1.9],
        "bone",
        { group: "Ornament", tint: 18 }
      );
    }
    // glowing eye sockets
    b.mirror((side) => {
      b.box(
        `skull_eye_${side}`,
        [cx + side * 1.05 - 0.6, skullY + 0.9, cz + 1.5],
        [cx + side * 1.05 + 0.6, skullY + 2.1, cz + 2.1],
        "gem",
        { group: "Core" }
      );
      // horn curling back from the temple
      b.spike(
        `skull_horn_${side}`,
        cx + side * 2.3,
        skullY + 2.6,
        cz - 0.4,
        1.7,
        4.4,
        "bone",
        { group: "Ornament", layers: 4 }
      );
    });
  }

  /* ---------------- CURSED/BLOOD: blood tank & feed lines ---------------- */
  if (cfg.hasBloodTank) {
    const tankY = gripTop - 3;
    // reservoir cylinder behind the grip
    b.box(
      "blood_tank",
      [cx - 2.1, tankY, cz - 4.8],
      [cx + 2.1, tankY + 7.5, cz - 1.6],
      "primary",
      { group: "Shell", tint: -18 }
    );
    // viscous fluid window
    b.box(
      "blood_fluid",
      [cx - 1.4, tankY + 0.8, cz - 4.95],
      [cx + 1.4, tankY + 5.4, cz - 4.55],
      "gem",
      { group: "Core" }
    );
    // banding hoops
    [1, 4, 6.6].forEach((h, i) => {
      b.box(
        `blood_hoop_${i}`,
        [cx - 2.35, tankY + h, cz - 5.05],
        [cx + 2.35, tankY + h + 0.7, cz - 1.4],
        "accent",
        { group: "Shell", tint: -8 }
      );
    });
    // pulsing feed tubes running to the blade
    b.mirror((side) => {
      const pts: [number, number, number][] = [];
      for (let i = 0; i <= 7; i++) {
        const t = i / 7;
        pts.push([
          cx + side * (1.4 + Math.sin(t * 2.4) * 1.1),
          tankY + 6.5 + t * (cfg.bladeLength * 0.5),
          cz - 3.2 + t * 3.4,
        ]);
      }
      b.strand(`blood_tube_${side}`, pts, 0.72, "gem", { group: "Piston" });
    });
    // drip spout
    b.spike("blood_spout", cx, tankY - 2.4, cz - 3.2, 1.4, 2.6, "gem", {
      group: "Core",
      layers: 2,
    });
  }

  /* ---------------- ORNAMENT: prism array ---------------- */
  if (cfg.hasPrismArray && cfg.category !== "scepter") {
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * Math.PI * 2;
      const r = Math.max(4, spanX * 0.8);
      const px = cx + Math.cos(a) * r;
      const pz = cz + Math.sin(a) * r;
      b.box(
        `prism_${p}`,
        [px - 0.72, midY - 2, pz - 0.72],
        [px + 0.72, midY + 2, pz + 0.72],
        p % 2 ? "gem" : "glow",
        { group: "Floating" }
      );
      b.spike(`prism_cap_${p}`, px, midY + 2, pz, 1.2, 2.2, "accent", {
        group: "Floating",
        layers: 2,
      });
    }
    b.ring("prism_orbit", midY, Math.max(4, spanX * 0.8), 0.6, "glow", {
      group: "Halo",
      segments: 16,
      height: 0.6,
    });
  }

  /* ---------------- ORNAMENT: banner / war standard ---------------- */
  if (cfg.hasBanner) {
    const poleX = cx - spanX * 0.55 - 1.4;
    const topY = gripTop + cfg.bladeLength * 0.55;
    // cross-arm
    b.box(
      "banner_arm",
      [poleX - 0.5, topY, cz - 0.5],
      [cx - 0.5, topY + 1, cz + 0.5],
      "secondary",
      { group: "Banner", tint: -10 }
    );
    // cloth body with a ragged lower hem
    const rows = 7;
    for (let r = 0; r < rows; r++) {
      const ragged = r === rows - 1 ? 0.55 : 1;
      const wave = Math.sin(r * 0.8) * 0.9;
      b.box(
        `banner_cloth_${r}`,
        [poleX - 0.3 + wave, topY - 2 - r * 2, cz - 0.35],
        [poleX + 5.6 * ragged + wave, topY - 0.3 - r * 2, cz + 0.35],
        r % 2 === 0 ? "cloth" : "accent",
        { group: "Banner", tint: r % 2 === 0 ? 0 : -12 }
      );
      // gold trim stripe
      if (r === 0 || r === rows - 1) {
        b.box(
          `banner_trim_${r}`,
          [poleX - 0.35 + wave, topY - 2.3 - r * 2, cz - 0.45],
          [poleX + 5.7 * ragged + wave, topY - 1.8 - r * 2, cz + 0.45],
          "gem",
          { group: "Banner" }
        );
      }
    }
    // hanging tassels
    for (let t = 0; t < 3; t++) {
      const tx = poleX + 1.2 + t * 1.9;
      b.strand(
        `banner_tassel_${t}`,
        Array.from({ length: 4 }, (_, i) => [tx, topY - 15 - i * 1.3, cz] as [number, number, number]),
        0.55,
        i2(t) ? "gem" : "cloth",
        { group: "Banner", emissive: false }
      );
    }
  }
}

const i2 = (n: number) => n % 2 === 0;
