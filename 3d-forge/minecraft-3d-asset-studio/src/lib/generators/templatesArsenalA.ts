import { chain, deg, forge, gear, maker, outward, ringOf } from "@/lib/generators/kit";
import { PALETTES } from "@/lib/generators/textureBaker";
import { ModelArchetype, ModelData, ModelElement, ModelTheme, TextureResolution } from "@/types/model";

const BONE = "#e8e0cc";
const WOOD = "#5b4632";
const CRIMSON = "#8b0000";
const DARK_CRIMSON = "#3a0b10";
const PARCHMENT = "#d8cfb0";

// ============================ MECH: DRILL LANCE ============================
function drillLance(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    P("dl_grip", "Grip", [0, -12, 0], [2, 10, 2], "rune", p.dark, "grip"),
    P("dl_pommel", "Counterweight", [0, -17.5, 0], [2.8, 1.6, 2.8], "guard", p.accent, "grip", { rotation: [0, 45, 0] }),
    P("dl_motor", "Motor Housing", [0, -1.4, 0], [4.6, 4.2, 4.6], "guard", p.primary, "motor"),
    P("dl_core", "Reactor Window", [0, -1.4, 2.4], [2, 2, 0.4], "gem", p.glow, "motor", { emissive: true }),
    ...[-1, 1].map((side) => P(`dl_exhaust_${side}`, `Exhaust ${side > 0 ? "R" : "L"}`, [side * 2.8, -2, -1], [0.9, 3.6, 0.9], "guard", p.dark, "motor", { rotation: [0, 0, side * 14] })),
    ...[0, 1, 2].map((index) => P(`dl_vent_${index}`, `Vent ${index + 1}`, [0, -2.8 + index * 1.2, -2.4], [3.4, 0.35, 0.4], "blade", p.secondary, "motor")),
  ];
  for (let index = 0; index < 4; index += 1) {
    e.push(P(`dl_vamp_${index}`, `Vamplate Tier ${index + 1}`, [0, -5.6 + index * 1.1, 0], [7 - index * 1.4, 1, 7 - index * 1.4], "guard", p.secondary, "vamplate", { rotation: [0, index % 2 === 0 ? 0 : 45, 0] }));
  }
  for (let index = 0; index < 10; index += 1) {
    const size = 5.6 * (1 - index / 10) + 0.6;
    e.push(P(`dl_drill_${index}`, `Drill Flight ${index + 1}`, [0, 2 + index * 2, 0], [size, 2, size], "blade", index % 2 === 0 ? p.highlight : p.secondary, "drill", { rotation: [0, index * 18, 0] }));
    if (index % 3 === 0) e.push(P(`dl_glow_${index}`, `Drill Glow ${index + 1}`, [0, 2.6 + index * 2, 0], [size + 0.3, 0.3, size + 0.3], "rune", p.glow, "drill", { rotation: [0, index * 18 + 9, 0], emissive: true }));
  }
  e.push(P("dl_tip", "Drill Tip", [0, 22.4, 0], [0.8, 2.6, 0.8], "gem", p.glow, "drill", { emissive: true, rotation: [0, 45, 0] }));
  return forge("Gyro Drill Lance", "螺旋ドリルを回転させて穿つ機械槍。動力ハウジングと四段のヴァンプレートを持つ。", theme, res, e, { particle: "sparks", circle: "gear_ring", loop: "engine_idle", circleY: 10, floatType: "rune_cube", floatY: 10 });
}

// ============================ MECH: PILE BUNKER ============================
function pileBunker(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    P("pb_body", "Gauntlet Body", [0, 0, 0], [5, 6, 9], "guard", p.dark, "gauntlet"),
    P("pb_armor", "Top Armor Plate", [0, 3.4, 0.4], [5.6, 0.9, 8], "blade", p.primary, "gauntlet"),
    P("pb_grip", "Inner Grip", [0, -0.6, -1.4], [1.4, 3, 1.4], "rune", p.secondary, "gauntlet"),
    ...[0, 1, 2, 3].map((index) => P(`pb_knuckle_${index}`, `Knuckle ${index + 1}`, [-1.8 + index * 1.2, 1.6, 4.8], [1, 1.4, 1], "blade", p.secondary, "gauntlet")),
    P("pb_sleeve", "Stake Sleeve", [0, 0, 6], [3.2, 3.2, 5], "guard", p.secondary, "stake"),
    P("pb_stake", "Tungsten Stake", [0, 0, 11], [1.5, 1.5, 9], "blade", p.highlight, "stake"),
    P("pb_tip", "Stake Tip", [0, 0, 16.2], [0.9, 0.9, 1.6], "gem", p.glow, "stake", { emissive: true, rotation: [0, 0, 45] }),
    ...[-1, 1].map((side) => P(`pb_piston_${side}`, `Recoil Piston ${side > 0 ? "R" : "L"}`, [side * 3, 0.6, 3], [1, 1, 8], "blade", p.accent, "stake")),
    ...[0, 1, 2, 3].map((index) => P(`pb_fin_${index}`, `Heat Fin ${index + 1}`, [0, -1.6 + index * 1.2, -4.9], [4.4, 0.4, 0.8], "blade", p.secondary, "gauntlet")),
  ];
  e.push(
    ...ringOf("pb_drum", "Cartridge", [0, 0, -1], 2.4, 6, [1, 1, 3.2], "xy", { region: "gem", color: p.accent, group: "drum", resolution: res }).map((element, index) => (index % 2 === 0 ? { ...element, color: p.glow, emissive: true } : element)),
  );
  return forge("Breaker Pile Bunker", "炸薬ドラムで杭を撃ち出す籠手型の機械兵装。反動ピストンと放熱フィンを装備。", theme, res, e, { particle: "smoke", circle: "gear_ring", loop: "engine_idle", circleTilt: 0, circleY: -4, floatEnabled: false });
}

// ============================ MAGIC: CRYSTAL SCEPTER ============================
function crystalScepter(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    P("cs_rod", "Scepter Rod", [0, -6, 0], [1.4, 18, 1.4], "guard", p.secondary, "rod"),
    ...[-10, -4, 2].map((y, index) => P(`cs_band_${index}`, `Rod Band ${index + 1}`, [0, y, 0], [2, 0.6, 2], "rune", p.glow, "rod", { emissive: true, rotation: [0, 45, 0] })),
    P("cs_pommel", "Pommel Gem", [0, -15.6, 0], [1.8, 1.8, 1.8], "gem", p.glow, "rod", { emissive: true, rotation: [45, 45, 0] }),
    P("cs_crown", "Crown Base", [0, 4, 0], [3.4, 1, 3.4], "guard", p.accent, "crown", { rotation: [0, 45, 0] }),
    P("cs_crystal", "Grand Crystal", [0, 9, 0], [3, 5, 3], "gem", p.glow, "crystal", { emissive: true, rotation: [0, 45, 0] }),
    P("cs_crystal_up", "Upper Crystal", [0, 12.4, 0], [2, 2.8, 2], "gem", p.highlight, "crystal", { emissive: true, rotation: [0, 45, 0] }),
    P("cs_crystal_tip", "Crystal Tip", [0, 14.4, 0], [1, 1.6, 1], "gem", p.glow, "crystal", { emissive: true, rotation: [0, 45, 0] }),
    P("cs_shell", "Crystal Aura", [0, 9.8, 0], [3.8, 6.4, 3.8], "rune", p.glow, "crystal", { emissive: true, rotation: [0, 45, 0], opacity: 0.3 }),
  ];
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
    e.push(P(`cs_prong_${index}`, `Crown Prong ${index + 1}`, [Math.cos(angle) * 1.8, 6.4, Math.sin(angle) * 1.8], [0.6, 4, 0.6], "blade", p.accent, "crown", { rotation: outward(angle, 16), origin: [Math.cos(angle) * 1.8, 4.4, Math.sin(angle) * 1.8] }));
  }
  e.push(...ringOf("cs_orbit", "Orbit Crystal", [0, 9.6, 0], 4.4, 6, [0.8, 1.8, 0.8], "xz", { region: "gem", color: p.glow, group: "orbit", resolution: res, emissive: true }));
  return forge("Prism Crystal Scepter", "巨大な三段結晶を冠に抱く王笏。六つの小結晶が周囲を巡る。", theme, res, e, { particle: "sparkle", circle: "hexagram", loop: "hover_spin", circleY: 9.6, circleTilt: 0, layers: 2, glyphs: true, floatType: "shard", floatY: 9.6 });
}

// ============================ MAGIC: ORB CATALYST ============================
function orbCatalyst(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    P("oc_handle", "Catalyst Handle", [0, -8, 0], [1.6, 10, 1.6], "guard", p.dark, "handle"),
    P("oc_guard", "Handle Collar", [0, -2.6, 0], [3, 0.8, 3], "guard", p.accent, "handle", { rotation: [0, 45, 0] }),
    P("oc_pommel", "Handle Pommel", [0, -13.4, 0], [2, 1.4, 2], "gem", p.glow, "handle", { emissive: true, rotation: [0, 45, 0] }),
    ...[-1, 1].map((side) => P(`oc_strut_${side}`, `Frame Strut ${side > 0 ? "R" : "L"}`, [side * 2.4, -1, 0], [0.7, 3.6, 0.7], "blade", p.accent, "frame", { rotation: [0, 0, side * -32] })),
    P("oc_orb", "Catalyst Orb", [0, 4, 0], [4, 4, 4], "gem", p.glow, "orb", { emissive: true, rotation: [45, 45, 0] }),
    P("oc_orb_shell", "Orb Field", [0, 4, 0], [5, 5, 5], "rune", p.glow, "orb", { emissive: true, rotation: [45, 45, 0], opacity: 0.3 }),
  ];
  e.push(...ringOf("oc_ring_a", "Outer Frame", [0, 4, 0], 5, 12, [1.4, 0.8, 1], "xy", { region: "guard", color: p.accent, group: "frame", resolution: res }));
  e.push(...ringOf("oc_ring_b", "Inner Frame", [0, 4, 0], 4.2, 10, [0.7, 0.7, 1.4], "yz", { region: "rune", color: p.glow, group: "frame", resolution: res, emissive: true }));
  return forge("Twin-Ring Orb Catalyst", "直交する二重リングに魔力球を固定した触媒。詠唱を増幅する。", theme, res, e, { particle: "runes", circle: "arcane_clock", loop: "levitate_tilt", circleY: 4, circleTilt: 0, layers: 3, glyphs: true, floatType: "orb", floatY: 4 });
}

// ============================ CURSED: SOUL LANTERN ============================
function soulLantern(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    ...chain("sl_chain", "Hanging Chain", [0, 22, 0], [0, 15, 0], 6, "#3b3350", res, "chain"),
    P("sl_hook", "Top Hook", [0, 23.2, 0], [1.6, 1, 0.6], "guard", "#3b3350", "chain"),
    P("sl_cap", "Lantern Cap", [0, 13.6, 0], [5, 1, 5], "guard", p.dark, "cage", { rotation: [0, 45, 0] }),
    P("sl_roof", "Lantern Roof", [0, 14.6, 0], [3, 1.4, 3], "guard", p.dark, "cage", { rotation: [0, 45, 0] }),
    P("sl_base", "Lantern Base", [0, 3, 0], [5, 1, 5], "guard", p.dark, "cage", { rotation: [0, 45, 0] }),
    P("sl_foot", "Lantern Foot", [0, 1.9, 0], [3, 1.2, 3], "guard", p.dark, "cage"),
    P("sl_soul", "Captured Soul", [0, 8, 0], [2.4, 4, 2.4], "gem", p.glow, "soul", { emissive: true, opacity: 0.8 }),
    P("sl_flame", "Soul Flame", [0, 10.6, 0], [1.2, 2.2, 1.2], "gem", p.highlight, "soul", { emissive: true, opacity: 0.6, rotation: [0, 45, 0] }),
    P("sl_skull", "Skull Finial", [0, 2.6, 2.8], [2, 2, 1.6], "guard", BONE, "cage"),
    ...[-1, 1].map((side) => P(`sl_eye_${side}`, `Skull Eye ${side > 0 ? "R" : "L"}`, [side * 0.5, 2.8, 3.7], [0.5, 0.5, 0.2], "gem", p.glow, "cage", { emissive: true })),
  ];
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
    e.push(P(`sl_post_${index}`, `Cage Post ${index + 1}`, [Math.cos(angle) * 2.3, 8.2, Math.sin(angle) * 2.3], [0.6, 9.6, 0.6], "blade", p.dark, "cage"));
  }
  [-1.6, 0, 1.6].forEach((x, index) => e.push(...chain(`sl_tail_${index}`, `Tail Chain ${index + 1}`, [x, 1.2, 0], [x * 1.2, -2.8 - index, 0], 3, "#3b3350", res, "chain")));
  return forge("Soul Eater Lantern", "彷徨う魂を閉じ込めた吊りランタン。髑髏の装飾と垂れ下がる鎖を持つ。", theme, res, e, { particle: "souls", circle: "sigil_eye", loop: "pendulum", circleY: 0, circleTilt: 0, floatType: "orb", floatY: 8, floatCount: 4 });
}

// ============================ CURSED: BONE SCYTHE ============================
function boneScythe(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [];
  for (let index = 0; index < 12; index += 1) {
    const y = -14 + index * 2.6;
    e.push(P(`bs_vert_${index}`, `Vertebra ${index + 1}`, [0, y, 0], [2.2, 1.6, 2.2], "guard", BONE, "spine"));
    e.push(P(`bs_disc_${index}`, `Spinal Disc ${index + 1}`, [0, y + 1.3, 0], [3, 0.6, 3], "guard", index % 3 === 0 ? p.glow : "#c9bfa8", "spine", { emissive: index % 3 === 0 }));
  }
  e.push(
    P("bs_skull", "Skull Mount", [0, 18.4, 0], [4, 4, 4], "guard", BONE, "skull"),
    P("bs_jaw", "Skull Jaw", [0, 16, 0.6], [3, 1.2, 3], "guard", "#d8cfb8", "skull"),
    ...[-1, 1].map((side) => P(`bs_eye_${side}`, `Skull Eye ${side > 0 ? "R" : "L"}`, [side * 0.9, 18.8, 2.05], [0.8, 0.8, 0.2], "gem", p.glow, "skull", { emissive: true })),
  );
  for (let index = 0; index < 7; index += 1) {
    const x = 2.4 + index * 2.1;
    const y = 18.6 - index * index * 0.35;
    const angle = -15 - index * 12;
    e.push(P(`bs_rib_${index}`, `Rib Blade ${index + 1}`, [x, y, 0], [2.6, 1.3 - index * 0.08, 0.6], "blade", BONE, "blade", { rotation: [0, 0, angle] }));
    e.push(P(`bs_edge_${index}`, `Soul Edge ${index + 1}`, [x + 0.3, y - 0.8, 0], [2.4, 0.3, 0.7], "rune", p.glow, "blade", { rotation: [0, 0, angle], emissive: true, opacity: 0.85 }));
  }
  e.push(P("bs_tip", "Fang Tip", [16.6, 1.6, 0], [1, 3.2, 0.5], "blade", BONE, "blade", { rotation: [0, 0, -100] }));
  return forge("Ossuary Bone Scythe", "脊椎を連ねた柄と肋骨の刃を持つ骸骨の大鎌。刃縁に霊気が宿る。", theme, res, e, { particle: "souls", circle: "pentagram", loop: "pendulum", circleY: 18, circleTilt: 25, floatType: "rune_cube", floatY: 16 });
}

// ============================ BLOOD: BLOOD SCYTHE ============================
function bloodScythe(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    P("bsc_shaft", "Crimson Shaft", [0, 0, 0], [1.8, 34, 1.8], "guard", DARK_CRIMSON, "shaft"),
    P("bsc_joint", "Head Joint", [0, 17.4, 0], [3.4, 3.4, 3.4], "blade", CRIMSON, "head", { rotation: [45, 45, 0] }),
    P("bsc_heart", "Heart Gem", [0, 17.4, 2.2], [1.6, 1.8, 0.8], "gem", "#ff1744", "head", { emissive: true, rotation: [0, 0, 45] }),
    P("bsc_butt", "Butt Fang", [0, -18.4, 0], [1.2, 3, 1.2], "blade", CRIMSON, "shaft"),
  ];
  for (let index = 0; index < 10; index += 1) {
    const angle = index * 1.1;
    e.push(P(`bsc_vein_${index}`, `Vein ${index + 1}`, [Math.cos(angle) * 1, -14 + index * 3, Math.sin(angle) * 1], [0.5, 1.6, 0.5], "gem", "#ff1744", "shaft", { emissive: true, rotation: [0, deg(angle), 18] }));
  }
  for (let index = 0; index < 8; index += 1) {
    const t = index / 7;
    const x = 1.6 + t * 13;
    const y = 18.6 - t * t * 9;
    e.push(P(`bsc_blade_${index}`, `Blood Blade ${index + 1}`, [x, y, 0], [3, 2.4 - t * 1.3, 0.6], "blade", CRIMSON, "blade", { rotation: [0, 0, -(t * 55) - 5] }));
    e.push(P(`bsc_edge_${index}`, `Blood Edge ${index + 1}`, [x + 0.2, y - 1.2 + t * 0.4, 0], [2.8, 0.3, 0.7], "rune", "#ff1744", "blade", { rotation: [0, 0, -(t * 55) - 5], emissive: true }));
    if (index % 2 === 1) e.push(P(`bsc_drip_${index}`, `Blood Drip ${index + 1}`, [x, y - 2.4 - index * 0.2, 0.2], [0.5, 1.4 + index * 0.15, 0.4], "gem", CRIMSON, "drips", { emissive: true, opacity: 0.85 }));
  }
  return forge("Crimson Bloom Scythe", "血管が脈打つ真紅の大鎌。刃から滴る血が花のように散る。", theme, res, e, { particle: "blood", circle: "blood_rune", loop: "heartbeat", circleY: 17, color: "#ff1744", secondary: CRIMSON, floatType: "orb", floatY: 17 });
}

// ============================ BLOOD: HEMO LANCE ============================
function hemoLance(theme: ModelTheme, res: TextureResolution): ModelData {
  const P = maker(res);
  const e: ModelElement[] = [
    P("hl_shaft", "Lance Shaft", [0, -4, 0], [1.6, 26, 1.6], "guard", DARK_CRIMSON, "shaft"),
    P("hl_grip", "Grip Wrap", [0, -8, 0], [2.2, 6, 2.2], "rune", "#1a0306", "shaft"),
    P("hl_head", "Hemo Spearhead", [0, 15.4, 0], [2.6, 8, 1], "blade", CRIMSON, "head"),
    P("hl_channel", "Blood Channel", [0, 15.4, 0.6], [0.7, 7, 0.3], "rune", "#ff1744", "head", { emissive: true }),
    P("hl_tip", "Lance Tip", [0, 20.2, 0], [1.2, 2.4, 0.8], "blade", CRIMSON, "head", { rotation: [0, 0, 45] }),
    ...[-1, 1].map((side) => P(`hl_barb_${side}`, `Barb ${side > 0 ? "R" : "L"}`, [side * 2, 12.6, 0], [0.9, 3, 0.6], "blade", CRIMSON, "head", { rotation: [0, 0, side * 35] })),
  ];
  for (let index = 0; index < 3; index += 1) {
    e.push(P(`hl_vamp_${index}`, `Vamplate ${index + 1}`, [0, 8.4 + index * 1, 0], [5 - index * 1.3, 1, 5 - index * 1.3], "guard", CRIMSON, "vamplate", { rotation: [0, 45 * index, 0] }));
  }
  for (let index = 0; index < 12; index += 1) {
    const angle = index * 0.9;
    e.push(P(`hl_vein_${index}`, `Spiral Vein ${index + 1}`, [Math.cos(angle) * 1.05, -14 + index * 1.8, Math.sin(angle) * 1.05], [0.4, 1.4, 0.4], "gem", "#ff1744", "shaft", { emissive: true, rotation: [0, deg(angle), 22] }));
  }
  e.push(...ringOf("hl_orb", "Blood Orb", [0, 14, 0], 3.6, 5, [1.1, 1.1, 1.1], "xz", { region: "gem", color: "#ff1744", group: "orbs", resolution: res, emissive: true, opacity: 0.9 }));
  return forge("Hemorrhage Lance", "血を吸って輝く吸血の槍。螺旋の血管と周回する血球を纏う。", theme, res, e, { particle: "blood", circle: "blood_rune", loop: "heartbeat", circleY: 12, color: "#ff1744", secondary: CRIMSON, floatEnabled: false });
}

// ============================ STAFF: FROST STAFF ============================
function frostStaff(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const ice = "#bfe9ff";
  const e: ModelElement[] = [
    P("fs_shaft", "Frozen Shaft", [0, -6, 0], [1.6, 28, 1.6], "guard", p.secondary, "shaft"),
    ...[-14, -6, 2].map((y, index) => P(`fs_ring_${index}`, `Frost Ring ${index + 1}`, [0, y, 0], [2.4, 0.7, 2.4], "rune", ice, "shaft", { emissive: true, rotation: [0, 45, 0] })),
    P("fs_cradle", "Ice Cradle", [0, 8.6, 0], [3, 1.2, 3], "guard", ice, "crown", { rotation: [0, 45, 0] }),
    P("fs_spike", "Central Icicle", [0, 13, 0], [2, 8, 2], "gem", ice, "crown", { emissive: true, rotation: [0, 45, 0], opacity: 0.9 }),
    P("fs_core", "Frost Core", [0, 12, 0], [1.2, 1.2, 1.2], "gem", p.glow, "crown", { emissive: true, rotation: [45, 45, 0] }),
  ];
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    e.push(P(`fs_shard_${index}`, `Radial Icicle ${index + 1}`, [Math.cos(angle) * 1.8, 11.6, Math.sin(angle) * 1.8], [0.8, 5, 0.8], "gem", index % 2 === 0 ? ice : p.highlight, "crown", { emissive: true, rotation: outward(angle, 35), origin: [Math.cos(angle) * 1.2, 9.4, Math.sin(angle) * 1.2], opacity: 0.9 }));
  }
  [0, 60, 120].forEach((angle, index) => e.push(P(`fs_flake_${index}`, `Snowflake Arm ${index + 1}`, [0, 12, -1.4], [8, 0.4, 0.3], "rune", p.glow, "flake", { rotation: [0, 0, angle], emissive: true, opacity: 0.75 })));
  return forge("Glacier Heart Staff", "放射状の氷柱と雪華の板を冠する氷霜の杖。核から冷気が溢れる。", theme, res, e, { particle: "ice", circle: "hexagram", loop: "levitate_tilt", circleY: 12, circleTilt: 0, layers: 2, glyphs: true, floatType: "shard", floatY: 12 });
}

// ============================ STAFF: DRUID STAFF ============================
function druidStaff(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const leafA = "#4caf50";
  const leafB = "#9ccc65";
  const e: ModelElement[] = [];
  for (let index = 0; index < 10; index += 1) {
    e.push(P(`ds_trunk_${index}`, `Twisted Trunk ${index + 1}`, [Math.sin(index * 0.9) * 0.6, -16 + index * 2.8, Math.cos(index * 0.9) * 0.3], [1.9 - index * 0.05, 3, 1.9 - index * 0.05], "guard", WOOD, "trunk", { rotation: [0, index * 25, Math.sin(index) * 6] }));
  }
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2;
    const x = Math.cos(angle) * 1.6;
    const z = Math.sin(angle) * 1.6;
    e.push(P(`ds_branch_${index}a`, `Branch ${index + 1}a`, [x, 13.4, z], [0.8, 3.4, 0.8], "guard", WOOD, "crown", { rotation: outward(angle, 30), origin: [x * 0.5, 11.6, z * 0.5] }));
    e.push(P(`ds_branch_${index}b`, `Branch ${index + 1}b`, [x * 1.4, 16, z * 1.4], [0.6, 2.4, 0.6], "guard", WOOD, "crown", { rotation: outward(angle, -20) }));
  }
  e.push(P("ds_seed", "World Seed", [0, 14.4, 0], [2.4, 2.4, 2.4], "gem", p.glow, "crown", { emissive: true, rotation: [45, 45, 0] }));
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    e.push(P(`ds_leaf_${index}`, `Leaf ${index + 1}`, [Math.cos(angle) * 3, 15.6 + (index % 2) * 1.2, Math.sin(angle) * 3], [1.8, 0.3, 1], "rune", index % 2 === 0 ? leafA : leafB, "leaves", { rotation: [20, -deg(angle), 15] }));
  }
  for (let index = 0; index < 9; index += 1) {
    const angle = index * 1.2;
    e.push(P(`ds_vine_${index}`, `Vine ${index + 1}`, [Math.cos(angle) * 1.2, -12 + index * 2.6, Math.sin(angle) * 1.2], [0.4, 1.8, 0.4], "rune", leafA, "vines", { rotation: [0, deg(angle), 25] }));
  }
  return forge("Elder Grove Druid Staff", "捻れた古木の幹に蔦と葉を纏い、世界樹の種子を抱くドルイドの杖。", theme, res, e, { particle: "cherry", circle: "elemental", loop: "pendulum", circleY: 14, circleTilt: 0, layers: 2, floatType: "orb", floatY: 14, color: p.glow });
}

// ============================ GRIMOIRE: NECRO ============================
function necroGrimoire(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const leather = "#1e1420";
  const e: ModelElement[] = [
    P("ng_back", "Back Cover", [0, 6, -1.6], [10, 13, 0.6], "guard", leather, "book"),
    P("ng_pages", "Cursed Pages", [0.3, 6, 0], [9, 12, 2.6], "rune", PARCHMENT, "book"),
    P("ng_front", "Front Cover", [0, 6, 1.6], [10, 13, 0.6], "guard", leather, "book"),
    P("ng_spine", "Spine", [-5.2, 6, 0], [1, 13, 3.8], "guard", leather, "book"),
    P("ng_skull", "Cover Skull", [0, 7, 2.5], [3, 3, 1], "guard", BONE, "cover"),
    P("ng_jaw", "Cover Jaw", [0, 5, 2.6], [2.2, 1, 0.8], "guard", "#d8cfb8", "cover"),
    ...[-1, 1].map((side) => P(`ng_eye_${side}`, `Skull Eye ${side > 0 ? "R" : "L"}`, [side * 0.7, 7.3, 3.05], [0.6, 0.6, 0.2], "gem", p.glow, "cover", { emissive: true })),
    P("ng_lock", "Seal Padlock", [0, 0.4, 2.3], [2, 2, 0.8], "gem", "#8d6e63", "cover"),
  ];
  [
    [-4.4, 12, 1],
    [4.4, 12, 1],
    [-4.4, 0, 1],
    [4.4, 0, 1],
  ].forEach(([x, y], index) => e.push(P(`ng_corner_${index}`, `Corner Spike ${index + 1}`, [x, y, 2.1], [1.4, 1.4, 0.8], "blade", p.accent, "cover", { rotation: [0, 0, 45] })));
  e.push(...chain("ng_chain_a", "Seal Chain A", [-4.6, 11.6, 2.2], [4.6, 0.4, 2.2], 9, "#4a4058", res, "chains"));
  e.push(...chain("ng_chain_b", "Seal Chain B", [4.6, 11.6, 2.2], [-4.6, 0.4, 2.2], 9, "#4a4058", res, "chains"));
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2;
    e.push(P(`ng_page_${index}`, `Floating Page ${index + 1}`, [Math.cos(angle) * 8, 10 + index, Math.sin(angle) * 8], [3, 4, 0.15], "rune", p.glow, "pages", { emissive: true, rotation: [10, -deg(angle) + 90, index * 12], opacity: 0.85 }));
  }
  return forge("Necronomicon of Chains", "髑髏と二重の鎖で封じられた死霊の禁書。浮遊する頁が呪文を囁く。", theme, res, e, { particle: "souls", circle: "grimoire_seal", loop: "levitate_tilt", circleY: -1, circleTilt: 0, layers: 3, glyphs: true, floatType: "rune_cube", floatY: 8 });
}

// ============================ GRIMOIRE: CELESTIAL CODEX ============================
function celestialCodex(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const gold = "#e0b64f";
  const e: ModelElement[] = [
    P("cc_spine", "Codex Spine", [0, 4, 0], [1.4, 1.6, 12], "guard", p.dark, "book"),
    P("cc_cover_l", "Cover Left", [-4.2, 4.4, 0], [8, 1, 13], "guard", p.primary, "book", { rotation: [0, 0, 16], origin: [-0.6, 4.4, 0] }),
    P("cc_cover_r", "Cover Right", [4.2, 4.4, 0], [8, 1, 13], "guard", p.primary, "book", { rotation: [0, 0, -16], origin: [0.6, 4.4, 0] }),
    P("cc_page_l", "Star Map Left", [-3.8, 5.4, 0], [7, 1.2, 11.6], "rune", p.glow, "pages", { rotation: [0, 0, 11], origin: [-0.6, 5.4, 0], emissive: true }),
    P("cc_page_r", "Star Map Right", [3.8, 5.4, 0], [7, 1.2, 11.6], "rune", p.glow, "pages", { rotation: [0, 0, -11], origin: [0.6, 5.4, 0], emissive: true }),
    P("cc_star", "Central Star", [0, 11, 0], [2.4, 2.4, 2.4], "gem", "#fff8e1", "cosmos", { emissive: true, rotation: [45, 45, 0] }),
    P("cc_star_halo", "Star Corona", [0, 11, 0], [3.4, 3.4, 3.4], "rune", p.glow, "cosmos", { emissive: true, rotation: [45, 0, 45], opacity: 0.35 }),
  ];
  [
    [-7.6, 4.6],
    [7.6, 4.6],
  ].forEach(([x], index) =>
    [-6, 6].forEach((z, j) => e.push(P(`cc_corner_${index}_${j}`, `Gold Corner ${index * 2 + j + 1}`, [x * 0.98, 4.4 + (index === 0 ? 2 : 2), z], [1.4, 0.6, 1.4], "guard", gold, "book", { rotation: [0, 45, index === 0 ? 16 : -16] }))),
  );
  const planetColors = [p.accent, p.highlight, "#ffab40", p.glow, "#b388ff"];
  for (let index = 0; index < 5; index += 1) {
    const angle = (index / 5) * Math.PI * 2;
    const size = 0.9 + (index % 3) * 0.45;
    e.push(P(`cc_planet_${index}`, `Planet ${index + 1}`, [Math.cos(angle) * 7, 10 + Math.sin(index * 2) * 1.2, Math.sin(angle) * 7], [size, size, size], "gem", planetColors[index], "cosmos", { emissive: true, rotation: [45, 45, 0] }));
  }
  e.push(...ringOf("cc_orbit", "Orbit Path", [0, 10, 0], 7, 24, [1.6, 0.15, 0.15], "xz", { region: "rune", color: gold, group: "cosmos", resolution: res, emissive: true, opacity: 0.6 }));
  return forge("Astral Codex", "星図を描いた頁と周回する惑星を持つ天文の写本。中央に恒星が輝く。", theme, res, e, { particle: "stars", circle: "celestial_sun", loop: "hover_spin", circleY: 2, circleTilt: 0, layers: 3, glyphs: true, floatEnabled: false });
}

// ============================ RANGED: CROSSBOW ============================
function crossbow(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    P("xb_stock", "Tiller Stock", [0, 0, 0], [2, 2.4, 16], "guard", WOOD, "stock"),
    P("xb_butt", "Butt Plate", [0, -1, -8.6], [2.4, 4, 2], "guard", WOOD, "stock"),
    P("xb_trigger", "Trigger Lever", [0, -2.4, -2], [0.6, 2.4, 0.8], "blade", p.secondary, "stock", { rotation: [20, 0, 0] }),
    P("xb_rail", "Bolt Rail", [0, 1.4, 2], [1, 0.4, 10], "rune", p.accent, "stock"),
    P("xb_bolt", "Mana Bolt", [0, 2, 3.4], [0.5, 0.5, 10], "guard", p.highlight, "bolt"),
    P("xb_bolt_head", "Bolt Head", [0, 2, 9], [1, 1, 1.8], "gem", p.glow, "bolt", { emissive: true, rotation: [0, 0, 45] }),
    P("xb_stirrup", "Stirrup", [0, 0, 8.8], [3.4, 1, 0.8], "blade", p.secondary, "stock"),
  ];
  [-1, 1].forEach((side) => {
    for (let index = 0; index < 3; index += 1) {
      e.push(P(`xb_prod_${side}_${index}`, `Prod Limb ${side > 0 ? "R" : "L"}${index + 1}`, [side * (2 + index * 2.4), 0.4, 7.4 - index * index * 0.5], [2.6, 1, 1], "blade", index === 2 ? p.accent : p.primary, "prod", { rotation: [0, side * -(index * 14), 0] }));
    }
    e.push(P(`xb_string_${side}`, `String ${side > 0 ? "R" : "L"}`, [side * 3.8, 0.4, 4.4], [7.4, 0.25, 0.25], "rune", p.highlight, "prod", { rotation: [0, side * 33, 0] }));
  });
  e.push(...gear("xb_crank", "Windlass Crank", [1.6, 0, -5], 1.2, 0.6, p.accent, res, "crank", 6));
  return forge("Arbalest Crossbow", "巻き上げ機で引き絞る重クロスボウ。魔力を込めたボルトを放つ。", theme, res, e, { particle: "feathers", circle: "runic_ring", loop: "levitate_tilt", circleY: 0, circleRadius: 7, floatEnabled: false });
}

// ============================ RANGED: COMPOUND BOW ============================
function compoundBow(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const P = maker(res);
  const e: ModelElement[] = [
    P("cb_riser", "Machined Riser", [0, 0, 0], [1.6, 12, 2], "guard", p.dark, "riser"),
    P("cb_grip", "Grip", [-0.4, -0.5, 0], [2.2, 3.6, 2.4], "rune", "#222", "riser"),
    P("cb_shelf", "Arrow Shelf", [0.9, 1.6, 0], [1, 0.6, 1.6], "blade", p.secondary, "riser"),
    P("cb_stab", "Stabilizer Rod", [0, -2.4, 6], [0.8, 0.8, 10], "guard", p.dark, "stabilizer"),
    P("cb_weight", "Stabilizer Weight", [0, -2.4, 11.4], [1.6, 1.6, 1.4], "gem", p.accent, "stabilizer"),
    P("cb_sight", "Sight Housing", [1.4, 3.2, 0.8], [0.6, 2, 2], "guard", p.dark, "sight"),
    ...[0, 1, 2].map((index) => P(`cb_pin_${index}`, `Sight Pin ${index + 1}`, [1.4, 2.6 + index * 0.6, 1.9], [0.3, 0.3, 0.3], "gem", [p.glow, "#76ff03", "#ff1744"][index], "sight", { emissive: true })),
    P("cb_arrow", "Carbon Arrow", [1.2, 1.9, 1], [0.4, 0.4, 16], "guard", "#263238", "arrow", { rotation: [0, 0, 0] }),
    P("cb_arrow_head", "Broadhead", [1.2, 1.9, 9.4], [1.2, 0.3, 1.6], "blade", p.highlight, "arrow", { emissive: true }),
  ];
  [-1, 1].forEach((side) => {
    e.push(P(`cb_limb_${side}a`, `Limb ${side > 0 ? "Top" : "Bottom"} A`, [-0.6, side * 7.6, 0], [1.4, 4.4, 2], "blade", p.primary, "limbs", { rotation: [0, 0, side * 14] }));
    e.push(P(`cb_limb_${side}b`, `Limb ${side > 0 ? "Top" : "Bottom"} B`, [-1.8, side * 11, 0], [1.2, 3.6, 1.8], "blade", p.primary, "limbs", { rotation: [0, 0, side * 28] }));
    e.push(...ringOf(`cb_cam_${side}`, `Cam ${side > 0 ? "Top" : "Bottom"}`, [-2.6, side * 12.8, 0], 1.2, 8, [1, 0.5, 0.6], "xy", { region: "rune", color: p.accent, group: "cams", resolution: res, emissive: true }));
    e.push(P(`cb_cable_${side}`, `Cable ${side > 0 ? "Top" : "Bottom"}`, [-1.4, side * 6.4, -0.6], [0.25, 12.4, 0.25], "rune", p.highlight, "cables", { rotation: [0, 0, side * -10] }));
  });
  return forge("Vector Compound Bow", "カム機構と照準ピン、スタビライザーを備えた近代コンパウンドボウ。", theme, res, e, { particle: "sparks", circle: "hex_tech", loop: "levitate_tilt", circleY: 0, circleRadius: 8, floatEnabled: false });
}

export function generateArsenalA(type: ModelArchetype, theme: ModelTheme, res: TextureResolution): ModelData | null {
  switch (type) {
    case "drill_lance":
      return drillLance(theme, res);
    case "pile_bunker":
      return pileBunker(theme, res);
    case "crystal_scepter":
      return crystalScepter(theme, res);
    case "orb_catalyst":
      return orbCatalyst(theme, res);
    case "soul_lantern":
      return soulLantern(theme, res);
    case "bone_scythe":
      return boneScythe(theme, res);
    case "blood_scythe":
      return bloodScythe(theme, res);
    case "hemo_lance":
      return hemoLance(theme, res);
    case "frost_staff":
      return frostStaff(theme, res);
    case "druid_staff":
      return druidStaff(theme, res);
    case "necro_grimoire":
      return necroGrimoire(theme, res);
    case "celestial_codex":
      return celestialCodex(theme, res);
    case "crossbow":
      return crossbow(theme, res);
    case "compound_bow":
      return compoundBow(theme, res);
    default:
      return null;
  }
}

