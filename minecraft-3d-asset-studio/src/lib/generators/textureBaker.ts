import { ColorPalette, FormId, ModelTheme, TextureResolution } from "@/types/model";

export const PALETTES: Record<ModelTheme, ColorPalette> = {
  fantasy: {
    id: "fantasy",
    name: "Royal Fantasy",
    primary: "#3a7bd5",
    secondary: "#f3a638",
    accent: "#68d8d6",
    dark: "#1e2430",
    highlight: "#ffffff",
    glow: "#00d2ff",
  },
  nether: {
    id: "nether",
    name: "Nether Magma",
    primary: "#d32f2f",
    secondary: "#2c1d27",
    accent: "#ff9800",
    dark: "#1a0f14",
    highlight: "#ffe082",
    glow: "#ff3d00",
  },
  void: {
    id: "void",
    name: "Ender Void",
    primary: "#673ab7",
    secondary: "#181425",
    accent: "#00e5ff",
    dark: "#0b0813",
    highlight: "#e040fb",
    glow: "#bd10e0",
  },
  holy: {
    id: "holy",
    name: "Archangel Light",
    primary: "#fdd835",
    secondary: "#f5f5f5",
    accent: "#ffb300",
    dark: "#37474f",
    highlight: "#ffffff",
    glow: "#fff59d",
  },
  cyber: {
    id: "cyber",
    name: "Cyberpunk Neon",
    primary: "#00f0ff",
    secondary: "#212121",
    accent: "#ff007f",
    dark: "#0a0a12",
    highlight: "#f5fbff",
    glow: "#00ffff",
  },
  frost: {
    id: "frost",
    name: "Glacial Frost",
    primary: "#4fc3f7",
    secondary: "#e1f5fe",
    accent: "#0288d1",
    dark: "#1a2a3a",
    highlight: "#ffffff",
    glow: "#80d8ff",
  },
  nature: {
    id: "nature",
    name: "Sylvan Emerald",
    primary: "#2e7d32",
    secondary: "#5d4037",
    accent: "#aed581",
    dark: "#1b281d",
    highlight: "#c8e6c9",
    glow: "#69f0ae",
  },
  steampunk: {
    id: "steampunk",
    name: "Brass Automaton",
    primary: "#b87333",
    secondary: "#3e2723",
    accent: "#ffd700",
    dark: "#211510",
    highlight: "#ffecb3",
    glow: "#ffaa00",
  },
};

// Helper: hex to RGB
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  let num = parseInt(clean, 16);
  if (clean.length === 3) {
    num = parseInt(clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2], 16);
  }
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
}

// Procedural pixel-art texture baker for Minecraft box UVs
export interface AtlasOptions {
  tier?: number;
  limitBreak?: number;
  form?: FormId;
}

/** Post-processing pass: adds enhancement detail per upgrade tier, limit break and form. */
function enhanceAtlas(data: Uint8ClampedArray, res: number, palette: ColorPalette, options: AtlasOptions) {
  const tier = options.tier ?? 0;
  const limitBreak = options.limitBreak ?? 0;
  const form = options.form ?? "base";
  const half = res / 2;
  const scale = res / 32;
  let seed = 1337 + tier * 31 + limitBreak * 101 + form.length * 7;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const get = (x: number, y: number): [number, number, number] => {
    const index = (y * res + x) * 4;
    return [data[index], data[index + 1], data[index + 2]];
  };
  const put = (x: number, y: number, [r, g, b]: [number, number, number], alpha = 1) => {
    if (x < 0 || y < 0 || x >= res || y >= res) return;
    const index = (Math.floor(y) * res + Math.floor(x)) * 4;
    data[index] = data[index] + (r - data[index]) * alpha;
    data[index + 1] = data[index + 1] + (g - data[index + 1]) * alpha;
    data[index + 2] = data[index + 2] + (b - data[index + 2]) * alpha;
    data[index + 3] = 255;
  };
  const glow = hexToRgb(palette.glow);
  const highlight = hexToRgb(palette.highlight);
  const gold = hexToRgb("#ffd54a");
  const walk = (count: number, color: [number, number, number], maxX: number, maxY: number, offsetX = 0, offsetY = 0) => {
    for (let vein = 0; vein < count; vein += 1) {
      let x = offsetX + Math.floor(random() * maxX);
      let y = offsetY;
      for (let step = 0; step < maxY * 1.3; step += 1) {
        put(x, y, color, 0.9);
        y += 1;
        x += Math.round((random() - 0.5) * 2);
        x = Math.max(offsetX, Math.min(offsetX + maxX - 1, x));
        if (y >= offsetY + maxY) break;
      }
    }
  };

  // +1: sparkle pixels on main material
  if (tier >= 1) {
    for (let index = 0; index < tier * res * 0.35; index += 1) {
      put(Math.floor(random() * half), Math.floor(random() * half), highlight, 0.85);
    }
  }
  // +2: gold trim lines on blade + guard sections
  if (tier >= 2) {
    const trimRows = [Math.max(2, Math.round(2 * scale)), half - Math.max(3, Math.round(3 * scale))];
    for (let x = 1; x < res - 1; x += 1) {
      trimRows.forEach((y) => put(x, y, gold, 0.8));
    }
  }
  // +3: dashed rune inlay down the blade center
  if (tier >= 3) {
    const cx = Math.floor(half / 2);
    for (let y = 2; y < half - 2; y += 1) {
      if (y % Math.max(3, Math.round(3 * scale)) !== 0) {
        put(cx, y, glow, 0.9);
        if (scale >= 2) put(cx + 1, y, glow, 0.6);
      }
    }
  }
  // +4: faceted gem section
  if (tier >= 4) {
    for (let i = 0; i < half; i += 1) {
      put(i, half + i, highlight, 0.5);
      put(half - 1 - i, half + i, highlight, 0.35);
    }
  }
  // +5: thickened glowing sigils
  if (tier >= 5) {
    for (let y = half; y < res; y += 1) {
      for (let x = half; x < res; x += 1) {
        const [r, g, b] = get(x, y);
        if (Math.abs(r - glow[0]) + Math.abs(g - glow[1]) + Math.abs(b - glow[2]) < 30) {
          put(x + 1, y, glow, 0.7);
          put(x, y + 1, glow, 0.7);
        }
      }
    }
  }
  // Limit break: energy crack veins, then transcendent light lift
  if (limitBreak >= 1) walk(limitBreak * 2, glow, half, half);
  if (limitBreak >= 2) walk(limitBreak, gold, half, half, half, 0);
  if (limitBreak >= 3) {
    for (let y = 0; y < res; y += 1) {
      for (let x = 0; x < res; x += 1) put(x, y, highlight, 0.14);
    }
    for (let x = 0; x < res; x += 1) {
      put(x, 0, gold, 0.9);
      put(x, res - 1, gold, 0.9);
    }
  }

  // Forms
  if (form === "sealed") {
    for (let y = 0; y < res; y += 1) {
      for (let x = 0; x < res; x += 1) {
        const [r, g, b] = get(x, y);
        put(x, y, [r * 0.55, g * 0.55, b * 0.6], 1);
        const link = Math.max(2, Math.round(2 * scale));
        if (x >= half && y < half && (Math.floor(x / link) + Math.floor(y / link)) % 2 === 0 && (x + y) % link === 0) {
          put(x, y, [120, 124, 134], 1);
        }
      }
    }
  } else if (form === "demonic") {
    walk(4, [255, 23, 68], half, half);
    walk(3, [140, 0, 20], half, half, half, 0);
  } else if (form === "crystal") {
    for (let i = 0; i < res; i += Math.max(3, Math.round(4 * scale))) {
      for (let t = 0; t < half; t += 1) {
        put((i + t) % half, t, highlight, 0.45);
      }
    }
  } else if (form === "winged") {
    for (let y = half; y < res; y += Math.max(2, Math.round(2 * scale))) {
      for (let x = half; x < res; x += 1) put(x, y, highlight, 0.4);
    }
  } else if (form === "extended" || form === "twin") {
    for (let y = 0; y < half; y += 1) put(half - 2, y, glow, 0.6);
  }
}

export function generateProceduralAtlas(
  palette: ColorPalette,
  res: TextureResolution = 32,
  options: AtlasOptions = {},
): string {
  if (typeof document === "undefined") {
    return ""; // Server-side fallback
  }

  const canvas = document.createElement("canvas");
  canvas.width = res;
  canvas.height = res;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Turn off anti-aliasing for pure pixel-art crispness
  ctx.imageSmoothingEnabled = false;

  const [pr, pg, pb] = hexToRgb(palette.primary);
  const [sr, sg, sb] = hexToRgb(palette.secondary);
  const [ar, ag, ab] = hexToRgb(palette.accent);
  const [dr, dg, db] = hexToRgb(palette.dark);
  const [hr, hg, hb] = hexToRgb(palette.highlight);
  const [gr, gg, gb] = hexToRgb(palette.glow);

  const imgData = ctx.createImageData(res, res);
  const data = imgData.data;

  // Simple pseudo-random hash for deterministic shading
  const pseudoNoise = (x: number, y: number, seed: number = 42) => {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453123;
    return n - Math.floor(n);
  };

  const scale = res / 32;

  // Fill default dark base
  for (let i = 0; i < data.length; i += 4) {
    data[i] = dr;
    data[i + 1] = dg;
    data[i + 2] = db;
    data[i + 3] = 255;
  }

  const setPixel = (x: number, y: number, r: number, g: number, b: number, a: number = 255) => {
    if (x < 0 || x >= res || y < 0 || y >= res) return;
    const idx = (Math.floor(y) * res + Math.floor(x)) * 4;
    data[idx] = Math.max(0, Math.min(255, Math.round(r)));
    data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
    data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
    data[idx + 3] = a;
  };

  // Section 1: Main metal/material texture (Blade & Body) [0, 0] to [16*scale, 16*scale]
  const q1W = Math.floor(16 * scale);
  const q1H = Math.floor(16 * scale);
  for (let y = 0; y < q1H; y++) {
    for (let x = 0; x < q1W; x++) {
      const edge = x === 0 || y === 0 || x === q1W - 1 || y === q1H - 1;
      const noise = (pseudoNoise(x, y, 1) - 0.5) * 20;
      const gradient = (y / q1H) * 25;

      if (edge) {
        // Dark beveled border
        setPixel(x, y, dr * 0.8, dg * 0.8, db * 0.8);
      } else if (x === 1 || y === 1) {
        // Highlight bevel
        setPixel(x, y, Math.min(255, hr), Math.min(255, hg), Math.min(255, hb));
      } else {
        // Main blade steel / primary material
        setPixel(x, y, pr + noise - gradient, pg + noise - gradient, pb + noise - gradient);
      }
    }
  }

  // Section 2: Secondary / Handle / Guard Material [16*scale, 0] to [32*scale, 16*scale]
  for (let y = 0; y < q1H; y++) {
    for (let x = q1W; x < res; x++) {
      const localX = x - q1W;
      const localY = y;
      const noise = (pseudoNoise(x, y, 2) - 0.5) * 15;
      const stripe = (localX + localY) % Math.floor(4 * scale) === 0;

      if (stripe) {
        setPixel(x, y, ar + noise, ag + noise, ab + noise);
      } else {
        setPixel(x, y, sr + noise, sg + noise, sb + noise);
      }
    }
  }

  // Section 3: Accent / Glowing Gem / Core Material [0, 16*scale] to [16*scale, 32*scale]
  const q3Y = Math.floor(16 * scale);
  for (let y = q3Y; y < res; y++) {
    for (let x = 0; x < q1W; x++) {
      const localX = x;
      const localY = y - q3Y;
      const distFromCenter = Math.hypot(localX - q1W / 2, localY - (res - q3Y) / 2);
      const maxDist = q1W / 2;
      const factor = Math.max(0, 1 - distFromCenter / maxDist);

      // Glowing crystal gradient
      const r = gr * factor + ar * (1 - factor);
      const g = gg * factor + ag * (1 - factor);
      const b = gb * factor + ab * (1 - factor);

      const noise = (pseudoNoise(x, y, 3) - 0.5) * 10;
      setPixel(x, y, r + noise, g + noise, b + noise);
    }
  }

  // Section 4: Runes / Intricate Sigil & Ornaments [16*scale, 16*scale] to [res, res]
  for (let y = q3Y; y < res; y++) {
    for (let x = q1W; x < res; x++) {
      const localX = x - q1W;
      const localY = y - q3Y;
      
      // Runic cross / mystic patterns
      const isRune =
        localX === Math.floor(8 * scale) ||
        localY === Math.floor(8 * scale) ||
        (Math.abs(localX - localY) <= 1 && localX > 2 * scale && localX < 14 * scale) ||
        (Math.abs(localX + localY - 16 * scale) <= 1 && localX > 2 * scale && localX < 14 * scale);

      if (isRune) {
        setPixel(x, y, gr, gg, gb);
      } else {
        const noise = (pseudoNoise(x, y, 4) - 0.5) * 10;
        setPixel(x, y, dr + noise, dg + noise, db + noise);
      }
    }
  }

  enhanceAtlas(data, res, palette, options);
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/png");
}

// Procedural Magic Circle Canvas Generator
export function generateMagicCircleTexture(
  color: string,
  style: string = "runic_ring",
  size: number = 256,
  options: { glyphs?: boolean } = {},
): string {
  if (typeof document === "undefined") return "";

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const [r, g, b] = hexToRgb(color);
  const center = size / 2;

  ctx.clearRect(0, 0, size, size);

  // Glow aura
  const glow = ctx.createRadialGradient(center, center, center * 0.1, center, center, center * 0.95);
  glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.25)`);
  glow.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.08)`);
  glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
  ctx.lineWidth = Math.max(2, size * 0.015);

  // Outer circles
  ctx.beginPath();
  ctx.arc(center, center, center * 0.9, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(center, center, center * 0.82, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = Math.max(1.5, size * 0.008);
  ctx.beginPath();
  ctx.arc(center, center, center * 0.45, 0, Math.PI * 2);
  ctx.stroke();

  // Draw style-specific patterns
  if (style === "pentagram" || style === "celestial_sun") {
    const points = style === "pentagram" ? 5 : 8;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? center * 0.78 : center * 0.35;
      const angle = (i * Math.PI) / points;
      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  } else if (style === "arcane_clock") {
    // 12 ticks and roman numerals or runes
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const r1 = center * 0.65;
      const r2 = center * 0.82;
      ctx.beginPath();
      ctx.moveTo(center + Math.cos(angle) * r1, center + Math.sin(angle) * r1);
      ctx.lineTo(center + Math.cos(angle) * r2, center + Math.sin(angle) * r2);
      ctx.stroke();
    }
  } else if (style === "hexagram") {
    ctx.lineWidth = Math.max(2, size * 0.012);
    [-Math.PI / 2, Math.PI / 2].forEach((start) => {
      ctx.beginPath();
      for (let index = 0; index <= 3; index += 1) {
        const angle = start + (index * Math.PI * 2) / 3;
        const x = center + Math.cos(angle) * center * 0.78;
        const y = center + Math.sin(angle) * center * 0.78;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    for (let index = 0; index < 6; index += 1) {
      const angle = -Math.PI / 2 + (index * Math.PI) / 3;
      ctx.beginPath();
      ctx.arc(center + Math.cos(angle) * center * 0.78, center + Math.sin(angle) * center * 0.78, size * 0.025, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (style === "elemental") {
    ctx.lineWidth = Math.max(2, size * 0.011);
    ctx.beginPath();
    for (let index = 0; index <= 4; index += 1) {
      const angle = (index * Math.PI) / 2;
      const x = center + Math.cos(angle) * center * 0.62;
      const y = center + Math.sin(angle) * center * 0.62;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (let index = 0; index < 4; index += 1) {
      const angle = (index * Math.PI) / 2;
      const x = center + Math.cos(angle) * center * 0.62;
      const y = center + Math.sin(angle) * center * 0.62;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.06, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      if (index === 0) { ctx.moveTo(x - size * 0.035, y + size * 0.03); ctx.lineTo(x, y - size * 0.035); ctx.lineTo(x + size * 0.035, y + size * 0.03); ctx.closePath(); }
      else if (index === 1) { ctx.moveTo(x - size * 0.035, y - size * 0.03); ctx.lineTo(x, y + size * 0.035); ctx.lineTo(x + size * 0.035, y - size * 0.03); ctx.closePath(); }
      else if (index === 2) { ctx.moveTo(x - size * 0.04, y); ctx.lineTo(x + size * 0.04, y); ctx.moveTo(x - size * 0.03, y - size * 0.02); ctx.lineTo(x + size * 0.03, y - size * 0.02); }
      else { ctx.arc(x, y, size * 0.025, 0, Math.PI * 2); }
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(center - center * 0.62, center);
    ctx.lineTo(center + center * 0.62, center);
    ctx.moveTo(center, center - center * 0.62);
    ctx.lineTo(center, center + center * 0.62);
    ctx.stroke();
  } else if (style === "sigil_eye") {
    ctx.lineWidth = Math.max(2, size * 0.014);
    ctx.beginPath();
    ctx.moveTo(center - center * 0.62, center);
    ctx.quadraticCurveTo(center, center - center * 0.62, center + center * 0.62, center);
    ctx.quadraticCurveTo(center, center + center * 0.62, center - center * 0.62, center);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(center, center, center * 0.24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(center, center, center * 0.06, center * 0.2, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (let index = 0; index < 14; index += 1) {
      const angle = (index / 14) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(center + Math.cos(angle) * center * 0.66, center + Math.sin(angle) * center * 0.66);
      ctx.lineTo(center + Math.cos(angle) * center * 0.76, center + Math.sin(angle) * center * 0.76);
      ctx.stroke();
    }
  } else if (style === "hex_tech") {
    ctx.lineWidth = Math.max(1.5, size * 0.009);
    const hexagon = (radius: number, rotation: number) => {
      ctx.beginPath();
      for (let index = 0; index <= 6; index += 1) {
        const angle = rotation + (index * Math.PI) / 3;
        const x = center + Math.cos(angle) * radius;
        const y = center + Math.sin(angle) * radius;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    hexagon(center * 0.8, 0);
    hexagon(center * 0.52, Math.PI / 6);
    hexagon(center * 0.26, 0);
    for (let index = 0; index < 6; index += 1) {
      const angle = (index * Math.PI) / 3;
      const x = center + Math.cos(angle) * center * 0.8;
      const y = center + Math.sin(angle) * center * 0.8;
      ctx.beginPath();
      ctx.moveTo(center + Math.cos(angle) * center * 0.26, center + Math.sin(angle) * center * 0.26);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.strokeRect(x - size * 0.018, y - size * 0.018, size * 0.036, size * 0.036);
    }
  } else if (style === "grimoire_seal") {
    ctx.lineWidth = Math.max(2, size * 0.011);
    [0, Math.PI / 4].forEach((rotation) => {
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(rotation);
      ctx.strokeRect(-center * 0.5, -center * 0.5, center, center);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(center, center, center * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    for (let index = 0; index < 24; index += 1) {
      const angle = (index / 24) * Math.PI * 2;
      const inner = center * (index % 3 === 0 ? 0.72 : 0.76);
      ctx.beginPath();
      ctx.moveTo(center + Math.cos(angle) * inner, center + Math.sin(angle) * inner);
      ctx.lineTo(center + Math.cos(angle) * center * 0.8, center + Math.sin(angle) * center * 0.8);
      ctx.stroke();
    }
  } else if (style === "gear_ring") {
    // Mechanical cog ring: teeth around the rim + bolt circle + hub
    const teeth = 18;
    ctx.lineWidth = Math.max(2, size * 0.012);
    for (let index = 0; index < teeth; index += 1) {
      const angle = (index / teeth) * Math.PI * 2;
      const inner = center * 0.72;
      const outer = center * (index % 2 === 0 ? 0.95 : 0.86);
      ctx.beginPath();
      ctx.moveTo(center + Math.cos(angle) * inner, center + Math.sin(angle) * inner);
      ctx.lineTo(center + Math.cos(angle) * outer, center + Math.sin(angle) * outer);
      ctx.stroke();
    }
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      const x = center + Math.cos(angle) * center * 0.36;
      const y = center + Math.sin(angle) * center * 0.36;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.028, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Spokes
    for (let index = 0; index < 4; index += 1) {
      const angle = (index / 4) * Math.PI * 2 + Math.PI / 8;
      ctx.beginPath();
      ctx.moveTo(center + Math.cos(angle) * center * 0.42, center + Math.sin(angle) * center * 0.42);
      ctx.lineTo(center + Math.cos(angle) * center * 0.7, center + Math.sin(angle) * center * 0.7);
      ctx.stroke();
    }
  } else if (style === "blood_rune") {
    // Blood rune: jagged halo, dripping inner ring, central sigil
    const spikes = 24;
    ctx.lineWidth = Math.max(2, size * 0.014);
    ctx.beginPath();
    for (let index = 0; index <= spikes * 2; index += 1) {
      const angle = (index / (spikes * 2)) * Math.PI * 2;
      const radius = center * (index % 2 === 0 ? 0.92 : 0.72);
      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    // Dripping arcs
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2;
      const x = center + Math.cos(angle) * center * 0.52;
      const y = center + Math.sin(angle) * center * 0.52;
      const length = size * (0.05 + ((index * 7) % 5) * 0.02);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + length);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y + length, size * 0.016, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Crossed blade sigil in the middle
    ctx.lineWidth = Math.max(3, size * 0.02);
    ctx.beginPath();
    ctx.moveTo(center - size * 0.16, center + size * 0.16);
    ctx.lineTo(center + size * 0.16, center - size * 0.16);
    ctx.moveTo(center - size * 0.16, center - size * 0.16);
    ctx.lineTo(center + size * 0.16, center + size * 0.16);
    ctx.stroke();
  } else if (style === "void_spiral") {
    // Triple logarithmic void spiral arms
    for (let arm = 0; arm < 3; arm++) {
      ctx.beginPath();
      for (let step = 0; step <= 120; step++) {
        const t = step / 120;
        const angle = arm * ((Math.PI * 2) / 3) + t * Math.PI * 3;
        const radius = center * (0.12 + t * 0.66);
        const x = center + Math.cos(angle) * radius;
        const y = center + Math.sin(angle) * radius;
        if (step === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else {
    // Runic ring runes (geometric notches)
    const notches = 16;
    for (let i = 0; i < notches; i++) {
      const angle = (i * Math.PI * 2) / notches;
      const r1 = center * 0.84;
      const r2 = center * 0.88;
      ctx.beginPath();
      ctx.moveTo(center + Math.cos(angle) * r1, center + Math.sin(angle) * r1);
      ctx.lineTo(center + Math.cos(angle) * r2, center + Math.sin(angle) * r2);
      ctx.stroke();
    }
  }

  // Engraved glyph band
  if (options.glyphs) {
    ctx.lineWidth = Math.max(1, size * 0.006);
    const glyphCount = 30;
    for (let index = 0; index < glyphCount; index += 1) {
      const angle = (index / glyphCount) * Math.PI * 2;
      const unit = size * 0.012;
      let seed = (index * 2654435761) >>> 0;
      ctx.save();
      ctx.translate(center + Math.cos(angle) * center * 0.865, center + Math.sin(angle) * center * 0.865);
      ctx.rotate(angle + Math.PI / 2);
      ctx.beginPath();
      for (let stroke = 0; stroke < 3; stroke += 1) {
        seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
        const a = ((seed >>> 8) % 5) - 2;
        const b = ((seed >>> 12) % 5) - 2;
        const c = ((seed >>> 16) % 5) - 2;
        const d = ((seed >>> 20) % 5) - 2;
        ctx.moveTo(a * unit, b * unit);
        ctx.lineTo(c * unit, d * unit);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // Center symbol
  ctx.beginPath();
  ctx.arc(center, center, center * 0.15, 0, Math.PI * 2);
  ctx.stroke();

  return canvas.toDataURL("image/png");
}
