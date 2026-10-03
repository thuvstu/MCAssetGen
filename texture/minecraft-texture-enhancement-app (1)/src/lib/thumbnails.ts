import { Tex, texToCanvas } from './tex';

export function cubeThumbnail(side: Tex, top: Tex = side, size = 144): string {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = 'rgba(0,0,0,.23)';
  ctx.beginPath(); ctx.ellipse(size / 2, size * 0.86, size * 0.29, size * 0.065, 0, 0, Math.PI * 2); ctx.fill();
  const sideCanvas = texToCanvas(side), topCanvas = texToCanvas(top);
  type Point = [number, number];
  const face = (img: HTMLCanvasElement, a: Point, b: Point, c: Point, shade: number) => {
    ctx.save();
    ctx.transform((b[0] - a[0]) / img.width, (b[1] - a[1]) / img.width, (c[0] - a[0]) / img.height, (c[1] - a[1]) / img.height, a[0], a[1]);
    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = `rgba(0,0,0,${shade})`; ctx.fillRect(0, 0, img.width, img.height);
    ctx.restore();
  };
  const l = size * 0.15, r = size * 0.85, m = size * 0.5;
  const y0 = size * 0.11, y1 = size * 0.285, y2 = size * 0.46, y3 = size * 0.675, y4 = size * 0.85;
  face(sideCanvas, [l, y1], [m, y2], [l, y3], 0.16);
  face(sideCanvas, [m, y2], [r, y1], [m, y4], 0.33);
  face(topCanvas, [m, y0], [r, y1], [l, y1], 0);
  return canvas.toDataURL('image/png');
}