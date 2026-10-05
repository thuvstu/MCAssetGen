import * as THREE from "three";
import { A, B, G, R, type Pix } from "@/lib/pixel/core";
import type { RenderResult } from "@/lib/pixel/generator";
import { applyRotation, type MCElement, type ModelSettings } from "@/lib/pixel/model3d";

type V3 = [number, number, number];

/**
 * Minecraft-accurate preview geometry: the exact boxes, UVs and rotations that the
 * exported item JSON will use in game.
 */
export function buildBoxGeometry(elements: MCElement[]): THREE.BufferGeometry {
  const pos: number[] = [], nrm: number[] = [], uv: number[] = [], idx: number[] = [];
  let vi = 0;
  const quad = (tl: V3, tr: V3, br: V3, bl: V3, u: [number, number, number, number], normal: V3) => {
    const [u1, v1, u2, v2] = u.map((x) => x / 16) as [number, number, number, number];
    pos.push(...tl, ...bl, ...br, ...tr);
    nrm.push(...normal, ...normal, ...normal, ...normal);
    uv.push(u1, v1, u1, v2, u2, v2, u2, v1);
    idx.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
    vi += 4;
  };
  const point = (element: MCElement, x: number, y: number, z: number): V3 => applyRotation(x, y, z, element.rotation);
  for (const element of elements) {
    const [x0, y0, z0] = element.from, [x1, y1, z1] = element.to;
    const face = element.faces;
    if (face.south) quad(point(element, x0, y1, z1), point(element, x1, y1, z1), point(element, x1, y0, z1), point(element, x0, y0, z1), face.south.uv, [0, 0, 1]);
    if (face.north) quad(point(element, x1, y1, z0), point(element, x0, y1, z0), point(element, x0, y0, z0), point(element, x1, y0, z0), face.north.uv, [0, 0, -1]);
    if (face.east) quad(point(element, x1, y1, z1), point(element, x1, y1, z0), point(element, x1, y0, z0), point(element, x1, y0, z1), face.east.uv, [1, 0, 0]);
    if (face.west) quad(point(element, x0, y1, z0), point(element, x0, y1, z1), point(element, x0, y0, z1), point(element, x0, y0, z0), face.west.uv, [-1, 0, 0]);
    if (face.up) quad(point(element, x0, y1, z0), point(element, x1, y1, z0), point(element, x1, y1, z1), point(element, x0, y1, z1), face.up.uv, [0, 1, 0]);
    if (face.down) quad(point(element, x0, y0, z1), point(element, x1, y0, z1), point(element, x1, y0, z0), point(element, x0, y0, z0), face.down.uv, [0, -1, 0]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(idx);
  return geometry;
}

/**
 * Relief mesh for artwork without parametric parts (imported images, hand-painted frames):
 * every opaque pixel becomes a vertex whose depth comes from the estimated depth map.
 */
export function buildHeightField(pix: Pix, depth: Float32Array, settings: ModelSettings): THREE.BufferGeometry {
  const { w, h } = pix;
  const pixelWidth = 16 / w, pixelHeight = 16 / h;
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const ids = new Int32Array(w * h).fill(-1);
  let count = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const index = y * w + x;
      if (A(pix.data[index]) < 16) continue;
      ids[index] = count;
      const thickness = settings.thickness * (settings.minThickness + (1 - settings.minThickness) * depth[index]);
      const X = (x + 0.5) * pixelWidth, Y = 16 - (y + 0.5) * pixelHeight;
      positions.push(X, Y, 8 + thickness / 2, X, Y, 8 - thickness / 2);
      uvs.push((x + 0.5) / w, (y + 0.5) / h, (x + 0.5) / w, (y + 0.5) / h);
      count += 2;
    }
  const quad = (i00: number, i10: number, i11: number, i01: number) => {
    if (ids[i00] < 0 || ids[i10] < 0 || ids[i11] < 0 || ids[i01] < 0) return;
    const a = ids[i00], b = ids[i10], c = ids[i11], d = ids[i01];
    indices.push(a, b, c, a, c, d, a + 1, d + 1, c + 1, a + 1, c + 1, b + 1);
  };
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) quad(y * w + x, y * w + x + 1, (y + 1) * w + x + 1, (y + 1) * w + x);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function previewGlowColor(render: RenderResult | null): THREE.Color {
  if (!render) return new THREE.Color(0.6, 0.85, 1);
  const color = render.material.glow;
  return new THREE.Color(R(color) / 255, G(color) / 255, B(color) / 255);
}

export function disposeGroup(group: THREE.Group) {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) object.geometry.dispose();
  });
}
