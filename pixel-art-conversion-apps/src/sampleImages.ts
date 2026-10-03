export interface SampleImage {
  id: string;
  name: string;
  category: string;
  dataUrl: string;
}

function createSample(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 128): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, size);
  return canvas.toDataURL("image/png");
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: "sword",
    name: "ダイヤモンドの剣",
    category: "アイテム",
    dataUrl: createSample((ctx, s) => {
      // Dark background
      ctx.fillStyle = "#1e1b2e";
      ctx.fillRect(0, 0, s, s);
      // Sword diagonal
      const step = s / 16;
      // Blade
      ctx.fillStyle = "#45e6d0";
      for (let i = 0; i < 9; i++) {
        ctx.fillRect((6 + i) * step, (1 + i) * step, step, step);
        ctx.fillStyle = "#2db3a0";
        ctx.fillRect((5 + i) * step, (2 + i) * step, step, step);
        ctx.fillStyle = "#a8fff5";
        ctx.fillRect((7 + i) * step, (0 + i) * step, step, step);
        ctx.fillStyle = "#45e6d0";
      }
      // Crossguard
      ctx.fillStyle = "#3a2518";
      ctx.fillRect(5 * step, 10 * step, step * 2, step);
      ctx.fillRect(4 * step, 9 * step, step, step * 2);
      ctx.fillRect(9 * step, 14 * step, step * 2, step);
      ctx.fillRect(10 * step, 13 * step, step, step * 2);
      // Handle
      ctx.fillStyle = "#8a5733";
      ctx.fillRect(4 * step, 11 * step, step, step);
      ctx.fillRect(3 * step, 12 * step, step, step);
      // Pommel
      ctx.fillStyle = "#2db3a0";
      ctx.fillRect(2 * step, 13 * step, step, step);
    }),
  },
  {
    id: "creeper",
    name: "クリーパーフェイス",
    category: "キャラクター",
    dataUrl: createSample((ctx, s) => {
      // Green patterned background
      const u = s / 8;
      const greens = ["#39962a", "#4bae3a", "#2f7b23", "#56c643", "#226318"];
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          ctx.fillStyle = greens[(x * 3 + y * 7) % greens.length];
          ctx.fillRect(x * u, y * u, u, u);
        }
      }
      // Black face features
      ctx.fillStyle = "#0c150b";
      // Eyes
      ctx.fillRect(1 * u, 2 * u, 2 * u, 2 * u);
      ctx.fillRect(5 * u, 2 * u, 2 * u, 2 * u);
      // Nose / mouth bridge
      ctx.fillRect(3 * u, 3 * u, 2 * u, 3 * u);
      // Mouth sides
      ctx.fillRect(2 * u, 4 * u, 1 * u, 3 * u);
      ctx.fillRect(5 * u, 4 * u, 1 * u, 3 * u);
      // Gap under mouth
      ctx.fillRect(3 * u, 6 * u, 2 * u, 1 * u);
    }),
  },
  {
    id: "golden_apple",
    name: "黄金のリンゴ",
    category: "アイテム",
    dataUrl: createSample((ctx, s) => {
      ctx.fillStyle = "#181424";
      ctx.fillRect(0, 0, s, s);
      const u = s / 16;
      // Stem
      ctx.fillStyle = "#5c3c1e";
      ctx.fillRect(8 * u, 2 * u, u, 3 * u);
      ctx.fillStyle = "#3a2512";
      ctx.fillRect(9 * u, 1 * u, u, 2 * u);
      // Apple body (Gold tones)
      const golds = ["#ffcc00", "#ffd700", "#ffaa00", "#e69500", "#fff280"];
      for (let y = 4; y < 14; y++) {
        for (let x = 3; x < 13; x++) {
          if ((x === 3 || x === 12) && (y === 4 || y === 13)) continue;
          if ((x === 7 || x === 8) && y === 4) continue;
          if (x < 6 && y < 8) {
            ctx.fillStyle = golds[4]; // highlight
          } else if (x > 9 || y > 10) {
            ctx.fillStyle = golds[3]; // shadow
          } else {
            ctx.fillStyle = golds[(x + y) % 3];
          }
          ctx.fillRect(x * u, y * u, u, u);
        }
      }
    }),
  },
  {
    id: "landscape",
    name: "マイクラ風サンセット",
    category: "風景",
    dataUrl: createSample((ctx, s) => {
      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, s);
      grad.addColorStop(0, "#4a1c6d");
      grad.addColorStop(0.35, "#ba4348");
      grad.addColorStop(0.65, "#f79331");
      grad.addColorStop(0.85, "#ffd15c");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, s, s);

      // Square Sun
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(s * 0.55, s * 0.35, s * 0.2, s * 0.2);

      // Cloud
      ctx.fillStyle = "rgba(255, 230, 200, 0.75)";
      ctx.fillRect(s * 0.1, s * 0.25, s * 0.5, s * 0.08);

      // Mountains (blocky step)
      ctx.fillStyle = "#2c1a3b";
      ctx.beginPath();
      ctx.moveTo(0, s);
      ctx.lineTo(0, s * 0.65);
      ctx.lineTo(s * 0.25, s * 0.65);
      ctx.lineTo(s * 0.35, s * 0.55);
      ctx.lineTo(s * 0.5, s * 0.55);
      ctx.lineTo(s * 0.6, s * 0.68);
      ctx.lineTo(s * 0.85, s * 0.58);
      ctx.lineTo(s, s * 0.72);
      ctx.lineTo(s, s);
      ctx.closePath();
      ctx.fill();

      // Foreground trees / terrain
      ctx.fillStyle = "#12091c";
      ctx.fillRect(0, s * 0.78, s, s * 0.22);
      ctx.fillRect(s * 0.15, s * 0.72, s * 0.08, s * 0.15);
      ctx.fillRect(s * 0.75, s * 0.68, s * 0.1, s * 0.18);
    }),
  },
  {
    id: "emerald",
    name: "エメラルド鉱石",
    category: "ブロック",
    dataUrl: createSample((ctx, s) => {
      // Stone gray background
      const u = s / 16;
      const stones = ["#595959", "#6e6e6e", "#4d4d4d", "#7a7a7a", "#404040"];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = stones[(x * 7 + y * 13) % stones.length];
          ctx.fillRect(x * u, y * u, u, u);
        }
      }
      // Emerald gems
      const emeralds = ["#17dd62", "#00b33c", "#5ff594", "#00802b", "#d4ffdc"];
      const coords = [
        [4, 4], [5, 4], [4, 5], [5, 5], [6, 5],
        [9, 8], [10, 8], [9, 9], [10, 9], [11, 9],
        [3, 11], [4, 11], [4, 12],
      ];
      coords.forEach(([x, y], idx) => {
        ctx.fillStyle = emeralds[idx % emeralds.length];
        ctx.fillRect(x * u, y * u, u, u);
      });
    }),
  },
];
