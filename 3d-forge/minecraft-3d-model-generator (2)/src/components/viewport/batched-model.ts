import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { GeneratedModel, ModelCube, Vec3 } from "@/lib/model-types";

export interface ModelBatch {
  mesh: THREE.Mesh;
  key: string;
  center: THREE.Vector3;
}
/** At most one draw per layer/rig/material class, instead of a draw per cube. */
export function createModelBatches(
  model: GeneratedModel,
  texture: THREE.Texture,
  wireframe: boolean,
): ModelBatch[] {
  const buckets = new Map<string, ModelCube[]>();
  for (const cube of model.cubes) {
    if (cube.hidden) continue;
    const layer = cube.layer === "floater" ? "floater" : (cube.rig ?? "body");
    const key = `${layer}:${cube.emissive ? "glow" : "solid"}:${cube.painted ? "paint" : "texture"}`;
    const list = buckets.get(key) ?? [];
    list.push(cube);
    buckets.set(key, list);
  }
  const centres = new Map<string, THREE.Vector3>();
  const layerCubes = new Map<string, ModelCube[]>();
  for (const [key, cubes] of buckets) {
    const layer = key.split(":")[0];
    layerCubes.set(layer, [...(layerCubes.get(layer) ?? []), ...cubes]);
  }
  for (const [layer, cubes] of layerCubes) {
    const min = new THREE.Vector3(Infinity, Infinity, Infinity),
      max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    for (const c of cubes) {
      min.min(new THREE.Vector3(...c.from));
      max.max(new THREE.Vector3(...c.to));
    }
    centres.set(
      layer,
      layer === "body" ? new THREE.Vector3() : min.add(max).multiplyScalar(0.5),
    );
  }
  return [...buckets].map(([key, cubes]) => {
    const center = centres.get(key.split(":")[0])!;
    const geometries = cubes.map((c) => {
      const size = c.to.map((v, i) => v - c.from[i]) as Vec3;
      const geometry = new THREE.BoxGeometry(...size);
      geometry.clearGroups();
      const uv = geometry.getAttribute("uv"),
        [u0, v0, u1, v1] = c.uv;
      for (let i = 0; i < uv.count; i++)
        uv.setXY(
          i,
          (u0 + (u1 - u0) * uv.getX(i)) / model.texture.width,
          1 - (v0 + (v1 - v0) * (1 - uv.getY(i))) / model.texture.height,
        );
      const colour = new THREE.Color(c.painted ? c.color : "#ffffff");
      const colors = new Float32Array(
        geometry.getAttribute("position").count * 3,
      );
      for (let i = 0; i < colors.length; i += 3) {
        colors[i] = colour.r;
        colors[i + 1] = colour.g;
        colors[i + 2] = colour.b;
      }
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.translate(
        (c.from[0] + c.to[0]) / 2 - center.x,
        (c.from[1] + c.to[1]) / 2 - center.y,
        (c.from[2] + c.to[2]) / 2 - center.z,
      );
      return geometry;
    });
    const merged = mergeGeometries(geometries, false)!;
    geometries.forEach((g) => g.dispose());
    const glow = cubes[0].emissive,
      paint = cubes[0].painted;
    const material = new THREE.MeshStandardMaterial({
      map: paint ? null : texture,
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.08,
      alphaTest: 0.1,
      wireframe,
      emissive: glow
        ? new THREE.Color(paint ? cubes[0].color : "#ffffff")
        : new THREE.Color(0),
      emissiveMap: glow && !paint ? texture : null,
      emissiveIntensity: glow ? 0.85 : 0,
    });
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.cubeNames = cubes.map((c) => c.name);
    mesh.userData.layer = key.split(":")[0];
    return { mesh, key: key.split(":")[0], center };
  });
}
export function nameAtIntersection(
  hit: Pick<THREE.Intersection, "object" | "faceIndex">,
): string | null {
  const names = hit.object.userData.cubeNames as string[] | undefined;
  return names && hit.faceIndex != null
    ? (names[Math.floor(hit.faceIndex / 12)] ?? null)
    : null;
}
