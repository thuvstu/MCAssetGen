import { NAMESPACE, baseItemOf, gridOf, poseOf, toMinecraftJson, type VoxelModel } from "./json-models";
import { accentEntries } from "./json-colors";

export interface ExportCheck { id: string; label: string; detail: string; status: "ok" | "warning" | "error" }
/** Structural inspection of the actual exported geometry. This is NOT a Minecraft client test. */
export function inspectExport(model: VoxelModel): ExportCheck[] {
  const all = [model.cubes, ...(model.variants ?? []).map(variant => variant.cubes)];
  const validGeometry = all.every(cubes => cubes.length > 0 && cubes.every(cube => cube.from.length === 3 && cube.to.length === 3 && cube.from.every((value, axis) => Number.isFinite(value) && value >= -16 && value <= 32 && Number.isFinite(cube.to[axis]) && cube.to[axis] <= 32 && cube.to[axis] > value)));
  const json = toMinecraftJson(model);
  const validUv = [json, ...(model.variants ?? []).map((_, i) => toMinecraftJson(model, i))].every(output => output.elements.every(element => Object.values(element.faces).every(face => face.uv.length === 4 && face.uv.every(value => Number.isFinite(value) && value >= 0 && value <= 16) && Object.hasOwn(output.textures, face.texture.slice(1)))));
  const validName = /^[a-z0-9_]+$/.test(model.slug) && /^(?:paper|stick|bow|trident|crossbow|flint_and_steel|enchanted_book|(?:wooden|stone|iron|diamond|netherite|golden)_(?:sword|axe|hoe|pickaxe|shovel))$/.test(baseItemOf(model));
  const count = Math.max(...all.map(cubes => cubes.length));
  const colors = accentEntries(model);
  const checks: ExportCheck[] = [
    { id: "geometry", label: "モデルの座標", detail: validGeometry ? `${model.cubes.length}キューブ・座標は −16〜32 の範囲内` : "範囲外・非数値・厚みゼロのキューブがあります。書き出す前に調整してください。", status: validGeometry ? "ok" : "error" },
    { id: "uv", label: "UVとテクスチャ参照", detail: validUv ? `参照を確認・独立した装飾色 ${colors.length}枚を同梱` : "UV座標またはテクスチャ参照にエラーがあります。", status: validUv ? "ok" : "error" },
    { id: "item", label: "アイテムID", detail: validName ? `minecraft:${baseItemOf(model)} → ${NAMESPACE}:${model.slug}` : "元アイテムまたはモデル識別子が不正です。", status: validName ? "ok" : "error" },
    { id: "budget", label: "モデルの負荷目安", detail: count > 600 ? `最大${count}キューブ。多数の同時表示では負荷が高くなる場合があります。` : `最大${count}キューブ。装飾を減らすと軽量化できます。`, status: count > 600 ? "warning" : "ok" },
  ];
  if (poseOf(model) === "bow") checks.push({ id: "bow", label: "弓の表示差分", detail: model.variants?.length === 3 ? "待機＋引き絞り3段階のモデル定義を同梱" : "引き絞りのモデル差分が不足しています。", status: model.variants?.length === 3 ? "ok" : "error" });
  if (gridOf(model).cols < 1 || gridOf(model).rows < 1) checks.push({ id: "atlas", label: "アトラス", detail: "分割数が不正です。", status: "error" });
  return checks;
}
