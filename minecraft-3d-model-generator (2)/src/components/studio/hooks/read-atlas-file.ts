import {
  ATLAS_BYTES_MESSAGE,
  ATLAS_LIMITS,
  ATLAS_SIZE_MESSAGE,
} from "@/lib/atlas-limits";
import type { AtlasInput } from "@/lib/model-types";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    image.src = source;
  });
}

/** Validates a user-picked PNG in the browser before sending it to the server. */
export async function readAtlasFile(file: File): Promise<AtlasInput> {
  if (file.type !== "image/png")
    throw new Error("PNG形式のUVアトラスを選択してください。");
  if (file.size > ATLAS_LIMITS.maxBytes) throw new Error(ATLAS_BYTES_MESSAGE);

  const source = await readAsDataUrl(file);
  const image = await loadImage(source);
  const { minSize, maxSize } = ATLAS_LIMITS;
  if (
    image.width < minSize ||
    image.height < minSize ||
    image.width > maxSize ||
    image.height > maxSize
  ) {
    throw new Error(ATLAS_SIZE_MESSAGE);
  }

  return { source, width: image.width, height: image.height, name: file.name };
}
