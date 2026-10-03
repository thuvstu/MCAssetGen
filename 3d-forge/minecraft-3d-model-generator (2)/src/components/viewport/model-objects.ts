import * as THREE from "three";

/** Pixel-perfect sampling shared by the batched renderer. */
export function createTexture(
  source: string,
  onLoad?: () => void,
): THREE.Texture {
  const texture = new THREE.TextureLoader().load(source, () => onLoad?.());
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  return texture;
}

export function createGlowLight(
  color: string,
  height: number,
): THREE.PointLight {
  const light = new THREE.PointLight(new THREE.Color(color), 12, 34, 2);
  light.position.set(0, height, 0);
  return light;
}

/** Release nested geometry/materials, but not the shared atlas texture. */
export function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (
      child instanceof THREE.Mesh ||
      child instanceof THREE.Points ||
      child instanceof THREE.LineSegments
    ) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      materials.forEach((material) => material.dispose());
    }
    if (child instanceof THREE.Light) child.dispose();
  });
}

export function clearGroup(group: THREE.Group, keep?: THREE.Object3D): void {
  for (const child of [...group.children]) {
    if (child === keep) continue;
    group.remove(child);
    disposeObject(child);
  }
}
