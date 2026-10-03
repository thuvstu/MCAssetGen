import { PALETTES, hexToRgb, rgbToHex } from "@/lib/generators/textureBaker";
import { analyzeModel as analyze, type ModelAnatomy } from "@/lib/model/anatomy";
import { applyDecorations } from "@/lib/decorations/decorations";
import {
  ColorPalette,
  DIRECTIONS,
  ElementFaces,
  FORM_IDS,
  FormId,
  MagicCircleStyle,
  ModelData,
  ModelElement,
  ModelTheme,
  ParticleType,
  TextureResolution,
  VariantState,
  Vector3,
} from "@/types/model";

export const MAX_TIER = 5;
export const MAX_LIMIT_BREAK = 3;
export const DEFAULT_VARIANT: VariantState = { tier: 0, limitBreak: 0, form: "base" };
export const GOLD = "#ffd54a";

export const FORM_DEFINITIONS: Record<FormId, { label: string; labelJa: string; description: string; icon: string }> = {
  base: { label: "Base", labelJa: "通常形態", description: "オリジナルの形状", icon: "◇" },
  extended: { label: "Extended", labelJa: "伸長形態", description: "刀身・杖身が伸び、先端に光刃が宿る", icon: "↕" },
  twin: { label: "Twin", labelJa: "双刃形態", description: "鏡像に分裂した二刀流/双杖", icon: "⫽" },
  sealed: { label: "Sealed", labelJa: "封印形態", description: "鎖で縛られ力を失った封印状態", icon: "⛓" },
  demonic: { label: "Demonic", labelJa: "魔獣形態", description: "棘と角が生えた禍々しい姿", icon: "♆" },
  crystal: { label: "Crystal", labelJa: "結晶形態", description: "結晶が全体を侵食し発光する", icon: "✦" },
  winged: { label: "Winged", labelJa: "天翼形態", description: "鍔元から光の翼が展開", icon: "⋀" },
};

export const TIER_LABELS = ["+0", "+1", "+2", "+3", "+4", "+5"];
export const LIMIT_BREAK_LABELS = ["—", "I", "II", "III"];

export const THEME_PARTICLES: Record<ModelTheme, ParticleType> = {
  fantasy: "sparkle",
  nether: "flame",
  void: "void",
  holy: "holy",
  cyber: "lightning",
  frost: "ice",
  nature: "cherry",
  steampunk: "sparkle",
};

export const THEME_CIRCLES: Record<ModelTheme, MagicCircleStyle> = {
  fantasy: "runic_ring",
  nether: "pentagram",
  void: "void_spiral",
  holy: "celestial_sun",
  cyber: "runic_ring",
  frost: "runic_ring",
  nature: "celestial_sun",
  steampunk: "arcane_clock",
};

// ---------- color helpers ----------
export function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

export function shiftHue(hex: string, degrees: number, saturationMultiplier = 1): string {
  const [r, g, b] = hexToRgb(hex).map((value) => value / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;
  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue /= 6;
  }
  hue = (((hue * 360 + degrees) % 360) + 360) % 360 / 360;
  saturation = Math.min(1, saturation * saturationMultiplier);

  const hueToRgb = (p: number, q: number, t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  if (saturation === 0) return rgbToHex(lightness * 255, lightness * 255, lightness * 255);
  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  return rgbToHex(hueToRgb(p, q, hue + 1 / 3) * 255, hueToRgb(p, q, hue) * 255, hueToRgb(p, q, hue - 1 / 3) * 255);
}

// ---------- geometry helpers ----------
type Region = "blade" | "guard" | "gem" | "rune";

function regionFaces(region: Region, resolution: TextureResolution): ElementFaces {
  const half = resolution / 2;
  const u = region === "guard" || region === "rune" ? half : 0;
  const v = region === "gem" || region === "rune" ? half : 0;
  return DIRECTIONS.reduce<ElementFaces>((faces, direction) => {
    faces[direction] = { uv: [u, v, u + half, v + half] };
    return faces;
  }, {});
}

interface CubeOptions {
  region: Region;
  color: string;
  resolution: TextureResolution;
  rotation?: Vector3;
  origin?: Vector3;
  emissive?: boolean;
  opacity?: number;
  inflate?: number;
  group?: string;
}

function cube(id: string, name: string, center: Vector3, size: Vector3, options: CubeOptions): ModelElement {
  return {
    id,
    name,
    group: options.group ?? "variant_fx",
    from: [center[0] - size[0] / 2, center[1] - size[1] / 2, center[2] - size[2] / 2],
    to: [center[0] + size[0] / 2, center[1] + size[1] / 2, center[2] + size[2] / 2],
    origin: options.origin ?? [...center],
    rotation: options.rotation ?? [0, 0, 0],
    faces: regionFaces(options.region, options.resolution),
    color: options.color,
    emissive: options.emissive ?? false,
    opacity: options.opacity,
    inflate: options.inflate ?? 0,
    visible: true,
    generated: true,
  };
}

function elementCenter(element: ModelElement): Vector3 {
  return [
    (element.from[0] + element.to[0]) / 2,
    (element.from[1] + element.to[1]) / 2,
    (element.from[2] + element.to[2]) / 2,
  ];
}

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stretchY(element: ModelElement, pivot: number, factor: number): ModelElement {
  const scale = (value: number) => pivot + (value - pivot) * factor;
  return {
    ...element,
    from: [element.from[0], scale(element.from[1]), element.from[2]],
    to: [element.to[0], scale(element.to[1]), element.to[2]],
    origin: [element.origin[0], scale(element.origin[1]), element.origin[2]],
  };
}

function isUpper(element: ModelElement, anatomy: ModelAnatomy) {
  return elementCenter(element)[1] > anatomy.threshold;
}

// ---------- form change ----------
function applyForm(model: ModelData, form: FormId): ModelData {
  if (form === "base") return model;
  const anatomy = analyze(model.elements);
  const res = model.textureWidth;
  const palette = model.palette;
  const additions: ModelElement[] = [];

  switch (form) {
    case "extended": {
      const factor = 1.4;
      model.elements = model.elements.map((element) => (isUpper(element, anatomy) ? stretchY(element, anatomy.threshold, factor) : element));
      const top = anatomy.threshold + (anatomy.maxY - anatomy.threshold) * factor;
      additions.push(
        cube("vx_form_ext_tip", "Light Blade Tip", [0, top + 2, 0], [0.7, 4, 0.5], { region: "rune", color: palette.glow, emissive: true, opacity: 0.85, resolution: res }),
        cube("vx_form_ext_edge", "Light Edge Core", [0, (anatomy.threshold + top) / 2, 0], [0.35, top - anatomy.threshold, 1.1], { region: "rune", color: palette.glow, emissive: true, opacity: 0.55, resolution: res }),
      );
      model.magicCircle = { ...model.magicCircle, radius: model.magicCircle.radius * 1.15 };
      model.floatingItems = { ...model.floatingItems, heightOffset: model.floatingItems.heightOffset * 1.2 };
      break;
    }
    case "twin": {
      const offset = Math.max(2.5, anatomy.guardHalfWidth * 0.8 + 1);
      const originals = model.elements.map((element) => ({
        ...element,
        from: [element.from[0] - offset, element.from[1], element.from[2]] as Vector3,
        to: [element.to[0] - offset, element.to[1], element.to[2]] as Vector3,
        origin: [element.origin[0] - offset, element.origin[1], element.origin[2]] as Vector3,
      }));
      const mirrors = model.elements.map<ModelElement>((element) => ({
        ...element,
        id: `vx_twin_${element.id}`,
        name: `${element.name} (Twin)`,
        group: "variant_twin",
        from: [-element.to[0] + offset, element.from[1], element.from[2]],
        to: [-element.from[0] + offset, element.to[1], element.to[2]],
        origin: [-element.origin[0] + offset, element.origin[1], element.origin[2]],
        rotation: [element.rotation[0], -element.rotation[1], -element.rotation[2]],
        generated: true,
      }));
      model.elements = [...originals, ...mirrors];
      model.floatingItems = { ...model.floatingItems, count: Math.min(8, model.floatingItems.count + 2), orbitRadius: model.floatingItems.orbitRadius + offset };
      model.magicCircle = { ...model.magicCircle, radius: model.magicCircle.radius + offset };
      break;
    }
    case "sealed": {
      const factor = 0.78;
      model.elements = model.elements.map((element) => ({
        ...(isUpper(element, anatomy) ? stretchY(element, anatomy.threshold, factor) : element),
        emissive: false,
        color: element.color ? mixHex(element.color, "#2a2a33", 0.55) : element.color,
      }));
      const top = anatomy.threshold + (anatomy.maxY - anatomy.threshold) * factor;
      for (let index = 0; index < 4; index += 1) {
        const y = anatomy.threshold + ((index + 0.7) / 4.4) * (top - anatomy.threshold);
        additions.push(
          cube(`vx_form_chain_${index}`, `Seal Chain ${index + 1}`, [0, y, 0], [anatomy.upperHalfWidth * 2 + 1, 0.8, anatomy.upperHalfDepth * 2 + 1], {
            region: "guard",
            color: "#5b5f6b",
            rotation: [0, 0, index % 2 === 0 ? 14 : -14],
            resolution: res,
          }),
        );
      }
      additions.push(
        cube("vx_form_lock", "Seal Padlock", [0, anatomy.guardY, anatomy.guardHalfDepth + 0.8], [2, 2.2, 1], { region: "gem", color: "#8d6e63", resolution: res }),
        cube("vx_form_seal_rune", "Seal Talisman", [0, (anatomy.threshold + top) / 2, anatomy.upperHalfDepth + 0.6], [1.6, 4, 0.1], { region: "rune", color: "#e8d9a8", rotation: [0, 0, 6], resolution: res }),
      );
      model.particles = { ...model.particles, type: "souls", density: Math.max(10, Math.round(model.particles.density * 0.3)), color: "#9e9e9e" };
      model.magicCircle = { ...model.magicCircle, enabled: false };
      model.floatingItems = { ...model.floatingItems, enabled: false };
      break;
    }
    case "demonic": {
      const demonGlow = "#ff1744";
      model.palette = { ...palette, glow: demonGlow, accent: mixHex(palette.accent, "#b71c1c", 0.7), dark: mixHex(palette.dark, "#1a0000", 0.6) };
      const spikeCount = 6;
      for (let index = 0; index < spikeCount; index += 1) {
        const side = index % 2 === 0 ? 1 : -1;
        const y = anatomy.threshold + ((index + 0.5) / spikeCount) * (anatomy.maxY - anatomy.threshold);
        const x = side * (anatomy.upperHalfWidth + 0.9);
        additions.push(
          cube(`vx_form_spike_${index}`, `Demon Spike ${index + 1}`, [x, y, 0], [0.8, 2.4, 0.6], {
            region: "blade",
            color: "#3e0d12",
            rotation: [0, 0, side * -38],
            origin: [x - side * 0.4, y - 1, 0],
            resolution: res,
          }),
        );
      }
      [-1, 1].forEach((side) => {
        additions.push(
          cube(`vx_form_horn_${side > 0 ? "r" : "l"}`, `Demon Horn ${side > 0 ? "R" : "L"}`, [side * (anatomy.guardHalfWidth + 1.2), anatomy.guardY + 2, 0], [1.1, 4, 1.1], {
            region: "guard",
            color: "#2b0a0e",
            rotation: [0, 0, side * -30],
            origin: [side * anatomy.guardHalfWidth, anatomy.guardY, 0],
            resolution: res,
          }),
        );
      });
      additions.push(cube("vx_form_demon_eye", "Demon Eye", [0, anatomy.guardY, anatomy.guardHalfDepth + 0.3], [1.4, 0.8, 0.4], { region: "gem", color: demonGlow, emissive: true, resolution: res }));
      model.particles = { ...model.particles, enabled: true, type: "flame", color: demonGlow, secondaryColor: "#ff9100" };
      model.magicCircle = { ...model.magicCircle, style: "pentagram", color: demonGlow };
      model.floatingItems = { ...model.floatingItems, color: demonGlow };
      break;
    }
    case "crystal": {
      const random = seeded(model.elements.length * 97 + 13);
      for (let index = 0; index < 12; index += 1) {
        const y = anatomy.threshold + random() * (anatomy.maxY - anatomy.threshold + 1);
        const side = random() > 0.5 ? 1 : -1;
        const x = side * (anatomy.upperHalfWidth * 0.6 + random() * 1.2);
        const z = (random() - 0.5) * (anatomy.upperHalfDepth * 2 + 1);
        const width = 0.6 + random() * 0.9;
        additions.push(
          cube(`vx_form_crystal_${index}`, `Crystal Shard ${index + 1}`, [x, y, z], [width, 1.6 + random() * 2.6, width], {
            region: "gem",
            color: index % 3 === 0 ? palette.highlight : palette.glow,
            emissive: true,
            opacity: 0.85,
            rotation: [(random() - 0.5) * 50, random() * 90, side * (10 + random() * 30)],
            resolution: res,
          }),
        );
      }
      model.floatingItems = { ...model.floatingItems, enabled: true, type: "crystal" };
      model.particles = { ...model.particles, enabled: true, secondaryColor: palette.highlight };
      break;
    }
    case "winged": {
      for (let index = 0; index < 5; index += 1) {
        [-1, 1].forEach((side) => {
          const length = 4 + index * 1.6;
          const baseX = side * (anatomy.guardHalfWidth + 0.5);
          additions.push(
            cube(`vx_form_wing_${side > 0 ? "r" : "l"}_${index}`, `Wing Feather ${side > 0 ? "R" : "L"}${index + 1}`, [baseX + side * (length / 2), anatomy.guardY + 0.5, -0.8 - index * 0.15], [length, 1.1, 0.3], {
              region: index % 2 === 0 ? "rune" : "blade",
              color: index % 2 === 0 ? palette.glow : palette.highlight,
              emissive: index % 2 === 0,
              opacity: 0.9,
              rotation: [0, 0, side * (18 + index * 14)],
              origin: [baseX, anatomy.guardY, -0.8],
              resolution: res,
            }),
          );
        });
      }
      model.floatingItems = { ...model.floatingItems, type: "shard" };
      break;
    }
  }

  model.elements = [...model.elements, ...additions];
  return model;
}

// ---------- upgrade tiers ----------
function applyTier(model: ModelData, tier: number): ModelData {
  if (tier <= 0) return model;
  const anatomy = analyze(model.elements);
  const res = model.textureWidth;
  const palette = tier >= 4 ? { ...model.palette, accent: mixHex(model.palette.accent, GOLD, 0.55) } : model.palette;
  model.palette = palette;
  const additions: ModelElement[] = [];
  const upperSpan = anatomy.maxY - anatomy.threshold;

  const bandHeights = tier >= 3 ? [0.22, 0.58] : [0.3];
  bandHeights.forEach((fraction, index) => {
    additions.push(
      cube(`vx_tier_band_${index}`, `Enhancement Rune Band ${index + 1}`, [0, anatomy.threshold + upperSpan * fraction, 0], [anatomy.upperHalfWidth * 2 + 0.5, 0.5, anatomy.upperHalfDepth * 2 + 0.5], {
        region: "rune",
        color: palette.glow,
        emissive: true,
        resolution: res,
      }),
    );
  });

  if (tier >= 2) {
    [1, -1].forEach((side) => {
      additions.push(
        cube(`vx_tier_socket_${side > 0 ? "f" : "b"}`, `Gem Socket ${side > 0 ? "Front" : "Back"}`, [0, anatomy.guardY, side * (anatomy.guardHalfDepth + 0.25)], [1.3, 1.3, 0.4], {
          region: "gem",
          color: palette.glow,
          emissive: true,
          rotation: [0, 0, 45],
          resolution: res,
        }),
      );
    });
  }

  if (tier >= 3) {
    [1, -1].forEach((side) => {
      additions.push(
        cube(`vx_tier_guard_${side > 0 ? "r" : "l"}`, `Gilded Guard Fin ${side > 0 ? "R" : "L"}`, [side * (anatomy.guardHalfWidth + 1), anatomy.guardY + 0.6, 0], [2, 0.8, 1.2], {
          region: "guard",
          color: GOLD,
          rotation: [0, 0, side * 28],
          origin: [side * anatomy.guardHalfWidth, anatomy.guardY, 0],
          resolution: res,
        }),
      );
    });
  }

  if (tier >= 4) {
    [-30, 0, 30].forEach((angle, index) => {
      additions.push(
        cube(`vx_tier_crown_${index}`, `Crown Ornament ${index + 1}`, [0, anatomy.maxY + 1.2, 0], [0.6, 2.2, 0.6], {
          region: "guard",
          color: GOLD,
          rotation: [0, 0, angle],
          origin: [0, anatomy.maxY, 0],
          resolution: res,
        }),
      );
    });
    additions.push(cube("vx_tier_pommel", "Grand Pommel Gem", [0, anatomy.minY - 0.8, 0], [1.6, 1.6, 1.6], { region: "gem", color: palette.glow, emissive: true, rotation: [45, 45, 0], resolution: res }));
  }

  if (tier >= 5) {
    model.elements
      .filter((element) => isUpper(element, anatomy) && element.visible !== false && !element.generated)
      .slice(0, 6)
      .forEach((element, index) => {
        additions.push({
          ...element,
          id: `vx_tier_aura_${index}`,
          name: `Aura Shell ${index + 1}`,
          group: "variant_fx",
          color: palette.glow,
          emissive: true,
          opacity: 0.32,
          inflate: (element.inflate ?? 0) + 0.45,
          generated: true,
        });
      });
  }

  model.elements = [...model.elements, ...additions];
  model.floatingItems = {
    ...model.floatingItems,
    enabled: model.floatingItems.enabled || tier >= 3,
    count: Math.min(8, model.floatingItems.count + Math.ceil(tier / 2)),
  };
  model.particles = {
    ...model.particles,
    enabled: model.particles.enabled || tier >= 2,
    density: Math.min(200, model.particles.density + tier * 12),
  };
  model.magicCircle = {
    ...model.magicCircle,
    radius: Math.min(24, model.magicCircle.radius + tier * 0.5),
    emissiveIntensity: model.magicCircle.emissiveIntensity + tier * 0.2,
  };
  return model;
}

// ---------- limit break ----------
function limitBreakPalette(palette: ColorPalette, level: number): ColorPalette {
  let next = { ...palette, glow: shiftHue(mixHex(palette.glow, "#ffffff", 0.2), 0, 1.3) };
  if (level >= 2) next = { ...next, accent: mixHex(next.accent, GOLD, 0.75), glow: shiftHue(next.glow, 18, 1.2) };
  if (level >= 3) {
    next = {
      ...next,
      primary: mixHex(next.primary, next.highlight, 0.3),
      secondary: mixHex(next.secondary, GOLD, 0.4),
      glow: mixHex(next.glow, "#ffffff", 0.4),
      highlight: "#ffffff",
    };
  }
  return next;
}

function applyLimitBreak(model: ModelData, level: number): ModelData {
  if (level <= 0) return model;
  const anatomy = analyze(model.elements);
  const res = model.textureWidth;
  const palette = limitBreakPalette(model.palette, level);
  model.palette = palette;
  const additions: ModelElement[] = [];

  [-24, 0, 24].forEach((angle, index) => {
    additions.push(
      cube(`vx_lb_crest_${index}`, `Energy Crest ${index + 1}`, [0, anatomy.maxY + 2, 0], [0.5, 3.6 - Math.abs(angle) / 20, 0.5], {
        region: "rune",
        color: palette.glow,
        emissive: true,
        opacity: 0.8,
        rotation: [0, 0, angle],
        origin: [0, anatomy.maxY, 0],
        resolution: res,
      }),
    );
  });

  if (level >= 2) {
    const midY = anatomy.threshold + (anatomy.maxY - anatomy.threshold) * 0.45;
    [-1, 1].forEach((side) => {
      [0, 1].forEach((index) => {
        const x = side * (anatomy.upperHalfWidth + 1.6 + index * 1.4);
        additions.push(
          cube(`vx_lb_fin_${side > 0 ? "r" : "l"}_${index}`, `Energy Fin ${side > 0 ? "R" : "L"}${index + 1}`, [x, midY + index, -1.2], [0.3, 6 - index, 2], {
            region: "rune",
            color: index === 0 ? palette.glow : palette.accent,
            emissive: true,
            opacity: 0.7,
            rotation: [0, 0, side * (16 + index * 10)],
            origin: [side * anatomy.upperHalfWidth, midY - 2, -1.2],
            resolution: res,
          }),
        );
      });
    });
  }

  if (level >= 3) {
    const haloRadius = Math.max(3.5, anatomy.upperHalfWidth * 2.2);
    for (let index = 0; index < 16; index += 1) {
      const angle = (index / 16) * Math.PI * 2;
      additions.push(
        cube(`vx_lb_halo_${index}`, `Halo Segment ${index + 1}`, [Math.cos(angle) * haloRadius, anatomy.maxY + 3.5, Math.sin(angle) * haloRadius], [1.2, 0.4, 0.5], {
          region: "rune",
          color: GOLD,
          emissive: true,
          rotation: [0, (-angle * 180) / Math.PI + 90, 0],
          resolution: res,
        }),
      );
    }
    const diskRadius = Math.max(6, anatomy.height * 0.28);
    const diskCenter = anatomy.threshold + (anatomy.maxY - anatomy.threshold) * 0.4;
    for (let index = 0; index < 20; index += 1) {
      const angle = (index / 20) * Math.PI * 2;
      additions.push(
        cube(`vx_lb_sun_${index}`, `Sun Disk Ray ${index + 1}`, [Math.cos(angle) * diskRadius, diskCenter + Math.sin(angle) * diskRadius, -2.5], [index % 2 === 0 ? 2.2 : 1.2, 0.5, 0.2], {
          region: "rune",
          color: index % 2 === 0 ? GOLD : palette.glow,
          emissive: true,
          opacity: 0.75,
          rotation: [0, 0, (angle * 180) / Math.PI],
          resolution: res,
        }),
      );
    }
  }

  model.elements = [...model.elements, ...additions];
  model.particles = {
    ...model.particles,
    enabled: true,
    density: Math.min(200, model.particles.density + level * 20),
    speed: model.particles.speed * (1 + level * 0.1),
    color: palette.glow,
    secondaryColor: level >= 2 ? GOLD : palette.accent,
  };
  model.magicCircle = {
    ...model.magicCircle,
    enabled: true,
    color: palette.glow,
    style: level >= 2 ? (model.theme === "void" ? "void_spiral" : "celestial_sun") : model.magicCircle.style,
    radius: Math.min(24, model.magicCircle.radius * (1 + level * 0.1)),
    emissiveIntensity: model.magicCircle.emissiveIntensity + level * 0.35,
  };
  model.floatingItems = {
    ...model.floatingItems,
    enabled: true,
    color: palette.glow,
    type: level >= 2 ? "blade_ring" : model.floatingItems.type,
    count: level >= 3 ? 8 : Math.min(8, model.floatingItems.count + level),
  };
  return model;
}

// ---------- public API ----------
export function isDefaultVariant(variant: VariantState): boolean {
  return variant.tier === 0 && variant.limitBreak === 0 && variant.form === "base";
}

export function stripVariantName(name: string): string {
  return name
    .replace(/\s\+\d$/, "")
    .replace(/\s\+\d(?=\s)/g, "")
    .replace(/\s◆限界突破[IV]+/g, "")
    .replace(/\s《[^》]+》/g, "")
    .trim();
}

export function formatVariantName(baseName: string, variant: VariantState): string {
  const parts = [stripVariantName(baseName)];
  if (variant.tier > 0) parts.push(`+${variant.tier}`);
  if (variant.limitBreak > 0) parts.push(`◆限界突破${LIMIT_BREAK_LABELS[variant.limitBreak]}`);
  if (variant.form !== "base") parts.push(`《${FORM_DEFINITIONS[variant.form].labelJa}》`);
  return parts.join(" ");
}

export function buildVariant(base: ModelData, variant: VariantState): ModelData {
  const hasDecorations = (base.decorations ?? []).some((decoration) => decoration.enabled);
  if (isDefaultVariant(variant)) return hasDecorations ? applyDecorations(base) : base;

  let model: ModelData = structuredClone(base);
  model = applyForm(model, variant.form);
  model = applyTier(model, Math.max(0, Math.min(MAX_TIER, variant.tier)));
  model = applyLimitBreak(model, Math.max(0, Math.min(MAX_LIMIT_BREAK, variant.limitBreak)));

  const fxIds = model.elements.filter((element) => element.group === "variant_fx").map((element) => element.id);
  const twinIds = model.elements.filter((element) => element.group === "variant_twin").map((element) => element.id);
  const groups = model.groups.filter((group) => group.id !== "variant_fx" && group.id !== "variant_twin");
  if (twinIds.length) groups.push({ id: "variant_twin", name: "Twin Mirror", pivot: [0, 0, 0], rotation: [0, 0, 0], childrenIds: twinIds });
  if (fxIds.length) groups.push({ id: "variant_fx", name: "Variant Ornaments", pivot: [0, 0, 0], rotation: [0, 0, 0], childrenIds: fxIds });
  model.groups = groups;

  model.name = formatVariantName(base.name, variant);
  model.variant = { ...variant, baseName: stripVariantName(base.name) };
  return hasDecorations ? applyDecorations(model, base) : model;
}

/** Converts generated parts into regular editable cubes so the variant can be refined by hand. */
export function bakeVariant(model: ModelData): ModelData {
  const stamp = Date.now().toString(36);
  const idMap = new Map<string, string>();
  const elements = model.elements.map((element) => {
    if (!element.generated) return element;
    const id = `${element.id.replace(/^vx_/, "baked_")}_${stamp}`;
    idMap.set(element.id, id);
    return { ...element, id, generated: false };
  });
  const groups = model.groups.map((group) => ({
    ...group,
    id: group.id.startsWith("variant_") ? `${group.id}_${stamp}` : group.id,
    childrenIds: group.childrenIds.map((childId) => idMap.get(childId) ?? childId),
  }));
  return { ...model, elements, groups: groups.map((group) => ({ ...group })), variant: undefined, decorations: [] };
}

/** Same silhouette, different elemental theme (同一モデルのテーマ違い). */
export function rethemeModel(base: ModelData, theme: ModelTheme): ModelData {
  const oldPalette = base.palette;
  const palette = PALETTES[theme];
  const keys = ["primary", "secondary", "accent", "dark", "highlight", "glow"] as const;
  const remap = (color?: string) => {
    if (!color) return color;
    const match = keys.find((key) => oldPalette[key].toLowerCase() === color.toLowerCase());
    return match ? palette[match] : color;
  };
  const baseName = stripVariantName(base.name).replace(/\s—\s.+ Edition$/, "");

  return {
    ...structuredClone(base),
    name: `${baseName} — ${palette.name} Edition`,
    theme,
    palette,
    elements: base.elements.map((element) => ({ ...element, color: remap(element.color) })),
    particles: { ...base.particles, type: THEME_PARTICLES[theme], color: palette.glow, secondaryColor: palette.accent },
    magicCircle: { ...base.magicCircle, style: THEME_CIRCLES[theme], color: palette.glow },
    floatingItems: { ...base.floatingItems, color: palette.glow },
    variant: undefined,
  };
}

export interface VariantSetEntry {
  key: string;
  label: string;
  kind: "tier" | "limit_break" | "form";
  state: VariantState;
}

/** Full progression set (段階強化 + 限界突破 + 全形態) for gallery display and pack export. */
export function buildVariantSet(current: VariantState): VariantSetEntry[] {
  const entries: VariantSetEntry[] = [];
  for (let tier = 0; tier <= MAX_TIER; tier += 1) {
    entries.push({ key: `t${tier}_lb0_${current.form}`, label: `${TIER_LABELS[tier]}`, kind: "tier", state: { tier, limitBreak: 0, form: current.form } });
  }
  for (let level = 1; level <= MAX_LIMIT_BREAK; level += 1) {
    entries.push({ key: `t5_lb${level}_${current.form}`, label: `限界突破${LIMIT_BREAK_LABELS[level]}`, kind: "limit_break", state: { tier: 5, limitBreak: level, form: current.form } });
  }
  FORM_IDS.forEach((form) => {
    const state = { tier: current.tier, limitBreak: current.limitBreak, form };
    const key = `t${state.tier}_lb${state.limitBreak}_${form}`;
    if (!entries.some((entry) => entry.key === key)) {
      entries.push({ key, label: FORM_DEFINITIONS[form].labelJa, kind: "form", state });
    }
  });
  return entries;
}
