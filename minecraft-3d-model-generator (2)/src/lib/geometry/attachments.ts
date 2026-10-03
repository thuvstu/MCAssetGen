import type {
  AttachmentKind,
  AttachmentSettings,
  ModelCube,
  ModelSettings,
  UVRect,
} from "../model-types";
import { GeometryBuilder } from "./builder";
import { crystal, hangingChain, ring, voxelLine } from "./primitives";

export const ATTACHMENT_LABELS: Record<AttachmentKind, string> = {
  crystal: "結晶",
  wings: "翼の飾り",
  halo: "光輪",
  chain: "鎖",
  runes: "ルーン",
  gear: "ギア",
  scope: "スコープ",
  bayonet: "銃剣",
  sigil: "魔法陣",
  spikes: "棘",
};
function decorate(b: GeometryBuilder, a: AttachmentSettings) {
  const m = a.material;
  switch (a.kind) {
    case "crystal":
      crystal(b, "crystal", [0, 0, 0], 4, 2, m, a.emissive);
      break;
    case "halo":
      ring(b, "halo", [0, 0, 0], 3, 24, 0.4, m, "xz", a.emissive);
      break;
    case "gear":
      ring(b, "gear_ring", [0, 0, 0], 2, 16, 0.7, m, "xy", a.emissive);
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4,
          x = Math.cos(ang) * 2.8,
          y = Math.sin(ang) * 2.8;
        b.box(
          "gear_tooth",
          [x - 0.4, y - 0.4, -0.4],
          [x + 0.4, y + 0.4, 0.4],
          m,
          a.emissive,
        );
      }
      break;
    case "chain":
      hangingChain(b, "chain", [0, 0, 0], 6, m);
      break;
    case "wings":
      for (const s of [-1, 1])
        for (let i = 0; i < 4; i++) {
          const x = s * (1 + i * 0.8);
          b.box(
            "wing_feather",
            [x - 0.4, -i * 0.45, -0.3],
            [x + 0.4, 2.8 - i * 0.75, 0.3],
            m,
            a.emissive,
          );
        }
      break;
    case "runes":
      for (let i = 0; i < 3; i++) {
        b.box(
          "rune",
          [-0.25, i * 1.5, -0.2],
          [0.25, i * 1.5 + 1, 0.2],
          m,
          a.emissive,
        );
        b.box(
          "rune",
          [-0.7, i * 1.5 + 0.25, -0.2],
          [0.7, i * 1.5 + 0.5, 0.2],
          m,
          a.emissive,
        );
      }
      break;
    case "scope":
      b.box("scope_body", [-3, -0.6, -0.7], [3, 0.6, 0.7], 0);
      b.box("scope_lens", [3, -0.45, -0.5], [3.2, 0.45, 0.5], m, a.emissive);
      b.box("scope_mount", [-1, -1.5, -0.4], [1, -0.6, 0.4], 6);
      break;
    case "bayonet":
      voxelLine(b, "bayonet", [0, 0, 0], [0, 4, 0], 0.6, m, a.emissive);
      b.box("bayonet_guard", [-1, -0.2, -0.3], [1, 0.2, 0.3], 6);
      break;
    case "spikes":
      for (const s of [-1, 0, 1])
        crystal(
          b,
          "spike",
          [s * 1.3, s ? -0.5 : 0, 0],
          s ? 2.2 : 3.4,
          0.8,
          m,
          a.emissive,
        );
      break;
    case "sigil":
      ring(b, "sigil", [0, 0, 0], 3, 32, 0.3, m, "xy", a.emissive);
      for (let i = 0; i < 3; i++) {
        const ang = (i * Math.PI * 2) / 3,
          ang2 = ((i + 1) * Math.PI * 2) / 3;
        voxelLine(
          b,
          "sigil_line",
          [Math.cos(ang) * 2.2, Math.sin(ang) * 2.2, 0],
          [Math.cos(ang2) * 2.2, Math.sin(ang2) * 2.2, 0],
          0.2,
          m,
          a.emissive,
        );
      }
      break;
  }
}
/** Attachments are already in model units; they never resize the base template. */
export function buildAttachments(
  settings: ModelSettings,
  palette: string[],
  regions?: UVRect[],
): ModelCube[] {
  return (settings.attachments ?? []).flatMap((a) => {
    const b = new GeometryBuilder(settings, palette, regions);
    decorate(b, a);
    return b.cubes
      .map((c, i) => ({
        ...c,
        name: `attachment_${a.id}_${a.kind}_${i}`,
        label: `${ATTACHMENT_LABELS[a.kind]} ${i + 1}`,
        ornament: true,
        from: c.from.map((v, j) =>
          Math.max(-23.4, Math.min(23, v * a.scale + a.position[j])),
        ) as ModelCube["from"],
        to: c.to.map((v, j) =>
          Math.max(-23.3, Math.min(23.4, v * a.scale + a.position[j])),
        ) as ModelCube["to"],
        emissive: a.emissive,
        layer: a.floating ? ("floater" as const) : undefined,
      }))
      .filter((c) => c.to.every((v, i) => v > c.from[i]));
  });
}
