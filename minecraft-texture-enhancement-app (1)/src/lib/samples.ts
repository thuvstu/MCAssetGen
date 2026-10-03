import { Tex, createTex, hexToRgb, hash2, fbm, rng, resizeTex, clamp, rgbToHex } from './tex';

function make(w: number, h: number, fn: (x: number, y: number) => string | null): Tex {
  const t = createTex(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = fn(x, y);
      if (!c) continue;
      const [r, g, b] = hexToRgb(c);
      const i = (y * w + x) * 4;
      t.d[i] = r; t.d[i + 1] = g; t.d[i + 2] = b; t.d[i + 3] = 255;
    }
  return t;
}
const shade = (pal: string[], v: number) => pal[Math.max(0, Math.min(pal.length - 1, Math.floor(v * pal.length)))];

function fromMap(rows: string[], cols: Record<string, string>): Tex {
  return make(rows[0].length, rows.length, (x, y) => cols[rows[y][x]] ?? null);
}

const stone = () => {
  const n = fbm(11, 16, 16, 4, 2);
  const pal = ['#5f5f5f', '#6f6f6f', '#7b7b7b', '#868686', '#8f8f8f', '#9a9a9a'];
  return make(16, 16, (x, y) => shade(pal, n(x, y) * 0.8 + hash2(x, y, 3) * 0.35 - 0.05));
};
const dirt = () => {
  const pal = ['#4a3222', '#593d29', '#6b4a32', '#79553a', '#866043'];
  return make(16, 16, (x, y) => shade(pal, hash2(x, y, 5) * 0.7 + hash2(x >> 1, y >> 1, 9) * 0.35));
};
const grass = () => {
  const pal = ['#3f6b22', '#4a7d2a', '#578f31', '#62a038', '#6fb33f'];
  return make(16, 16, (x, y) => shade(pal, hash2(x, y, 21) * 0.75 + hash2(x >> 2, y >> 2, 4) * 0.3));
};
const grassSide = () => {
  const d = dirt();
  const gp = ['#4a7d2a', '#578f31', '#62a038'];
  return make(16, 16, (x, y) => {
    const depth = 3 + Math.floor(hash2(x, 0, 77) * 2.6);
    if (y < depth) return shade(gp, hash2(x, y, 31));
    const i = (y * 16 + x) * 4;
    return '#' + [d.d[i], d.d[i + 1], d.d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('');
  });
};
const planks = () => {
  const pal = ['#8a6a3c', '#9b7845', '#a8834c', '#b58f56', '#bb9860'];
  return make(16, 16, (x, y) => {
    const row = Math.floor(y / 4);
    if (y % 4 === 3) return '#6b5230';
    const seam = [3, 11, 7, 14][row];
    if (x === seam) return '#735834';
    const grain = hash2(Math.floor(x / 3) + row * 7, y, 8) * 0.6 + hash2(row, 0, 2) * 0.4;
    return shade(pal, grain);
  });
};
const cobble = () => {
  const R = rng(42);
  const pts = Array.from({ length: 9 }, () => [R() * 16, R() * 16]);
  const pal = ['#5a5a5a', '#6e6e6e', '#7f7f7f', '#8d8d8d', '#9c9c9c'];
  return make(16, 16, (x, y) => {
    let d1 = 1e9, d2 = 1e9, id = 0;
    pts.forEach(([px, py], i) => {
      for (const ox of [-16, 0, 16]) for (const oy of [-16, 0, 16]) {
        const d = Math.hypot(x + 0.5 - px - ox, y + 0.5 - py - oy);
        if (d < d1) { d2 = d1; d1 = d; id = i; } else if (d < d2) d2 = d;
      }
    });
    if (d2 - d1 < 1.1) return '#3e3e3e';
    const [px, py] = pts[id];
    const lit = (px - x) + (py - y) > 0 ? 0.25 : -0.1;
    return shade(pal, 0.35 + lit + hash2(x, y, id) * 0.35);
  });
};
const sand = () => {
  const pal = ['#d4c08a', '#dbc893', '#e2d09c', '#e8d8a6', '#c9b27a'];
  return make(16, 16, (x, y) => shade(pal, hash2(x, y, 55)));
};
const lava = () => {
  const n = fbm(5, 16, 16, 3, 3);
  const pal = ['#a02200', '#cf3a00', '#e85a08', '#f68a1a', '#ffb830', '#ffe070'];
  return make(16, 16, (x, y) => shade(pal, n(x, y) * 1.3 - 0.15));
};
const bricks = () => {
  const pal = ['#8c3f2e', '#9a4a36', '#a8543e', '#96452f'];
  return make(16, 16, (x, y) => {
    const row = Math.floor(y / 4);
    if (y % 4 === 3) return '#b8aea0';
    if ((x + (row % 2 ? 4 : 0)) % 8 === 7) return '#b8aea0';
    return shade(pal, hash2(x, y, 12) * 0.7 + (y % 4 === 0 ? 0.3 : 0));
  });
};

const SWORD = [
  '..............oo', '.............olo', '............olmo', '...........olmo.', '..........olmo..', '.........olmo...',
  '........olmo....', '.......olmd.....', '..oo..olmd......', '..ogoolmd.......', '...oggmd........', '....ogo.........',
  '...ohogo........', '..oho.ogo.......', '.ooo...oo.......', '.oo.............',
];
const GEM = [
  '................', '................', '.....oooooo.....', '....ollllmmo....', '...olwllmmmdo...', '..olwlllmmmddo..',
  '..ommmmmmmdddo..', '...ommmmmmddo...', '....ommmmddo....', '.....ommmdo.....', '......omdo......', '.......oo.......',
  '................', '................', '................', '................',
];
const APPLE = [
  '................', '........o.......', '.......oh.......', '.....ooghoo.....', '....orrgrrro....', '...orwrrrrrdo...',
  '...orwrrrrrdo...', '...orrrrrrrdo...', '...orrrrrrddo...', '...orrrrrrddo...', '....orrrrddo....', '....orrrdddo....',
  '.....oo.ooo.....', '................', '................', '................',
];
const PICK = [
  '................', '....oooooooo....', '...ollllmmmmo...', '..olmoooooomdo..', '..omo..ohho.odo.', '..oo...oho...oo.',
  '......ohoo......', '.....ohoo.......', '....ohoo........', '...ohoo.........', '..ohoo..........', '.ohoo...........',
  '.ooo............', '................', '................', '................',
];

export interface Sample { id: string; name: string; kind: 'block' | 'item' | 'other'; make: () => Tex; top?: () => Tex }
const BASE_SAMPLES: Sample[] = [
  { id: 'stone', name: '石', kind: 'block', make: stone },
  { id: 'cobble', name: '丸石', kind: 'block', make: cobble },
  { id: 'dirt', name: '土', kind: 'block', make: dirt },
  { id: 'grass', name: '草ブロック側面', kind: 'block', make: grassSide },
  { id: 'grasstop', name: '草(上面)', kind: 'block', make: grass },
  { id: 'planks', name: 'オークの板材', kind: 'block', make: planks },
  { id: 'bricks', name: 'レンガ', kind: 'block', make: bricks },
  { id: 'sand', name: '砂', kind: 'block', make: sand },
  { id: 'lava', name: '溶岩', kind: 'block', make: lava },
  { id: 'sword', name: 'ダイヤの剣', kind: 'item', make: () => fromMap(SWORD, { o: '#0b3534', l: '#d8fff9', m: '#4ae3d6', d: '#23958c', g: '#4d3313', h: '#8a5a2b' }) },
  { id: 'pick', name: '鉄のツルハシ', kind: 'item', make: () => fromMap(PICK, { o: '#262626', l: '#f2f2f2', m: '#c8c8c8', d: '#8a8a8a', h: '#8a5a2b' }) },
  { id: 'gem', name: 'ルビー', kind: 'item', make: () => fromMap(GEM, { o: '#3a0610', l: '#ff6a80', w: '#ffe0e6', m: '#d8203c', d: '#8a0f22' }) },
  { id: 'apple', name: 'リンゴ', kind: 'item', make: () => fromMap(APPLE, { o: '#3a0a0a', r: '#d42a2a', w: '#ffb0a0', d: '#8e1616', g: '#3f8a2a', h: '#5a3a16' }) },
];

function oreTexture(color: string, seed = 15): Tex {
  const base = resizeTex(stone(), 32);
  const c = hexToRgb(color), occupied = new Set<number>();
  const clusters = [[3, 3], [11, 2], [7, 6], [2, 9], [12, 9], [7, 12], [13, 14]];
  for (const [cx, cy] of clusters) {
    const shape = hash2(cx, cy, seed) > 0.5 ? [[0, 0], [1, 0], [0, 1], [-1, 1]] : [[0, 0], [1, 0], [1, 1], [0, -1]];
    for (const [dx, dy] of shape) occupied.add((cy + dy) * 16 + cx + dx);
  }
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const i = (y * 32 + x) * 4, px = x >> 1, py = y >> 1, k = py * 16 + px;
    const grain = (hash2(x, y, seed) - 0.5) * 10;
    if (occupied.has(k)) {
      const top = !occupied.has(k - 16) && y % 2 === 0;
      const left = !occupied.has(k - 1) && x % 2 === 0;
      const bottom = !occupied.has(k + 16) && y % 2 === 1;
      const right = !occupied.has(k + 1) && x % 2 === 1;
      const light = top || left ? 0.35 : bottom || right ? -0.38 : (hash2(px, py, seed + 1) - 0.5) * 0.25;
      for (let q = 0; q < 3; q++) base.d[i + q] = c[q] + (light > 0 ? (255 - c[q]) * light : c[q] * light) + grain;
    } else {
      const edge = occupied.has(k + 1) || occupied.has(k - 1) || occupied.has(k + 16) || occupied.has(k - 16);
      for (let q = 0; q < 3; q++) base.d[i + q] = base.d[i + q] * (edge ? 0.61 : 0.87) + grain;
    }
  }
  return base;
}

const mineral = (colors: string[], seed: number) => {
  const n = fbm(seed, 16, 16, 5, 2);
  return make(16, 16, (x, y) => shade(colors, clamp(n(x, y) * 1.3 - 0.15 + hash2(x, y, seed) * 0.1, 0, 1)));
};

const logTexture = () => make(16, 16, (x, y) => {
  const row = hash2(Math.floor(x / 2), Math.floor(y / 7), 45);
  return shade(['#3d2e1d', '#51402a', '#645133', '#76603c', '#856c46'], row * 0.9 + hash2(x, y, 6) * 0.18);
});
const logTop = () => make(16, 16, (x, y) => {
  const r = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
  if (r > 6) return '#5e492d';
  return shade(['#af8d54', '#c7a769', '#d7ba7e'], (Math.floor(r) % 3) / 3 + hash2(x, y, 4) * 0.2);
});

const leaves = () => make(16, 16, (x, y) => {
  if (hash2(x, y, 12) < 0.13) return null;
  return shade(['#294b28', '#396734', '#4c823b', '#649549', '#76a657'], hash2(x, y, 39));
});

const potion = () => fromMap([
  '................', '......oooo......', '......ohho......', '......oggo......', '.....ogwwgo.....',
  '....ogw..wgo....', '...ogw....wgo...', '...ogwpppppgo...', '...ogppppppgo...', '...ogppllppgo...',
  '...ogplllppgo...', '...ogppppppgo...', '....ogppppgo....', '.....oooooo.....', '................', '................',
], { o: '#272538', h: '#9e784b', g: '#9aabb2', w: '#e4ffff', p: '#a45fe0', l: '#cf95f5' });

const skin = () => {
  const t = createTex(64, 64);
  const rect = (x: number, y: number, w: number, h: number, c: string) => {
    const rgb = hexToRgb(c);
    for (let py = y; py < y + h; py++) for (let px = x; px < x + w; px++) {
      const i = (py * 64 + px) * 4;
      const noise = hash2(px, py, 2) * 8;
      t.d[i] = rgb[0] + noise; t.d[i + 1] = rgb[1] + noise; t.d[i + 2] = rgb[2] + noise; t.d[i + 3] = 255;
    }
  };
  rect(0, 8, 32, 8, '#bd9378'); rect(8, 0, 16, 8, '#483e33'); rect(0, 8, 32, 2, '#483e33');
  rect(10, 12, 2, 1, '#ebeeec'); rect(14, 12, 2, 1, '#ebeeec'); rect(11, 12, 1, 1, '#3d788c'); rect(14, 12, 1, 1, '#3d788c');
  rect(0, 20, 16, 12, '#343d53'); rect(16, 20, 24, 12, '#36939c'); rect(40, 20, 16, 4, '#36939c');
  rect(40, 24, 16, 8, '#bd9378'); rect(16, 52, 16, 12, '#343d53'); rect(32, 52, 16, 4, '#36939c'); rect(32, 56, 16, 8, '#bd9378');
  return t;
};

const gui = () => make(128, 64, (x, y) => {
  if (x < 2 || y < 2 || x > 125 || y > 61) return '#292b2a';
  if (x < 4 || y < 4) return '#e6e5df';
  if (x > 123 || y > 59) return '#686d68';
  const sx = (x - 10) % 18, sy = (y - 14) % 18;
  if (x >= 10 && x < 118 && y >= 14 && y < 50) return sx < 16 && sy < 16 ? sx === 0 || sy === 0 ? '#5e6561' : '#949b93' : '#c2c8bc';
  return '#c2c8bc';
});

const byId = (id: string) => BASE_SAMPLES.find((s) => s.id === id)!;

export const SAMPLES: Sample[] = [
  { ...byId('grass'), name: '草ブロック', top: grass },
  byId('stone'), byId('cobble'), byId('dirt'),
  { id: 'diamond_ore', name: 'ダイヤモンド鉱石', kind: 'block', make: () => oreTexture('#45c7bb') },
  { id: 'emerald_ore', name: 'エメラルド鉱石', kind: 'block', make: () => oreTexture('#53c779', 47) },
  { id: 'gold_ore', name: '金鉱石', kind: 'block', make: () => oreTexture('#e4bd62', 5) },
  { id: 'iron_ore', name: '鉄鉱石', kind: 'block', make: () => oreTexture('#d2b9a1', 23) },
  { id: 'redstone_ore', name: 'レッドストーン', kind: 'block', make: () => oreTexture('#c64843', 7) },
  byId('planks'), { id: 'oak_log', name: 'オークの原木', kind: 'block', make: logTexture, top: logTop }, byId('bricks'),
  { id: 'obsidian', name: '黒曜石', kind: 'block', make: () => mineral(['#171522', '#231e31', '#342c44', '#463e55', '#605269'], 54) },
  { id: 'amethyst', name: 'アメジスト', kind: 'block', make: () => mineral(['#4e3b6e', '#745496', '#9471ba', '#b298d2', '#d2baf0'], 15) },
  byId('sand'), byId('lava'),
  { id: 'water', name: '水', kind: 'block', make: () => mineral(['#173b80', '#1e509b', '#2564b1', '#397ac4', '#609dd7'], 42) },
  { id: 'leaves', name: 'オークの葉', kind: 'block', make: leaves },
  byId('sword'), byId('pick'), byId('gem'),
  { id: 'diamond', name: 'ダイヤモンド', kind: 'item', make: () => fromMap(GEM, { o: '#164a4d', l: '#a7f2e5', w: '#e3fff9', m: '#40c8bc', d: '#218c88' }) },
  byId('apple'), { id: 'potion', name: 'ポーション', kind: 'item', make: potion },
  { id: 'skin', name: 'スキン UV', kind: 'other', make: skin },
  { id: 'inventory', name: 'インベントリ UI', kind: 'other', make: gui },
  { id: 'particle', name: 'パーティクル', kind: 'other', make: () => make(16, 16, (x, y) => {
    const dx = Math.abs(x - 7), dy = Math.abs(y - 7);
    if (dx + dy > 6 || (dx > 1 && dy > 1)) return null;
    return rgbToHex(170 + (6 - dx - dy) * 14, 215 + (6 - dx - dy) * 5, 255);
  }) },
];
