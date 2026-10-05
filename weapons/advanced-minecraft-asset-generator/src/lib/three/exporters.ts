import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import type { Pix } from "@/lib/pixel/core";
import type { RenderResult } from "@/lib/pixel/generator";
import type { ModelSettings } from "@/lib/pixel/model3d";
import { pixToCanvas } from "@/lib/pixel/export";
import { buildHeightField, previewGlowColor } from "./weaponGeometry";
import { buildWeaponGroup, createWeaponMaterials, disposeWeaponMaterials, type WeaponMaterials } from "./weaponMesh";

type ExportScene = { scene: THREE.Scene; dispose: () => void };

/**
 * Builds a standalone, fully textured 3D scene of the weapon for file export.
 * Parametric artwork becomes a true solid model; flat artwork becomes a relief mesh.
 */
export function buildExportScene(
  render: RenderResult | null,
  model: ModelSettings,
  pix: Pix,
  depth: Float32Array,
): ExportScene {
  const scene = new THREE.Scene();
  scene.name = "mc_asset_forge_weapon";
  const texture = new THREE.CanvasTexture(pixToCanvas(pix));
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  const materials: WeaponMaterials = createWeaponMaterials(texture, previewGlowColor(render));
  let group: THREE.Group;
  if (render && render.pix.w === pix.w && model.reconstruct !== "extrude") {
    group = buildWeaponGroup(render, model, materials);
  } else {
    const mesh = new THREE.Mesh(buildHeightField(pix, depth, model), materials.metal);
    mesh.name = "relief";
    group = new THREE.Group();
    group.add(mesh);
  }
  group.name = "weapon";
  scene.add(group);
  return {
    scene,
    dispose: () => {
      group.traverse((object) => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
      disposeWeaponMaterials(materials);
      texture.dispose();
    },
  };
}

/** Binary glTF — a real 3D asset for Blender, Unity, Unreal, three.js, etc. */
export async function exportGLB(
  render: RenderResult | null, model: ModelSettings, pix: Pix, depth: Float32Array,
): Promise<Blob> {
  const { scene, dispose } = buildExportScene(render, model, pix, depth);
  try {
    const exporter = new GLTFExporter();
    const buffer = await exporter.parseAsync(scene, { binary: true, onlyVisible: true, embedImages: true });
    if (buffer instanceof ArrayBuffer) return new Blob([buffer], { type: "model/gltf-binary" });
    return new Blob([JSON.stringify(buffer)], { type: "model/gltf+json" });
  } finally {
    dispose();
  }
}

/** Wavefront OBJ with UVs and normals. */
export function exportOBJ(
  render: RenderResult | null, model: ModelSettings, pix: Pix, depth: Float32Array,
): string {
  const { scene, dispose } = buildExportScene(render, model, pix, depth);
  try {
    return new OBJExporter().parse(scene);
  } finally {
    dispose();
  }
}

/** STL for 3D printing (geometry only). */
export function exportSTL(
  render: RenderResult | null, model: ModelSettings, pix: Pix, depth: Float32Array,
): string {
  const { scene, dispose } = buildExportScene(render, model, pix, depth);
  try {
    return new STLExporter().parse(scene, { binary: false });
  } finally {
    dispose();
  }
}
