import { GenCtx } from "./adv-gen-weapons";

const SHELL = "Shell" as const;
const CORE = "Core" as const;

function buildCrystal(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const baseY = 4;
  const layers = 14;
  const maxR = Math.max(4, cfg.bladeWidth * 0.9 + 3);

  // faceted monolith body — widest in the middle
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const r = Math.max(1.2, Math.sin(Math.PI * Math.pow(t, 0.92)) * maxR + 1);
    b.cxBox(`crystal_${i}`, baseY + i * 2, r * 1.5, 2, r * 1.5, i % 2 ? "gem" : "glow", {
      group: CORE,
      tint: i % 3 === 0 ? 6 : -4,
    });
  }
  const topY = baseY + layers * 2;

  // secondary shards jutting from the body
  b.mirror((side) => {
    b.spike(
      `crystal_shard_${side}`,
      b.centerX + side * (maxR * 0.7),
      baseY + 8,
      b.centerZ + side * 1.5,
      3,
      8,
      "glow",
      { group: CORE, layers: 5 }
    );
  });

  // four rune pillars around it
  for (let p = 0; p < 4; p++) {
    const a = (p / 4) * Math.PI * 2 + Math.PI / 4;
    const px = b.centerX + Math.cos(a) * (maxR + 6);
    const pz = b.centerZ + Math.sin(a) * (maxR + 6);
    const h = 7 + (p % 2) * 3;
    for (let s = 0; s < h; s++) {
      b.box(
        `pillar_${p}_${s}`,
        [px - 1.2, baseY + s * 3, pz - 1.2],
        [px + 1.2, baseY + s * 3 + 2.6, pz + 1.2],
        s % 4 === 2 ? "accent" : "primary",
        { group: SHELL, tint: -s * 2 }
      );
    }
    b.spike(`pillar_cap_${p}`, px, baseY + h * 3, pz, 2.6, 3.4, "bone", {
      group: SHELL,
      layers: 3,
    });
    if (cfg.hasRunicEngravings) {
      b.box(
        `pillar_rune_${p}`,
        [px - 1.6, baseY + 7, pz - 1.6],
        [px + 1.6, baseY + 9.5, pz + 1.6],
        "gem",
        { group: SHELL }
      );
    }
  }

  // floating capstone
  b.cxBox("capstone", topY + 3, maxR * 1.1, 2.4, maxR * 1.1, "secondary", { group: "Floating" });
  b.spike("capstone_tip", b.centerX, topY + 5.4, b.centerZ, maxR * 0.8, 5, "gem", {
    group: "Floating",
    layers: 4,
  });
  b.ring("orbit_band", topY - 4, maxR + 4, 1.2, "accent", {
    group: "Floating",
    segments: 20,
    height: 1,
  });
}

function buildGrimoire(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const y = 8;
  const depth = Math.max(9, cfg.bladeLength * 0.75);
  const wingW = Math.max(8, cfg.crossguardWidth);

  // spine
  b.box(
    "book_spine",
    [b.centerX - 1.4, y - 0.6, b.centerZ - depth / 2],
    [b.centerX + 1.4, y + 1.4, b.centerZ + depth / 2],
    "primary",
    { group: SHELL }
  );

  // page blocks angling upward from the spine
  const steps = 5;
  for (let i = 0; i < steps; i++) {
    const dx = 1.4 + i * (wingW / steps);
    const lift = i * 1.15;
    b.mirror((side) => {
      b.box(
        `page_${side}_${i}`,
        [
          side === -1 ? b.centerX - dx - wingW / steps : b.centerX + dx,
          y + lift,
          b.centerZ - depth / 2 + 0.6,
        ],
        [
          side === -1 ? b.centerX - dx : b.centerX + dx + wingW / steps,
          y + lift + 1.3,
          b.centerZ + depth / 2 - 0.6,
        ],
        i === steps - 1 ? "bone" : "cloth",
        { group: SHELL, tint: i === steps - 1 ? -10 : 18 }
      );
      // page edge lines
      b.box(
        `page_edge_${side}_${i}`,
        [
          side === -1 ? b.centerX - dx - wingW / steps : b.centerX + dx,
          y + lift + 1.3,
          b.centerZ - depth / 2 + 1.4,
        ],
        [
          side === -1 ? b.centerX - dx : b.centerX + dx + wingW / steps,
          y + lift + 1.7,
          b.centerZ + depth / 2 - 1.4,
        ],
        "bone",
        { group: SHELL, tint: -4 }
      );
    });
  }

  // clasps and corners
  b.mirror((side) => {
    b.box(
      `clasp_${side}`,
      [b.centerX + side * (wingW + 1.4) - 1.2, y + 4.4, b.centerZ - depth / 2 + 1],
      [b.centerX + side * (wingW + 1.4) + 1.2, y + 6.4, b.centerZ + depth / 2 - 1],
      "accent",
      { group: SHELL }
    );
    b.spike(
      `corner_${side}`,
      b.centerX + side * (wingW + 0.6),
      y + 4.6,
      b.centerZ - depth / 2 + 0.5,
      3,
      5,
      "bone",
      { group: SHELL, layers: 4 }
    );
  });

  // clasp gem
  if (cfg.hasCoreGem) {
    const g = Math.max(2.5, cfg.coreGemSize * 0.8);
    b.cxBox("book_clasp_gem", y + 4.2, g, g, depth + 2.4, "gem", { group: CORE });
    b.ring("book_ring", y + 4.6, g + 1.6, 1, "accent", {
      group: CORE,
      segments: 12,
      height: 1,
    });
  }

  // levitating sigil above the open pages
  const sigilY = y + 12;
  b.ring("sigil_ring", sigilY, wingW * 0.55, 1.1, "glow", {
    group: "Floating",
    segments: 16,
    height: 1,
  });
  b.ring("sigil_ring2", sigilY + 2.6, wingW * 0.34, 1, "gem", {
    group: "Floating",
    segments: 12,
    height: 0.9,
  });
  b.cxBox("sigil_core", sigilY + 1.2, 2.4, 2.4, 2.4, "gem", { group: "Floating" });
  b.spike("sigil_ray", b.centerX, sigilY + 3.8, b.centerZ, 2, 4, "glow", {
    group: "Floating",
    layers: 3,
  });
}

function buildTotem(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const h = Math.max(12, cfg.handleLength + 6);
  const w = Math.max(6, cfg.bladeWidth + 4);
  const baseY = 2;

  // stacked ido blocks
  const rows = Math.max(4, Math.round(h / 3));
  for (let r = 0; r < rows; r++) {
    const t = r / (rows - 1);
    const shrink = 1 - Math.abs(t - 0.45) * 0.5;
    b.cxBox(
      `totem_${r}`,
      baseY + r * (h / rows),
      w * shrink,
      h / rows,
      w * shrink,
      r % 2 ? "primary" : "secondary",
      { group: SHELL, tint: r % 2 ? -6 : 4 }
    );
    // carved bands
    b.cxBox(
      `totem_band_${r}`,
      baseY + r * (h / rows) + 0.5,
      w * shrink + 1.2,
      1,
      w * shrink + 1.2,
      r % 3 === 0 ? "accent" : "bone",
      { group: SHELL }
    );
  }

  // glowing eyes
  const eyeY = baseY + h * 0.62;
  b.mirror((side) => {
    b.box(
      `totem_eye_${side}`,
      [
        b.centerX + side * (w * 0.22) - 1,
        eyeY,
        b.centerZ + w / 2 - 0.2,
      ],
      [b.centerX + side * (w * 0.22) + 1, eyeY + 2, b.centerZ + w / 2 + 1.4],
      "gem",
      { group: CORE }
    );
  });

  if (cfg.hasCoreGem) {
    b.cxBox(
      "totem_heart",
      eyeY - 6,
      cfg.coreGemSize,
      cfg.coreGemSize,
      cfg.coreGemSize,
      "gem",
      { group: CORE }
    );
  }

  // carved studs + fangs on every tier
  for (let r = 1; r < rows; r += 2) {
    const y = baseY + r * (h / rows) + 0.6;
    b.mirror((side) => {
      b.box(
        `totem_stud_${r}_${side}`,
        [b.centerX + side * (w * 0.34) - 1, y, b.centerZ + w / 2 - 0.4],
        [b.centerX + side * (w * 0.34) + 1, y + 1.8, b.centerZ + w / 2 + 1.2],
        r % 4 === 1 ? "gem" : "accent",
        { group: SHELL }
      );
      b.spike(
        `totem_fang_${r}_${side}`,
        b.centerX + side * (w * 0.42),
        y - 2.2,
        b.centerZ + w * 0.3,
        2,
        3.4,
        "bone",
        { group: SHELL, layers: 3 }
      );
    });
  }

  // hanging ribbons from the mid tier
  if (cfg.hasChainsOrRibbons) {
    b.mirror((side) => {
      const pts: [number, number, number][] = [];
      for (let i = 0; i < 5; i++) {
        pts.push([
          b.centerX + side * (w * 0.5) + Math.sin(i * 0.8) * 0.7,
          baseY + h * 0.45 - i * 1.6,
          b.centerZ + Math.cos(i * 0.7) * 0.6,
        ]);
      }
      b.strand(`totem_ribbon_${side}`, pts, 1.1, side === 1 ? "accent" : "cloth", {
        group: "Ornament",
        emissive: false,
      });
    });
  }

  // crown of horns
  b.mirror((side) => {
    b.spike(
      `totem_horn_${side}`,
      b.centerX + side * w * 0.3,
      baseY + h,
      b.centerZ,
      3,
      7,
      "bone",
      { group: SHELL, layers: 5 }
    );
  });
  b.spike("totem_crown", b.centerX, baseY + h, b.centerZ, w * 0.6, 6, "accent", {
    group: SHELL,
    layers: 4,
  });
}

export const RELIC_BUILDERS: Record<string, (ctx: GenCtx) => void> = {
  relic_crystal: buildCrystal,
  relic_grimoire: buildGrimoire,
  totem: buildTotem,
};
