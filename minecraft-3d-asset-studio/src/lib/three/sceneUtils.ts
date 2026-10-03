import * as THREE from "three";

const TEXTURE_KEYS = [
  "map",
  "alphaMap",
  "aoMap",
  "bumpMap",
  "displacementMap",
  "emissiveMap",
  "envMap",
  "lightMap",
  "metalnessMap",
  "normalMap",
  "roughnessMap",
  "specularMap",
] as const;

function disposeMaterial(material: THREE.Material, disposedTextures: Set<THREE.Texture>) {
  const materialWithMaps = material as THREE.Material & Record<(typeof TEXTURE_KEYS)[number], THREE.Texture | null | undefined>;

  TEXTURE_KEYS.forEach((key) => {
    const texture = materialWithMaps[key];
    if (texture && !disposedTextures.has(texture) && !texture.userData?.keep) {
      texture.dispose();
      disposedTextures.add(texture);
    }
  });

  material.dispose();
}

export function disposeObject3D(object: THREE.Object3D): void {
  const disposedTextures = new Set<THREE.Texture>();

  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Line)) return;

    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => disposeMaterial(material, disposedTextures));
  });
}

export function clearGroup(group: THREE.Group): void {
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    disposeObject3D(child);
  }
}

export function removeAndDispose(scene: THREE.Scene, object: THREE.Object3D | null): void {
  if (!object) return;
  scene.remove(object);
  disposeObject3D(object);
}
