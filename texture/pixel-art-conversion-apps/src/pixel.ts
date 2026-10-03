export type RGB = [number, number, number];

export const PALETTES: Record<string, RGB[] | null> = {
  "自動 (k-means)": null,
  "Minecraft標準 (鉱石・土・木・羊毛)": [
    [16, 16, 16], [40, 40, 40], [80, 80, 80], [130, 130, 130], [180, 180, 180], [240, 240, 240], // グレースケール/石
    [134, 96, 67], [86, 61, 42], [160, 115, 80], [198, 142, 99], // 木材・土
    [87, 109, 39], [112, 142, 51], [58, 81, 23], // 草・葉
    [45, 166, 152], [92, 219, 213], [19, 122, 127], // ダイヤ・水
    [245, 183, 29], [216, 127, 51], [150, 52, 20], // 金・火・溶岩
    [178, 34, 34], [153, 51, 51], [220, 20, 60], // 赤石・赤羊毛
    [118, 67, 138], [128, 0, 128], [76, 29, 149], // 黒曜石・アメジスト
    [50, 160, 60], [20, 110, 40], // エメラルド
    [22, 100, 180], [35, 60, 150], // ラピスラズリ
  ],
  "PICO-8 (16色レトロ)": [
    [0, 0, 0], [29, 43, 83], [126, 37, 83], [0, 135, 81],
    [171, 82, 54], [95, 87, 79], [194, 195, 199], [255, 241, 232],
    [255, 0, 77], [255, 163, 0], [255, 236, 39], [0, 228, 54],
    [41, 173, 255], [131, 118, 156], [255, 119, 168], [255, 204, 170]
  ],
  "ゲームボーイ風 (4色)": [
    [15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]
  ],
  "ファミコン / NES風 (16色)": [
    [0, 0, 0], [252, 252, 252], [188, 188, 188], [124, 124, 124],
    [168, 16, 0], [248, 56, 0], [252, 160, 68], [248, 184, 0],
    [0, 168, 0], [88, 216, 84], [0, 120, 248], [104, 136, 252],
    [216, 0, 204], [248, 120, 248], [172, 124, 0], [0, 136, 136]
  ],
  "サイバーネオン (12色)": [
    [10, 10, 25], [255, 0, 128], [0, 240, 255], [57, 255, 20],
    [255, 225, 53], [138, 43, 226], [255, 110, 0], [255, 255, 255],
    [40, 20, 60], [20, 70, 90], [100, 20, 80], [180, 255, 0]
  ],
  "モノクロ (白黒2階調)": [
    [0, 0, 0], [255, 255, 255]
  ],
  "セピア写真風": [
    [43, 26, 14], [94, 62, 35], [150, 108, 68], [204, 166, 116], [240, 220, 180]
  ],
};

const dist = (a: RGB, b: RGB) => {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return 0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db;
};

function nearest(c: RGB, pal: RGB[]) {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < pal.length; i++) {
    const d = dist(c, pal[i]);
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return pal[best];
}

function kmeans(px: RGB[], k: number): RGB[] {
  if (!px.length) return [[128, 128, 128]];
  const cents: RGB[] = [px[Math.floor(px.length / 2)]];
  while (cents.length < k && cents.length < px.length) {
    let far = px[0];
    let fd = -1;
    for (let i = 0; i < px.length; i += Math.max(1, Math.floor(px.length / 400))) {
      let m = Infinity;
      for (const c of cents) {
        m = Math.min(m, dist(px[i], c));
      }
      if (m > fd) {
        fd = m;
        far = px[i];
      }
    }
    cents.push([...far] as RGB);
  }

  for (let it = 0; it < 12; it++) {
    const s = cents.map(() => [0, 0, 0, 0]);
    for (const p of px) {
      let bi = 0;
      let bd = Infinity;
      cents.forEach((c, i) => {
        const d = dist(p, c);
        if (d < bd) {
          bd = d;
          bi = i;
        }
      });
      s[bi][0] += p[0];
      s[bi][1] += p[1];
      s[bi][2] += p[2];
      s[bi][3]++;
    }
    s.forEach((v, i) => {
      if (v[3]) cents[i] = [v[0] / v[3], v[1] / v[3], v[2] / v[3]];
    });
  }
  return cents.map((c) => c.map(Math.round) as RGB);
}

const BAYER_4x4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export interface Opts {
  size: number; // 16 to 128
  aspectMode: "square-crop" | "square-fit" | "stretch" | "original";
  colors: number;
  palette: string;
  dither: "none" | "bayer" | "fs" | "noise";
  contrast: number; // -100 to 100
  brightness: number; // -100 to 100
  saturation: number; // 0 to 200
  mcNoise: number; // 0 to 100 Minecraft texture noise
  outline: boolean;
  sharpness: boolean;
}

export function pixelate(img: HTMLImageElement, o: Opts) {
  let targetW = o.size;
  let targetH = o.size;

  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const aspect = nh / nw;

  if (o.aspectMode === "original") {
    if (aspect <= 1) {
      targetW = o.size;
      targetH = Math.max(1, Math.round(o.size * aspect));
    } else {
      targetH = o.size;
      targetW = Math.max(1, Math.round(o.size / aspect));
    }
  } else {
    // Minecraft textures are strictly square (16x16, 32x32, 64x64...)
    targetW = o.size;
    targetH = o.size;
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Handle aspect mode cropping / drawing
  if (o.aspectMode === "square-crop") {
    // Crop center square from source
    const minSide = Math.min(nw, nh);
    const sx = (nw - minSide) / 2;
    const sy = (nh - minSide) / 2;
    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetW, targetH);
  } else if (o.aspectMode === "square-fit") {
    // Fit inside square with transparent margins
    let fw = targetW;
    let fh = targetH;
    let ox = 0;
    let oy = 0;
    if (nw > nh) {
      fh = Math.max(1, Math.round((targetW * nh) / nw));
      oy = Math.floor((targetH - fh) / 2);
    } else {
      fw = Math.max(1, Math.round((targetH * nw) / nh));
      ox = Math.floor((targetW - fw) / 2);
    }
    ctx.drawImage(img, 0, 0, nw, nh, ox, oy, fw, fh);
  } else {
    // stretch or original
    ctx.drawImage(img, 0, 0, targetW, targetH);
  }

  const id = ctx.getImageData(0, 0, targetW, targetH);
  const d = id.data;

  // 1. Color adjustments (Contrast, Brightness, Saturation)
  const cf = (259 * (o.contrast + 255)) / (255 * (259 - o.contrast));
  const px: RGB[] = [];
  const alpha: number[] = [];

  // Minecraft texture grain noise generator with deterministic seed or subtle random
  const noiseScale = (o.mcNoise / 100) * 32;

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];
    const a = d[i + 3];

    if (a < 20) {
      px.push([0, 0, 0]);
      alpha.push(0);
      continue;
    }

    // Brightness
    r += (o.brightness / 100) * 128;
    g += (o.brightness / 100) * 128;
    b += (o.brightness / 100) * 128;

    // Contrast
    r = cf * (r - 128) + 128;
    g = cf * (g - 128) + 128;
    b = cf * (b - 128) + 128;

    // Saturation
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    const s = o.saturation / 100;
    r = l + (r - l) * s;
    g = l + (g - l) * s;
    b = l + (b - l) * s;

    // Minecraft grain noise (creates that classic blocky stone/wood texture variance)
    if (noiseScale > 0) {
      const n = (Math.random() - 0.5) * noiseScale * 2;
      r += n;
      g += n;
      b += n;
    }

    px.push([
      Math.max(0, Math.min(255, r)),
      Math.max(0, Math.min(255, g)),
      Math.max(0, Math.min(255, b)),
    ]);
    alpha.push(a);
  }

  // 2. Palette resolution
  const activePal = PALETTES[o.palette] ?? kmeans(px.filter((_, i) => alpha[i] > 20), o.colors);

  // 3. Dithering
  const buf = px.map((p) => [...p] as RGB);
  const spread = 56 / Math.max(2, Math.sqrt(activePal.length));

  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const idx = y * targetW + x;
      if (alpha[idx] < 64) {
        d[idx * 4 + 3] = 0;
        continue;
      }

      let p = buf[idx];

      if (o.dither === "bayer") {
        const threshold = (BAYER_4x4[y % 4][x % 4] / 16 - 0.5) * spread;
        p = [p[0] + threshold, p[1] + threshold, p[2] + threshold];
      } else if (o.dither === "noise") {
        const rnd = (Math.random() - 0.5) * spread * 0.8;
        p = [p[0] + rnd, p[1] + rnd, p[2] + rnd];
      }

      const clampedP: RGB = [
        Math.max(0, Math.min(255, p[0])),
        Math.max(0, Math.min(255, p[1])),
        Math.max(0, Math.min(255, p[2])),
      ];

      const n = nearest(clampedP, activePal);

      if (o.dither === "fs") {
        const e = [clampedP[0] - n[0], clampedP[1] - n[1], clampedP[2] - n[2]];
        const addError = (xx: number, yy: number, weight: number) => {
          if (xx < 0 || xx >= targetW || yy < 0 || yy >= targetH) return;
          const neighborIdx = yy * targetW + xx;
          if (alpha[neighborIdx] < 64) return;
          const q = buf[neighborIdx];
          q[0] += e[0] * weight;
          q[1] += e[1] * weight;
          q[2] += e[2] * weight;
        };
        addError(x + 1, y, 7 / 16);
        addError(x - 1, y + 1, 3 / 16);
        addError(x, y + 1, 5 / 16);
        addError(x + 1, y + 1, 1 / 16);
      }

      d[idx * 4] = n[0];
      d[idx * 4 + 1] = n[1];
      d[idx * 4 + 2] = n[2];
      d[idx * 4 + 3] = 255; // Minecraft textures are crisp solid or 0 alpha
    }
  }

  // 4. Outline (useful for Minecraft items like swords / tools)
  if (o.outline) {
    const isSolid = alpha.map((a) => a > 127);
    let darkest = activePal[0];
    for (const p of activePal) {
      if (p[0] + p[1] + p[2] < darkest[0] + darkest[1] + darkest[2]) darkest = p;
    }
    for (let y = 0; y < targetH; y++) {
      for (let x = 0; x < targetW; x++) {
        const i = y * targetW + x;
        if (!isSolid[i]) continue;
        const isEdge = [
          [1, 0], [-1, 0], [0, 1], [0, -1],
        ].some(([dx, dy]) => {
          const X = x + dx;
          const Y = y + dy;
          return X < 0 || Y < 0 || X >= targetW || Y >= targetH || !isSolid[Y * targetW + X];
        });
        if (isEdge) {
          d[i * 4] = darkest[0];
          d[i * 4 + 1] = darkest[1];
          d[i * 4 + 2] = darkest[2];
        }
      }
    }
  }

  ctx.putImageData(id, 0, 0);
  return { canvas, palette: activePal };
}
