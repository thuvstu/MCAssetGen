/** Shared atlas constraints. Safe to import from both server and client code. */
export const ATLAS_LIMITS = {
  minSize: 16,
  maxSize: 1024,
  maxBytes: 2 * 1024 * 1024,
  /** Base64 data URLs are ~33% larger than the binary they carry. */
  maxDataUrlChars: 3_000_000,
  maxRequestChars: 3_100_000,
} as const;

export const ATLAS_SIZE_MESSAGE = `アトラスのサイズは${ATLAS_LIMITS.minSize}〜${ATLAS_LIMITS.maxSize} pxにしてください。`;
export const ATLAS_BYTES_MESSAGE = "2 MB以下のPNG画像を使用してください。";
