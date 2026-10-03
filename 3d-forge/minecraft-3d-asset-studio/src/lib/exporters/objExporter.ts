import { ModelData } from "@/types/model";

export function exportToOBJ(model: ModelData): { obj: string; mtl: string } {
  let obj = `# Minecraft 3D Model Forge OBJ Exporter\n`;
  obj += `# Model: ${model.name}\n`;
  obj += `mtllib model.mtl\no ${model.name.replace(/\s+/g, "_")}\n\n`;

  let vCount = 1;
  let vtCount = 1;
  let vnCount = 1;

  // Box faces normal vectors
  const normals = [
    [0, 0, 1],   // north (z+)
    [0, 0, -1],  // south (z-)
    [1, 0, 0],   // east (x+)
    [-1, 0, 0],  // west (x-)
    [0, 1, 0],   // up (y+)
    [0, -1, 0],  // down (y-)
  ];

  normals.forEach(([nx, ny, nz]) => {
    obj += `vn ${nx.toFixed(4)} ${ny.toFixed(4)} ${nz.toFixed(4)}\n`;
  });

  const tw = model.textureWidth;
  const th = model.textureHeight;

  model.elements.forEach((el, elIdx) => {
    obj += `\ng element_${elIdx}_${el.name.replace(/\s+/g, "_")}\nusemtl material0\n`;

    const x1 = el.from[0] / 16;
    const y1 = el.from[1] / 16;
    const z1 = el.from[2] / 16;
    const x2 = el.to[0] / 16;
    const y2 = el.to[1] / 16;
    const z2 = el.to[2] / 16;

    // 8 vertices of cube
    // 1: x1, y1, z2
    // 2: x2, y1, z2
    // 3: x2, y2, z2
    // 4: x1, y2, z2
    // 5: x2, y1, z1
    // 6: x1, y1, z1
    // 7: x1, y2, z1
    // 8: x2, y2, z1
    const verts = [
      [x1, y1, z2],
      [x2, y1, z2],
      [x2, y2, z2],
      [x1, y2, z2],
      [x2, y1, z1],
      [x1, y1, z1],
      [x1, y2, z1],
      [x2, y2, z1],
    ];

    verts.forEach(([vx, vy, vz]) => {
      obj += `v ${vx.toFixed(4)} ${vy.toFixed(4)} ${vz.toFixed(4)}\n`;
    });

    const facesDef = [
      { name: "north", v: [1, 2, 3, 4], norm: 1 },
      { name: "south", v: [5, 6, 7, 8], norm: 2 },
      { name: "east", v: [2, 5, 8, 3], norm: 3 },
      { name: "west", v: [6, 1, 4, 7], norm: 4 },
      { name: "up", v: [4, 3, 8, 7], norm: 5 },
      { name: "down", v: [6, 5, 2, 1], norm: 6 },
    ] as const;

    facesDef.forEach((f) => {
      const faceData = el.faces[f.name];
      if (faceData) {
        const u1 = faceData.uv[0] / tw;
        const v1 = 1 - faceData.uv[3] / th;
        const u2 = faceData.uv[2] / tw;
        const v2 = 1 - faceData.uv[1] / th;

        obj += `vt ${u1.toFixed(4)} ${v1.toFixed(4)}\n`;
        obj += `vt ${u2.toFixed(4)} ${v1.toFixed(4)}\n`;
        obj += `vt ${u2.toFixed(4)} ${v2.toFixed(4)}\n`;
        obj += `vt ${u1.toFixed(4)} ${v2.toFixed(4)}\n`;

        const baseV = vCount;
        const baseVt = vtCount;
        const n = f.norm;

        obj += `f ${baseV + f.v[0] - 1}/${baseVt}/${n} ${baseV + f.v[1] - 1}/${baseVt + 1}/${n} ${baseV + f.v[2] - 1}/${baseVt + 2}/${n} ${baseV + f.v[3] - 1}/${baseVt + 3}/${n}\n`;

        vtCount += 4;
      }
    });

    vCount += 8;
  });

  const mtl = `# Minecraft 3D Model Forge MTL
newmtl material0
Ka 1.000000 1.000000 1.000000
Kd 1.000000 1.000000 1.000000
Ks 0.000000 0.000000 0.000000
map_Kd texture.png
`;

  return { obj, mtl };
}
