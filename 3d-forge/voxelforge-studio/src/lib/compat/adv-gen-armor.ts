import { GenCtx, buildChains } from "./adv-gen-weapons";

const CROWN = "Shell" as const;
const CORE = "Core" as const;

function buildCrown(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const rad = Math.max(5, cfg.crossguardWidth * 0.55);
  const baseY = 5;

  // circlet band
  b.ring("circlet", baseY, rad, 2.6, "primary", {
    group: CROWN,
    segments: Math.max(14, Math.round(rad * 3)),
    height: 3,
  });
  b.ring("circlet_trim", baseY + 3, rad, 1.6, "secondary", {
    group: CROWN,
    segments: Math.max(12, Math.round(rad * 2.6)),
    height: 1.4,
  });
  b.ring("circlet_inlay", baseY + 0.6, rad + 1, 1, "accent", {
    group: CROWN,
    segments: Math.max(12, Math.round(rad * 2.4)),
    height: 1,
  });

  // spikes, crest and inset stones around the band
  const spikes = Math.max(6, Math.round(rad * 2));
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2;
    const x = b.centerX + Math.cos(a) * rad;
    const z = b.centerZ + Math.sin(a) * rad;
    const tall = i % 2 === 0 ? 6.5 : 4;
    b.spike(`crown_spike_${i}`, x, baseY + 3.5, z, 2.4, tall, i % 2 === 0 ? "accent" : "bone", {
      group: CROWN,
      layers: 4,
    });
    if (cfg.hasCoreGem && i % 3 === 0) {
      b.box(
        `crown_stone_${i}`,
        [x - 1.2, baseY + 0.6, z - 1.2],
        [x + 1.2, baseY + 3, z + 1.2],
        "gem",
        { group: CORE }
      );
    }
  }

  // front crest plume
  b.spike("crest", b.centerX, baseY + 3, b.centerZ + rad, 5, 9, cfg.hasSpikesOrWings ? "gem" : "accent", {
    group: CROWN,
    layers: 6,
  });
  if (cfg.hasSpikesOrWings) {
    b.mirror((side) => {
      for (let f = 0; f < 3; f++) {
        b.box(
          `helm_wing_${side}_${f}`,
          [
            b.centerX + side * (rad + 0.6 + f * 1.6),
            baseY + 3.5 + f * 1.4,
            b.centerZ - 1.2 + f * 0.3,
          ],
          [
            b.centerX + side * (rad + 2.4 + f * 2.2),
            baseY + 5.4 + f * 1.8,
            b.centerZ + 1.2 - f * 0.3,
          ],
          f === 2 ? "accent" : "bone",
          { group: CROWN, tint: -f * 6 }
        );
      }
    });
  }

  // visor brow across the front
  b.box(
    "brow",
    [b.centerX - rad * 0.7, baseY + 3.2, b.centerZ + rad - 1.4],
    [b.centerX + rad * 0.7, baseY + 5.4, b.centerZ + rad + 1.4],
    "secondary",
    { group: CROWN }
  );
  if (cfg.hasRunicEngravings) {
    b.box(
      "brow_sigil",
      [b.centerX - 1.4, baseY + 3.6, b.centerZ + rad + 1.4],
      [b.centerX + 1.4, baseY + 5, b.centerZ + rad + 2],
      "gem",
      { group: CROWN }
    );
  }

  // floating halo above the crown
  const haloY = baseY + 13 + cfg.floatingHeightOffset * 0.4;
  b.ring("halo", haloY, rad * 1.25, 1.2, "glow", {
    group: "Floating",
    segments: 18,
    height: 1.1,
  });
  b.ring("halo_spokes", haloY + 0.3, rad * 1.25 - 1.4, 1, "gem", {
    group: "Floating",
    segments: 6,
    height: 0.7,
  });
}

function buildWings(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  const reach = Math.max(16, cfg.bladeLength + 6);
  const boneY = 9;

  // spine plate on the back
  b.cxBox("wing_backplate", boneY - 4, 7, 12, 4, "primary", { group: CROWN });
  if (cfg.hasCoreGem) {
    b.cxBox(
      "wing_core",
      boneY - 1,
      cfg.coreGemSize,
      cfg.coreGemSize,
      4.6,
      "gem",
      { group: CORE }
    );
  }
  b.ring("wing_ring", boneY - 2, 6.5, 1.4, "accent", {
    group: CROWN,
    segments: 14,
    height: 1.6,
  });

  const segs = Math.max(6, Math.round(reach / 3.4));
  b.mirror((side) => {
    for (let i = 0; i < segs; i++) {
      const t = i / (segs - 1);
      const x = b.centerX + side * (4 + t * reach * 0.8);
      const y = boneY + Math.sin(t * Math.PI * 0.78) * 9 + t * 5;
      const w = 3.4 * (1 - t * 0.5);

      // bone segment
      b.box(
        `wing_bone_${side}_${i}`,
        [x - w / 2, y - 1.2, b.centerZ - 1.2],
        [x + w / 2, y + 1.2, b.centerZ + 1.2],
        "bone",
        { group: CROWN, tint: -i * 3 }
      );
      b.spike(
        `wing_joint_${side}_${i}`,
        x,
        y + 1,
        b.centerZ,
        w,
        i === segs - 1 ? 5 : 2.4,
        "accent",
        { group: CROWN, layers: 3 }
      );

      // hanging membrane / feathers
      const feathers = cfg.hasSpikesOrWings ? 4 : 3;
      for (let f = 1; f <= feathers; f++) {
        const drop = f * 4.2;
        b.box(
          `wing_feather_${side}_${i}_${f}`,
          [x - w * 0.6, y - drop, b.centerZ - 0.6 + f * 0.12],
          [x + side * w * 0.9, y - drop + 3.6, b.centerZ + 0.6 - f * 0.12],
          f === 1 ? "secondary" : f === feathers ? "glow" : "primary",
          { group: CROWN, tint: -f * 8 }
        );
      }

      if (cfg.hasRunicEngravings && i % 3 === 1) {
        b.box(
          `wing_rune_${side}_${i}`,
          [x - 1, y - 1, b.centerZ - 1.7],
          [x + 1, y + 1, b.centerZ + 1.7],
          "gem",
          { group: CROWN }
        );
      }
    }
  });

  buildChains(ctx, boneY - 4);
}

export const ARMOR_BUILDERS: Record<string, (ctx: GenCtx) => void> = {
  armor_helmet: buildCrown,
  armor_wings: buildWings,
};
