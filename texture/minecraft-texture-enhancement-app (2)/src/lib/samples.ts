import { Tex, createTex, hexToRgb, hash2, fbm, rng } from './tex';

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

const material = (palette: string[], seed: number, scale = 4) => {
  const n = fbm(seed, 16, 16, scale, 3);
  return make(16, 16, (x, y) => shade(palette, n(x, y) * 0.82 + hash2(x, y, seed + 90) * 0.32 - 0.04));
};
const obsidian = () => material(['#130e20', '#201630', '#302042', '#432954', '#5d386b'], 44, 3);
const endStone = () => material(['#a6aa79', '#b8bb88', '#c9cc9c', '#d7d9ae', '#e5e6ba'], 64, 5);
const netherrack = () => material(['#35111a', '#4e1923', '#68212b', '#792c33', '#8b353b'], 81, 6);
const deepslate = () => material(['#282d2f', '#343a3d', '#41484a', '#51575a', '#5e6565'], 90, 4);
const water = () => material(['#17446f', '#195589', '#20669a', '#307bad', '#4794bd'], 30, 3);
const wool = () => material(['#bab1a6', '#d2c9be', '#e5dcd2', '#f1e9df', '#ffffff'], 102, 8);
const leaves = () => make(16, 16, (x, y) => hash2(x, y, 72) < 0.12 ? null :
  shade(['#173d20', '#27612b', '#3d7935', '#4a8c3e', '#64a54a'], hash2(x, y, 73) * 0.65 + hash2(x >> 2, y >> 2, 74) * 0.35));
const glass = () => make(16, 16, (x, y) => {
  if (x === 0 || y === 0) return '#e5faff';
  if (x === 15 || y === 15) return '#6395a8';
  if ((x === 3 && y >= 2 && y < 8) || (x === 5 && y >= 2 && y < 5) || (y === 12 && x > 10)) return '#b8e9f4';
  return null;
});

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

export interface Sample { id: string; name: string; kind: 'block' | 'item'; make: () => Tex }
export const SAMPLES: Sample[] = [
  { id: 'stone', name: '石', kind: 'block', make: stone },
  { id: 'cobble', name: '丸石', kind: 'block', make: cobble },
  { id: 'dirt', name: '土', kind: 'block', make: dirt },
  { id: 'grass', name: '草ブロック側面', kind: 'block', make: grassSide },
  { id: 'grasstop', name: '草(上面)', kind: 'block', make: grass },
  { id: 'planks', name: 'オークの板材', kind: 'block', make: planks },
  { id: 'bricks', name: 'レンガ', kind: 'block', make: bricks },
  { id: 'sand', name: '砂', kind: 'block', make: sand },
  { id: 'lava', name: '溶岩', kind: 'block', make: lava },
  { id: 'obsidian', name: '黒曜石', kind: 'block', make: obsidian },
  { id: 'endstone', name: 'エンドストーン', kind: 'block', make: endStone },
  { id: 'netherrack', name: 'ネザーラック', kind: 'block', make: netherrack },
  { id: 'deepslate', name: '深層岩', kind: 'block', make: deepslate },
  { id: 'water', name: '水', kind: 'block', make: water },
  { id: 'wool', name: '白い羊毛', kind: 'block', make: wool },
  { id: 'leaves', name: '葉', kind: 'block', make: leaves },
  { id: 'glass', name: 'ガラス', kind: 'block', make: glass },
  { id: 'sword', name: 'ダイヤの剣', kind: 'item', make: () => fromMap(SWORD, { o: '#0b3534', l: '#d8fff9', m: '#4ae3d6', d: '#23958c', g: '#4d3313', h: '#8a5a2b' }) },
  { id: 'pick', name: '鉄のツルハシ', kind: 'item', make: () => fromMap(PICK, { o: '#262626', l: '#f2f2f2', m: '#c8c8c8', d: '#8a8a8a', h: '#8a5a2b' }) },
  { id: 'gem', name: 'ルビー', kind: 'item', make: () => fromMap(GEM, { o: '#3a0610', l: '#ff6a80', w: '#ffe0e6', m: '#d8203c', d: '#8a0f22' }) },
  { id: 'apple', name: 'リンゴ', kind: 'item', make: () => fromMap(APPLE, { o: '#3a0a0a', r: '#d42a2a', w: '#ffb0a0', d: '#8e1616', g: '#3f8a2a', h: '#5a3a16' }) },
];
