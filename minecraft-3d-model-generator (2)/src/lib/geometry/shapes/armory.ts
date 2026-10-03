import type { GeometryBuilder } from "../builder";
import { crystal, hangingChain, ring, rigBox, voxelLine } from "../primitives";

export function buildBow(b: GeometryBuilder) {
  b.box("bow_grip", [2.5, -3, -1], [4.2, 3, 1], 5);
  for (const s of [-1, 1]) {
    voxelLine(b, "bow_limb", [3, s * 2, 0], [5, s * 7, 0], 1.25, 6);
    voxelLine(b, "bow_limb", [5, s * 7, 0], [2, s * 12, 0], 1.15, 0);
    voxelLine(b, "bow_limb", [2, s * 12, 0], [-2, s * 15, 0], 0.8, 6);
    crystal(b, "bow_gem", [3, s * 10, 0.8], 2, 1, 3);
    voxelLine(
      b,
      "bow_string",
      [-2, s * 15, 0],
      [-3, 0, 0],
      0.2,
      4,
      true,
      "string",
    );
  }
  rigBox(b, "bow_arrow", [-3, -0.18, 0], [9, 0.18, 0.4], 6, "string");
  rigBox(
    b,
    "bow_arrow_head",
    [9, -0.65, -0.3],
    [11, 0.65, 0.6],
    3,
    "string",
    true,
  );
  for (let y = -2.5; y < 3; y += 1)
    b.box("bow_grip_ring", [2.4, y, -1.1], [4.3, y + 0.25, 1.1], 0);
}
function receiver(b: GeometryBuilder, pistol = false) {
  b.box("gun_receiver", [-7, -1.6, -1.2], [pistol ? 3 : 6, 1.6, 1.2], 1);
  rigBox(
    b,
    "gun_slide",
    [-6, 1.6, -1.35],
    [pistol ? 5 : 5.5, 2.8, 1.35],
    3,
    "mechanism",
  );
  b.box("gun_grip", [-6, -7, -1], [-3, -1.5, 1], 5);
  b.box("gun_trigger_guard", [-3.1, -3.9, -0.6], [0.8, -3.55, 0.6], 0);
  b.box("gun_trigger", [-1.8, -3.5, -0.3], [-1.5, -1.7, 0.3], 6);
  b.box("gun_trigger_guard", [0.5, -3.9, -0.6], [0.85, -1.5, 0.6], 0);
  for (let y = -6.5; y < -2; y += 1)
    b.box("gun_grip_texture", [-6.1, y, 1], [-3.2, y + 0.3, 1.2], 1);
}
export function buildPistol(b: GeometryBuilder) {
  receiver(b, true);
  b.box("pistol_muzzle", [3, -0.8, -0.95], [6.8, 1.5, 0.95], 0);
  b.box("pistol_muzzle_rim", [6.8, -0.95, -1.1], [7.3, 1.65, 1.1], 1);
  for (const x of [-5.5, 4])
    b.box("pistol_sight", [x, 2.8, -0.4], [x + 0.5, 3.4, 0.4], 3, true);
  for (let x = -5; x < 1; x += 1)
    rigBox(
      b,
      "pistol_slide_vent",
      [x, 1.7, 1.35],
      [x + 0.35, 2.6, 1.55],
      0,
      "mechanism",
    );
  rigBox(
    b,
    "pistol_magazine",
    [-5.7, -7.4, -0.9],
    [-3.3, -6.8, 0.9],
    6,
    "magazine",
  );
}
export function buildRifle(b: GeometryBuilder) {
  receiver(b);
  b.box("rifle_stock", [-14, -1.8, -1.5], [-7, 1.4, 1.5], 0);
  b.box("rifle_stock_pad", [-14.7, -2.2, -1.6], [-14, 1.8, 1.6], 5);
  b.box("rifle_handguard", [6, -1.2, -1.4], [12, 1.5, 1.4], 0);
  b.box("rifle_barrel", [12, -0.35, -0.5], [17, 0.65, 0.5], 2);
  b.box("rifle_muzzle", [17, -0.7, -0.8], [19, 1, 0.8], 0);
  rigBox(b, "rifle_magazine", [0, -6, -1], [3, -1.6, 1], 2, "magazine");
  for (let x = 6.3; x < 12; x += 0.9)
    b.box("rifle_cooling_vent", [x, -0.9, 1.4], [x + 0.4, 1, 1.55], 2);
  b.box("rifle_scope_mount", [-2, 2.8, -0.75], [3, 3.3, 0.75], 0);
  b.box("rifle_scope", [-3, 3.3, -1], [4, 4.8, 1], 1);
  b.box("rifle_scope_lens", [4, 3.45, -0.8], [4.25, 4.65, 0.8], 3, true);
  for (let x = -5; x < 12; x += 1.4)
    b.box("rifle_top_rail", [x, 2.7, -0.4], [x + 0.5, 3.05, 0.4], 0);
}
export function buildRailgun(b: GeometryBuilder) {
  receiver(b);
  b.box("railgun_stock", [-12, -1.8, -1.8], [-7, 1.8, 1.8], 0);
  for (const s of [-1, 1]) {
    b.box(
      "railgun_conductor",
      [4, -0.6, s < 0 ? -2.1 : 1.3],
      [19, 0.9, s < 0 ? -1.3 : 2.1],
      2,
    );
    b.box(
      "railgun_energy_track",
      [5, 0.9, s < 0 ? -1.8 : 1.5],
      [19, 1.15, s < 0 ? -1.5 : 1.8],
      3,
      true,
    );
    for (let x = 5; x < 18; x += 2.3) {
      b.box(
        "railgun_coil",
        [x, -1.3, s < 0 ? -2.9 : 1.9],
        [x + 0.7, 1.6, s < 0 ? -1.9 : 2.9],
        6,
      );
      b.box(
        "railgun_capacitor",
        [x, -1.45, s < 0 ? -2.5 : 2.1],
        [x + 0.5, -1.25, s < 0 ? -2.1 : 2.5],
        3,
        true,
      );
    }
  }
  crystal(b, "railgun_core", [-2, 1, 0], 3.5, 2, 3);
  b.box("railgun_energy_chamber", [-4, -1.5, 1.3], [2, 1.5, 1.65], 0);
  for (let x = -3; x < 2; x++)
    b.box(
      "railgun_chamber_glow",
      [x, -0.8, 1.65],
      [x + 0.45, 0.8, 1.85],
      3,
      true,
    );
  rigBox(b, "railgun_cell", [-1, -5.5, -1.1], [2, -1.6, 1.1], 6, "magazine");
}
export function buildChainsaw(b: GeometryBuilder) {
  b.handle(-14, -3, 1.8);
  b.box("chainsaw_engine", [-3.5, -3, -2.4], [3.5, 3, 2.4], 6);
  b.box("chainsaw_motor_cover", [-2.8, -2.2, 2.4], [2.8, 2.2, 2.8], 0);
  ring(b, "chainsaw_motor_gear", [0, 0, 2.9], 1.6, 12, 0.4, 2);
  b.box("chainsaw_bar", [-2.2, 3, -0.6], [2.2, 17, 0.6], 1);
  b.box("chainsaw_bar_tip", [-1.5, 17, -0.6], [1.5, 19, 0.6], 2);
  for (let y = 3; y < 18; y += 1)
    for (const s of [-1, 1]) {
      rigBox(
        b,
        "chainsaw_chain_tooth",
        [s < 0 ? -3.2 : 2.2, y, -0.7],
        [s < 0 ? -2.2 : 3.2, y + 0.55, 0.7],
        3,
        "mechanism",
      );
      rigBox(
        b,
        "chainsaw_chain_link",
        [s < 0 ? -2.7 : 2.1, y + 0.6, -0.8],
        [s < 0 ? -2.1 : 2.7, y + 0.85, 0.8],
        0,
        "mechanism",
      );
    }
  b.box("chainsaw_safety_guard", [-4.5, 1, -3], [4.5, 1.6, -2.4], 0);
  for (const s of [-1, 1])
    voxelLine(
      b,
      "chainsaw_handle",
      [s * 4, -3, -2.8],
      [s * 4, 1, -2.8],
      0.65,
      0,
    );
  voxelLine(b, "chainsaw_handle", [-4, -3, -2.8], [4, -3, -2.8], 0.65, 0);
  for (let y = -2; y < 2; y += 0.7)
    b.box("chainsaw_exhaust", [-4, y, -1], [-3.5, y + 0.3, 1], 0);
}
export function buildSpear(b: GeometryBuilder) {
  b.handle(-22, 7, 1.15);
  for (let y = 5; y < 20; y++) {
    const w = y > 16 ? 0.5 : y > 13 ? 1.2 : y > 10 ? 1.8 : 2.5;
    b.box(
      "spear_leaf_blade",
      [-w, y, -0.45],
      [w, y + 1, 0.45],
      y % 3 ? 3 : 2,
      true,
    );
    b.box("spear_gold_spine", [-0.23, y, -0.55], [0.23, y + 1, 0.55], 6);
  }
  for (const s of [-1, 1]) {
    for (let i = 0; i < 5; i++)
      b.box(
        "spear_wing",
        [s < 0 ? -2.3 - i * 0.8 : 1.5 + i * 0.8, 5 + i * 0.5, -0.45],
        [s < 0 ? -1.5 - i * 0.8 : 2.3 + i * 0.8, 8.5 + i * 0.25, 0.45],
        i % 2 ? 6 : 0,
      );
    hangingChain(b, "spear_ceremonial_chain", [s * 3, 5, 0], 5);
    for (let i = 0; i < 4; i++)
      b.box(
        "spear_tassel",
        [s * 3 - 0.6 + i * 0.3, -2.5, 0],
        [s * 3 - 0.4 + i * 0.3, 1.2 - i * 0.3, 0.3],
        7,
      );
    crystal(b, "spear_crown_gem", [s * 2, 9, 0], 2.2, 1.1, 3);
  }
  for (let y = -18; y < 7; y += 3) {
    ring(b, "spear_gold_collar", [0, y, 0], 1.2, 8, 0.25, 6, "xz");
    b.box(
      "spear_grip_rune",
      [-0.2, y + 0.3, 0.95],
      [0.2, y + 1.3, 1.1],
      3,
      true,
    );
  }
  crystal(b, "spear_guard_heart", [0, 5, 1], 3, 2, 3);
  b.box("spear_heel_spike", [-0.4, -24, -0.4], [0.4, -22, 0.4], 6);
}
export function buildMace(b: GeometryBuilder) {
  b.handle(-15, 5, 1.8);
  b.box("mace_head_core", [-2, 4, -2], [2, 12, 2], 0);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3,
      x = Math.cos(a) * 3,
      z = Math.sin(a) * 3;
    b.box("mace_flange", [x - 0.55, 5, z - 0.55], [x + 0.55, 11, z + 0.55], 2);
    b.box(
      "mace_flange_crown",
      [x - 0.6, 11, z - 0.6],
      [x + 0.6, 12.5, z + 0.6],
      6,
    );
    b.box(
      "mace_energy_glyph",
      [x - 0.22, 6, z + 0.6],
      [x + 0.22, 9, z + 0.9],
      3,
      true,
    );
  }
  ring(b, "mace_crown_ring", [0, 11, 0], 2.5, 16, 0.55, 6, "xz");
  crystal(b, "mace_lightning_core", [0, 12, 0], 3.4, 2.3, 3);
  ring(b, "mace_bottom_collar", [0, 5, 0], 2.5, 12, 0.5, 6, "xz");
  hangingChain(b, "mace_chain", [1.5, -14, 0], 4);
}
