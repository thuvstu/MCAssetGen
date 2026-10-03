import { ModelArchetype, ModelData, ModelElement, ModelTheme, TextureResolution } from "@/types/model";
import { PALETTES } from "@/lib/generators/textureBaker";
import { assembly, chain, gear, group, part } from "@/lib/generators/kit";

// ============================ 1. MECH HAMMER ============================
function mechHammer(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const c = p.secondary;
  const e: ModelElement[] = [
    part("mh_handle", "Grip Steel Pipe", [0, -10, 0], [2, 14, 2], { region: "guard", color: c, group: "body", resolution: res }),
    part("mh_grip", "Rubber Grip", [0, -6, 0], [2.6, 6, 2.6], { region: "rune", color: p.dark, group: "body", resolution: res }),
    part("mh_pommel", "Butt Cap", [0, -17, 0], [3, 1.6, 3], { region: "guard", color: p.accent, group: "body", resolution: res }),
    part("mh_piston_a", "Piston Left", [-2.2, -2, 0], [1.2, 6, 1.2], { region: "blade", color: p.primary, group: "mech", rotation: [0, 0, -8], resolution: res }),
    part("mh_piston_b", "Piston Right", [2.2, -2, 0], [1.2, 6, 1.2], { region: "blade", color: p.primary, group: "mech", rotation: [0, 0, 8], resolution: res }),
    part("mh_head", "Hammer Head Block", [0, 6, 0], [9, 6, 6], { region: "blade", color: p.primary, group: "head", resolution: res }),
    part("mh_head_plate", "Impact Face Plate", [0, 6, 3.4], [7, 4.6, 0.8], { region: "guard", color: p.accent, group: "head", resolution: res }),
    part("mh_head_back", "Rear Counter Weight", [0, 6, -3.6], [6, 4, 1.2], { region: "guard", color: p.dark, group: "head", resolution: res }),
    part("mh_chimney", "Steam Chimney", [-3, 10.2, -1.4], [1.6, 2.4, 1.6], { region: "guard", color: p.dark, group: "mech", resolution: res }),
    part("mh_valve", "Pressure Valve", [3.2, 9.4, 1.6], [1.4, 1.4, 1.4], { region: "gem", color: p.glow, emissive: true, group: "mech", rotation: [0, 45, 0], resolution: res }),
    part("mh_core", "Boiler Core Crystal", [0, 6, 0], [2.4, 2.4, 6.6], { region: "gem", color: p.glow, emissive: true, group: "head", resolution: res }),
  ];
  const gears = [
    ...gear("mh_g1", "Left Cog", [-4.2, 2.2, 0], 2.6, 0.9, p.accent, res, "mech"),
    ...gear("mh_g2", "Right Cog", [4.2, 2.2, 0], 2.6, 0.9, p.accent, res, "mech", 6),
    ...gear("mh_g3", "Top Cog", [0, 11.4, 0], 2, 0.8, p.secondary, res, "mech", 6),
  ];
  const all = [...e, ...gears];
  return assembly("Clockwork Gear Hammer", "機械式ギアハンマー。ボイラー心核と3基の駆動歯車を備えた打撃兵器。", "sword", theme, all,
    [
      group("body", "Grip Assembly", ["mh_handle", "mh_grip", "mh_pommel"]),
      group("mech", "Mechanics", [...gears.map((part) => part.id), "mh_piston_a", "mh_piston_b", "mh_chimney", "mh_valve"]),
      group("head", "Hammer Head", ["mh_head", "mh_head_plate", "mh_head_back", "mh_core"]),
    ],
    {
      particleType: "gears",
      circleStyle: "gear_ring",
      loop: "pulse_glow",
      floatingItems: { enabled: true, count: 3, type: "rune_cube", orbitRadius: 8, orbitSpeed: 1.6, heightOffset: 6, bobbingAmplitude: 1, color: PALETTES[theme].glow },
      magicCircle: { enabled: true, radius: 11, rotationSpeed: 1.4, yOffset: 6, tiltAngle: 90, style: "gear_ring", color: PALETTES[theme].glow, emissiveIntensity: 1.9 },
    },
  );
}

// ============================ 2. BLOOD BLADE ============================
function bloodBlade(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const blood = "#8b0000";
  const e: ModelElement[] = [
    part("bb_grip", "Leather Grip", [0, -8, 0], [1.8, 9, 1.8], { region: "guard", color: p.dark, group: "hilt", resolution: res }),
    part("bb_pommel", "Skull Pommel", [0, -13, 0], [2.6, 2.6, 2.6], { region: "gem", color: blood, group: "hilt", rotation: [45, 45, 0], emissive: true, resolution: res }),
    part("bb_guard", "Ribcage Guard", [0, -2.5, 0], [7, 1.4, 2], { region: "blade", color: blood, group: "hilt", resolution: res }),
    part("bb_guard_l", "Guard Fang Left", [-3.6, -1.2, 0], [1, 3, 1], { region: "blade", color: blood, group: "hilt", rotation: [0, 0, -28], resolution: res }),
    part("bb_guard_r", "Guard Fang Right", [3.6, -1.2, 0], [1, 3, 1], { region: "blade", color: blood, group: "hilt", rotation: [0, 0, 28], resolution: res }),
    part("bb_blade", "Crimson Blade Body", [0, 8, 0], [2.6, 19, 0.9], { region: "blade", color: blood, group: "blade", resolution: res }),
    part("bb_edge", "Blood Channel", [0, 8, 0.55], [0.7, 17, 0.3], { region: "rune", color: p.glow, emissive: true, group: "blade", resolution: res }),
    part("bb_tip", "Blade Tip Fang", [0, 19.5, 0], [1.4, 4, 0.6], { region: "blade", color: blood, group: "blade", rotation: [0, 0, 0], resolution: res }),
    part("bb_serration_l", "Serrated Edge Left", [-1.7, 12, 0], [1, 2.2, 0.5], { region: "blade", color: blood, group: "blade", rotation: [0, 0, -22], resolution: res }),
    part("bb_serration_r", "Serrated Edge Right", [1.7, 6, 0], [1, 2.2, 0.5], { region: "blade", color: blood, group: "blade", rotation: [0, 0, 22], resolution: res }),
    part("bb_heart", "Pulse Heart Gem", [0, -2.5, 1.2], [1.6, 1.6, 1], { region: "gem", color: p.glow, emissive: true, group: "hilt", rotation: [0, 0, 45], resolution: res }),
  ];
  const drips = Array.from({ length: 5 }, (_, index) =>
    part(`bb_drip_${index}`, `Blood Drip ${index + 1}`, [(index % 2 === 0 ? -1 : 1) * (1.2 + index * 0.35), 16 - index * 3.6, 0.6], [0.5, 1.4 + index * 0.3, 0.4], {
      region: "gem",
      color: blood,
      group: "blade",
      emissive: true,
      opacity: 0.85,
      resolution: res,
    }),
  );
  return assembly("Blood Reaper Blade", "ブラッド系の生体剣。脈打つ心核と滴る血の通路を刃に宿す。", "sword", theme, [...e, ...drips],
    [group("hilt", "Hilt", e.filter((part) => part.group === "hilt").map((part) => part.id)), group("blade", "Blade", e.filter((part) => part.group === "blade").map((part) => part.id).concat(drips.map((part) => part.id)))],
    {
      particleType: "blood",
      circleStyle: "blood_rune",
      loop: "idle_float",
      magicCircle: { enabled: true, radius: 10, rotationSpeed: -1.1, yOffset: 3, tiltAngle: 90, style: "blood_rune", color: "#8b0000", emissiveIntensity: 2.1 },
      floatingItems: { enabled: true, count: 4, type: "orb", orbitRadius: 6.5, orbitSpeed: 1.2, heightOffset: 8, bobbingAmplitude: 1.6, color: "#8b0000" },
      particles: { enabled: true, type: "blood", density: 60, speed: 1.2, spread: 4, color: "#8b0000", secondaryColor: p.glow },
    },
  );
}

// ============================ 3. CURSED BLADE ============================
function cursedBlade(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const dark = "#120b1c";
  const e: ModelElement[] = [
    part("cb_staff", "Obsidian Shaft", [0, -2, 0], [2.2, 20, 2.2], { region: "guard", color: dark, group: "body", resolution: res }),
    part("cb_ring_a", "Binding Ring Upper", [0, 5, 0], [3.2, 1, 3.2], { region: "rune", color: p.glow, emissive: true, group: "body", resolution: res }),
    part("cb_ring_b", "Binding Ring Lower", [0, -6, 0], [3.2, 1, 3.2], { region: "rune", color: p.glow, emissive: true, group: "body", resolution: res }),
    part("cb_head", "Cursed Head Mass", [0, 12, 0], [5, 5, 5], { region: "blade", color: dark, group: "head", rotation: [45, 45, 0], resolution: res }),
    part("cb_eye_main", "Great Watching Eye", [0, 12, 3.2], [2.6, 1.6, 0.6], { region: "gem", color: p.glow, emissive: true, group: "head", resolution: res }),
    part("cb_eye_l", "Watching Eye Left", [-3, 10.4, 1.6], [1.6, 1, 0.5], { region: "gem", color: p.glow, emissive: true, group: "head", resolution: res }),
    part("cb_eye_r", "Watching Eye Right", [3, 10.4, 1.6], [1.6, 1, 0.5], { region: "gem", color: p.glow, emissive: true, group: "head", resolution: res }),
  ];
  const horns = [-1, 1].flatMap((side) => [
    part(`cb_horn_${side > 0 ? "r" : "l"}_a`, `Horn ${side > 0 ? "R" : "L"} 1`, [side * 4, 14.5, 0], [1.2, 5, 1.2], { region: "blade", color: dark, group: "head", rotation: [0, 0, side * -32], origin: [side * 2, 12, 0], resolution: res }),
    part(`cb_horn_${side > 0 ? "r" : "l"}_b`, `Horn ${side > 0 ? "R" : "L"} 2`, [side * 6.2, 17, -1], [1, 4, 1], { region: "blade", color: dark, group: "head", rotation: [-12, 0, side * -52], origin: [side * 3, 13, 0], resolution: res }),
  ]);
  const chains = chain("cb_chain_l", "Seal Chain Left", [-3, 6, -1], [-4.6, -8, -1.4], 5, "#3b3350", res, "chains");
  const chains2 = chain("cb_chain_r", "Seal Chain Right", [3, 6, -1], [4.6, -8, -1.4], 5, "#3b3350", res, "chains");
  return assembly("Cursed Watching Blade", "禍々しい呪詛の刃。多数の魔眼と封鎖鎖を纏い、闇の残滓を撒き散らす。", "sword", theme, [...e, ...horns, ...chains, ...chains2],
    [group("body", "Shaft", e.filter((part) => part.group === "body").map((part) => part.id)), group("head", "Cursed Head", e.filter((part) => part.group === "head").map((part) => part.id).concat(horns.map((part) => part.id))), group("chains", "Binding Chains", [...chains, ...chains2].map((part) => part.id))],
    {
      particleType: "souls",
      circleStyle: "pentagram",
      loop: "magic_cast",
      magicCircle: { enabled: true, radius: 12, rotationSpeed: -1.6, yOffset: 12, tiltAngle: 25, style: "pentagram", color: p.glow, emissiveIntensity: 2.6 },
      particles: { enabled: true, type: "souls", density: 75, speed: 1.4, spread: 5, color: p.glow, secondaryColor: "#3b3350" },
      floatingItems: { enabled: true, count: 5, type: "rune_cube", orbitRadius: 8, orbitSpeed: -1.4, heightOffset: 12, bobbingAmplitude: 2, color: p.glow },
    },
  );
}

// ============================ 4. WIZARD STAFF ============================
function wizardStaff(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const wood = "#5b4632";
  const e: ModelElement[] = [
    part("ws_rod", "Elderwood Rod", [0, -6, 0], [1.8, 30, 1.8], { region: "guard", color: wood, group: "body", resolution: res }),
    part("ws_wrap", "Leather Wrap", [0, -2, 0], [2.4, 6, 2.4], { region: "rune", color: p.dark, group: "body", resolution: res }),
    part("ws_knot_a", "Branch Knot Upper", [1.4, 6, 0], [1.4, 1.4, 1.4], { region: "guard", color: wood, group: "body", rotation: [0, 45, 0], resolution: res }),
    part("ws_knot_b", "Branch Knot Lower", [-1.4, -9, 0], [1.4, 1.4, 1.4], { region: "guard", color: wood, group: "body", rotation: [0, 45, 0], resolution: res }),
    part("ws_claw_base", "Orb Claw Base", [0, 10, 0], [4, 1.2, 4], { region: "guard", color: p.accent, group: "head", resolution: res }),
  ];
  const claws = [-1, 1].flatMap((side) =>
    [
      part(`ws_claw_${side > 0 ? "r" : "l"}_1`, `Claw ${side > 0 ? "R" : "L"} 1`, [side * 1.9, 12, 0], [0.8, 5, 0.8], { region: "blade", color: p.accent, group: "head", rotation: [0, 0, side * -14], origin: [0, 10, 0], resolution: res }),
      part(`ws_claw_${side > 0 ? "r" : "l"}_2`, `Claw ${side > 0 ? "R" : "L"} 2`, [0, 13, side * 1.9], [0.8, 5, 0.8], { region: "blade", color: p.accent, group: "head", rotation: [side * 14, 0, 0], origin: [0, 10, 0], resolution: res }),
    ],
  );
  const orb = [
    part("ws_orb", "Mana Orb Core", [0, 13.5, 0], [4.4, 4.4, 4.4], { region: "gem", color: p.glow, emissive: true, group: "head", rotation: [45, 45, 0], resolution: res }),
    part("ws_orb_shell", "Mana Orb Shell", [0, 13.5, 0], [5.2, 5.2, 5.2], { region: "rune", color: p.glow, emissive: true, group: "head", rotation: [45, 45, 0], opacity: 0.35, resolution: res }),
  ];
  const rings = [0, 1].map((index) =>
    part(`ws_ring_${index}`, `Orbit Ring ${index + 1}`, [0, 13.5, 0], [9 - index * 2, 0.4, 0.4], {
      region: "rune",
      color: p.glow,
      emissive: true,
      group: "head",
      rotation: [index * 30 + 20, 0, index * 30],
      resolution: res,
    }),
  );
  return assembly("Grand Wizard Staff", "魔導師の大型杖。マナ球を三重の揺籃リングで保持し、周回する符札が詠唱を補助する。", "staff", theme, [...e, ...claws, ...orb, ...rings],
    [group("body", "Staff Body", e.map((part) => part.id)), group("head", "Mana Head", [...claws, ...orb, ...rings].map((part) => part.id))],
    {
      particleType: "runes",
      circleStyle: "arcane_clock",
      loop: "magic_cast",
      magicCircle: { enabled: true, radius: 9, rotationSpeed: 1.2, yOffset: 13.5, tiltAngle: 0, style: "arcane_clock", color: p.glow, emissiveIntensity: 2.4 },
      particles: { enabled: true, type: "runes", density: 70, speed: 1.1, spread: 5, color: p.glow, secondaryColor: p.accent },
      floatingItems: { enabled: true, count: 4, type: "rune_cube", orbitRadius: 7, orbitSpeed: 1.3, heightOffset: 13.5, bobbingAmplitude: 1.4, color: p.glow },
    },
  );
}

// ============================ 5. BOW ============================
function bow(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const wood = "#6b4a2f";
  const limbs = Array.from({ length: 7 }, (_, index) => {
    const t = index / 6;
    const y = -10 + t * 26;
    const x = Math.sin(t * Math.PI) * 6.2;
    return part(`bw_limb_${index}`, `Limb Segment ${index + 1}`, [x, y, 0], [1.4, 4.4, 1.2], {
      region: "blade",
      color: index % 2 === 0 ? wood : p.primary,
      group: "limbs",
      rotation: [0, 0, -34 + t * 68],
      resolution: res,
    });
  });
  const string = Array.from({ length: 9 }, (_, index) =>
    part(`bw_string_${index}`, `Bow String ${index + 1}`, [6.2 - index * 1.2, 13 - index * 3, 0], [0.28, 3.2, 0.28], {
      region: "rune",
      color: p.highlight,
      group: "string",
      rotation: [0, 0, 20 - index * 4],
      resolution: res,
    }),
  );
  const arrow = [
    part("bw_shaft", "Arrow Shaft", [1.6, -1, 2], [0.5, 18, 0.5], { region: "guard", color: p.highlight, group: "arrow", rotation: [0, 0, -6], resolution: res }),
    part("bw_head", "Arrow Head", [2.6, 9, 2], [1.2, 2.4, 1.2], { region: "blade", color: p.accent, group: "arrow", rotation: [0, 0, -6], emissive: true, resolution: res }),
    part("bw_fletch_a", "Fletching A", [1, -8.5, 2], [2.2, 2.4, 0.3], { region: "rune", color: p.primary, group: "arrow", rotation: [0, 30, -6], resolution: res }),
    part("bw_fletch_b", "Fletching B", [1, -8.5, 2], [0.3, 2.4, 2.2], { region: "rune", color: p.primary, group: "arrow", rotation: [0, 30, -6], resolution: res }),
    part("bw_grip", "Riser Grip", [0, -1, 0], [2, 6, 2.2], { region: "rune", color: p.dark, group: "limbs", resolution: res }),
  ];
  return assembly("Sylvan Longbow", "森の長弓。反り返るリムと輝く弦、魔力を宿した矢を抱える。", "sword", theme, [...limbs, ...string, ...arrow],
    [group("limbs", "Bow Limbs", [...limbs.map((part) => part.id), "bw_grip"]), group("string", "Bow String", string.map((part) => part.id)), group("arrow", "Arrow", arrow.map((part) => part.id))],
    {
      particleType: "sparkle",
      circleStyle: "runic_ring",
      loop: "idle_float",
      magicCircle: { enabled: true, radius: 7, rotationSpeed: 0.8, yOffset: 1, tiltAngle: 90, style: "runic_ring", color: p.glow, emissiveIntensity: 1.6 },
    },
  );
}

// ============================ 6. ASSAULT RIFLE ============================
function gun(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const body = p.dark;
  const metal = "#3c4250";
  const e: ModelElement[] = [
    part("gn_receiver", "Receiver Body", [0, 0, 0], [2.2, 4.4, 14], { region: "guard", color: body, group: "body", resolution: res }),
    part("gn_rail", "Top Picatinny Rail", [0, 2.6, 1], [1.6, 0.7, 10], { region: "rune", color: metal, group: "body", resolution: res }),
    part("gn_barrel", "Barrel Assembly", [0, 1, 10.5], [1.3, 1.3, 9], { region: "blade", color: metal, group: "barrel", resolution: res }),
    part("gn_muzzle", "Muzzle Brake", [0, 1, 15.4], [1.9, 1.9, 1.8], { region: "guard", color: body, group: "barrel", resolution: res }),
    part("gn_handguard", "Ventilated Handguard", [0, 0.4, 6.6], [2.6, 2.6, 7], { region: "guard", color: body, group: "barrel", resolution: res }),
    part("gn_mag", "Curved Magazine", [0, -4.6, 1.4], [1.7, 6, 3], { region: "guard", color: metal, group: "body", rotation: [-14, 0, 0], resolution: res }),
    part("gn_grip", "Pistol Grip", [0, -4, -3.4], [1.7, 5, 2.2], { region: "rune", color: body, group: "body", rotation: [18, 0, 0], resolution: res }),
    part("gn_stock", "Adjustable Stock", [0, 0.2, -8.6], [1.9, 3.4, 6], { region: "guard", color: body, group: "body", resolution: res }),
    part("gn_stock_pad", "Recoil Pad", [0, 0.2, -11.8], [2.2, 3.8, 0.8], { region: "rune", color: metal, group: "body", resolution: res }),
    part("gn_sight", "Holo Sight", [0, 3.6, -0.6], [1.5, 1.6, 2.2], { region: "guard", color: body, group: "body", resolution: res }),
    part("gn_sight_lens", "Holo Lens", [0, 3.6, 0.7], [1.1, 1, 0.3], { region: "gem", color: p.glow, emissive: true, group: "body", resolution: res }),
    part("gn_charging", "Charging Handle", [1.6, 2.2, -2.2], [1, 1, 2.2], { region: "blade", color: metal, group: "body", resolution: res }),
    part("gn_core", "Energy Cell", [-1.7, 1, -5.2], [0.7, 1.6, 3], { region: "gem", color: p.glow, emissive: true, group: "body", resolution: res }),
  ];
  return assembly("VX-9 Assault Carbine", "近代的アサルトカービン。ホロサイトとエネルギーセルを備えた短機関銃。", "sword", theme, e,
    [group("body", "Receiver", e.filter((part) => part.group === "body").map((part) => part.id)), group("barrel", "Barrel", e.filter((part) => part.group === "barrel").map((part) => part.id))],
    {
      particleType: "sparks",
      circleStyle: "gear_ring",
      loop: "wing_flutter",
      magicCircle: { enabled: true, radius: 7, rotationSpeed: 1.1, yOffset: 1, tiltAngle: 90, style: "gear_ring", color: p.glow, emissiveIntensity: 1.2 },
      floatingItems: { enabled: true, count: 2, type: "blade_ring", orbitRadius: 8, orbitSpeed: 1.7, heightOffset: 1, bobbingAmplitude: 0.6, color: p.glow },
      particles: { enabled: true, type: "sparks", density: 35, speed: 1.6, spread: 3, color: p.glow, secondaryColor: p.accent },
    },
  );
}

// ============================ 7. CHAINSAW ============================
function chainsaw(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const housing = "#2c3140";
  const chain = "#b6bec9";
  const teeth = Array.from({ length: 14 }, (_, index) => {
    const z = -4 + index * 1.7;
    return part(`cs_tooth_${index}`, `Chain Tooth ${index + 1}`, [0, 3.4 + (index % 2) * 0.5, z], [1.4, 1, 1.1], {
      region: "blade",
      color: chain,
      group: "chain",
      rotation: [index % 2 === 0 ? -18 : 18, 0, 0],
      emissive: index % 3 === 0,
      resolution: res,
    });
  });
  const e: ModelElement[] = [
    part("cs_bar", "Guide Bar", [0, 1.6, 6], [1.1, 3.6, 20], { region: "blade", color: chain, group: "chain", resolution: res }),
    part("cs_bar_tip", "Bar Nose Sprocket", [0, 1.6, 16.6], [1.3, 2.6, 2.6], { region: "gem", color: p.glow, emissive: true, group: "chain", resolution: res }),
    part("cs_body", "Engine Housing", [0, 1, -6.6], [5, 6, 8], { region: "guard", color: housing, group: "engine", resolution: res }),
    part("cs_casing", "Red Recoil Casing", [0, 4.4, -6.6], [5.4, 1.2, 8.4], { region: "blade", color: p.primary, group: "engine", resolution: res }),
    part("cs_handle_top", "Top Carry Handle", [0, 7.2, -6.2], [1.4, 1.4, 6], { region: "guard", color: housing, group: "engine", resolution: res }),
    part("cs_handle_rear", "Rear Grip Handle", [0, 0, -11.6], [1.6, 5, 2.2], { region: "rune", color: housing, group: "engine", rotation: [-12, 0, 0], resolution: res }),
    part("cs_exhaust", "Exhaust Muffler", [-2.9, 3.2, -8.4], [1, 2.2, 2.6], { region: "guard", color: "#4b5563", group: "engine", resolution: res }),
    part("cs_starter", "Starter Recoil Cover", [3, 1.4, -6.6], [0.8, 3.6, 3.6], { region: "gem", color: p.accent, group: "engine", rotation: [0, 45, 0], resolution: res }),
    part("cs_fuel", "Fuel Tank Glow", [2.6, -1.8, -7.4], [0.7, 2, 3.4], { region: "gem", color: p.glow, emissive: true, group: "engine", resolution: res }),
  ];
  return assembly("Ripper Motor Chainsaw", "内燃チェーンソー。駆動歯が並ぶガイドバーと二気筒エンジンを持つ伐採・近接両用機。", "sword", theme, [...e, ...teeth],
    [group("engine", "Engine", e.map((part) => part.id)), group("chain", "Chain Bar", ["cs_bar", "cs_bar_tip", ...teeth.map((part) => part.id)])],
    {
      particleType: "sparks",
      circleStyle: "gear_ring",
      loop: "wing_flutter",
      magicCircle: { enabled: true, radius: 8, rotationSpeed: 2.2, yOffset: 1.5, tiltAngle: 90, style: "gear_ring", color: p.glow, emissiveIntensity: 1.1 },
      floatingItems: { enabled: false, count: 1, type: "blade_ring", orbitRadius: 6, orbitSpeed: 2, heightOffset: 1.5, bobbingAmplitude: 0.4, color: p.glow },
      particles: { enabled: true, type: "sparks", density: 65, speed: 2, spread: 4, color: p.accent, secondaryColor: p.highlight },
    },
  );
}

// ============================ 8. RAILGUN ============================
function railgun(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const shell = "#242a38";
  const e: ModelElement[] = [
    part("rg_chassis", "Main Chassis", [0, 0, 0], [2.6, 5, 16], { region: "guard", color: shell, group: "body", resolution: res }),
    part("rg_rail_l", "Accelerator Rail Left", [-1.9, 1.4, 6], [1, 1.4, 16], { region: "blade", color: p.primary, group: "rails", emissive: true, resolution: res }),
    part("rg_rail_r", "Accelerator Rail Right", [1.9, 1.4, 6], [1, 1.4, 16], { region: "blade", color: p.primary, group: "rails", emissive: true, resolution: res }),
    part("rg_core_beam", "Plasma Channel", [0, 1.4, 6], [0.8, 0.8, 16], { region: "gem", color: p.glow, emissive: true, group: "rails", opacity: 0.7, resolution: res }),
    part("rg_muzzle", "Focusing Emitter", [0, 1.2, 15.2], [3.6, 3.6, 2.4], { region: "gem", color: p.glow, emissive: true, group: "body", rotation: [0, 45, 0], resolution: res }),
    part("rg_stock", "Shoulder Stock", [0, -0.4, -10], [2, 3.6, 6.4], { region: "guard", color: shell, group: "body", resolution: res }),
    part("rg_grip", "Control Grip", [0, -3.6, -3], [1.8, 5, 2.2], { region: "rune", color: shell, group: "body", rotation: [18, 0, 0], resolution: res }),
    part("rg_scope", "Targeting Optic", [0, 3.4, -2], [1.8, 1.8, 5], { region: "guard", color: shell, group: "body", resolution: res }),
    part("rg_scope_lens", "Optic Lens", [0, 3.4, 0.8], [1.2, 1.2, 0.3], { region: "gem", color: p.glow, emissive: true, group: "body", resolution: res }),
  ];
  const coils = Array.from({ length: 5 }, (_, index) =>
    part(`rg_coil_${index}`, `Induction Coil ${index + 1}`, [0, 1.4, 0.5 + index * 3], [4.4, 4.4, 0.8], {
      region: "rune",
      color: p.accent,
      group: "rails",
      emissive: true,
      rotation: [0, 45, 0],
      resolution: res,
    }),
  );
  const cells = Array.from({ length: 3 }, (_, index) =>
    part(`rg_cell_${index}`, `Capacitor Cell ${index + 1}`, [-2.6, -1.6 - 0.2, -8.5 + index * 3], [0.9, 2, 2], {
      region: "gem",
      color: p.glow,
      emissive: true,
      group: "body",
      resolution: res,
    }),
  );
  return assembly("P-Drive Railgun", "電磁加速レールガン。5基の誘導コイルと高出力コンデンサ群で荷電体を射出する。", "sword", theme, [...e, ...coils, ...cells],
    [group("body", "Chassis", [...e.filter((part) => part.group === "body").map((part) => part.id), ...cells.map((part) => part.id)]), group("rails", "Accelerator Rails", [...e.filter((part) => part.group === "rails").map((part) => part.id), ...coils.map((part) => part.id)])],
    {
      particleType: "lightning",
      circleStyle: "void_spiral",
      loop: "pulse_glow",
      magicCircle: { enabled: true, radius: 8, rotationSpeed: -1.8, yOffset: 1.5, tiltAngle: 90, style: "void_spiral", color: p.glow, emissiveIntensity: 2 },
      particles: { enabled: true, type: "lightning", density: 55, speed: 1.8, spread: 3, color: p.glow, secondaryColor: p.highlight },
      floatingItems: { enabled: true, count: 3, type: "orb", orbitRadius: 7, orbitSpeed: 1.9, heightOffset: 1.5, bobbingAmplitude: 0.8, color: p.glow },
    },
  );
}

// ============================ 9. ORNATE SPEAR ============================
function ornateSpear(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const gold = "#e0b64f";
  const e: ModelElement[] = [
    part("sp_shaft", "Lacquered Shaft", [0, -6, 0], [1.4, 30, 1.4], { region: "guard", color: p.primary, group: "shaft", resolution: res }),
    part("sp_butt", "Iron Butt Spike", [0, -21.5, 0], [1.6, 3, 1.6], { region: "blade", color: gold, group: "shaft", resolution: res }),
    part("sp_blade_main", "Spear Head Main", [0, 17, 0], [3, 9, 1], { region: "blade", color: p.highlight, group: "head", resolution: res }),
    part("sp_blade_edge", "Spear Edge Core", [0, 18, 0.7], [1, 7, 0.3], { region: "rune", color: p.glow, emissive: true, group: "head", resolution: res }),
    part("sp_blade_socket", "Blade Socket", [0, 11.6, 0], [3.2, 2, 3.2], { region: "guard", color: gold, group: "head", rotation: [0, 45, 0], resolution: res }),
    part("sp_cross_l", "Wing Blade Left", [-3.4, 11.4, 0], [4, 1.4, 1], { region: "blade", color: p.highlight, group: "head", rotation: [0, 0, 18], resolution: res }),
    part("sp_cross_r", "Wing Blade Right", [3.4, 11.4, 0], [4, 1.4, 1], { region: "blade", color: p.highlight, group: "head", rotation: [0, 0, -18], resolution: res }),
    part("sp_crest_gem", "Crest Gem", [0, 11.4, 2.2], [1.6, 1.6, 0.6], { region: "gem", color: p.glow, emissive: true, group: "head", rotation: [0, 0, 45], resolution: res }),
  ];
  const bands = [8, 2, -4, -10].map((y, index) =>
    part(`sp_band_${index}`, `Gilded Band ${index + 1}`, [0, y, 0], [2.2, 1.1, 2.2], {
      region: "rune",
      color: gold,
      group: "shaft",
      emissive: index === 1,
      rotation: [0, 45, 0],
      resolution: res,
    }),
  );
  const gems = Array.from({ length: 6 }, (_, index) => {
    const angle = (index / 6) * Math.PI * 2;
    return part(`sp_gem_${index}`, `Inset Gem ${index + 1}`, [Math.cos(angle) * 1.6, 15.2, Math.sin(angle) * 1.6], [0.8, 0.8, 0.8], {
      region: "gem",
      color: index % 2 === 0 ? p.glow : p.accent,
      emissive: true,
      group: "head",
      rotation: [45, 45, 0],
      resolution: res,
    });
  });
  const tassels = [0, 1, 2].map((index) =>
    part(`sp_tassel_${index}`, `Ceremonial Tassel ${index + 1}`, [(index - 1) * 2.4, 7.4, 1.6], [1, 4.4, 0.3], {
      region: "rune",
      color: p.accent,
      group: "shaft",
      rotation: [(index - 1) * 12, 0, (index - 1) * 8],
      resolution: res,
    }),
  );
  return assembly("Celestial Ornate Spear", "満天の装飾を施した儀礼用槍。金細工・宝石六連・三本の房飾りを持つ最上位の刺突武器。", "sword", theme, [...e, ...bands, ...gems, ...tassels],
    [group("shaft", "Shaft", [...e.filter((part) => part.group === "shaft").map((part) => part.id), ...bands.map((part) => part.id), ...tassels.map((part) => part.id)]), group("head", "Ornate Head", [...e.filter((part) => part.group === "head").map((part) => part.id), ...gems.map((part) => part.id)])],
    {
      particleType: "holy",
      circleStyle: "celestial_sun",
      loop: "idle_float",
      magicCircle: { enabled: true, radius: 10, rotationSpeed: 1, yOffset: 12, tiltAngle: 60, style: "celestial_sun", color: p.glow, emissiveIntensity: 2.2 },
      floatingItems: { enabled: true, count: 5, type: "shard", orbitRadius: 7, orbitSpeed: 1.1, heightOffset: 12, bobbingAmplitude: 1.6, color: p.glow },
    },
  );
}

// ============================ 10. SPIKED MACE ============================
function spikedMace(theme: ModelTheme, res: TextureResolution): ModelData {
  const p = PALETTES[theme];
  const iron = "#2f3542";
  const e: ModelElement[] = [
    part("mc_handle", "Wrapped Handle", [0, -8, 0], [2, 12, 2], { region: "rune", color: p.dark, group: "handle", resolution: res }),
    part("mc_guard", "Handle Guard Disk", [0, -1.4, 0], [5, 1.2, 5], { region: "guard", color: iron, group: "handle", rotation: [0, 45, 0], resolution: res }),
    part("mc_pommel", "Pommel Weight", [0, -14.6, 0], [3, 2, 3], { region: "gem", color: p.accent, group: "handle", rotation: [0, 45, 0], emissive: true, resolution: res }),
    part("mc_head", "Flanged Mace Head", [0, 5, 0], [7, 8, 7], { region: "blade", color: iron, group: "head", rotation: [0, 45, 0], resolution: res }),
    part("mc_core", "Molten Core", [0, 5, 0], [3, 4, 3], { region: "gem", color: p.glow, emissive: true, group: "head", resolution: res }),
    part("mc_crest", "Head Crest", [0, 10, 0], [3.4, 1.6, 3.4], { region: "guard", color: p.accent, group: "head", rotation: [0, 45, 0], resolution: res }),
  ];
  const spikes = Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * Math.PI * 2;
    const row = index % 3;
    const y = 2.4 + row * 2.8;
    return part(`mc_spike_${index}`, `Head Spike ${index + 1}`, [Math.cos(angle) * 5, y, Math.sin(angle) * 5], [1.2, 1.2, 3.4], {
      region: "blade",
      color: iron,
      group: "head",
      rotation: [-(row - 1) * 12, (angle * 180) / Math.PI, 0],
      origin: [Math.cos(angle) * 1.5, y, Math.sin(angle) * 1.5],
      emissive: index % 4 === 0,
      resolution: res,
    });
  });
  return assembly("Molten Flanged Mace", "溶鉄のフレンジメイス。十二本の鋭刺と燃える心核を持つ打撃武器。", "sword", theme, [...e, ...spikes],
    [group("handle", "Handle", e.filter((part) => part.group === "handle").map((part) => part.id)), group("head", "Mace Head", [...e.filter((part) => part.group === "head").map((part) => part.id), ...spikes.map((part) => part.id)])],
    {
      particleType: "flame",
      circleStyle: "pentagram",
      loop: "pulse_glow",
      magicCircle: { enabled: true, radius: 10, rotationSpeed: -1.2, yOffset: 5, tiltAngle: 90, style: "pentagram", color: p.glow, emissiveIntensity: 2 },
      floatingItems: { enabled: true, count: 3, type: "rune_cube", orbitRadius: 8, orbitSpeed: 1.3, heightOffset: 5, bobbingAmplitude: 1.2, color: p.glow },
    },
  );
}

export function generateIndustrialTemplate(type: ModelArchetype, theme: ModelTheme, res: TextureResolution = 32): ModelData | null {
  switch (type) {
    case "mech_hammer": return mechHammer(theme, res);
    case "blood_blade": return bloodBlade(theme, res);
    case "cursed_blade": return cursedBlade(theme, res);
    case "wizard_staff": return wizardStaff(theme, res);
    case "bow": return bow(theme, res);
    case "gun": return gun(theme, res);
    case "chainsaw": return chainsaw(theme, res);
    case "railgun": return railgun(theme, res);
    case "spear": return ornateSpear(theme, res);
    case "mace": return spikedMace(theme, res);
    default: return null;
  }
}
