import { NAMESPACE, type AccentId, type VoxelCube, type VoxelModel } from "./model-types";
import { encodePurePng } from "./png";

export const ACCENT_COLORS: Record<AccentId, { label: string; color: string | null }> = {
  auto: { label: "継承", color: null }, gold: { label: "金", color: "#f2cf7a" }, rose: { label: "ローズ", color: "#f29bb8" }, cyan: { label: "シアン", color: "#66e0ea" }, emerald: { label: "緑", color: "#5bdc9a" }, lavender: { label: "紫", color: "#b99bff" }, white: { label: "白", color: "#eef1f8" },
};
export const isHex = (color: unknown): color is `#${string}` => typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color);
export function resolvedColor(color: string | null | undefined): string | null {
  if (isHex(color)) return color.toLowerCase();
  return color && Object.hasOwn(ACCENT_COLORS, color) ? ACCENT_COLORS[color as AccentId].color : null;
}
export function shadeColor(color: string, factor: number): string {
  return "#" + [1, 3, 5].map(offset => Math.round(Math.min(255, Math.max(0, parseInt(color.slice(offset, offset + 2), 16) * factor))).toString(16).padStart(2, "0")).join("");
}
export const tintKey = (color: string) => `accent_${color.slice(1).toLowerCase()}`;
export function accentEntries(model: VoxelModel) {
  const colors = new Set<string>();
  for (const cube of [...model.cubes, ...(model.variants ?? []).flatMap(variant => variant.cubes)]) if (isHex(cube.tint)) colors.add(cube.tint.toLowerCase());
  return [...colors].sort().map((color, index) => ({ color, key: tintKey(color), index: index + 1 }));
}
export function colorPixels(hex: string): Uint8Array {
  const pixels = new Uint8Array(16 * 16 * 4);
  const channels = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
  for (let i = 0; i < 256; i++) {
    const factor = 1 + (((i * 13 + i % 16 * 7) % 11) - 5) * .008;
    for (let c = 0; c < 3; c++) pixels[i * 4 + c] = Math.round(Math.min(255, channels[c] * factor));
    pixels[i * 4 + 3] = 255;
  }
  return pixels;
}
export const colorPng = (color: string) => encodePurePng(16, 16, colorPixels(color));
export function colorDataUrl(color: string) {
  const bytes = colorPng(color); let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return "data:image/png;base64," + btoa(binary);
}
export const tintTextureVariables = (model: VoxelModel) => Object.fromEntries(accentEntries(model).map(entry => [entry.key, `${NAMESPACE}:item/${model.slug}_${entry.key}`]));
export function bbTintTextures(model: VoxelModel) {
  return accentEntries(model).map(entry => ({ uuid: crypto.randomUUID(), id: String(entry.index), name: `${model.slug}_${entry.key}.png`, width: 16, height: 16, uv_width: 16, uv_height: 16, source: colorDataUrl(entry.color), internal: true, mode: "bitmap", saved: false, namespace: NAMESPACE, folder: "item" }));
}
export const bbFaceTexture = (cube: VoxelCube, entries: ReturnType<typeof accentEntries>) => cube.tint ? entries.find(entry => entry.color === cube.tint?.toLowerCase())?.index ?? 0 : 0;
