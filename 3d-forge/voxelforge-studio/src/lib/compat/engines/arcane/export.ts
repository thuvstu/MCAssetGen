/* PNG / animation ZIP export */
import JSZip from 'jszip';
import type { StaffConfig } from './types';
import { DEFAULT_ANIMATION } from './defaults';
import { renderAnimationFrames, renderPixels, buildMcmeta } from './render';

export const baseName = (cfg: StaffConfig) =>
  `arcane-${cfg.itemType}_${cfg.element}_${cfg.seed}_${cfg.resolution}x${cfg.resolution}`;

function imageToCanvas(img: ImageData, scale = 1): HTMLCanvasElement {
  const src = document.createElement('canvas');
  src.width = img.width; src.height = img.height;
  src.getContext('2d')!.putImageData(img, 0, 0);
  if (scale === 1) return src;
  const out = document.createElement('canvas');
  out.width = img.width * scale; out.height = img.height * scale;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, out.width, out.height);
  return out;
}

function trigger(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href; a.download = filename; a.click();
}

export function downloadPng(cfg: StaffConfig, scale = 1) {
  const { data, size } = renderPixels(cfg);
  const cv = imageToCanvas(new ImageData(new Uint8ClampedArray(data), size, size), scale);
  trigger(cv.toDataURL('image/png'), `${baseName(cfg)}${scale > 1 ? `@${scale}x` : ''}.png`);
}

export async function downloadAnimationZip(cfg: StaffConfig): Promise<number> {
  const anim = cfg.animation ?? DEFAULT_ANIMATION;
  const frames = renderAnimationFrames(cfg);
  const zip = new JSZip();
  const name = `${baseName(cfg)}_${anim.type}`;
  const folder = anim.frameByFrame ? zip.folder(name)! : zip;
  const pad = String(frames.length).length;
  frames.forEach((img, i) => {
    const b64 = imageToCanvas(img).toDataURL('image/png').split(',')[1];
    folder.file(`frame_${String(i).padStart(pad, '0')}.png`, b64, { base64: true });
  });
  if (anim.mcmeta) folder.file('magic_rod.png.mcmeta', JSON.stringify(buildMcmeta(cfg), null, 2));

  // vertical sprite strip (what vanilla actually animates)
  const strip = document.createElement('canvas');
  strip.width = cfg.resolution; strip.height = cfg.resolution * frames.length;
  const sctx = strip.getContext('2d')!;
  sctx.imageSmoothingEnabled = false;
  frames.forEach((img, i) => sctx.drawImage(imageToCanvas(img), 0, i * cfg.resolution));
  const blob: Blob = await new Promise((res) => strip.toBlob((b) => res(b!), 'image/png'));
  zip.file(`sprite_sheet_${frames.length}f.png`, blob);

  zip.file('README.txt', [
    `# ${name}`, '',
    `- Item type : ${cfg.itemType}`, `- Element   : ${cfg.element}`, `- Animation : ${anim.type}`,
    `- Frames    : ${frames.length} @ ${anim.fps}fps (${anim.loopMode})`,
    `- Resolution: ${cfg.resolution}×${cfg.resolution}`, `- Seed      : ${cfg.seed}`, '',
    '## Minecraft resource pack usage',
    'Rename sprite_sheet_*.png to your item texture, place it in',
    'assets/minecraft/textures/item/ together with the .mcmeta file',
    '(vanilla animates vertical strips automatically).',
  ].join('\n'));

  const buf = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(buf);
  trigger(url, `${name}.zip`);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return frames.length;
}
