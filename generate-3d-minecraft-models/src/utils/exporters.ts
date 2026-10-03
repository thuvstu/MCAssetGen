import type { VoxelCube } from "../types/model";

interface GltfInput {
  name: string;
  voxels: VoxelCube[];
  textureWidth: number;
  textureHeight: number;
  textureDataUrl: string;
}

/**
 * Builds a valid glTF 2.0 document (JSON + embedded binary buffer + embedded PNG).
 * The result can be imported directly into Blockbench via File > Import.
 */
export function buildGltfDocument({
  name,
  voxels,
  textureWidth,
  textureHeight,
  textureDataUrl,
}: GltfInput): string {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let min: [number, number, number] = [0, 0, 0];
  let max: [number, number, number] = [0, 0, 0];
  let firstVertex = true;

  const toU = (value: number) => value / textureWidth;
  const toV = (value: number) => 1 - value / textureHeight;

  voxels.forEach((cube) => {
    const [u1, v1, u2, v2] = cube.uv;
    const uLeft = toU(u1);
    const uRight = toU(u2);
    const vTop = toV(v1);
    const vBottom = toV(v2);

    const x0 = cube.x;
    const x1 = cube.x + cube.width;
    const y0 = cube.y;
    const y1 = cube.y + cube.height;
    const z0 = cube.z;
    const z1 = cube.z + cube.depth;

    // Each face lists corners as [bottom-left, bottom-right, top-left, top-right]
    const faces: number[][][] = [
      [
        [x0, y0, z1],
        [x1, y0, z1],
        [x0, y1, z1],
        [x1, y1, z1],
      ],
      [
        [x1, y0, z0],
        [x0, y0, z0],
        [x1, y1, z0],
        [x0, y1, z0],
      ],
      [
        [x1, y0, z1],
        [x1, y0, z0],
        [x1, y1, z1],
        [x1, y1, z0],
      ],
      [
        [x0, y0, z0],
        [x0, y0, z1],
        [x0, y1, z0],
        [x0, y1, z1],
      ],
      [
        [x0, y1, z0],
        [x1, y1, z0],
        [x0, y1, z1],
        [x1, y1, z1],
      ],
      [
        [x0, y0, z1],
        [x1, y0, z1],
        [x0, y0, z0],
        [x1, y0, z0],
      ],
    ];

    const faceUvs: number[][] = [
      [uLeft, vBottom],
      [uRight, vBottom],
      [uLeft, vTop],
      [uRight, vTop],
    ];

    faces.forEach((corners) => {
      const base = positions.length / 3;
      corners.forEach((corner, cornerIndex) => {
        positions.push(corner[0], corner[1], corner[2]);
        uvs.push(faceUvs[cornerIndex][0], faceUvs[cornerIndex][1]);

        if (firstVertex) {
          min = [corner[0], corner[1], corner[2]];
          max = [corner[0], corner[1], corner[2]];
          firstVertex = false;
          return;
        }
        min = [
          Math.min(min[0], corner[0]),
          Math.min(min[1], corner[1]),
          Math.min(min[2], corner[2]),
        ];
        max = [
          Math.max(max[0], corner[0]),
          Math.max(max[1], corner[1]),
          Math.max(max[2], corner[2]),
        ];
      });
      indices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
    });
  });

  const positionBuffer = new Uint8Array(new Float32Array(positions).buffer);
  const uvBuffer = new Uint8Array(new Float32Array(uvs).buffer);
  const indexBuffer = new Uint8Array(new Uint32Array(indices).buffer);

  const positionLength = positionBuffer.length;
  const uvLength = uvBuffer.length;
  const indexLength = indexBuffer.length;

  const packed = new Uint8Array(positionLength + uvLength + indexLength);
  packed.set(positionBuffer, 0);
  packed.set(uvBuffer, positionLength);
  packed.set(indexBuffer, positionLength + uvLength);

  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < packed.length; offset += chunkSize) {
    binary += String.fromCharCode(...packed.subarray(offset, offset + chunkSize));
  }
  const bufferUri = `data:application/octet-stream;base64,${btoa(binary)}`;

  const document = {
    asset: {
      version: "2.0",
      generator: "Voxel Forge Studio",
    },
    scene: 0,
    scenes: [{ name, nodes: [0] }],
    nodes: [{ name, mesh: 0 }],
    meshes: [
      {
        name,
        primitives: [
          {
            attributes: { POSITION: 0, TEXCOORD_0: 1 },
            indices: 2,
            material: 0,
            mode: 4,
          },
        ],
      },
    ],
    materials: [
      {
        name: `${name}_material`,
        doubleSided: true,
        alphaMode: "BLEND",
        pbrMetallicRoughness: {
          baseColorTexture: { index: 0 },
          metallicFactor: 0,
          roughnessFactor: 1,
        },
      },
    ],
    textures: [{ sampler: 0, source: 0 }],
    samplers: [{ magFilter: 9728, minFilter: 9728, wrapS: 33071, wrapT: 33071 }],
    images: [{ uri: textureDataUrl }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: positions.length / 3,
        type: "VEC3",
        min,
        max,
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: uvs.length / 2,
        type: "VEC2",
      },
      {
        bufferView: 2,
        componentType: 5125,
        count: indices.length,
        type: "SCALAR",
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positionLength, target: 34962 },
      { buffer: 0, byteOffset: positionLength, byteLength: uvLength, target: 34962 },
      {
        buffer: 0,
        byteOffset: positionLength + uvLength,
        byteLength: indexLength,
        target: 34963,
      },
    ],
    buffers: [{ uri: bufferUri, byteLength: packed.length }],
  };

  return JSON.stringify(document, null, 2);
}
