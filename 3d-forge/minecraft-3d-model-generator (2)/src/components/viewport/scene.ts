import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { CameraView } from "./types";

export const BASE_ZOOM = 1.2;
export const DEFAULT_ROTATION: [number, number, number] = [0.04, -0.12, -0.72];
export const FLOOR_Y = -18;

const FRUSTUM_HALF_HEIGHT = 18.5;
const CAMERA_POSITIONS: Record<CameraView, [number, number, number]> = {
  perspective: [27, 15, 70],
  front: [0, 0, 75],
  right: [75, 0, 0],
  top: [0, 75, 0.01],
};

export interface SceneHandles {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  /** Holds the base orientation of the model. */
  modelGroup: THREE.Group;
  /** Sits on the grip pivot; attack/spell motions rotate and move it. */
  actionGroup: THREE.Group;
  /** Offsets the content back so the pivot lands on the grip. */
  contentGroup: THREE.Group;
  grid: THREE.GridHelper;
  resize: () => void;
  dispose: () => void;
}

function addLighting(scene: THREE.Scene): void {
  scene.add(new THREE.HemisphereLight(0xd8efff, 0x4a3e64, 2.3));

  const key = new THREE.DirectionalLight(0xe9fff8, 3.3);
  key.position.set(-20, 35, 45);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -32,
    right: 32,
    top: 32,
    bottom: -32,
    near: 1,
    far: 120,
  });
  key.shadow.bias = -0.002;
  key.shadow.normalBias = 0.1;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xa295ee, 1.3);
  rim.position.set(30, 12, -20);
  scene.add(rim);
}

function addGround(scene: THREE.Scene): THREE.GridHelper {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({ opacity: 0.19, color: 0x000000 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR_Y;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(200, 80, 0x53566c, 0x3d4050);
  grid.position.y = FLOOR_Y - 0.04;
  const material = grid.material as THREE.Material;
  material.transparent = true;
  material.opacity = 0.26;
  scene.add(grid);
  return grid;
}

export function cameraPositionFor(view: CameraView): [number, number, number] {
  return CAMERA_POSITIONS[view];
}

/** Boots the renderer, camera rig and static scene furniture. Returns null without WebGL. */
export function createScene(
  container: HTMLElement,
  onZoomChange: (zoom: number) => void,
): SceneHandles | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute(
    "aria-label",
    "3Dモデル。ドラッグで回転、スクロールでズームできます。",
  );
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog("#1a1b23", 85, 155);

  const camera = new THREE.OrthographicCamera(
    -30,
    30,
    FRUSTUM_HALF_HEIGHT,
    -FRUSTUM_HALF_HEIGHT,
    0.1,
    250,
  );
  camera.position.set(...CAMERA_POSITIONS.perspective);
  camera.zoom = BASE_ZOOM;
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = true;
  controls.minZoom = 0.6;
  controls.maxZoom = 2.64;
  controls.autoRotateSpeed = 1.5;
  controls.target.set(0, 0, 0);
  controls.update();

  let reportedZoom = 100;
  controls.addEventListener("change", () => {
    const zoom = Math.round((camera.zoom / BASE_ZOOM) * 100);
    if (zoom === reportedZoom) return;
    reportedZoom = zoom;
    onZoomChange(zoom);
  });

  addLighting(scene);
  const grid = addGround(scene);

  const modelGroup = new THREE.Group();
  modelGroup.rotation.set(...DEFAULT_ROTATION);
  modelGroup.position.y = 1;
  const actionGroup = new THREE.Group();
  const contentGroup = new THREE.Group();
  actionGroup.add(contentGroup);
  modelGroup.add(actionGroup);
  scene.add(modelGroup);

  const resize = () => {
    const { clientWidth: width, clientHeight: height } = container;
    if (!width || !height) return;
    renderer.setSize(width, height);
    const aspect = width / height;
    camera.left = -FRUSTUM_HALF_HEIGHT * aspect;
    camera.right = FRUSTUM_HALF_HEIGHT * aspect;
    camera.top = FRUSTUM_HALF_HEIGHT;
    camera.bottom = -FRUSTUM_HALF_HEIGHT;
    camera.updateProjectionMatrix();
  };
  resize();

  const dispose = () => {
    controls.dispose();
    scene.traverse((object) => {
      if (
        object instanceof THREE.Mesh ||
        object instanceof THREE.Points ||
        object instanceof THREE.LineSegments
      ) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    renderer.dispose();
    renderer.domElement.remove();
  };

  return {
    scene,
    camera,
    renderer,
    controls,
    modelGroup,
    actionGroup,
    contentGroup,
    grid,
    resize,
    dispose,
  };
}
