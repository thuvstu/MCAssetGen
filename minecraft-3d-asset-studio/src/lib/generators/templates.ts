import { ModelArchetype, ModelData, ModelElement, ModelGroup, ModelTheme, TextureResolution } from "@/types/model";
import { PALETTES } from "./textureBaker";
import { generateIndustrialTemplate } from "./templatesIndustrial";
import { generateArsenalA } from "./templatesArsenalA";
import { generateArsenalB } from "./templatesArsenalB";
import { categoryForArchetype } from "./catalog";

// Helper to create element faces pointing to texture atlas regions:
// region "blade": [0, 0, 16, 16]
// region "guard": [16, 0, 32, 16]
// region "gem":   [0, 16, 16, 32]
// region "rune":  [16, 16, 32, 32]
function makeFaces(region: "blade" | "guard" | "gem" | "rune", res: TextureResolution = 32) {
  const scale = res / 32;
  let baseU = 0;
  let baseV = 0;
  let span = 16 * scale;

  if (region === "guard") {
    baseU = 16 * scale;
    baseV = 0;
  } else if (region === "gem") {
    baseU = 0;
    baseV = 16 * scale;
  } else if (region === "rune") {
    baseU = 16 * scale;
    baseV = 16 * scale;
  }

  const uv: [number, number, number, number] = [baseU, baseV, baseU + span, baseV + span];
  return {
    north: { uv },
    south: { uv },
    east: { uv },
    west: { uv },
    up: { uv },
    down: { uv },
  };
}

function generateBaseTemplate(
  type: ModelArchetype,
  theme: ModelTheme = "fantasy",
  res: TextureResolution = 32,
): ModelData {
  const palette = PALETTES[theme];

  const industrial = generateIndustrialTemplate(type, theme, res);
  if (industrial) return industrial;

  switch (type) {
    case "sword": {
      // Astral Katana
      const elements: ModelElement[] = [
        // Handle / Tsuka
        {
          id: "handle_base",
          name: "Handle Base",
          group: "handle",
          from: [-1, -8, -1],
          to: [1, 2, 1],
          origin: [0, -3, 0],
          rotation: [0, 0, 0],
          faces: makeFaces("guard", res),
          color: palette.secondary,
        },
        {
          id: "handle_wrap",
          name: "Handle Wrap Accent",
          group: "handle",
          from: [-1.2, -6, -1.2],
          to: [1.2, 0, 1.2],
          origin: [0, -3, 0],
          rotation: [0, 0, 0],
          faces: makeFaces("rune", res),
          inflate: 0.1,
          color: palette.accent,
        },
        {
          id: "pommel",
          name: "Pommel Jewel",
          group: "handle",
          from: [-1.5, -9.5, -1.5],
          to: [1.5, -8, 1.5],
          origin: [0, -8.7, 0],
          rotation: [0, 0, 0],
          faces: makeFaces("gem", res),
          color: palette.glow,
          emissive: true,
        },
        // Tsuba / Guard
        {
          id: "guard_disk",
          name: "Tsuba Guard",
          group: "guard",
          from: [-3.5, 2, -3.5],
          to: [3.5, 3, 3.5],
          origin: [0, 2.5, 0],
          rotation: [0, 0, 0],
          faces: makeFaces("guard", res),
          color: palette.secondary,
        },
        {
          id: "guard_wings_left",
          name: "Guard Flange Left",
          group: "guard",
          from: [-5, 2.2, -1.5],
          to: [-3.5, 2.8, 1.5],
          origin: [-3.5, 2.5, 0],
          rotation: [0, 0, 15],
          faces: makeFaces("gem", res),
          color: palette.accent,
        },
        {
          id: "guard_wings_right",
          name: "Guard Flange Right",
          group: "guard",
          from: [3.5, 2.2, -1.5],
          to: [5, 2.8, 1.5],
          origin: [3.5, 2.5, 0],
          rotation: [0, 0, -15],
          faces: makeFaces("gem", res),
          color: palette.accent,
        },
        // Blade Lower
        {
          id: "blade_lower",
          name: "Blade Lower Section",
          group: "blade",
          from: [-1, 3, -0.6],
          to: [1, 14, 0.6],
          origin: [0, 3, 0],
          rotation: [0, 0, 0],
          faces: makeFaces("blade", res),
          color: palette.primary,
        },
        // Blade Upper (tapered)
        {
          id: "blade_upper",
          name: "Blade Upper Section",
          group: "blade",
          from: [-0.9, 14, -0.5],
          to: [0.9, 24, 0.5],
          origin: [0, 14, 0],
          rotation: [0, 0, 0],
          faces: makeFaces("blade", res),
          color: palette.primary,
        },
        // Blade Tip
        {
          id: "blade_tip",
          name: "Blade Kissaki Tip",
          group: "blade",
          from: [-0.6, 24, -0.4],
          to: [0.6, 29, 0.4],
          origin: [0, 24, 0],
          rotation: [0, 0, 0],
          faces: makeFaces("blade", res),
          color: palette.primary,
        },
        // Glowing fuller runic channel
        {
          id: "blade_fuller",
          name: "Runic Blade Channel",
          group: "blade",
          from: [-0.3, 4, -0.7],
          to: [0.3, 22, 0.7],
          origin: [0, 13, 0],
          rotation: [0, 0, 0],
          faces: makeFaces("rune", res),
          emissive: true,
          color: palette.glow,
        },
      ];

      const groups: ModelGroup[] = [
        { id: "handle", name: "Handle", pivot: [0, -3, 0], rotation: [0, 0, 0], childrenIds: ["handle_base", "handle_wrap", "pommel"] },
        { id: "guard", name: "Crossguard", pivot: [0, 2.5, 0], rotation: [0, 0, 0], childrenIds: ["guard_disk", "guard_wings_left", "guard_wings_right"] },
        { id: "blade", name: "Blade", pivot: [0, 3, 0], rotation: [0, 0, 0], childrenIds: ["blade_lower", "blade_upper", "blade_tip", "blade_fuller"] },
      ];

      return {
        name: "Astral Void Katana",
        description: "A masterwork cosmic blade forged with glowing runic fuller and orbiting void crystal shards.",
        category: "sword",
        theme,
        textureWidth: res,
        textureHeight: res,
        elements,
        groups,
        floatingItems: {
          enabled: true,
          count: 3,
          type: "crystal",
          orbitRadius: 7,
          orbitSpeed: 1.2,
          heightOffset: 2.5,
          bobbingAmplitude: 1.2,
          color: palette.glow,
        },
        magicCircle: {
          enabled: true,
          radius: 9,
          rotationSpeed: 0.8,
          yOffset: 2.5,
          tiltAngle: 90,
          style: "runic_ring",
          color: palette.glow,
          emissiveIntensity: 1.8,
        },
        particles: {
          enabled: true,
          type: theme === "void" ? "void" : theme === "nether" ? "flame" : "sparkle",
          density: 45,
          speed: 1,
          spread: 4,
          color: palette.glow,
          secondaryColor: palette.accent,
        },
        animations: {
          activeAnimation: "idle_float",
          speed: 1.0,
          amplitude: 1.0,
          enableHover: true,
          enableOrbitals: true,
          enablePulse: true,
          enableFlicker: true,
        },
        palette,
      };
    }

    case "greatsword": {
      // Colossal Archangel Greatsword
      const elements: ModelElement[] = [
        { id: "hilt", name: "Grip Two-Handed", group: "hilt", from: [-1, -11, -1], to: [1, 1, 1], origin: [0, -5, 0], rotation: [0, 0, 0], faces: makeFaces("guard", res), color: palette.secondary },
        { id: "pommel_orb", name: "Holy Pommel Core", group: "hilt", from: [-2, -13.5, -2], to: [2, -11, 2], origin: [0, -12, 0], rotation: [0, 0, 0], faces: makeFaces("gem", res), color: palette.glow, emissive: true },
        // Grand Winged Crossguard
        { id: "crossguard_center", name: "Crossguard Core", group: "guard", from: [-3, 1, -2], to: [3, 4, 2], origin: [0, 2.5, 0], rotation: [0, 0, 0], faces: makeFaces("guard", res), color: palette.secondary },
        { id: "guard_left_wing_1", name: "Left Wing Tier 1", group: "guard", from: [-7, 2, -1.5], to: [-3, 4.5, 1.5], origin: [-3, 3, 0], rotation: [0, 0, 15], faces: makeFaces("guard", res), color: palette.accent },
        { id: "guard_left_wing_2", name: "Left Wing Tier 2", group: "guard", from: [-11, 3.5, -1], to: [-7, 5.5, 1], origin: [-7, 4, 0], rotation: [0, 0, 30], faces: makeFaces("rune", res), color: palette.glow, emissive: true },
        { id: "guard_right_wing_1", name: "Right Wing Tier 1", group: "guard", from: [3, 2, -1.5], to: [7, 4.5, 1.5], origin: [3, 3, 0], rotation: [0, 0, -15], faces: makeFaces("guard", res), color: palette.accent },
        { id: "guard_right_wing_2", name: "Right Wing Tier 2", group: "guard", from: [7, 3.5, -1], to: [11, 5.5, 1], origin: [7, 4, 0], rotation: [0, 0, -30], faces: makeFaces("rune", res), color: palette.glow, emissive: true },
        // Colossal Blade
        { id: "blade_ricasso", name: "Blade Ricasso", group: "blade", from: [-2.5, 4, -1], to: [2.5, 10, 1], origin: [0, 4, 0], rotation: [0, 0, 0], faces: makeFaces("blade", res), color: palette.primary },
        { id: "blade_main", name: "Blade Body", group: "blade", from: [-2.8, 10, -0.8], to: [2.8, 25, 0.8], origin: [0, 10, 0], rotation: [0, 0, 0], faces: makeFaces("blade", res), color: palette.primary },
        { id: "blade_point", name: "Blade Point", group: "blade", from: [-2, 25, -0.6], to: [2, 32, 0.6], origin: [0, 25, 0], rotation: [0, 0, 0], faces: makeFaces("blade", res), color: palette.primary },
        // Runic Inlaid Core
        { id: "blade_gem_core", name: "Sun Core Jewel", group: "blade", from: [-1.2, 5, -1.2], to: [1.2, 8, 1.2], origin: [0, 6.5, 0], rotation: [0, 0, 0], faces: makeFaces("gem", res), color: palette.glow, emissive: true },
        { id: "blade_light_strip", name: "Holy Light Channel", group: "blade", from: [-0.6, 8, -1], to: [0.6, 26, 1], origin: [0, 17, 0], rotation: [0, 0, 0], faces: makeFaces("rune", res), color: palette.glow, emissive: true },
      ];

      const groups: ModelGroup[] = [
        { id: "hilt", name: "Hilt", pivot: [0, -5, 0], rotation: [0, 0, 0], childrenIds: ["hilt", "pommel_orb"] },
        { id: "guard", name: "Winged Guard", pivot: [0, 2.5, 0], rotation: [0, 0, 0], childrenIds: ["crossguard_center", "guard_left_wing_1", "guard_left_wing_2", "guard_right_wing_1", "guard_right_wing_2"] },
        { id: "blade", name: "Colossal Blade", pivot: [0, 4, 0], rotation: [0, 0, 0], childrenIds: ["blade_ricasso", "blade_main", "blade_point", "blade_gem_core", "blade_light_strip"] },
      ];

      return {
        name: "Archangel's Dawn Greatsword",
        description: "A monumental two-handed holy blade blessed with golden wings and high-luminosity solar runes.",
        category: "sword",
        theme,
        textureWidth: res,
        textureHeight: res,
        elements,
        groups,
        floatingItems: {
          enabled: true,
          count: 4,
          type: "shard",
          orbitRadius: 10,
          orbitSpeed: 0.9,
          heightOffset: 12,
          bobbingAmplitude: 1.5,
          color: palette.glow,
        },
        magicCircle: {
          enabled: true,
          radius: 12,
          rotationSpeed: 0.6,
          yOffset: 3,
          tiltAngle: 90,
          style: "celestial_sun",
          color: palette.glow,
          emissiveIntensity: 2.2,
        },
        particles: {
          enabled: true,
          type: "holy",
          density: 50,
          speed: 1.2,
          spread: 5,
          color: palette.glow,
          secondaryColor: palette.highlight,
        },
        animations: {
          activeAnimation: "idle_float",
          speed: 0.9,
          amplitude: 1.1,
          enableHover: true,
          enableOrbitals: true,
          enablePulse: true,
          enableFlicker: true,
        },
        palette,
      };
    }

    case "staff": {
      // Celestial Chrono Staff
      const elements: ModelElement[] = [
        { id: "shaft_lower", name: "Shaft Lower", group: "staff_rod", from: [-1, -14, -1], to: [1, 2, 1], origin: [0, -6, 0], rotation: [0, 0, 0], faces: makeFaces("guard", res), color: palette.secondary },
        { id: "shaft_upper", name: "Shaft Upper", group: "staff_rod", from: [-1, 2, -1], to: [1, 16, 1], origin: [0, 9, 0], rotation: [0, 0, 0], faces: makeFaces("guard", res), color: palette.secondary },
        { id: "rod_ring_1", name: "Grip Ring 1", group: "staff_rod", from: [-1.3, -2, -1.3], to: [1.3, 0, 1.3], origin: [0, -1, 0], rotation: [0, 0, 0], faces: makeFaces("rune", res), color: palette.accent },
        { id: "rod_ring_2", name: "Grip Ring 2", group: "staff_rod", from: [-1.3, 10, -1.3], to: [1.3, 12, 1.3], origin: [0, 11, 0], rotation: [0, 0, 0], faces: makeFaces("rune", res), color: palette.accent },
        { id: "butt_spike", name: "Staff Butt Spike", group: "staff_rod", from: [-0.6, -17, -0.6], to: [0.6, -14, 0.6], origin: [0, -15.5, 0], rotation: [0, 0, 0], faces: makeFaces("blade", res), color: palette.primary },
        // Head / Crystalline Cage
        { id: "head_cradle", name: "Orb Cradle Base", group: "head", from: [-2.5, 16, -2.5], to: [2.5, 18, 2.5], origin: [0, 17, 0], rotation: [0, 0, 0], faces: makeFaces("guard", res), color: palette.secondary },
        { id: "cradle_prong_n", name: "Prong North", group: "head", from: [-1, 18, -3.5], to: [1, 25, -2], origin: [0, 18, -2.5], rotation: [-15, 0, 0], faces: makeFaces("blade", res), color: palette.primary },
        { id: "cradle_prong_s", name: "Prong South", group: "head", from: [-1, 18, 2], to: [1, 25, 3.5], origin: [0, 18, 2.5], rotation: [15, 0, 0], faces: makeFaces("blade", res), color: palette.primary },
        { id: "cradle_prong_e", name: "Prong East", group: "head", from: [2, 18, -1], to: [3.5, 25, 1], origin: [2.5, 18, 0], rotation: [0, 0, -15], faces: makeFaces("blade", res), color: palette.primary },
        { id: "cradle_prong_w", name: "Prong West", group: "head", from: [-3.5, 18, -1], to: [-2, 25, 1], origin: [-2.5, 18, 0], rotation: [0, 0, 15], faces: makeFaces("blade", res), color: palette.primary },
        // Floating Central Crystal Orb
        { id: "core_orb", name: "Levitating Core Orb", group: "head", from: [-2.2, 20.5, -2.2], to: [2.2, 24.9, 2.2], origin: [0, 22.7, 0], rotation: [0, 45, 0], faces: makeFaces("gem", res), color: palette.glow, emissive: true },
        // Top Crescent Crown
        { id: "top_crescent", name: "Top Astral Crescent", group: "head", from: [-3.5, 26, -0.8], to: [3.5, 31, 0.8], origin: [0, 26, 0], rotation: [0, 0, 0], faces: makeFaces("rune", res), color: palette.accent },
      ];

      const groups: ModelGroup[] = [
        { id: "staff_rod", name: "Staff Rod", pivot: [0, 0, 0], rotation: [0, 0, 0], childrenIds: ["shaft_lower", "shaft_upper", "rod_ring_1", "rod_ring_2", "butt_spike"] },
        { id: "head", name: "Astrolabe Head", pivot: [0, 22, 0], rotation: [0, 0, 0], childrenIds: ["head_cradle", "cradle_prong_n", "cradle_prong_s", "cradle_prong_e", "cradle_prong_w", "core_orb", "top_crescent"] },
      ];

      return {
        name: "Celestial Chrono Staff",
        description: "An ancient brass astrolabe staff harboring an infinitely rotating chronomantic core and celestial runes.",
        category: "staff",
        theme,
        textureWidth: res,
        textureHeight: res,
        elements,
        groups,
        floatingItems: {
          enabled: true,
          count: 5,
          type: "shard",
          orbitRadius: 7,
          orbitSpeed: 1.5,
          heightOffset: 22.7,
          bobbingAmplitude: 1.8,
          color: palette.glow,
        },
        magicCircle: {
          enabled: true,
          radius: 8,
          rotationSpeed: 1.2,
          yOffset: 22.7,
          tiltAngle: 0,
          style: "arcane_clock",
          color: palette.glow,
          emissiveIntensity: 2.0,
        },
        particles: {
          enabled: true,
          type: "sparkle",
          density: 60,
          speed: 1.1,
          spread: 4.5,
          color: palette.glow,
          secondaryColor: palette.accent,
        },
        animations: {
          activeAnimation: "magic_cast",
          speed: 1.0,
          amplitude: 1.2,
          enableHover: true,
          enableOrbitals: true,
          enablePulse: true,
          enableFlicker: true,
        },
        palette,
      };
    }

    case "scythe": {
      // Netherflame Demon Scythe
      const elements: ModelElement[] = [
        { id: "scythe_staff", name: "Bone Staff", group: "scythe_shaft", from: [-1, -15, -1], to: [1, 15, 1], origin: [0, 0, 0], rotation: [0, 0, 0], faces: makeFaces("guard", res), color: palette.secondary },
        { id: "spine_segment_1", name: "Vertebra Ring 1", group: "scythe_shaft", from: [-1.8, -4, -1.8], to: [1.8, -1, 1.8], origin: [0, -2.5, 0], rotation: [0, 0, 0], faces: makeFaces("rune", res), color: palette.dark },
        { id: "spine_segment_2", name: "Vertebra Ring 2", group: "scythe_shaft", from: [-1.8, 6, -1.8], to: [1.8, 9, 1.8], origin: [0, 7.5, 0], rotation: [0, 0, 0], faces: makeFaces("rune", res), color: palette.dark },
        // Scythe Head Joint
        { id: "head_skull", name: "Demon Skull Mount", group: "scythe_blade", from: [-2.5, 14, -2.5], to: [2.5, 20, 2.5], origin: [0, 16, 0], rotation: [0, 0, 0], faces: makeFaces("guard", res), color: palette.dark },
        { id: "head_eye", name: "Hellfire Core", group: "scythe_blade", from: [-1.5, 15.5, 1.5], to: [1.5, 18.5, 2.8], origin: [0, 17, 2], rotation: [0, 0, 0], faces: makeFaces("gem", res), color: palette.glow, emissive: true },
        // Curved Blade Segments
        { id: "blade_root", name: "Scythe Arm Extension", group: "scythe_blade", from: [1, 18, -1.5], to: [8, 22, 1.5], origin: [1, 19, 0], rotation: [0, 0, -20], faces: makeFaces("blade", res), color: palette.primary },
        { id: "blade_curve_mid", name: "Scythe Main Arc", group: "scythe_blade", from: [7, 12, -1], to: [17, 20, 1], origin: [7, 19, 0], rotation: [0, 0, -45], faces: makeFaces("blade", res), color: palette.primary },
        { id: "blade_edge_inner", name: "Lethal Edge", group: "scythe_blade", from: [9, 8, -0.6], to: [21, 15, 0.6], origin: [13, 13, 0], rotation: [0, 0, -65], faces: makeFaces("rune", res), color: palette.glow, emissive: true },
        { id: "blade_scythe_tip", name: "Scythe Fang Tip", group: "scythe_blade", from: [12, -1, -0.4], to: [17, 9, 0.4], origin: [15, 6, 0], rotation: [0, 0, -85], faces: makeFaces("blade", res), color: palette.primary },
      ];

      const groups: ModelGroup[] = [
        { id: "scythe_shaft", name: "Bone Staff", pivot: [0, 0, 0], rotation: [0, 0, 0], childrenIds: ["scythe_staff", "spine_segment_1", "spine_segment_2"] },
        { id: "scythe_blade", name: "Nether Blade", pivot: [0, 17, 0], rotation: [0, 0, 0], childrenIds: ["head_skull", "head_eye", "blade_root", "blade_curve_mid", "blade_edge_inner", "blade_scythe_tip"] },
      ];

      return {
        name: "Netherflame Demon Scythe",
        description: "Curved demonic reaping weapon with molten magma edges, bone vertebrate inlays, and trailing flame embers.",
        category: "sword",
        theme: "nether",
        textureWidth: res,
        textureHeight: res,
        elements,
        groups,
        floatingItems: {
          enabled: true,
          count: 3,
          type: "rune_cube",
          orbitRadius: 9,
          orbitSpeed: 1.6,
          heightOffset: 16,
          bobbingAmplitude: 2.0,
          color: palette.glow,
        },
        magicCircle: {
          enabled: true,
          radius: 11,
          rotationSpeed: -1.2,
          yOffset: 16,
          tiltAngle: 45,
          style: "pentagram",
          color: palette.glow,
          emissiveIntensity: 2.5,
        },
        particles: {
          enabled: true,
          type: "flame",
          density: 70,
          speed: 1.5,
          spread: 6,
          color: palette.glow,
          secondaryColor: palette.accent,
        },
        animations: {
          activeAnimation: "blade_swing",
          speed: 1.1,
          amplitude: 1.2,
          enableHover: true,
          enableOrbitals: true,
          enablePulse: true,
          enableFlicker: true,
        },
        palette: PALETTES.nether,
      };
    }

    case "armor": {
      // Dragon Valkyrie Pauldron & Helm
      const elements: ModelElement[] = [
        // Pauldron Main Shoulder Shell
        { id: "pauldron_base", name: "Pauldron Base Cup", group: "shoulder", from: [-6, 6, -5], to: [4, 12, 5], origin: [-1, 9, 0], rotation: [0, 0, 0], faces: makeFaces("blade", res), color: palette.primary, inflate: 0.2 },
        { id: "pauldron_plate_2", name: "Pauldron Tier 2 Guard", group: "shoulder", from: [-7.5, 4, -4.5], to: [2.5, 9, 4.5], origin: [-2.5, 6.5, 0], rotation: [0, 0, 12], faces: makeFaces("guard", res), color: palette.secondary, inflate: 0.1 },
        { id: "pauldron_plate_3", name: "Pauldron Bicep Flange", group: "shoulder", from: [-8.5, 1, -4], to: [1.5, 5, 4], origin: [-3.5, 3, 0], rotation: [0, 0, 20], faces: makeFaces("guard", res), color: palette.secondary },
        // Floating Valkyrie Wing Plates
        { id: "wing_plate_upper", name: "Valkyrie Wing Feather 1", group: "wings", from: [-5, 11, 2], to: [-1, 21, 3.5], origin: [-3, 11, 2.7], rotation: [-15, 20, 25], faces: makeFaces("rune", res), color: palette.accent },
        { id: "wing_plate_mid", name: "Valkyrie Wing Feather 2", group: "wings", from: [-4, 10, 3], to: [-0.5, 18, 4.5], origin: [-2, 10, 3.7], rotation: [-25, 25, 40], faces: makeFaces("blade", res), color: palette.primary },
        { id: "wing_plate_lower", name: "Valkyrie Wing Feather 3", group: "wings", from: [-3, 9, 4], to: [0, 15, 5.2], origin: [-1.5, 9, 4.6], rotation: [-35, 30, 55], faces: makeFaces("blade", res), color: palette.primary },
        // Gem Crest
        { id: "shoulder_gem", name: "Empyrean Core Gem", group: "shoulder", from: [-2.5, 8.5, -5.8], to: [0.5, 11.5, -4.6], origin: [-1, 10, -5.2], rotation: [0, 0, 45], faces: makeFaces("gem", res), color: palette.glow, emissive: true },
        // Crest Halo Pin
        { id: "crest_pin", name: "Gilded Shoulder Spike", group: "shoulder", from: [-2, 12, -2], to: [0, 16, 0], origin: [-1, 12, -1], rotation: [0, 0, -10], faces: makeFaces("rune", res), color: palette.accent },
      ];

      const groups: ModelGroup[] = [
        { id: "shoulder", name: "Shoulder Armor", pivot: [-1, 9, 0], rotation: [0, 0, 0], childrenIds: ["pauldron_base", "pauldron_plate_2", "pauldron_plate_3", "shoulder_gem", "crest_pin"] },
        { id: "wings", name: "Valkyrie Wings", pivot: [-2, 10, 3], rotation: [0, 0, 0], childrenIds: ["wing_plate_upper", "wing_plate_mid", "wing_plate_lower"] },
      ];

      return {
        name: "Dragon Valkyrie Pauldron",
        description: "Layered 3D custom armor piece with flared articulated wings, emissive chestplate gems, and holy ward runes.",
        category: "armor",
        theme: "holy",
        textureWidth: res,
        textureHeight: res,
        elements,
        groups,
        floatingItems: {
          enabled: true,
          count: 3,
          type: "blade_ring",
          orbitRadius: 9,
          orbitSpeed: 0.8,
          heightOffset: 12,
          bobbingAmplitude: 1.0,
          color: palette.glow,
        },
        magicCircle: {
          enabled: true,
          radius: 10,
          rotationSpeed: 0.7,
          yOffset: 10,
          tiltAngle: 25,
          style: "celestial_sun",
          color: palette.glow,
          emissiveIntensity: 1.8,
        },
        particles: {
          enabled: true,
          type: "holy",
          density: 40,
          speed: 0.9,
          spread: 4,
          color: palette.glow,
          secondaryColor: palette.highlight,
        },
        animations: {
          activeAnimation: "wing_flutter",
          speed: 1.0,
          amplitude: 1.0,
          enableHover: true,
          enableOrbitals: true,
          enablePulse: true,
          enableFlicker: true,
        },
        palette: PALETTES.holy,
      };
    }

    case "magic": {
      // Arcane Grimoire & Runes
      const elements: ModelElement[] = [
        // Book Spine & Covers
        { id: "spine", name: "Grimoire Leather Spine", group: "book", from: [-0.8, 6, -6], to: [0.8, 7.5, 6], origin: [0, 6.7, 0], rotation: [0, 0, 0], faces: makeFaces("guard", res), color: palette.secondary },
        { id: "cover_left", name: "Cover Wing Left", group: "book", from: [-8, 6.2, -6.5], to: [-0.6, 7.4, 6.5], origin: [-0.6, 6.8, 0], rotation: [0, 0, 18], faces: makeFaces("blade", res), color: palette.primary },
        { id: "cover_right", name: "Cover Wing Right", group: "book", from: [0.6, 6.2, -6.5], to: [8, 7.4, 6.5], origin: [0.6, 6.8, 0], rotation: [0, 0, -18], faces: makeFaces("blade", res), color: palette.primary },
        // Pages
        { id: "pages_left", name: "Enchanted Parchment Left", group: "book", from: [-7.5, 7.4, -5.8], to: [-0.8, 9, 5.8], origin: [-0.8, 8, 0], rotation: [0, 0, 12], faces: makeFaces("gem", res), color: palette.highlight },
        { id: "pages_right", name: "Enchanted Parchment Right", group: "book", from: [0.8, 7.4, -5.8], to: [7.5, 9, 5.8], origin: [0.8, 8, 0], rotation: [0, 0, -12], faces: makeFaces("gem", res), color: palette.highlight },
        // Floating Center Mana Core
        { id: "mana_core", name: "Hovering Mana Core", group: "book", from: [-1.8, 12, -1.8], to: [1.8, 15.6, 1.8], origin: [0, 13.8, 0], rotation: [45, 45, 0], faces: makeFaces("rune", res), color: palette.glow, emissive: true },
        // Floating Page Shards
        { id: "levitating_page_1", name: "Levitating Rune Page 1", group: "book", from: [-6, 14, -3], to: [-1, 14.3, 3], origin: [-3.5, 14, 0], rotation: [10, 20, -15], faces: makeFaces("rune", res), color: palette.glow, emissive: true },
        { id: "levitating_page_2", name: "Levitating Rune Page 2", group: "book", from: [1, 16, -3], to: [6, 16.3, 3], origin: [3.5, 16, 0], rotation: [-15, -25, 20], faces: makeFaces("rune", res), color: palette.glow, emissive: true },
      ];

      const groups: ModelGroup[] = [
        { id: "book", name: "Arcane Grimoire", pivot: [0, 7, 0], rotation: [0, 0, 0], childrenIds: ["spine", "cover_left", "cover_right", "pages_left", "pages_right", "mana_core", "levitating_page_1", "levitating_page_2"] },
      ];

      return {
        name: "Arcane Spell Grimoire",
        description: "An unbound hovering magical tome with levitating enchanted parchment, floating mana orbs, and concentric spell rings.",
        category: "magic",
        theme: "void",
        textureWidth: res,
        textureHeight: res,
        elements,
        groups,
        floatingItems: {
          enabled: true,
          count: 6,
          type: "rune_cube",
          orbitRadius: 9,
          orbitSpeed: 1.4,
          heightOffset: 14,
          bobbingAmplitude: 1.8,
          color: palette.glow,
        },
        magicCircle: {
          enabled: true,
          radius: 12,
          rotationSpeed: 1.0,
          yOffset: 5,
          tiltAngle: 0,
          style: "runic_ring",
          color: palette.glow,
          emissiveIntensity: 2.2,
        },
        particles: {
          enabled: true,
          type: "sparkle",
          density: 65,
          speed: 1.2,
          spread: 6,
          color: palette.glow,
          secondaryColor: palette.accent,
        },
        animations: {
          activeAnimation: "idle_float",
          speed: 0.9,
          amplitude: 1.2,
          enableHover: true,
          enableOrbitals: true,
          enablePulse: true,
          enableFlicker: true,
        },
        palette: PALETTES.void,
      };
    }

    case "wand": {
      // Arcane Starlight Wand
      const elements: ModelElement[] = [
        { id: "handle_rod", name: "Wand Grip", group: "grip", from: [-0.8, -8, -0.8], to: [0.8, 6, 0.8], origin: [0, -1, 0], rotation: [0, 0, 0], faces: makeFaces("guard", res), color: palette.secondary },
        { id: "handle_pommel", name: "Spiral Pommel", group: "grip", from: [-1.4, -10.5, -1.4], to: [1.4, -8, 1.4], origin: [0, -9.2, 0], rotation: [0, 45, 0], faces: makeFaces("gem", res), color: palette.glow, emissive: true },
        { id: "wand_shaft", name: "Upper Shaft", group: "tip", from: [-0.6, 6, -0.6], to: [0.6, 17, 0.6], origin: [0, 11, 0], rotation: [0, 0, 0], faces: makeFaces("blade", res), color: palette.primary },
        // Star Tip
        { id: "star_core", name: "Starlight Star Core", group: "tip", from: [-2, 17.5, -2], to: [2, 21.5, 2], origin: [0, 19.5, 0], rotation: [0, 45, 0], faces: makeFaces("gem", res), color: palette.glow, emissive: true },
        { id: "star_spike_up", name: "Star Ray Top", group: "tip", from: [-0.8, 21.5, -0.8], to: [0.8, 26, 0.8], origin: [0, 23.5, 0], rotation: [0, 0, 0], faces: makeFaces("rune", res), color: palette.accent },
        { id: "star_spike_left", name: "Star Ray Left", group: "tip", from: [-6, 18.7, -0.8], to: [-2, 20.3, 0.8], origin: [-4, 19.5, 0], rotation: [0, 0, 0], faces: makeFaces("rune", res), color: palette.accent },
        { id: "star_spike_right", name: "Star Ray Right", group: "tip", from: [2, 18.7, -0.8], to: [6, 20.3, 0.8], origin: [4, 19.5, 0], rotation: [0, 0, 0], faces: makeFaces("rune", res), color: palette.accent },
      ];

      const groups: ModelGroup[] = [
        { id: "grip", name: "Wand Grip", pivot: [0, -1, 0], rotation: [0, 0, 0], childrenIds: ["handle_rod", "handle_pommel"] },
        { id: "tip", name: "Star Tip", pivot: [0, 19.5, 0], rotation: [0, 0, 0], childrenIds: ["wand_shaft", "star_core", "star_spike_up", "star_spike_left", "star_spike_right"] },
      ];

      return {
        name: "Arcane Starlight Wand",
        description: "A nimble channeler wand topped with an unyielding 8-pointed astral star crystal.",
        category: "staff",
        theme,
        textureWidth: res,
        textureHeight: res,
        elements,
        groups,
        floatingItems: {
          enabled: true,
          count: 3,
          type: "shard",
          orbitRadius: 5.5,
          orbitSpeed: 2.0,
          heightOffset: 19.5,
          bobbingAmplitude: 1.5,
          color: palette.glow,
        },
        magicCircle: {
          enabled: true,
          radius: 6,
          rotationSpeed: 1.5,
          yOffset: 19.5,
          tiltAngle: 0,
          style: "runic_ring",
          color: palette.glow,
          emissiveIntensity: 2.2,
        },
        particles: {
          enabled: true,
          type: "sparkle",
          density: 50,
          speed: 1.2,
          spread: 3.5,
          color: palette.glow,
          secondaryColor: palette.accent,
        },
        animations: {
          activeAnimation: "magic_cast",
          speed: 1.1,
          amplitude: 1.0,
          enableHover: true,
          enableOrbitals: true,
          enablePulse: true,
          enableFlicker: true,
        },
        palette,
      };
    }

    case "rapier":
    default: {
      // Glacial Frostfang Rapier
      const elements: ModelElement[] = [
        { id: "rapier_grip", name: "Wire Grip", group: "grip", from: [-0.9, -9, -0.9], to: [0.9, 0, 0.9], origin: [0, -4.5, 0], rotation: [0, 0, 0], faces: makeFaces("guard", res), color: palette.secondary },
        { id: "rapier_pommel", name: "Diamond Pommel", group: "grip", from: [-1.6, -11.5, -1.6], to: [1.6, -9, 1.6], origin: [0, -10.2, 0], rotation: [0, 45, 0], faces: makeFaces("gem", res), color: palette.glow, emissive: true },
        // Cup Guard
        { id: "cup_guard_base", name: "Cup Guard Disk", group: "guard", from: [-4, 0, -4], to: [4, 1.5, 4], origin: [0, 0.7, 0], rotation: [0, 0, 0], faces: makeFaces("guard", res), color: palette.accent },
        { id: "cup_guard_flange_n", name: "Guard Shell North", group: "guard", from: [-3.5, 1.5, -4.2], to: [3.5, 4.5, -3.2], origin: [0, 3, -3.7], rotation: [-15, 0, 0], faces: makeFaces("guard", res), color: palette.accent },
        { id: "cup_guard_flange_s", name: "Guard Shell South", group: "guard", from: [-3.5, 1.5, 3.2], to: [3.5, 4.5, 4.2], origin: [0, 3, 3.7], rotation: [15, 0, 0], faces: makeFaces("guard", res), color: palette.accent },
        // Thin Rapier Needle Blade
        { id: "rapier_blade_lower", name: "Rapier Lower Spine", group: "blade", from: [-0.8, 1.5, -0.8], to: [0.8, 16, 0.8], origin: [0, 8, 0], rotation: [0, 0, 0], faces: makeFaces("blade", res), color: palette.primary },
        { id: "rapier_blade_mid", name: "Rapier Needle Mid", group: "blade", from: [-0.6, 16, -0.6], to: [0.6, 26, 0.6], origin: [0, 21, 0], rotation: [0, 0, 0], faces: makeFaces("blade", res), color: palette.primary },
        { id: "rapier_blade_point", name: "Rapier Ice Point", group: "blade", from: [-0.4, 26, -0.4], to: [0.4, 32, 0.4], origin: [0, 29, 0], rotation: [0, 0, 0], faces: makeFaces("rune", res), color: palette.glow, emissive: true },
      ];

      const groups: ModelGroup[] = [
        { id: "grip", name: "Grip", pivot: [0, -4.5, 0], rotation: [0, 0, 0], childrenIds: ["rapier_grip", "rapier_pommel"] },
        { id: "guard", name: "Cup Guard", pivot: [0, 2, 0], rotation: [0, 0, 0], childrenIds: ["cup_guard_base", "cup_guard_flange_n", "cup_guard_flange_s"] },
        { id: "blade", name: "Needle Blade", pivot: [0, 16, 0], rotation: [0, 0, 0], childrenIds: ["rapier_blade_lower", "rapier_blade_mid", "rapier_blade_point"] },
      ];

      return {
        name: "Glacial Frostfang Rapier",
        description: "A razor-sharp thrusting foil forged from perpetual ice crystal, boasting a diamond cup guard.",
        category: "sword",
        theme: "frost",
        textureWidth: res,
        textureHeight: res,
        elements,
        groups,
        floatingItems: {
          enabled: true,
          count: 4,
          type: "shard",
          orbitRadius: 6,
          orbitSpeed: 1.4,
          heightOffset: 2,
          bobbingAmplitude: 1.0,
          color: palette.glow,
        },
        magicCircle: {
          enabled: true,
          radius: 7,
          rotationSpeed: 0.9,
          yOffset: 2,
          tiltAngle: 90,
          style: "runic_ring",
          color: palette.glow,
          emissiveIntensity: 1.8,
        },
        particles: {
          enabled: true,
          type: "ice",
          density: 45,
          speed: 1.0,
          spread: 3.5,
          color: palette.glow,
          secondaryColor: palette.primary,
        },
        animations: {
          activeAnimation: "blade_swing",
          speed: 1.0,
          amplitude: 1.0,
          enableHover: true,
          enableOrbitals: true,
          enablePulse: true,
          enableFlicker: true,
        },
        palette: PALETTES.frost,
      };
    }
  }
}

/** Legacy templates hard-coded their own theme; re-map their palette so the requested theme always wins. */
function enforceTheme(model: ModelData, theme: ModelTheme): ModelData {
  if (model.theme === theme) return model;
  const from = model.palette;
  const to = PALETTES[theme];
  const keys = ["primary", "secondary", "accent", "dark", "highlight", "glow"] as const;
  const remap = (color?: string) => {
    const key = color ? keys.find((entry) => from[entry].toLowerCase() === color.toLowerCase()) : undefined;
    return key ? to[key] : color;
  };
  return {
    ...model,
    theme,
    palette: to,
    elements: model.elements.map((element) => ({ ...element, color: remap(element.color) })),
    floatingItems: { ...model.floatingItems, color: to.glow },
    magicCircle: { ...model.magicCircle, color: to.glow },
    particles: { ...model.particles, color: to.glow, secondaryColor: to.accent },
  };
}

export function generateTemplate(type: ModelArchetype, theme: ModelTheme = "fantasy", res: TextureResolution = 32): ModelData {
  const model = generateArsenalA(type, theme, res) ?? generateArsenalB(type, theme, res) ?? generateBaseTemplate(type, theme, res);
  return { ...enforceTheme(model, theme), archetype: type, category: categoryForArchetype(type), decorations: model.decorations ?? [] };
}
