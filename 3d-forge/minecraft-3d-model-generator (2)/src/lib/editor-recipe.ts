import type { CubeEdit, GeneratedModel, ModelCube } from "./model-types";

/** Recipe edits are applied after size fitting, in the same model units shown in the inspector. */
export function applyCubeEdits(
  cubes: ModelCube[],
  edits: CubeEdit[] = [],
  custom: ModelCube[] = [],
): ModelCube[] {
  const byName = new Map(edits.map((edit) => [edit.target, edit]));
  return [...cubes, ...custom]
    .map((cube) => {
      const edit = byName.get(cube.name);
      if (!edit) return cube;
      return {
        ...cube,
        from: edit.from ?? cube.from,
        to: edit.to ?? cube.to,
        color: edit.color ?? cube.color,
        label: edit.label ?? cube.label,
        hidden: edit.hidden ?? cube.hidden,
        emissive: edit.emissive ?? cube.emissive,
        painted: edit.color ? true : cube.painted,
      };
    })
    .filter((cube) => cube.to.every((value, axis) => value > cube.from[axis]));
}
export function upsertCubeEdit(edits: CubeEdit[], patch: CubeEdit): CubeEdit[] {
  const found = edits.find((edit) => edit.target === patch.target);
  return [
    ...edits.filter((edit) => edit.target !== patch.target),
    { ...found, ...patch },
  ];
}
export function editedPreview(
  model: GeneratedModel,
  edits: CubeEdit[],
  custom: ModelCube[],
): GeneratedModel {
  // Coordinates here are absolute overrides; applying twice never accumulates a movement.
  return {
    ...model,
    cubes: applyCubeEdits(
      model.cubes.filter((cube) => !cube.name.startsWith("custom_")),
      edits,
      custom,
    ),
    settings: { ...model.settings, edits, customCubes: custom },
  };
}
export function cubeGroup(cube: ModelCube): string {
  if (cube.name.startsWith("custom_")) return "追加キューブ";
  if (cube.name.startsWith("attachment_")) return "装飾パーツ";
  if (cube.layer === "floater") return "浮遊物";
  if (cube.rig) return "可動機構";
  if (cube.ornament) return "強化装飾";
  if (/handle|wrap|grip|pommel/.test(cube.name)) return "柄・グリップ";
  return "本体";
}
