/**
 * Server-safe ImageData shim.
 *
 * Several ported studios were written against the browser `ImageData` type.
 * Their pixel pipelines are DOM-free, so a minimal constructor is enough to
 * run them inside the studio API. This module runs on import: engines that
 * create ImageData during module evaluation are guarded because the shim is
 * imported first by the registry.
 */
type ImageDataLike = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

const globalScope = globalThis as unknown as { ImageData?: unknown };

if (typeof globalScope.ImageData === "undefined") {
  class ImageDataShim implements ImageDataLike {
    width: number;
    height: number;
    data: Uint8ClampedArray;
    readonly colorSpace = "srgb" as const;

    constructor(a: number | Uint8ClampedArray, b?: number, c?: number) {
      if (typeof a === "number") {
        this.width = a;
        this.height = b ?? 1;
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
        return;
      }
      this.data = a;
      this.width = b ?? 1;
      this.height = c ?? Math.max(1, Math.floor(a.length / 4 / this.width));
    }
  }
  globalScope.ImageData = ImageDataShim;
}

export {};
