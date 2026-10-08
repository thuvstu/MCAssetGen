import type { RGBA } from "./generator";

/** RGBAピクセル列を Canvas に変換（scale 倍のニアレストネイバー拡大） */
export function rgbaToCanvas(rgba: RGBA, scale = 1): HTMLCanvasElement {
  const base = document.createElement("canvas");
  base.width = rgba.width;
  base.height = rgba.height;
  const bctx = base.getContext("2d")!;
  const imageData = new ImageData(new Uint8ClampedArray(rgba.data), rgba.width, rgba.height);
  bctx.putImageData(imageData, 0, 0);
  if (scale === 1) return base;

  const out = document.createElement("canvas");
  out.width = rgba.width * scale;
  out.height = rgba.height * scale;
  const octx = out.getContext("2d")!;
  octx.imageSmoothingEnabled = false;
  octx.drawImage(base, 0, 0, out.width, out.height);
  return out;
}

/** Canvas から RGBA ピクセル列を取り出す */
export function canvasToRgba(canvas: HTMLCanvasElement): RGBA {
  const ctx = canvas.getContext("2d")!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { width: canvas.width, height: canvas.height, data: new Uint8ClampedArray(img.data) };
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG変換に失敗しました"))), "image/png");
  });
}

/** 任意サイズの画像ファイルを 64x32 のRGBAとして読み込む */
export function loadImageAsAtlas(file: File, width = 64, height = 32): Promise<RGBA> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvasToRgba(canvas));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像の読み込みに失敗しました"));
    };
    img.src = url;
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
