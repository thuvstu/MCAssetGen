import type { GeometryBuilder } from "../builder";
import { crystal, hangingChain, ring, rigBox, voxelLine } from "../primitives";
import { buildSword } from "./sword";

export function buildRuneBlade(b: GeometryBuilder) {
  buildSword(b);
  for (let y = -3; y < 14; y += 2) {
    b.box("rune_blade_glyph", [-0.8, y, 0.9], [0.8, y + 0.35, 1.15], 4, true);
    b.box(
      "rune_blade_glyph",
      [-0.25, y - 0.4, 0.9],
      [0.25, y + 0.9, 1.15],
      3,
      true,
    );
  }
  ring(b, "rune_guard_seal", [0, -6, 2.4], 2, 16, 0.4, 6, "xy", true);
}
export function buildCursedBlade(b: GeometryBuilder) {
  b.handle(-16, -6, 2);
  b.box("abyss_spine", [-1.1, -6, -0.9], [1.1, 18, 0.9], 0);
  for (let y = -5; y < 16; y++) {
    const w = y > 12 ? 1.5 : 2.8;
    b.box("abyss_blade", [-w, y, -0.7], [w, y + 1, 0.7], y % 4 ? 1 : 2);
    if (y % 3 === 0)
      for (const s of [-1, 1]) {
        b.box(
          "abyss_serration",
          [s < 0 ? -w - 1.6 : w, y, -0.55],
          [s < 0 ? -w : w + 1.6, y + 1.8, 0.55],
          0,
        );
        b.box("abyss_vein", [-0.2, y, 0.7], [0.2, y + 1.6, 1], 3, true);
      }
  }
  for (const s of [-1, 1]) {
    voxelLine(b, "abyss_horn", [s * 1.5, -6, 0], [s * 5.2, -3.8, 0], 1.5, 0);
    voxelLine(
      b,
      "abyss_horn_tip",
      [s * 5.2, -3.8, 0],
      [s * 4.8, -1, 0],
      0.8,
      1,
    );
    hangingChain(b, "abyss_chain", [s * 4.2, -6, 0], 4, 6);
  }
  crystal(b, "abyss_eye", [0, -5, 1.2], 2.4, 2.2, 3);
  b.box("abyss_eye_pupil", [-0.18, -5.6, 2.4], [0.18, -4.3, 2.7], 0);
  b.box("abyss_point", [-0.45, 18, -0.45], [0.45, 20, 0.45], 3, true);
}
export function buildBloodBlade(b: GeometryBuilder) {
  b.handle(-16, -5, 1.7);
  for (let y = -5; y < 17; y++) {
    const reach = y > 12 ? 2 : 3.2;
    b.box(
      "blood_blade",
      [-reach, y, -0.7],
      [reach, y + 1, 0.7],
      y % 3 === 0 ? 3 : 2,
      true,
    );
    b.box("blood_spine", [-0.5, y, -0.82], [0.5, y + 1, 0.82], 0);
    if (y % 4 === 0)
      for (const s of [-1, 1])
        b.box(
          "blood_fang",
          [s < 0 ? -reach - 1.3 : reach, y, -0.5],
          [s < 0 ? -reach : reach + 1.3, y + 2, 0.5],
          1,
        );
  }
  voxelLine(b, "blood_crossguard", [-5, -6, 0], [5, -6, 0], 1.5, 0);
  crystal(b, "blood_heart", [0, -5.4, 1], 2.8, 2.5, 3);
  for (const s of [-1, 1])
    voxelLine(
      b,
      "blood_crescent",
      [s * 4.5, -6, 0],
      [s * 3.4, -2.8, 0],
      0.9,
      6,
    );
  b.box("blood_tip", [-0.6, 17, -0.4], [0.6, 19, 0.4], 4, true);
}
export function buildElderStaff(b: GeometryBuilder) {
  b.handle(-18, 6, 1.5);
  b.box("astral_neck", [-1.7, 4, -1.5], [1.7, 7, 1.5], 6);
  ring(b, "astral_armillary_outer", [0, 11, 0], 5.2, 28, 0.65, 6);
  ring(b, "astral_armillary_inner", [0, 11, 0], 3.9, 24, 0.45, 3, "xz", true);
  crystal(b, "astral_star", [0, 11, 0], 5, 3.2, 2);
  for (const s of [-1, 1]) {
    voxelLine(b, "astral_crown", [s * 3.7, 14, 0], [s * 2, 18.2, 0], 0.65, 6);
    hangingChain(b, "astral_chain", [s * 4.4, 10, 0], 5, 6);
  }
  for (let y = -15; y < 5; y += 3) {
    ring(b, "astral_grip_ring", [0, y, 0], 1.4, 8, 0.35, 6, "xz");
    b.box("astral_handle_glyph", [-0.25, y, 1], [0.25, y + 1, 1.3], 4, true);
  }
}
export function buildBloodStaff(b: GeometryBuilder) {
  b.handle(-18, 5, 1.4);
  for (const s of [-1, 1]) {
    voxelLine(b, "blood_moon", [0, 5, 0], [s * 4.2, 9, 0], 1.2, 0);
    voxelLine(b, "blood_moon", [s * 4.2, 9, 0], [s * 3.4, 15, 0], 1, 2, true);
    voxelLine(
      b,
      "blood_moon_tip",
      [s * 3.4, 15, 0],
      [s * 1.7, 17, 0],
      0.6,
      3,
      true,
    );
    hangingChain(b, "blood_staff_chain", [s * 3.5, 10, 0], 4, 6);
  }
  crystal(b, "blood_staff_heart", [0, 11, 0], 4.8, 2.4, 3);
  for (let y = -12; y < 5; y += 3.5) {
    b.box("blood_bone_wrap", [-1.4, y, -1.2], [1.4, y + 0.6, 1.2], 0);
    b.box("blood_staff_rune", [-0.3, y + 0.6, 1], [0.3, y + 1.6, 1.3], 3, true);
  }
}
export function buildGrimoire(b: GeometryBuilder) {
  b.box("grimoire_spine", [-0.65, -6, -1.4], [0.65, 6, 1.4], 6);
  for (const side of [-1, 1]) {
    const x = side < 0 ? -8 : 0.6;
    const X = side < 0 ? -0.6 : 8;
    b.box("grimoire_cover", [x, -6, -1.7], [X, 6, -1.1], 0);
    for (let p = 0; p < 5; p++)
      rigBox(
        b,
        "grimoire_page",
        [x + 0.2, -5.7, -1 + p * 0.28],
        [X - 0.2, 5.7, -0.76 + p * 0.28],
        p % 2 ? 4 : 6,
        "page",
      );
    for (const y of [-5.7, 5.1])
      b.box(
        "grimoire_gold_corner",
        [side < 0 ? -8 : 6.4, y, -0.1],
        [side < 0 ? -6.4 : 8, y + 0.6, 0.5],
        6,
      );
    for (let y = -4; y < 4; y += 1.4) {
      rigBox(
        b,
        "grimoire_ink",
        [side < 0 ? -6.8 : 1.5, y, 0.65],
        [side < 0 ? -1.5 : 6.8, y + 0.15, 0.82],
        y % 2 ? 1 : 3,
        "page",
        true,
      );
      rigBox(
        b,
        "grimoire_glyph",
        [side * 4 - 0.25, y + 0.15, 0.65],
        [side * 4 + 0.25, y + 0.7, 0.85],
        3,
        "page",
        true,
      );
    }
    hangingChain(b, "grimoire_bookmark", [side * 6, -6, 0], 3);
  }
  ring(b, "grimoire_sigil", [0, 1, 2.2], 2.4, 16, 0.4, 3, "xy", true);
  crystal(b, "grimoire_seal", [0, 1, 2.2], 2, 1.3, 3);
}
export function buildMagicCircle(b: GeometryBuilder) {
  ring(b, "sigil_outer", [0, 0, 0], 11, 64, 0.5, 3, "xy", true);
  ring(b, "sigil_gold", [0, 0, 0], 10.1, 56, 0.35, 6);
  ring(b, "sigil_inner", [0, 0, 0], 8, 48, 0.35, 3, "xy", true);
  const points: Vec3[] = Array.from({ length: 6 }, (_, i) => [
    Math.cos((i * Math.PI) / 3) * 7,
    Math.sin((i * Math.PI) / 3) * 7,
    0,
  ]);
  for (let i = 0; i < 6; i++)
    voxelLine(b, "sigil_star", points[i], points[(i + 2) % 6], 0.3, 2, true);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const x = Math.cos(a) * 9,
      y = Math.sin(a) * 9;
    b.box(
      "sigil_glyph",
      [x - 0.2, y - 0.7, -0.2],
      [x + 0.2, y + 0.7, 0.2],
      4,
      true,
    );
    b.box(
      "sigil_glyph",
      [x - 0.65, y + 0.1, -0.2],
      [x + 0.65, y + 0.35, 0.2],
      6,
    );
  }
  crystal(b, "sigil_core", [0, 0, 0], 3, 2, 3);
}
export function buildRelic(b: GeometryBuilder) {
  crystal(b, "relic_heart", [0, 1, 0], 9, 4, 3);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const x = Math.cos(a) * 4,
      z = Math.sin(a) * 4;
    voxelLine(b, "relic_cage", [0, -7, 0], [x, 0, z], 0.55, 6);
    voxelLine(b, "relic_cage", [x, 0, z], [0, 9, 0], 0.55, 6);
    crystal(b, "relic_satellite", [x * 1.3, 2, z * 1.3], 2.5, 1, 3);
  }
  ring(b, "relic_halo", [0, 0, 0], 5, 32, 0.4, 6, "xz", true);
  ring(b, "relic_halo", [0, 4, 0], 4, 24, 0.3, 3, "xz", true);
  b.box("relic_crown", [-1, 9, -1], [1, 11, 1], 6);
  hangingChain(b, "relic_chain", [0, -7, 0], 4, 6);
}
import type { Vec3 } from "../../model-types";
