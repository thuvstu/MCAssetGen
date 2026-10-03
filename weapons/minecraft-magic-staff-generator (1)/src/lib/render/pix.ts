import { RGB, clamp01, clamp255 } from '../color';

/** RGBA pixel buffer with source-over blending. */
export class Pix {
  w: number; h: number;
  d: Uint8ClampedArray;
  constructor(w: number, h: number) {
    this.w = w; this.h = h;
    this.d = new Uint8ClampedArray(w * h * 4);
  }
  idx(x: number, y: number) { return (y * this.w + x) * 4; }
  in(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  alpha(x: number, y: number) {
    if (!this.in(x, y)) return 0;
    return this.d[this.idx(x, y) + 3];
  }
  set(x: number, y: number, c: RGB, a = 255) {
    x = Math.round(x); y = Math.round(y);
    if (!this.in(x, y)) return;
    const i = this.idx(x, y);
    this.d[i] = clamp255(c[0]); this.d[i + 1] = clamp255(c[1]); this.d[i + 2] = clamp255(c[2]); this.d[i + 3] = clamp255(a);
  }
  blend(x: number, y: number, c: RGB, a: number) {
    x = Math.round(x); y = Math.round(y);
    if (!this.in(x, y) || a <= 0) return;
    const i = this.idx(x, y);
    const da = this.d[i + 3] / 255;
    const sa = clamp01(a / 255);
    const out = sa + da * (1 - sa);
    if (out <= 0.001) return;
    this.d[i] = clamp255((c[0] * sa + this.d[i] * da * (1 - sa)) / out);
    this.d[i + 1] = clamp255((c[1] * sa + this.d[i + 1] * da * (1 - sa)) / out);
    this.d[i + 2] = clamp255((c[2] * sa + this.d[i + 2] * da * (1 - sa)) / out);
    this.d[i + 3] = clamp255(out * 255);
  }
  disc(cx: number, cy: number, r: number, c: RGB, a = 255) {
    if (r <= 0) { this.blend(cx, cy, c, a); return; }
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        if (Math.hypot(x - cx, y - cy) <= r + 0.2) this.blend(x, y, c, a);
      }
    }
  }
  ring(cx: number, cy: number, r: number, th: number, c: RGB, a: number) {
    for (let y = Math.floor(cy - r - th); y <= cy + r + th; y++) {
      for (let x = Math.floor(cx - r - th); x <= cx + r + th; x++) {
        const d = Math.abs(Math.hypot(x - cx, y - cy) - r);
        if (d <= th) this.blend(x, y, c, a * (1 - (d / (th + 0.001)) * 0.55));
      }
    }
  }
}
