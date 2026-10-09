import { Tex, createTex } from './tex';

const dist = (a: RGB, b: RGB) => {
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return 0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db;
};

function nearest(c: RGB, pal: RGB[]): RGB {
  let best = 0, bd = Infinity;
  for (let i = 0; i < pal.length; i++) {
    const d = dist(c, pal[i]);
    if (d < bd) { bd = d; best = i; }
  }
  return pal[best];
}

export function kmeans(px: RGB[], k: number): RGB[] {
  if (!px.length) return [[128, 128, 128]];
  const cents: RGB[] = [px[Math.floor(px.length / 2)]];
  while (cents.length < k && cents.length < px.length) {
    let far = px[0], fd = -1;
    for (let i = 0; i < px.length; i += Math.max(1, Math.floor(px.length / 400))) {
      let m = Infinity;
      for (const c of cents) m = Math.min(m, dist(px[i], c));
      if (m > fd) { fd = m; far = px[i]; }
    }
    cents.push([...far] as RGB);
  }
  for (let it = 0; it < 12; it++) {
    const s = cents.map(() => [0, 0, 0, 0]);
    for (const p of px) {
      let bi = 0, bd = Infinity;
      cents.forEach((c, i) => {
        const d = dist(p, c);
        if (d < bd) { bd = d; bi = i; }
      });
      s[bi][0] += p[0]; s[bi][1] += p[1]; s[bi][2] += p[2]; s[bi][3]++;
    }
    s.forEach((v, i) => {
      if (v[3]) cents[i] = [v[0] / v[3], v[1] / v[3], v[2] / v[3]];
    });
  }
  return cents.map((c) => c.map(Math.round) as RGB);
}

/** Reduce a Tex to a fixed palette (or k-means palette when paletteName is null). */
export function reduceTex(src: Tex, paletteName: string | null, colors = 16): Tex {
  const px: RGB[] = [];
  for (let i = 0; i < src.d.length; i += 4) {
    if (src.d[i + 3] < 20) continue;
    px.push([src.d[i], src.d[i + 1], src.d[i + 2]]);
  }
  const pal = paletteName ? PALETTES[paletteName] ?? null : null;
  const table = pal ?? kmeans(px, Math.max(2, Math.min(256, colors)));
  const out = createTex(src.w, src.h);
  for (let i = 0; i < src.d.length; i += 4) {
    if (src.d[i + 3] < 20) continue;
    const [r, g, b] = nearest([src.d[i], src.d[i + 1], src.d[i + 2]], table);
    out.d[i] = r; out.d[i + 1] = g; out.d[i + 2] = b; out.d[i + 3] = 255;
  }
  return out;
}

export type RGB = [number, number, number];

// ---- Palettes ported from pixel-art-conversion-apps (8) ----

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
