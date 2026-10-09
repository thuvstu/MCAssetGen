import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { GeoLayout } from "../lib/geoModel";
import { faceRects } from "../lib/geoModel";
import { ARM_UV, BODY_UV, HEAD_UV, LEG_UV, type Faces, type FaceName } from "../lib/uvLayout";

export type PreviewMode = "geo" | "vanilla";
export type PreviewFocus = "helmet" | "full";

interface Props {
  atlas1: HTMLCanvasElement;
  atlas2: HTMLCanvasElement;
  geoTexture: HTMLCanvasElement;
  layout: GeoLayout;
  mode: PreviewMode;
  focus: PreviewFocus;
  mannequin: boolean;
  autoRotate: boolean;
  /** GeoUvMap などで選択中のボーン名。対応パーツを発光させる */
  highlightBone: string | null;
}

// BoxGeometry の面順: +X, -X, +Y, -Y, +Z, -Z
const SIDE_ORDER: FaceName[] = ["left", "right", "top", "bottom", "back", "front"];
const HIGHLIGHT = 0x8a5a22;

function makeTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** ピクセル単位のボックスを three.js のメッシュにする。faces が null なら UV なし。 */
function makeBox(
  origin: [number, number, number],
  size: [number, number, number],
  faces: Faces | null,
  textureSize: [number, number],
  material: THREE.Material
): THREE.Mesh {
  const [w, h, d] = size;
  const geo = new THREE.BoxGeometry(w / 16, h / 16, d / 16);
  if (faces) {
    const uv = geo.getAttribute("uv") as THREE.BufferAttribute;
    for (let side = 0; side < 6; side++) {
      const rect = faces[SIDE_ORDER[side]];
      for (let corner = 0; corner < 4; corner++) {
        const index = side * 4 + corner;
        const a = uv.getX(index);
        const b = uv.getY(index);
        uv.setXY(
          index,
          (rect.x + rect.w * a) / textureSize[0],
          1 - (rect.y + rect.h * (1 - b)) / textureSize[1]
        );
      }
    }
    uv.needsUpdate = true;
  }
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set((origin[0] + w / 2) / 16, (origin[1] + h / 2) / 16, (origin[2] + d / 2) / 16);
  return mesh;
}

function disposeModel(group: THREE.Group) {
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  group.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.geometry.dispose();
      const values = Array.isArray(node.material) ? node.material : [node.material];
      values.forEach((material) => materials.add(material));
    }
  });
  materials.forEach((material) => {
    if (material instanceof THREE.MeshStandardMaterial && material.map) textures.add(material.map);
    material.dispose();
  });
  textures.forEach((texture) => texture.dispose());
}

export function Preview3D({
  atlas1,
  atlas2,
  geoTexture,
  layout,
  mode,
  focus,
  mannequin,
  autoRotate,
  highlightBone,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const geoMaterialsRef = useRef<Map<string, THREE.MeshStandardMaterial>>(new Map());

  /* 1) レンダラー・カメラ・照明（マウント時のみ） */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(3.4, 2, -6.8);

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.target.set(0, 1.12, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.enablePan = false;
    controls.minDistance = 1.4;
    controls.maxDistance = 10;
    controls.autoRotateSpeed = 1.1;
    controls.update();

    scene.add(new THREE.HemisphereLight(0xcbd8e3, 0x312923, 2.2));
    const key = new THREE.DirectionalLight(0xffdeaa, 3.6);
    key.position.set(-3, 5, -5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x80a8c8, 3);
    rim.position.set(3, 3, 3);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, 0.6);
    fill.position.set(2, 0, -3);
    scene.add(fill);

    // 足元の台座（スケールの基準）
    const plinth = new THREE.Mesh(
      new THREE.CircleGeometry(1.1, 64),
      new THREE.MeshBasicMaterial({ color: 0x0b0f0d, transparent: true, opacity: 0.55 })
    );
    plinth.rotation.x = -Math.PI / 2;
    plinth.position.y = -0.005;
    scene.add(plinth);

    const resize = () => {
      const width = mount.clientWidth || 600;
      const height = mount.clientHeight || 650;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.fov = width < 520 ? 48 : 32;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let raf = 0;
    const frame = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      controls.dispose();
      if (modelRef.current) disposeModel(modelRef.current);
      plinth.geometry.dispose();
      (plinth.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
      sceneRef.current = null;
      modelRef.current = null;
      controlsRef.current = null;
      cameraRef.current = null;
    };
  }, []);

  /* 2) モデル（テクスチャ・造形・モードが変わったら再構築） */
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (modelRef.current) {
      scene.remove(modelRef.current);
      disposeModel(modelRef.current);
    }
    const group = new THREE.Group();
    const materials = new Map<string, THREE.MeshStandardMaterial>();

    if (mannequin) {
      const skin = new THREE.MeshStandardMaterial({ color: 0xb8a69b, roughness: 1 });
      const cloth = new THREE.MeshStandardMaterial({ color: 0x343940, roughness: 1 });
      const eye = new THREE.MeshStandardMaterial({ color: 0x161a1e, roughness: 1 });
      group.add(makeBox([-4, 24, -4], [8, 8, 8], null, [64, 32], skin));
      group.add(makeBox([-3.1, 27.2, -4.04], [1.5, 0.45, 0.15], null, [64, 32], eye));
      group.add(makeBox([1.6, 27.2, -4.04], [1.5, 0.45, 0.15], null, [64, 32], eye));
      group.add(makeBox([-4, 12, -2], [8, 12, 4], null, [64, 32], cloth));
      for (const side of [-1, 1]) {
        group.add(makeBox([side * 6 - 2, 12, -2], [4, 12, 4], null, [64, 32], cloth));
        group.add(makeBox([side * 2 - 2, 0, -2], [4, 12, 4], null, [64, 32], cloth));
      }
    }

    if (mode === "geo") {
      const texture = makeTexture(geoTexture);
      for (const bone of layout.bones) {
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          alphaTest: 0.5,
          roughness: 0.58,
          metalness: 0.18,
          side: THREE.DoubleSide,
          emissive: new THREE.Color(0x000000),
        });
        materials.set(bone.name, material);
        for (const cube of bone.cubes) {
          group.add(makeBox(cube.origin, cube.size, faceRects(cube), [layout.size, layout.size], material));
        }
      }
    } else {
      const t1 = makeTexture(atlas1);
      const t2 = makeTexture(atlas2);
      const mat1 = new THREE.MeshStandardMaterial({ map: t1, alphaTest: 0.1, roughness: 0.75, side: THREE.DoubleSide });
      const mat2 = new THREE.MeshStandardMaterial({ map: t2, alphaTest: 0.1, roughness: 0.75, side: THREE.DoubleSide });
      const vanilla = (origin: [number, number, number], size: [number, number, number], faces: Faces, mat: THREE.Material) => {
        group.add(makeBox(origin, size, faces, [64, 32], mat));
      };
      vanilla([-4.55, 23.45, -4.55], [9.1, 9.1, 9.1], HEAD_UV, mat1);
      vanilla([-4.5, 11.5, -2.5], [9, 13, 5], BODY_UV, mat1);
      for (const s of [-1, 1]) {
        const x = s * 6;
        vanilla([x - 2.5, 11.5, -2.5], [5, 13, 5], ARM_UV, mat1);
        const leg = s * 2;
        vanilla([leg - 2.3, -0.3, -2.3], [4.6, 12.6, 4.6], LEG_UV, mat2);
        vanilla([leg - 2.55, -0.55, -2.55], [5.1, 13.1, 5.1], LEG_UV, mat1);
      }

    }

    geoMaterialsRef.current = materials;
    scene.add(group);
    modelRef.current = group;
  }, [atlas1, atlas2, geoTexture, layout, mode, mannequin]);

  /* 3) ホバー中のボーンを発光させる */
  useEffect(() => {
    geoMaterialsRef.current.forEach((material, name) => {
      material.emissive.set(name === highlightBone ? HIGHLIGHT : 0x000000);
    });
  }, [highlightBone, layout, geoTexture, mode]);

  /* 4) 焦点（ヘルメット / 全身） */
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    if (focus === "helmet") {
      camera.position.set(1.55, 2.26, -2.8);
      controls.target.set(0, 1.82, 0);
      controls.minDistance = 1.15;
    } else {
      camera.position.set(2.7, 1.92, -6.4);
      controls.target.set(0, 1.17, 0);
      controls.minDistance = 2.1;
    }
    controls.update();
  }, [focus]);

  /* 5) 自動回転 */
  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  return (
    <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" aria-label="防具の3Dプレビュー" />
  );
}
