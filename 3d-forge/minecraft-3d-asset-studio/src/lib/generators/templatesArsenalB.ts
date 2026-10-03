import { alignTo, chain, forge, maker, outward, ringOf } from "@/lib/generators/kit";
import { PALETTES } from "@/lib/generators/textureBaker";
import { ModelArchetype, ModelData, ModelElement, ModelTheme, TextureResolution, Vector3 } from "@/types/model";

const GOLD = "#e0b64f";
const GUNMETAL = "#3c4250";
const WOOD = "#6b4a2f";
const IRON = "#2f3542";

/** Fibonacci-sphere directions for evenly spread spikes. */
function sphereDirections(count: number): Vector3[] {
  return Array.from({ length: count }, (_, index) => {
    const y = 1 - (index / Math.max(1, count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = index * Math.PI * (3 - Math.sqrt(5));
    return [Math.cos(theta) * radius, y, Math.sin(theta) * radius];
  });
}

// ============================ SHOTGUN ============================
function shotgun(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    P("sg_receiver", "Receiver", [0, 0, 0], [2.4, 3.6, 9], "guard", p.dark, "body"),
    P("sg_barrel", "Barrel", [0, 1, 8.6], [1.3, 1.3, 13], "blade", GUNMETAL, "barrel"),
    P("sg_tube", "Magazine Tube", [0, -0.5, 7.6], [1.2, 1.2, 11], "blade", GUNMETAL, "barrel"),
    P("sg_pump", "Pump Foregrip", [0, -0.6, 6.2], [2.3, 1.8, 4.2], "rune", WOOD, "barrel"),
    P("sg_bead", "Front Bead", [0, 1.8, 14.8], [0.4, 0.5, 0.4], "gem", p.glow, "barrel", { emissive: true }),
    P("sg_muzzle", "Choke Ring", [0, 1, 15.3], [1.7, 1.7, 0.8], "guard", p.dark, "barrel"),
    P("sg_stock", "Wood Stock", [0, -0.8, -8], [2, 3.4, 7.4], "guard", WOOD, "stock", { rotation: [-6, 0, 0] }),
    P("sg_pad", "Recoil Pad", [0, -1.2, -11.9], [2.2, 3.8, 0.8], "rune", "#1b1b1b", "stock", { rotation: [-6, 0, 0] }),
    P("sg_grip", "Wrist", [0, -1.8, -3.4], [1.7, 3, 2.4], "guard", WOOD, "stock", { rotation: [16, 0, 0] }),
    P("sg_trigger", "Trigger Guard", [0, -2.3, -1.2], [0.6, 1.4, 2.2], "blade", GUNMETAL, "body"),
  ];
  for (let index = 0; index < 5; index += 1) {
    e.push(P(`sg_shell_${index}`, `Shell ${index + 1}`, [1.5, 0.8, -1.6 + index * 0.9], [0.7, 1.6, 0.7], "gem", index % 2 === 0 ? "#d32f2f" : p.glow, "shells", { emissive: index % 2 === 1 }));
  }
  return forge("Breacher Pump Shotgun", "チューブ弾倉とサイドシェルホルダーを備えた木製ストックのポンプショットガン。", theme, res, e, { particle: "smoke", circle: "gear_ring", loop: "levitate_tilt", circleY: 0, circleRadius: 7, floatEnabled: false });
}

// ============================ SNIPER ============================
function sniper(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    P("sn_receiver", "Receiver", [0, 0, 0], [2, 3, 12], "guard", p.dark, "body"),
    P("sn_barrel", "Fluted Barrel", [0, 0.6, 12.8], [1, 1, 15], "blade", GUNMETAL, "barrel"),
    P("sn_suppressor", "Suppressor", [0, 0.6, 21.6], [1.8, 1.8, 5], "guard", p.dark, "barrel"),
    P("sn_scope", "Long Scope", [0, 3.4, 0], [1.8, 1.8, 10], "guard", p.dark, "optic"),
    P("sn_objective", "Objective Bell", [0, 3.4, 5.4], [2.4, 2.4, 1.6], "guard", p.dark, "optic"),
    P("sn_lens_f", "Objective Lens", [0, 3.4, 6.3], [1.9, 1.9, 0.2], "gem", p.glow, "optic", { emissive: true }),
    P("sn_lens_r", "Eyepiece Lens", [0, 3.4, -5.1], [1.2, 1.2, 0.2], "gem", p.glow, "optic", { emissive: true }),
    P("sn_turret", "Elevation Turret", [0, 4.6, 0.4], [1, 0.8, 1], "rune", p.accent, "optic"),
    ...[-2.4, 2.6].map((z, index) => P(`sn_ring_${index}`, `Scope Ring ${index + 1}`, [0, 2.2, z], [1.4, 1.6, 0.8], "guard", GUNMETAL, "optic")),
    P("sn_bolt", "Bolt Handle", [1.6, 0.8, -2.6], [1.8, 0.5, 0.5], "blade", p.highlight, "body"),
    P("sn_stock", "Skeleton Stock", [0, -0.4, -10], [2, 3.6, 8], "guard", p.dark, "stock"),
    P("sn_cheek", "Cheek Rest", [0, 1.8, -9.4], [1.8, 0.8, 4], "rune", p.accent, "stock"),
    P("sn_mag", "Box Magazine", [0, -2.8, 1.4], [1.4, 3, 2.4], "guard", GUNMETAL, "body"),
  ];
  [-1, 1].forEach((side) => e.push(P(`sn_bipod_${side}`, `Bipod Leg ${side > 0 ? "R" : "L"}`, [side * 1.4, -2.6, 11], [0.6, 6, 0.6], "blade", GUNMETAL, "bipod", { rotation: [0, 0, side * 22], origin: [side * 0.3, 0, 11] })));
  return forge("Longshot Anti-Material Rifle", "長銃身・サプレッサー・高倍率スコープ・二脚を備えた対物狙撃銃。", theme, res, e, { particle: "glitch", circle: "hex_tech", loop: "levitate_tilt", circleY: 0, circleRadius: 9, floatEnabled: false });
}

// ============================ SMG ============================
function smg(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    P("sm_receiver", "Compact Receiver", [0, 0, 0], [2.2, 3.4, 9], "guard", p.dark, "body"),
    P("sm_shroud", "Barrel Shroud", [0, 0.6, 6.4], [2.2, 2.2, 5], "guard", GUNMETAL, "barrel"),
    ...[0, 1, 2, 3].map((index) => P(`sm_vent_${index}`, `Shroud Vent ${index + 1}`, [1.15, 0.6, 4.6 + index * 1.2], [0.1, 1.2, 0.5], "rune", "#111", "barrel")),
    P("sm_barrel", "Barrel", [0, 0.6, 9.8], [0.9, 0.9, 2.4], "blade", GUNMETAL, "barrel"),
    P("sm_vgrip", "Vertical Foregrip", [0, -3, 4.4], [1.4, 4, 1.4], "rune", p.dark, "body"),
    P("sm_mag", "Stick Magazine", [0, -4.4, 0], [1.4, 5.6, 2], "guard", GUNMETAL, "body"),
    P("sm_grip", "Pistol Grip", [0, -3.4, -3.2], [1.6, 4, 2], "rune", p.dark, "body", { rotation: [16, 0, 0] }),
    P("sm_sight", "Red Dot", [0, 2.6, -0.4], [1.4, 1.4, 2], "guard", p.dark, "optic"),
    P("sm_dot", "Red Dot Lens", [0, 2.6, 0.65], [0.9, 0.9, 0.2], "gem", "#ff1744", "optic", { emissive: true }),
    P("sm_light", "Tactical Light", [0, -1, 7.4], [1.2, 1.2, 2.4], "guard", p.dark, "barrel"),
    P("sm_lens", "Light Lens", [0, -1, 8.7], [1, 1, 0.2], "gem", p.glow, "barrel", { emissive: true }),
    ...[-1, 1].map((side) => P(`sm_stock_${side}`, `Folding Stock Bar ${side > 0 ? "R" : "L"}`, [side * 0.7, -0.6, -7.2], [0.4, 0.6, 6], "blade", GUNMETAL, "stock")),
    P("sm_stock_pad", "Stock Pad", [0, -0.6, -10.4], [2, 3, 0.6], "rune", p.dark, "stock"),
  ];
  return forge("Viper Submachine Gun", "フォアグリップ・タクティカルライト・ドットサイトを備えた短機関銃。", theme, res, e, { particle: "sparks", circle: "hex_tech", loop: "engine_idle", circleY: 0, circleRadius: 7, floatEnabled: false });
}

// ============================ CHAINSAW SWORD ============================
function chainsawSword(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const steel = "#b6bec9";
  const e: ModelElement[] = [
    P("css_grip", "Grip", [0, -8, 0], [1.8, 8, 1.8], "rune", p.dark, "hilt"),
    P("css_pommel", "Pull Starter Pommel", [0, -12.8, 0], [2.6, 1.6, 2.6], "gem", p.accent, "hilt", { rotation: [0, 45, 0] }),
    P("css_engine", "Guard Engine Block", [0, -2.4, 0], [6.4, 3.4, 4], "guard", p.primary, "engine"),
    P("css_engine_core", "Engine Core", [0, -2.4, 2.1], [2, 2, 0.4], "gem", p.glow, "engine", { emissive: true }),
    ...[-1, 1].map((side) => P(`css_exhaust_${side}`, `Exhaust ${side > 0 ? "R" : "L"}`, [side * 3.6, -0.6, -1.2], [1, 3.2, 1], "guard", IRON, "engine", { rotation: [0, 0, side * -18] })),
    P("css_bar", "Saw Bar Blade", [0, 9.4, 0], [3.4, 20, 1], "blade", steel, "blade"),
    P("css_core", "Bar Core Channel", [0, 9.4, 0.55], [0.8, 18, 0.3], "rune", p.glow, "blade", { emissive: true }),
    P("css_tip", "Nose Sprocket", [0, 19.8, 0], [2.4, 2.4, 1.2], "gem", p.glow, "blade", { emissive: true, rotation: [0, 0, 45] }),
  ];
  [-1, 1].forEach((side) => {
    for (let index = 0; index < 13; index += 1) {
      e.push(P(`css_tooth_${side}_${index}`, `Chain Tooth ${side > 0 ? "R" : "L"}${index + 1}`, [side * 1.95, 0.6 + index * 1.45, 0], [0.8, 0.9, 1.3], "blade", steel, "chain", { rotation: [0, 0, side * 30], emissive: index % 3 === 0 }));
    }
  });
  return forge("Ripper Chainsword", "鍔にエンジンを内蔵し、両刃にチェーン歯が回転する機械剣。", theme, res, e, { particle: "sparks", circle: "gear_ring", loop: "engine_idle", circleY: 4, circleSpeed: 2.2, floatEnabled: false });
}

// ============================ REVOLVER ============================
function revolver(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    P("rv_frame", "Frame", [0, 0, 0], [1.8, 3.4, 6], "guard", GUNMETAL, "frame"),
    P("rv_barrel", "Barrel", [0, 1, 6.6], [1.4, 1.4, 8], "blade", GUNMETAL, "barrel"),
    P("rv_rib", "Engraved Rib", [0, 1.9, 6.6], [0.6, 0.4, 8], "rune", GOLD, "barrel", { emissive: true }),
    P("rv_ejector", "Ejector Rod", [0, 0, 5.4], [0.5, 0.5, 5], "blade", GUNMETAL, "barrel"),
    P("rv_front_sight", "Front Sight", [0, 2.1, 10.2], [0.3, 0.6, 0.6], "gem", p.glow, "barrel", { emissive: true }),
    P("rv_hub", "Cylinder Hub", [0, 0.6, 1.2], [1.2, 1.2, 3.4], "guard", GUNMETAL, "cylinder"),
    P("rv_hammer", "Hammer", [0, 2.4, -2.6], [0.6, 1.4, 1], "blade", p.highlight, "frame", { rotation: [-30, 0, 0] }),
    P("rv_guard", "Trigger Guard", [0, -2.2, 0.4], [0.5, 1.4, 2.4], "blade", GOLD, "frame"),
    P("rv_grip", "Ivory Grip", [0, -3.6, -2.6], [1.6, 5, 2.2], "guard", "#efe6d2", "grip", { rotation: [20, 0, 0] }),
    P("rv_medallion", "Grip Medallion", [0.85, -3.4, -2.6], [0.2, 1.2, 1.2], "gem", p.glow, "grip", { emissive: true, rotation: [20, 0, 45] }),
  ];
  e.push(...ringOf("rv_chamber", "Chamber", [0, 0.6, 1.2], 1.25, 6, [0.95, 0.95, 3.2], "xy", { region: "guard", color: GOLD, group: "cylinder", resolution: res }).map((element, index) => (index === 0 ? { ...element, color: p.glow, emissive: true } : element)));
  return forge("Gilded Peacemaker Revolver", "金彫りのリブと象牙グリップを持つ六連発リボルバー。", theme, res, e, { particle: "sparks", circle: "runic_ring", loop: "pendulum", circleY: 0, circleRadius: 6, floatEnabled: false });
}

// ============================ RAIL CANNON ============================
function railCannon(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const shell = "#1f2430";
  const e: ModelElement[] = [
    P("rc_chassis", "Heavy Chassis", [0, 0, 0], [4, 6, 18], "guard", shell, "chassis"),
    ...[-1, 1].map((side) => P(`rc_rail_${side}`, `Mag Rail ${side > 0 ? "R" : "L"}`, [side * 2.8, 1.6, 8], [1.4, 2, 22], "blade", p.primary, "rails", { emissive: true })),
    P("rc_channel", "Plasma Channel", [0, 1.6, 8], [1.2, 1.2, 22], "gem", p.glow, "rails", { emissive: true, opacity: 0.7 }),
    P("rc_emitter", "Focusing Emitter", [0, 1.4, 19.6], [5, 5, 2.6], "gem", p.glow, "rails", { emissive: true, rotation: [0, 0, 45] }),
    P("rc_mount", "Shoulder Mount", [0, -3.8, -6], [3, 2, 6], "guard", shell, "chassis"),
    P("rc_grip", "Control Grip", [0, -4.4, 0], [1.8, 5, 2.2], "rune", shell, "chassis", { rotation: [16, 0, 0] }),
    P("rc_scope", "Target Array", [0, 4.4, -2], [2, 2, 5], "guard", shell, "chassis"),
    P("rc_scope_lens", "Array Lens", [0, 4.4, 0.6], [1.4, 1.4, 0.3], "gem", p.glow, "chassis", { emissive: true }),
  ];
  for (let index = 0; index < 7; index += 1) {
    e.push(P(`rc_coil_${index}`, `Induction Coil ${index + 1}`, [0, 1.6, 0 + index * 2.8], [6.6, 6.6, 1], "rune", p.accent, "coils", { emissive: true, rotation: [0, 0, 45] }));
  }
  for (let index = 0; index < 6; index += 1) {
    e.push(P(`rc_fin_${index}`, `Cooling Fin ${index + 1}`, [0, 3.6, -7 + index * 1.2], [3.6, 1.4, 0.3], "blade", "#5b6475", "cooling"));
  }
  [-1, 1].forEach((side) => {
    for (let index = 0; index < 4; index += 1) {
      e.push(P(`rc_cell_${side}_${index}`, `Capacitor ${side > 0 ? "R" : "L"}${index + 1}`, [side * 2.6, -1.4, -7.4 + index * 2.4], [1, 2, 2], "gem", p.glow, "capacitors", { emissive: true }));
    }
  });
  return forge("Leviathan Rail Cannon", "七連誘導コイルと冷却フィン、コンデンサバンクを搭載した重レールキャノン。", theme, res, e, { particle: "lightning", circle: "hex_tech", loop: "engine_idle", circleY: 1.6, layers: 2, floatType: "orb", floatY: 2 });
}

// ============================ RELIC: HOLY GRAIL ============================
function holyGrail(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    P("hg_base", "Grail Foot", [0, -10, 0], [7, 1, 7], "guard", GOLD, "base", { rotation: [0, 45, 0] }),
    P("hg_step", "Foot Step", [0, -9, 0], [5.2, 1, 5.2], "guard", GOLD, "base"),
    P("hg_stem", "Stem", [0, -6, 0], [1.6, 6, 1.6], "guard", GOLD, "stem"),
    P("hg_knot", "Stem Knot", [0, -6, 0], [2.8, 1.4, 2.8], "rune", GOLD, "stem", { rotation: [0, 45, 0] }),
    P("hg_rim", "Grail Rim", [0, 5.4, 0], [9, 0.6, 9], "guard", GOLD, "cup", { rotation: [0, 45, 0] }),
    P("hg_wine", "Holy Wine", [0, 5.2, 0], [7, 0.3, 7], "gem", p.glow, "cup", { emissive: true, rotation: [0, 45, 0], opacity: 0.9 }),
    P("hg_shaft", "Light Shaft", [0, 12, 0], [2, 9, 2], "rune", p.glow, "light", { emissive: true, opacity: 0.25 }),
  ];
  for (let index = 0; index < 6; index += 1) {
    const size = 3 + index * 1;
    e.push(P(`hg_cup_${index}`, `Cup Tier ${index + 1}`, [0, -2.4 + index * 1.25, 0], [size, 1.3, size], "guard", GOLD, "cup", { rotation: [0, index % 2 === 0 ? 0 : 45, 0] }));
  }
  e.push(...ringOf("hg_knot_gem", "Knot Gem", [0, -6, 0], 1.6, 4, [0.6, 0.6, 0.6], "xz", { region: "gem", color: p.accent, group: "stem", resolution: res, emissive: true }));
  e.push(...ringOf("hg_cup_gem", "Cup Gem", [0, 2, 0], 3.4, 6, [0.8, 0.8, 0.5], "xz", { region: "gem", color: p.glow, group: "gems", resolution: res, emissive: true }));
  e.push(...ringOf("hg_halo", "Halo", [0, 11, 0], 5, 18, [1.6, 0.4, 0.4], "xz", { region: "rune", color: GOLD, group: "light", resolution: res, emissive: true }));
  return forge("Sanctum Holy Grail", "光輪と宝石を頂く聖杯。杯に満ちた聖水から光の柱が立ち昇る。", theme, res, e, { particle: "holy", circle: "celestial_sun", loop: "hover_spin", circleY: -10.5, circleTilt: 0, layers: 2, glyphs: true, floatType: "shard", floatY: 6 });
}

// ============================ RELIC: ANCIENT CROWN ============================
function ancientCrown(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    ...ringOf("ac_band", "Crown Band", [0, 0, 0], 5, 16, [2.2, 2.4, 0.8], "xz", { region: "guard", color: GOLD, group: "band", resolution: res }),
    ...ringOf("ac_trim", "Jewel Trim", [0, -0.9, 0], 5.3, 16, [1.4, 0.5, 0.4], "xz", { region: "gem", color: p.glow, group: "band", resolution: res, emissive: true }),
    P("ac_cap", "Velvet Cap", [0, 1.4, 0], [8, 2.6, 8], "rune", p.primary, "cap", { opacity: 0.95 }),
    P("ac_jewel", "Front Jewel", [0, 0.6, 5.4], [1.8, 1.8, 0.8], "gem", p.glow, "jewels", { emissive: true, rotation: [0, 0, 45] }),
    P("ac_cross_v", "Orb Cross Vertical", [0, 6.4, 0], [0.6, 3, 0.6], "guard", GOLD, "cross"),
    P("ac_cross_h", "Orb Cross Horizontal", [0, 6.8, 0], [2, 0.6, 0.6], "guard", GOLD, "cross"),
    P("ac_orb", "Monde Orb", [0, 4.4, 0], [1.8, 1.8, 1.8], "gem", p.accent, "cross", { emissive: true, rotation: [45, 45, 0] }),
  ];
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const tall = index % 2 === 0;
    const height = tall ? 3.4 : 2.2;
    const center: Vector3 = [Math.cos(angle) * 5, 1.2 + height / 2, Math.sin(angle) * 5];
    e.push(P(`ac_point_${index}`, `Crown Point ${index + 1}`, center, [0.9, height, 0.9], "blade", GOLD, "points", { rotation: outward(angle, 10) }));
    e.push(P(`ac_tip_${index}`, `Point Jewel ${index + 1}`, [center[0] * 1.03, 1.2 + height + 0.4, center[2] * 1.03], [0.8, 0.8, 0.8], "gem", tall ? p.glow : p.highlight, "jewels", { emissive: true, rotation: [45, 45, 0] }));
  }
  return forge("Crown of the First King", "八尖の宝冠に宝石を散りばめた古代王の冠。頂に十字の宝珠を戴く。", theme, res, e, { particle: "sparkle", circle: "celestial_sun", loop: "hover_spin", circleY: -2, circleTilt: 0, layers: 2, glyphs: true, floatType: "shard", floatY: 4 });
}

// ============================ RELIC: CURSED AMULET ============================
function cursedAmulet(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    ...ringOf("ca_chain", "Neck Chain", [0, 10, 0], 6, 16, [0.7, 1.1, 0.7], "xy", { region: "guard", color: "#4a4058", group: "chain", resolution: res }),
    ...ringOf("ca_frame", "Pendant Frame", [0, 0, 0], 3.4, 12, [1.6, 0.9, 1], "xy", { region: "guard", color: IRON, group: "pendant", resolution: res }),
    P("ca_backplate", "Backplate", [0, 0, -0.4], [5.6, 5.6, 0.4], "rune", "#1a1020", "pendant", { rotation: [0, 0, 45] }),
    P("ca_eye", "Cursed Eye", [0, 0, 0.4], [2.6, 1.6, 1], "gem", p.glow, "eye", { emissive: true }),
    P("ca_pupil", "Slit Pupil", [0, 0, 1], [0.5, 1.4, 0.4], "gem", "#0b0013", "eye"),
    P("ca_bail", "Bail", [0, 4.4, 0], [1.2, 1.6, 0.8], "guard", IRON, "pendant"),
  ];
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const center: Vector3 = [Math.cos(angle) * 4.8, Math.sin(angle) * 4.8, 0];
    e.push(P(`ca_spike_${index}`, `Frame Spike ${index + 1}`, center, [0.7, 2.2, 0.6], "blade", IRON, "spikes", { rotation: alignTo([Math.cos(angle), Math.sin(angle), 0]) }));
  }
  [-1.2, 0, 1.2].forEach((x, index) => e.push(P(`ca_tendril_${index}`, `Shadow Tendril ${index + 1}`, [x, -5 - index * 0.6, 0], [0.5, 3 + index, 0.4], "gem", p.glow, "tendrils", { emissive: true, opacity: 0.8, rotation: [0, 0, x * 8] })));
  return forge("Amulet of the Watcher", "魔眼を嵌め込み棘で囲った呪いの護符。影の触手が垂れ下がる。", theme, res, e, { particle: "souls", circle: "sigil_eye", loop: "pendulum", circleY: 0, circleTilt: 90, layers: 2, floatType: "rune_cube", floatY: 0 });
}

// ============================ RELIC: GYRO ORB ============================
function relicOrb(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    P("ro_base", "Pedestal Base", [0, -8, 0], [6, 1.2, 6], "guard", p.dark, "pedestal", { rotation: [0, 45, 0] }),
    P("ro_column", "Pedestal Column", [0, -5, 0], [2, 5, 2], "guard", p.dark, "pedestal"),
    P("ro_orb", "Relic Orb", [0, 3, 0], [5, 5, 5], "gem", p.glow, "orb", { emissive: true, rotation: [45, 45, 0] }),
    P("ro_shell", "Orb Field", [0, 3, 0], [6, 6, 6], "rune", p.glow, "orb", { emissive: true, rotation: [45, 0, 45], opacity: 0.28 }),
  ];
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
    e.push(P(`ro_claw_${index}`, `Claw ${index + 1}`, [Math.cos(angle) * 2.4, -1, Math.sin(angle) * 2.4], [0.8, 4, 0.8], "blade", p.accent, "pedestal", { rotation: outward(angle, 28), origin: [Math.cos(angle) * 1.2, -2.6, Math.sin(angle) * 1.2] }));
  }
  e.push(...ringOf("ro_gyro_a", "Gyro Ring A", [0, 3, 0], 4.6, 16, [1.8, 0.5, 0.5], "xz", { region: "rune", color: GOLD, group: "gyro", resolution: res, emissive: true }));
  e.push(...ringOf("ro_gyro_b", "Gyro Ring B", [0, 3, 0], 5.3, 16, [2, 0.5, 0.5], "xy", { region: "rune", color: p.accent, group: "gyro", resolution: res, emissive: true }));
  e.push(...ringOf("ro_gyro_c", "Gyro Ring C", [0, 3, 0], 6, 16, [0.5, 0.5, 2.2], "yz", { region: "rune", color: p.highlight, group: "gyro", resolution: res, emissive: true }));
  return forge("Tri-Axis Gyro Relic", "三軸のジャイロ環が交差する宝珠。台座の爪がそれを支える。", theme, res, e, { particle: "runes", circle: "hexagram", loop: "levitate_tilt", circleY: -8.6, circleTilt: 0, layers: 3, glyphs: true, floatEnabled: false });
}

// ============================ POLEARM: HALBERD ============================
function halberd(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    P("hb_shaft", "Lacquered Shaft", [0, -4, 0], [1.4, 34, 1.4], "guard", p.primary, "shaft"),
    P("hb_butt", "Butt Spike", [0, -22.4, 0], [1.4, 3, 1.4], "blade", GOLD, "shaft", { rotation: [0, 45, 0] }),
    P("hb_socket", "Head Socket", [0, 12, 0], [2.4, 3, 2.4], "guard", GOLD, "head", { rotation: [0, 45, 0] }),
    P("hb_spike", "Top Spike", [0, 19, 0], [1.4, 9, 1], "blade", p.highlight, "head"),
    P("hb_spike_glow", "Spike Edge", [0, 19, 0.6], [0.4, 8, 0.3], "rune", p.glow, "head", { emissive: true }),
    P("hb_axe", "Crescent Axe", [4, 14, 0], [5, 8, 0.8], "blade", p.highlight, "axe"),
    P("hb_axe_edge", "Axe Edge Glow", [6.7, 14, 0], [0.5, 7.6, 0.9], "rune", p.glow, "axe", { emissive: true }),
    P("hb_axe_rim", "Gold Rim", [1.9, 14, 0], [0.8, 8, 1], "guard", GOLD, "axe"),
    P("hb_axe_gem", "Axe Gem", [3.6, 14, 0.5], [1.4, 1.4, 0.4], "gem", p.glow, "axe", { emissive: true, rotation: [0, 0, 45] }),
  ];
  for (let index = 0; index < 3; index += 1) {
    e.push(P(`hb_hook_${index}`, `Back Hook ${index + 1}`, [-1.8 - index * 1.2, 15 - index * 1.4, 0], [1.6, 0.9, 0.6], "blade", p.highlight, "hook", { rotation: [0, 0, -20 - index * 25] }));
  }
  [8, 2, -4, -10, -16].forEach((y, index) => {
    e.push(P(`hb_band_${index}`, `Jeweled Band ${index + 1}`, [0, y, 0], [2.2, 1, 2.2], "rune", GOLD, "bands", { rotation: [0, 45, 0] }));
    e.push(P(`hb_band_gem_${index}`, `Band Gem ${index + 1}`, [0, y, 1.2], [0.6, 0.6, 0.3], "gem", p.glow, "bands", { emissive: true, rotation: [0, 0, 45] }));
  });
  [0, 1, 2].forEach((index) => e.push(P(`hb_tassel_${index}`, `Tassel ${index + 1}`, [(index - 1) * 1.6, 8.2, 1.4], [0.8, 4, 0.3], "rune", p.accent, "tassels", { rotation: [0, 0, (index - 1) * 8] })));
  return forge("Royal Guard Halberd", "斧刃・鉤爪・頂の穂先を備え、宝飾帯と房で飾られた王宮の長柄斧。", theme, res, e, { particle: "holy", circle: "celestial_sun", loop: "levitate_tilt", circleY: 14, circleTilt: 60, floatType: "shard", floatY: 14 });
}

// ============================ POLEARM: TRIDENT ============================
function trident(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    P("td_shaft", "Coral Shaft", [0, -4, 0], [1.4, 32, 1.4], "guard", p.secondary, "shaft"),
    P("td_crossbar", "Crossbar", [0, 13, 0], [8, 1.4, 1.4], "guard", GOLD, "head"),
    P("td_pearl", "Sea Pearl", [0, 13, 1.1], [1.6, 1.6, 1.6], "gem", "#f5f5f5", "head", { emissive: true, rotation: [45, 45, 0] }),
    P("td_prong_c", "Center Prong", [0, 19.4, 0], [1.2, 11, 1.2], "blade", p.highlight, "prongs"),
    P("td_tip_c", "Center Tip", [0, 25.4, 0], [1.4, 2, 1.4], "gem", p.glow, "prongs", { emissive: true, rotation: [0, 45, 0] }),
  ];
  [-1, 1].forEach((side) => {
    e.push(P(`td_prong_${side}`, `Side Prong ${side > 0 ? "R" : "L"}`, [side * 3.4, 17.6, 0], [1, 7.6, 1], "blade", p.highlight, "prongs"));
    e.push(P(`td_tip_${side}`, `Side Tip ${side > 0 ? "R" : "L"}`, [side * 3.4, 22, 0], [1.2, 1.6, 1.2], "gem", p.glow, "prongs", { emissive: true, rotation: [0, 45, 0] }));
    e.push(P(`td_barb_${side}`, `Barb ${side > 0 ? "R" : "L"}`, [side * 4.2, 20.4, 0], [0.6, 1.8, 0.6], "blade", p.highlight, "prongs", { rotation: [0, 0, side * 40] }));
    for (let index = 0; index < 3; index += 1) {
      e.push(P(`td_wave_${side}_${index}`, `Wave Curl ${side > 0 ? "R" : "L"}${index + 1}`, [side * (4.6 + index * 0.6), 12.4 - index * 1.1, 0], [1.4, 0.6, 0.5], "rune", p.accent, "waves", { rotation: [0, 0, side * (30 + index * 35)], emissive: index === 2 }));
    }
  });
  [7, 0, -7, -14].forEach((y, index) => e.push(P(`td_scale_${index}`, `Scale Band ${index + 1}`, [0, y, 0], [2, 1.4, 2], "rune", index % 2 === 0 ? GOLD : p.accent, "shaft", { rotation: [0, 45, 0] })));
  return forge("Abyssal Trident", "真珠を抱く金の横木と波飾りを持つ海神の三叉槍。", theme, res, e, { particle: "bubbles", circle: "elemental", loop: "pendulum", circleY: 13, circleTilt: 70, floatType: "orb", floatY: 16 });
}

// ============================ MACE: MORNING STAR ============================
function morningStar(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const ball: Vector3 = [4.4, 9, 0];
  const e: ModelElement[] = [
    P("ms_handle", "Wrapped Handle", [0, -10, 0], [2, 12, 2], "rune", p.dark, "handle"),
    P("ms_guard", "Handle Guard", [0, -3.4, 0], [3.6, 1, 3.6], "guard", IRON, "handle", { rotation: [0, 45, 0] }),
    P("ms_pommel", "Pommel Ring", [0, -16.8, 0], [2.6, 1.4, 2.6], "gem", p.accent, "handle", { emissive: true }),
    P("ms_eye", "Chain Eye", [0, -2.4, 0], [1.2, 1.2, 1.2], "guard", IRON, "handle"),
    ...chain("ms_chain", "Flail Chain", [0.4, -1.4, 0], [3.6, 5.8, 0], 6, IRON, res, "chain"),
    P("ms_ball", "Star Ball", ball, [5, 5, 5], "blade", IRON, "ball", { rotation: [45, 45, 0] }),
    P("ms_core", "Molten Cracks", ball, [5.2, 1, 5.2], "gem", p.glow, "ball", { emissive: true, rotation: [20, 45, 30], opacity: 0.85 }),
  ];
  sphereDirections(14).forEach((direction, index) => {
    e.push(
      P(`ms_spike_${index}`, `Star Spike ${index + 1}`, [ball[0] + direction[0] * 3.4, ball[1] + direction[1] * 3.4, ball[2] + direction[2] * 3.4], [1, 2.6, 1], "blade", index % 4 === 0 ? p.glow : IRON, "spikes", {
        rotation: alignTo(direction),
        emissive: index % 4 === 0,
      }),
    );
  });
  return forge("Doomstar Morning Star", "鎖で振り回す十四棘の鉄球。内部の溶鉄が亀裂から漏れ出す。", theme, res, e, { particle: "flame", circle: "pentagram", loop: "pendulum", circleY: 9, circleTilt: 90, floatEnabled: false });
}

// ============================ MACE: HOLY MACE ============================
function holyMace(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    P("hm_handle", "Ivory Handle", [0, -8, 0], [1.8, 12, 1.8], "guard", "#efe6d2", "handle"),
    P("hm_wrap", "Gold Wrap", [0, -6, 0], [2.2, 4, 2.2], "rune", GOLD, "handle"),
    P("hm_pommel", "Pommel Gem", [0, -14.6, 0], [2.2, 2.2, 2.2], "gem", p.glow, "handle", { emissive: true, rotation: [45, 45, 0] }),
    P("hm_collar", "Head Collar", [0, -1.4, 0], [3.4, 1.2, 3.4], "guard", GOLD, "head", { rotation: [0, 45, 0] }),
    P("hm_core", "Sacred Core", [0, 3, 0], [3, 5, 3], "gem", p.glow, "head", { emissive: true, rotation: [0, 45, 0] }),
    P("hm_top", "Crown Spike", [0, 7.6, 0], [1.2, 3.2, 1.2], "blade", GOLD, "head", { rotation: [0, 45, 0] }),
  ];
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    e.push(P(`hm_flange_${index}`, `Flange ${index + 1}`, [Math.cos(angle) * 2.6, 3, Math.sin(angle) * 2.6], [0.6, 6, 2.6], "blade", index % 2 === 0 ? p.highlight : GOLD, "flanges", { rotation: [0, -(angle * 180) / Math.PI, 0] }));
  }
  [-1, 1].forEach((side) => {
    for (let index = 0; index < 3; index += 1) {
      e.push(P(`hm_wing_${side}_${index}`, `Wing ${side > 0 ? "R" : "L"}${index + 1}`, [side * (4 + index * 0.9), 3.6 + index * 0.6, -0.6], [3.2 - index * 0.4, 0.9, 0.3], "rune", p.highlight, "wings", { rotation: [0, 0, side * (15 + index * 18)], origin: [side * 2.6, 3, -0.6], emissive: index === 0 }));
    }
  });
  e.push(...ringOf("hm_halo", "Halo", [0, 10.6, 0], 3.6, 16, [1.4, 0.4, 0.4], "xz", { region: "rune", color: GOLD, group: "halo", resolution: res, emissive: true }));
  return forge("Seraph Holy Mace", "八枚のフランジと聖なる翼、光輪を持つ聖騎士の戦鎚。", theme, res, e, { particle: "holy", circle: "celestial_sun", loop: "hover_spin", circleY: 3, circleTilt: 90, layers: 2, floatType: "shard", floatY: 6 });
}

export function generateArsenalB(type: ModelArchetype, theme: ModelTheme, res: TextureResolution): ModelData | null {
  switch (type) {
    case "shotgun":
      return shotgun(theme, res);
    case "sniper":
      return sniper(theme, res);
    case "smg":
      return smg(theme, res);
    case "chainsaw_sword":
      return chainsawSword(theme, res);
    case "revolver":
      return revolver(theme, res);
    case "rail_cannon":
      return railCannon(theme, res);
    case "holy_grail":
      return holyGrail(theme, res);
    case "ancient_crown":
      return ancientCrown(theme, res);
    case "cursed_amulet":
      return cursedAmulet(theme, res);
    case "relic_orb":
      return relicOrb(theme, res);
    case "halberd":
      return halberd(theme, res);
    case "trident":
      return trident(theme, res);
    case "morning_star":
      return morningStar(theme, res);
    case "holy_mace":
      return holyMace(theme, res);
    default:
      return null;
  }
}
