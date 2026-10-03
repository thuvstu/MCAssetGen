import { GeneratedModel, VoxelElement } from "../types";
import { DISPLAY_POSES, faceUV } from "./bbmodel";
import { sanitizeIdentifier } from "../color";

const r2 = (v: number) => Math.round(v * 100) / 100;

export function toJavaModel(model: GeneratedModel): string {
  const { config, elements } = model;
  const id = sanitizeIdentifier(config.name);
  const s = (config.textureResolution || 16) / 16;

  const faces = (el: VoxelElement) =>
    Object.fromEntries(
      ["north", "east", "south", "west", "up", "down"].map((f) => [f, { uv: faceUV(el, s), texture: "#0" }])
    );

  return JSON.stringify(
    {
      credit: "Minecraft 3D Forge Studio — Blockbench-ready custom item model",
      texture_size: [config.textureResolution, config.textureResolution],
      textures: { 0: `item/${id}`, particle: `item/${id}` },
      elements: elements.map((el) => ({
        name: el.name,
        from: el.from.map(r2),
        to: el.to.map(r2),
        light_emission: el.emissive ? 15 : undefined,
        faces: faces(el),
      })),
      display: DISPLAY_POSES,
    },
    null,
    2
  );
}

export function toBedrockGeometry(model: GeneratedModel): string {
  const { config, elements } = model;
  const id = sanitizeIdentifier(config.name);

  const cubes = elements.map((el: VoxelElement) => ({
    origin: el.from.map(r2),
    size: [
      Math.max(0.1, r2(el.to[0] - el.from[0])),
      Math.max(0.1, r2(el.to[1] - el.from[1])),
      Math.max(0.1, r2(el.to[2] - el.from[2])),
    ],
    uv: el.uv ?? [0, 0],
    inflate: 0.01,
  }));

  return JSON.stringify(
    {
      format_version: "1.12.0",
      "minecraft:geometry": [
        {
          description: {
            identifier: `geometry.${id}`,
            texture_width: config.textureResolution,
            texture_height: config.textureResolution,
            visible_bounds_width: 4,
            visible_bounds_height: 4,
            visible_bounds_offset: [0, 1.5, 0],
          },
          bones: [{ name: "root", pivot: [8, 8, 8], cubes }],
        },
      ],
    },
    null,
    2
  );
}

export function toWavefront(model: GeneratedModel): { obj: string; mtl: string } {
  const { config, elements, palette } = model;
  const id = sanitizeIdentifier(config.name);

  let obj = `# Minecraft 3D Forge Studio — ${config.name}\nmtllib ${id}.mtl\n`;
  let vIndex = 1;

  elements.forEach((el, index) => {
    const [x1, y1, z1] = el.from.map((v) => (v / 16).toFixed(4));
    const [x2, y2, z2] = el.to.map((v) => (v / 16).toFixed(4));
    const mat = `mat_${el.material}`;

    obj += `\no ${el.group}_${index}_${el.name}\nusemtl ${mat}\n`;
    obj += [
      `v ${x1} ${y1} ${z1}`,
      `v ${x2} ${y1} ${z1}`,
      `v ${x2} ${y2} ${z1}`,
      `v ${x1} ${y2} ${z1}`,
      `v ${x1} ${y1} ${z2}`,
      `v ${x2} ${y1} ${z2}`,
      `v ${x2} ${y2} ${z2}`,
      `v ${x1} ${y2} ${z2}`,
    ].join("\n") + "\n";

    const b = vIndex;
    const quads: number[][] = [
      [b, b + 1, b + 2, b + 3],
      [b + 5, b + 4, b + 7, b + 6],
      [b + 4, b, b + 3, b + 7],
      [b + 1, b + 5, b + 6, b + 2],
      [b + 3, b + 2, b + 6, b + 7],
      [b + 4, b + 5, b + 1, b],
    ];
    for (const [a, c, d, e] of quads) {
      obj += `f ${a} ${c} ${d}\nf ${a} ${d} ${e}\n`;
    }
    vIndex += 8;
  });

  const mats = Object.entries(palette)
    .map(
      ([key, hex]) => {
        const num = parseInt(hex.replace("#", ""), 16);
        const r = (((num >> 16) & 255) / 255).toFixed(4);
        const g = (((num >> 8) & 255) / 255).toFixed(4);
        const b = ((num & 255) / 255).toFixed(4);
        const illum = key === "gem" || key === "glow" ? "3" : "2";
        return `newmtl mat_${key}\nKd ${r} ${g} ${b}\nKa 0.15 0.15 0.15\nKs 0.2 0.2 0.2\nNs 40\nillum ${illum}\n`;
      }
    )
    .join("\n");

  const mtl = `# Materials — ${config.name}\n\n${mats}`;
  return { obj, mtl };
}
