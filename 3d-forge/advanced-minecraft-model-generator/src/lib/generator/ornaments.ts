import { GenCtx } from "./weapons";
import { VoxelElement } from "../types";

/**
 * Attaches the orbiting debris ring and any category-agnostic decoration on
 * top of the base model.
 */
export function buildOrnaments(ctx: GenCtx): void {
  const { cfg, b } = ctx;
  if (cfg.floatingType === "none" || cfg.floatingCount <= 0) return;

  const count = cfg.floatingCount;
  const radius = cfg.floatingRadius;
  const centerY = 14 + cfg.floatingHeightOffset;

  if (cfg.floatingType === "magic_ring") {
    b.ring("magic_ring", centerY, radius, 1.6, "accent", {
      group: "Floating",
      segments: Math.max(18, Math.round(radius * 2.6)),
      height: 1.4,
    });
    b.ring("magic_ring_glow", centerY + 1.8, radius * 0.82, 1.2, "gem", {
      group: "Floating",
      segments: Math.max(14, Math.round(radius * 2)),
      height: 1,
    });
    b.ring("magic_ring_runes", centerY - 1.6, radius * 1.14, 1, "glow", {
      group: "Floating",
      segments: Math.max(8, count * 3),
      height: 1.6,
    });
    return;
  }

  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const x = b.centerX + Math.cos(a) * radius;
    const z = b.centerZ + Math.sin(a) * radius;
    const y = centerY + Math.sin(i * 1.9) * 3.2;

    switch (cfg.floatingType) {
      case "runes": {
        b.box(`rune_tablet_${i}`, [x - 1.4, y - 2, z - 0.6], [x + 1.4, y + 2, z + 0.6], "primary", {
          group: "Floating",
        });
        b.box(`rune_glyph_${i}`, [x - 0.8, y - 1, z - 0.75], [x + 0.8, y + 1, z + 0.75], "gem", {
          group: "Floating",
        });
        break;
      }
      case "crystals": {
        b.spike(`crystal_up_${i}`, x, y, z, 2.4, 3.4, "gem", { group: "Floating", layers: 3 });
        b.spike(`crystal_down_${i}`, x, y, z, 1.8, 3, "accent", { group: "Floating", layers: 3 });
        break;
      }
      case "orbs": {
        b.box(`orb_${i}`, [x - 1.7, y - 1.7, z - 1.7], [x + 1.7, y + 1.7, z + 1.7], "gem", {
          group: "Floating",
        });
        b.box(`orb_core_${i}`, [x - 0.8, y - 0.8, z - 0.8], [x + 0.8, y + 0.8, z + 0.8], "glow", {
          group: "Floating",
          tint: 8,
        });
        break;
      }
      case "skulls": {
        b.box(`skull_${i}`, [x - 1.8, y - 1.6, z - 1.8], [x + 1.8, y + 1.6, z + 1.8], "bone", {
          group: "Floating",
          tint: -6,
        });
        b.box(`skull_jaw_${i}`, [x - 1.2, y - 2.4, z - 1.4], [x + 1.2, y - 1.6, z + 1.4], "bone", {
          group: "Floating",
          tint: -14,
        });
        b.mirror((side) => {
          b.box(
            `skull_eye_${side}_${i}`,
            [x + side * 1.1 - 0.5, y - 0.2, z + 1.7],
            [x + side * 1.1 + 0.5, y + 0.8, z + 2],
            "glow",
            { group: "Floating" }
          );
        });
        break;
      }
      case "feathers": {
        for (let f = 0; f < 4; f++) {
          b.box(
            `feather_${i}_${f}`,
            [x - 1 + f * 0.2, y - f * 1.9, z - 0.5],
            [x + 1.6 + f * 0.3, y - f * 1.9 + 1.8, z + 0.5],
            f % 2 ? "glow" : "bone",
            { group: "Floating" }
          );
        }
        break;
      }
      case "stars": {
        b.box(`star_h_${i}`, [x - 2.4, y - 0.5, z - 0.5], [x + 2.4, y + 0.5, z + 0.5], "glow", {
          group: "Floating",
        });
        b.box(`star_v_${i}`, [x - 0.5, y - 2.4, z - 0.5], [x + 0.5, y + 2.4, z + 0.5], "gem", {
          group: "Floating",
        });
        b.box(`star_d_${i}`, [x - 1.2, y - 1.2, z - 0.3], [x + 1.2, y + 1.2, z + 0.3], "accent", {
          group: "Floating",
        });
        break;
      }
      /* ---------------- new: 浮遊歯車 ---------------- */
      case "gears": {
        const r = 1.9;
        const teeth = 8;
        for (let t = 0; t < teeth; t++) {
          const ga = (t / teeth) * Math.PI * 2 + i;
          b.box(
            `fgear_${i}_${t}`,
            [x + Math.cos(ga) * r - 0.38, y + Math.sin(ga) * r - 0.38, z - 0.5],
            [x + Math.cos(ga) * r + 0.38, y + Math.sin(ga) * r + 0.38, z + 0.5],
            t % 2 ? "accent" : "secondary",
            { group: "Floating", tint: 6 }
          );
        }
        b.box(`fgear_hub_${i}`, [x - 0.8, y - 0.8, z - 0.65], [x + 0.8, y + 0.8, z + 0.65], "gem", {
          group: "Floating",
        });
        break;
      }
      /* ---------------- new: 血滴 ---------------- */
      case "bloodDrops": {
        b.box(`drop_body_${i}`, [x - 1.1, y - 1.1, z - 1.1], [x + 1.1, y + 1.1, z + 1.1], "gem", {
          group: "Floating",
        });
        // tapering tail pointing down
        for (let s = 0; s < 3; s++) {
          const w = 0.85 - s * 0.26;
          b.box(
            `drop_tail_${i}_${s}`,
            [x - w, y + 1.1 + s * 0.9, z - w],
            [x + w, y + 2 + s * 0.9, z + w],
            "accent",
            { group: "Floating", tint: -6 }
          );
        }
        b.box(`drop_shine_${i}`, [x - 0.4, y - 0.4, z + 1.05], [x + 0.4, y + 0.4, z + 1.4], "glow", {
          group: "Floating",
        });
        break;
      }
      /* ---------------- new: 排莢薬莢 ---------------- */
      case "shells": {
        const tilt = (i % 3) * 0.5;
        b.box(
          `shell_case_${i}`,
          [x - 0.62, y - 1.5 + tilt, z - 0.62],
          [x + 0.62, y + 1.5 + tilt, z + 0.62],
          "accent",
          { group: "Floating", tint: 14 }
        );
        b.box(
          `shell_rim_${i}`,
          [x - 0.8, y - 1.8 + tilt, z - 0.8],
          [x + 0.8, y - 1.3 + tilt, z + 0.8],
          "secondary",
          { group: "Floating", tint: -10 }
        );
        b.box(
          `shell_flash_${i}`,
          [x - 0.42, y + 1.5 + tilt, z - 0.42],
          [x + 0.42, y + 2.2 + tilt, z + 0.42],
          "glow",
          { group: "Floating" }
        );
        break;
      }
      /* ---------------- new: 呪詛の棘 ---------------- */
      case "thorns": {
        b.spike(`thorn_up_${i}`, x, y, z, 1.5, 4.2, "wood", { group: "Floating", layers: 4 });
        b.spike(`thorn_down_${i}`, x, y - 4.2, z, 1.5, 4.2, "bone", { group: "Floating", layers: 4 });
        b.box(`thorn_band_${i}`, [x - 1, y - 0.45, z - 1], [x + 1, y + 0.45, z + 1], "gem", {
          group: "Floating",
        });
        break;
      }
    }
  }
}

/** Resolves automatic atlas UV anchors per element (16-unit space). */
export function assignUVs(elements: VoxelElement[]): void {
  const anchors: Record<string, [number, number]> = {
    primary: [0, 0],
    secondary: [4, 0],
    accent: [8, 0],
    bone: [12, 0],
    wood: [0, 4],
    cloth: [4, 4],
    gem: [8, 4],
    glow: [12, 4],
  };
  for (const el of elements) {
    if (el.uv) continue;
    const base = anchors[el.material] ?? [0, 0];
    const jitterX = (el.name.length % 3) * 0.4;
    const jitterY = (el.name.charCodeAt(0) % 3) * 0.4;
    el.uv = [Math.min(12, base[0] + jitterX), Math.min(12, base[1] + jitterY)];
  }
}
