"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { ACTION_DEFINITIONS, ActionFxEvent, sampleKeyframes } from "@/lib/animation/actions";
import { DeathPlan, evaluateDeath, evaluateSpawn, easeOutCubic, hashString, planTransform, SpawnPlan, TransitionPlan } from "@/lib/animation/transform";
import { generateMagicCircleTexture } from "@/lib/generators/textureBaker";
import { clearGroup, disposeObject3D, removeAndDispose } from "@/lib/three/sceneUtils";
import { TEMPORARY_MODES } from "@/lib/variants/modes";
import { ActionId, ElementTransform, GizmoMode, ModelData, ModelElement, ParticleType, TemporaryModeId, Vector3 } from "@/types/model";

export type CameraView = "perspective" | "top" | "front" | "right" | "isometric" | "first_person";

export interface ViewportHandle {
  captureScreenshot: () => string;
  resetCamera: () => void;
  setCameraAngle: (view: CameraView) => void;
  playAction: (id: ActionId) => void;
}

interface ModelViewportProps {
  model: ModelData;
  textureDataUrl: string;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  wireframe: boolean;
  showGrid: boolean;
  lightingMode: "minecraft" | "shaded" | "studio";
  isPlayingAnimation: boolean;
    activeMode: TemporaryModeId | null;
  gizmoMode?: GizmoMode;
  editable?: boolean;
  onTransformElement?: (id: string, change: ElementTransform) => void;
}

const CAMERA_PRESETS: Record<CameraView, { position: [number, number, number]; target: [number, number, number] }> = {
  perspective: { position: [24, 18, 28], target: [0, 8, 0] },
  top: { position: [0, 48, 0.01], target: [0, 8, 0] },
  front: { position: [0, 8, 44], target: [0, 8, 0] },
  right: { position: [44, 8, 0], target: [0, 8, 0] },
  isometric: { position: [30, 30, 30], target: [0, 8, 0] },
  first_person: { position: [-8, 5, 18], target: [0, 10, 0] },
};

interface MeshRuntimeData {
  baseEmissive: number;
  baseEmissiveColor: THREE.Color;
  baseOpacity: number;
  basePosition: THREE.Vector3;
  baseRotation: THREE.Euler;
}

interface MeshAnimEntry {
  kind: "spawn" | "morph";
  plan: SpawnPlan | TransitionPlan;
  start: number;
}

interface DeathRuntime {
  plan: DeathPlan;
  start: number;
  seed: number;
  basePosition: THREE.Vector3;
  baseRotation: THREE.Euler;
  baseOpacity: number;
}

interface ParticleState {
  points: THREE.Points;
  positions: Float32Array;
  velocities: Float32Array;
  phases: Float32Array;
  type: ParticleType;
  spread: number;
  speed: number;
}

interface TransientFx {
  object: THREE.Object3D;
  age: number;
  life: number;
  update: (fx: TransientFx, progress: number, dt: number) => void;
}

interface ActiveAction {
  id: ActionId;
  elapsed: number;
  fired: Set<string>;
}

interface ModelMetrics {
  centerY: number;
  topY: number;
  height: number;
}

const RISING: ParticleType[] = ["flame", "holy", "souls", "sparkle", "sparks", "runes", "smoke", "bubbles"];
const FALLING: ParticleType[] = ["ice", "cherry", "blood", "feathers", "ash"];

function createSquareSprite(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#ffffff";
    context.fillRect(2, 2, 12, 12);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

function glowMaterial(color: THREE.Color, opacity = 0.9) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function resetParticle(state: ParticleState, index: number, initial: boolean) {
  const i3 = index * 3;
  const { spread, speed, type, positions, velocities, phases } = state;
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.sqrt(Math.random()) * spread;
  positions[i3] = Math.cos(angle) * radius;
  positions[i3 + 2] = Math.sin(angle) * radius;
  phases[index] = Math.random() * Math.PI * 2;

  if (type === "void") {
    velocities[i3] = spread * (0.6 + Math.random());
    positions[i3 + 1] = Math.random() * 26 - 4;
    return;
  }
  if (FALLING.includes(type)) {
    positions[i3 + 1] = initial ? Math.random() * 34 - 6 : 28;
    const fallSpeed = type === "ice" ? 2 + Math.random() * 2.5 : type === "blood" ? 4 + Math.random() * 5 : type === "feathers" ? 0.8 + Math.random() * 0.8 : type === "ash" ? 1 + Math.random() : 1.5 + Math.random() * 1.5;
    velocities[i3 + 1] = -fallSpeed * speed;
    return;
  }
  if (type === "stars") {
    positions[i3] = (Math.random() - 0.5) * spread * 4;
    positions[i3 + 1] = Math.random() * 30 - 4;
    positions[i3 + 2] = (Math.random() - 0.5) * spread * 4;
    return;
  }
  if (type === "glitch") {
    positions[i3] = Math.round((Math.random() - 0.5) * spread * 2);
    positions[i3 + 1] = Math.round(Math.random() * 28 - 4);
    positions[i3 + 2] = Math.round((Math.random() - 0.5) * spread * 2);
    return;
  }
  if (type === "lightning") {
    positions[i3 + 1] = Math.random() * 30 - 5;
    return;
  }
  positions[i3 + 1] = initial ? Math.random() * 32 - 5 : -5;
  const rise = type === "flame" ? 8 + Math.random() * 8 : type === "holy" ? 3 + Math.random() * 3 : type === "souls" ? 2 + Math.random() * 2 : type === "smoke" ? 2 + Math.random() * 2 : type === "bubbles" ? 3 + Math.random() * 3 : 0.6 + Math.random();
  velocities[i3 + 1] = rise * speed;
}

function stepParticles(state: ParticleState, dt: number, time: number, speedMultiplier: number) {
  const { positions, velocities, phases, type, spread } = state;
  const count = positions.length / 3;
  const step = dt * speedMultiplier;

  for (let index = 0; index < count; index += 1) {
    const i3 = index * 3;
    const phase = phases[index];
    switch (type) {
      case "void": {
        phases[index] += step * 1.6 * state.speed;
        velocities[i3] -= step * 2.2 * state.speed;
        const radius = velocities[i3];
        positions[i3] = Math.cos(phases[index]) * radius;
        positions[i3 + 2] = Math.sin(phases[index]) * radius;
        positions[i3 + 1] += (10 - positions[i3 + 1]) * step * 0.4;
        if (radius < 0.4) resetParticle(state, index, false);
        break;
      }
      case "lightning": {
        if (Math.random() < 0.15 * speedMultiplier) resetParticle(state, index, false);
        else {
          positions[i3] += (Math.random() - 0.5) * 0.6;
          positions[i3 + 1] += (Math.random() - 0.5) * 0.6;
          positions[i3 + 2] += (Math.random() - 0.5) * 0.6;
        }
        break;
      }
      case "flame":
        positions[i3 + 1] += velocities[i3 + 1] * step;
        positions[i3] *= 1 - 0.3 * step;
        positions[i3 + 2] *= 1 - 0.3 * step;
        break;
      case "cherry":
        positions[i3 + 1] += velocities[i3 + 1] * step;
        positions[i3] += Math.sin(time * 1.5 + phase) * step * 3;
        positions[i3 + 2] += Math.cos(time + phase) * step * 1.5;
        break;
      case "ice":
        positions[i3 + 1] += velocities[i3 + 1] * step;
        positions[i3] += Math.sin(time + phase) * step * 0.5;
        break;
      case "blood":
        positions[i3 + 1] += velocities[i3 + 1] * step;
        if (positions[i3 + 1] < -6) {
          // splash burst: re-scatter outwards after the drip lands
          positions[i3] += (Math.random() - 0.5) * 3;
          positions[i3 + 2] += (Math.random() - 0.5) * 3;
        }
        break;
      case "gears":
        phases[index] += step * (1 + (index % 3));
        positions[i3] += Math.sin(phases[index]) * step * 2;
        positions[i3 + 1] += Math.cos(phases[index] * 0.7) * step * 1.6;
        positions[i3 + 2] += Math.cos(phases[index]) * step * 2;
        break;
      case "sparks":
        positions[i3] += Math.sin(phase) * step * 7;
        positions[i3 + 1] += velocities[i3 + 1] * step * 1.8;
        positions[i3 + 2] += Math.cos(phase) * step * 7;
        if (Math.random() < 0.02 * speedMultiplier) resetParticle(state, index, false);
        break;
      case "smoke":
        positions[i3 + 1] += velocities[i3 + 1] * step;
        positions[i3] += (positions[i3] >= 0 ? 1 : -1) * step * 0.8 + Math.sin(time + phase) * step;
        break;
      case "bubbles":
        positions[i3 + 1] += velocities[i3 + 1] * step;
        positions[i3] += Math.sin(time * 4 + phase) * step * 1.5;
        positions[i3 + 2] += Math.cos(time * 4 + phase) * step * 1.5;
        break;
      case "stars":
        positions[i3 + 1] += Math.sin(time + phase) * step * 0.3;
        if (Math.random() < 0.004 * speedMultiplier) resetParticle(state, index, false);
        break;
      case "glitch":
        if (Math.random() < 0.08 * speedMultiplier) resetParticle(state, index, false);
        break;
      case "feathers":
        positions[i3 + 1] += velocities[i3 + 1] * step;
        positions[i3] += Math.sin(time * 1.2 + phase) * step * 4;
        positions[i3 + 2] += Math.cos(time * 0.8 + phase) * step * 2;
        break;
      case "ash":
        positions[i3 + 1] += velocities[i3 + 1] * step;
        positions[i3] += (Math.random() - 0.5) * step * 3;
        break;
      case "runes":
        positions[i3 + 1] += velocities[i3 + 1] * step * 0.6;
        positions[i3] += Math.sin(time + phase) * step * 1.2;
        positions[i3 + 2] += Math.cos(time * 1.3 + phase) * step * 1.2;
        break;
      default:
        positions[i3 + 1] += velocities[i3 + 1] * step;
        positions[i3] += Math.sin(time * 2 + phase) * step * 1.4;
    }

    if (RISING.includes(type) && positions[i3 + 1] > 28) resetParticle(state, index, false);
    if (FALLING.includes(type) && positions[i3 + 1] < -8) resetParticle(state, index, false);
    if (Math.abs(positions[i3]) > spread * 3) positions[i3] *= 0.5;
  }
  state.points.geometry.attributes.position.needsUpdate = true;
}

function createModeAura(modeId: TemporaryModeId, color: THREE.Color, metrics: ModelMetrics): THREE.Group {
  const group = new THREE.Group();
  const aura = TEMPORARY_MODES[modeId].aura;
  const size = Math.max(10, metrics.height * 0.6);

  if (aura === "rings") {
    [0, 1, 2].forEach((index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(size * (0.6 + index * 0.18), 0.22, 6, 64), glowMaterial(color, 0.75));
      ring.rotation.x = Math.PI / 2 + index * 0.5;
      ring.userData.spin = (index + 1) * (index % 2 === 0 ? 1 : -1);
      group.add(ring);
    });
  } else if (aura === "spikes") {
    const spikes = new THREE.Mesh(new THREE.IcosahedronGeometry(size * 0.75, 0), glowMaterial(color, 0.6));
    (spikes.material as THREE.MeshBasicMaterial).wireframe = true;
    spikes.userData.spin = 1.5;
    group.add(spikes);
    const inner = new THREE.Mesh(new THREE.OctahedronGeometry(size * 0.5, 0), glowMaterial(color, 0.35));
    (inner.material as THREE.MeshBasicMaterial).wireframe = true;
    inner.userData.spin = -2.5;
    group.add(inner);
  } else if (aura === "shield") {
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(size * 0.95, 1), glowMaterial(color, 0.55));
    (shell.material as THREE.MeshBasicMaterial).wireframe = true;
    shell.userData.spin = 0.25;
    group.add(shell);
    const fill = new THREE.Mesh(new THREE.SphereGeometry(size * 0.93, 32, 16), glowMaterial(color, 0.08));
    group.add(fill);
  } else if (aura === "halo") {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(4, 0.45, 8, 48), glowMaterial(new THREE.Color("#ffd54a"), 0.95));
    halo.rotation.x = Math.PI / 2;
    halo.position.y = metrics.topY - metrics.centerY + 5;
    halo.userData.bob = true;
    group.add(halo);
    const glowSphere = new THREE.Mesh(new THREE.SphereGeometry(size * 0.9, 32, 16), glowMaterial(color, 0.07));
    group.add(glowSphere);
    for (let index = 0; index < 12; index += 1) {
      const ray = new THREE.Mesh(new THREE.BoxGeometry(0.4, size * 1.4, 0.1), glowMaterial(new THREE.Color("#ffd54a"), 0.25));
      ray.rotation.z = (index / 12) * Math.PI;
      ray.position.z = -3;
      group.add(ray);
    }
    group.userData.spin = 0.4;
  }

  return group;
}

export const ModelViewport = forwardRef<ViewportHandle, ModelViewportProps>(function ModelViewport(
  { model, textureDataUrl, selectedElementId, onSelectElement, wireframe, showGrid, lightingMode, isPlayingAnimation, activeMode, gizmoMode = "none", editable = false, onTransformElement },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectElementRef = useRef(onSelectElement);
  const stateRef = useRef({ model, isPlaying: isPlayingAnimation, activeMode });

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const lightsRef = useRef<{ ambient: THREE.AmbientLight; key: THREE.DirectionalLight; rim: THREE.DirectionalLight; grid: THREE.GridHelper } | null>(null);

  const rootGroupRef = useRef<THREE.Group | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const floatingGroupRef = useRef<THREE.Group | null>(null);
  const fxGroupRef = useRef<THREE.Group | null>(null);
  const auraGroupRef = useRef<THREE.Group | null>(null);
  const magicCircleRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<ParticleState | null>(null);
  const selectionBoxRef = useRef<THREE.BoxHelper | null>(null);
  const elementMeshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const metricsRef = useRef<ModelMetrics>({ centerY: 8, topY: 20, height: 24 });

  const actionRef = useRef<ActiveAction | null>(null);
  const fxListRef = useRef<TransientFx[]>([]);
  const prevElementsRef = useRef<Map<string, ModelElement>>(new Map());
  const meshAnimRef = useRef<Map<string, MeshAnimEntry>>(new Map());
  const dyingGroupRef = useRef<THREE.Group | null>(null);
  const realTimeRef = useRef(0);
  const freezeUntilRef = useRef(0);
  const shakeRef = useRef({ until: 0, strength: 0 });
  const punchRef = useRef({ value: 1, target: 1, holdUntil: 0 });
  const letterboxRef = useRef({ current: 0, target: 0 });
  const letterboxTopRef = useRef<HTMLDivElement>(null);
  const letterboxBottomRef = useRef<HTMLDivElement>(null);
  const gizmoRef = useRef<TransformControls | null>(null);
  const gizmoModeRef = useRef<GizmoMode>("none");
  const onTransformRef = useRef(onTransformElement);
  const skipMorphRef = useRef(false);
  const atlasTextureRef = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    onSelectElementRef.current = onSelectElement;
  }, [onSelectElement]);

  useEffect(() => {
    onTransformRef.current = onTransformElement;
  }, [onTransformElement]);

  useEffect(() => {
    stateRef.current = { model, isPlaying: isPlayingAnimation, activeMode };
  }, [model, isPlayingAnimation, activeMode]);

  useImperativeHandle(ref, () => {
    const applyCamera = (view: CameraView) => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;
      const preset = CAMERA_PRESETS[view];
      camera.position.set(...preset.position);
      controls.target.set(...preset.target);
      controls.update();
    };
    return {
      captureScreenshot: () => {
        const renderer = rendererRef.current;
        if (!renderer || !sceneRef.current || !cameraRef.current) return "";
        renderer.render(sceneRef.current, cameraRef.current);
        return renderer.domElement.toDataURL("image/png");
      },
      resetCamera: () => applyCamera("perspective"),
      setCameraAngle: (view) => applyCamera(view),
      playAction: (id) => {
        actionRef.current = { id, elapsed: 0, fired: new Set() };
      },
    };
  }, []);

  // ---------- scene bootstrap + render loop ----------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x13151b);
    scene.fog = new THREE.Fog(0x13151b, 90, 200);

    const camera = new THREE.PerspectiveCamera(45, Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight), 0.1, 1000);
    camera.position.set(...CAMERA_PRESETS.perspective.position);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(...CAMERA_PRESETS.perspective.target);

    // Transform gizmo (move / rotate / scale) — snapped to Minecraft-friendly increments.
    const gizmo = new TransformControls(camera, renderer.domElement);
    gizmo.setTranslationSnap(0.5);
    gizmo.setRotationSnap(THREE.MathUtils.degToRad(22.5));
    gizmo.setScaleSnap(0.1);
    gizmo.setSize(0.85);
    const gizmoHelper = gizmo.getHelper();
    scene.add(gizmoHelper);
    gizmo.addEventListener("dragging-changed", (event) => {
      const dragging = Boolean((event as unknown as { value?: boolean }).value);
      controls.enabled = !dragging;
      if (dragging) return;
      const mesh = gizmo.object as THREE.Mesh | undefined;
      if (!mesh) return;
      let id: string | null = null;
      elementMeshMapRef.current.forEach((value, key) => {
        if (value === mesh) id = key;
      });
      if (!id) return;
      const data = mesh.userData as MeshRuntimeData;
      const change: ElementTransform = {
        translate: [mesh.position.x - data.basePosition.x, mesh.position.y - data.basePosition.y, mesh.position.z - data.basePosition.z],
        rotation: [THREE.MathUtils.radToDeg(mesh.rotation.x), THREE.MathUtils.radToDeg(mesh.rotation.y), THREE.MathUtils.radToDeg(mesh.rotation.z)] as Vector3,
        scale: [mesh.scale.x, mesh.scale.y, mesh.scale.z],
      };
      skipMorphRef.current = true;
      onTransformRef.current?.(id, change);
    });
    gizmoRef.current = gizmo;

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(20, 40, 20);
    const rim = new THREE.DirectionalLight(0x99bbff, 0.3);
    rim.position.set(-20, -20, -20);
    const grid = new THREE.GridHelper(32, 32, 0x3b82f6, 0x222736);
    grid.position.y = -10;
    const axes = new THREE.AxesHelper(6);
    axes.position.y = -9.9;
    scene.add(ambient, key, rim, grid, axes);

    const rootGroup = new THREE.Group();
    const modelGroup = new THREE.Group();
    const auraGroup = new THREE.Group();
    const dyingGroup = new THREE.Group();
    rootGroup.add(modelGroup, auraGroup, dyingGroup);
    const floatingGroup = new THREE.Group();
    const fxGroup = new THREE.Group();
    scene.add(rootGroup, floatingGroup, fxGroup);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;
    lightsRef.current = { ambient, key, rim, grid };
    rootGroupRef.current = rootGroup;
    modelGroupRef.current = modelGroup;
    auraGroupRef.current = auraGroup;
    floatingGroupRef.current = floatingGroup;
    fxGroupRef.current = fxGroup;
    dyingGroupRef.current = dyingGroup;

    const resizeObserver = new ResizeObserver(() => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(container);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    const handlePointerDown = (event: PointerEvent) => {
      downX = event.clientX;
      downY = event.clientY;
    };
    const handlePointerUp = (event: PointerEvent) => {
      if (event.button !== 0 || Math.hypot(event.clientX - downX, event.clientY - downY) > 4) return;
      if (gizmo.dragging || (gizmo.object && gizmo.axis !== null)) return;
      const bounds = container.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(Array.from(elementMeshMapRef.current.values()), false)[0];
      if (!hit) return;
      for (const [id, mesh] of elementMeshMapRef.current.entries()) {
        if (mesh === hit.object) {
          onSelectElementRef.current(id);
          return;
        }
      }
    };
    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointerup", handlePointerUp);

    const sprite = createSquareSprite();
    const clock = new THREE.Clock();
    const tintColor = new THREE.Color();
    const glowColor = new THREE.Color();
    let time = 0;
    let flash = 0;
    let circleBoost = 1;
    let frame = 0;

    const spawnFx = (event: ActionFxEvent) => {
      const metrics = metricsRef.current;
      const color = glowColor.clone();
      const addFx = (object: THREE.Object3D, life: number, update: TransientFx["update"]) => {
        fxGroup.add(object);
        fxListRef.current.push({ object, age: 0, life, update });
      };

      switch (event.type) {
        case "flash":
          flash = 1.4;
          break;
        case "slash_trail": {
          const radius = Math.max(8, metrics.height * 0.55);
          const trail = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.7, 6, 48, Math.PI * 0.9), glowMaterial(color, 0.9));
          trail.position.set(0, metrics.centerY, 2);
          trail.rotation.z = THREE.MathUtils.degToRad((event.angle ?? 0) + 20);
          trail.rotation.x = event.angle === 90 ? Math.PI / 2 : 0.25;
          addFx(trail, 0.4, (fx, progress, dt) => {
            fx.object.scale.setScalar(0.8 + progress * 0.5);
            fx.object.rotation.z -= dt * 7;
            ((fx.object as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - progress);
          });
          break;
        }
        case "shockwave": {
          const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.6, 64), glowMaterial(color, 0.9));
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = -9.5;
          addFx(ring, 0.7, (fx, progress) => {
            fx.object.scale.setScalar(1 + progress * 16);
            ((fx.object as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - progress);
          });
          break;
        }
        case "thrust_wave": {
          const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.4, 48), glowMaterial(color, 0.95));
          ring.position.set(0, metrics.centerY * 0.6, 10);
          addFx(ring, 0.5, (fx, progress) => {
            fx.object.position.z = 10 + progress * 18;
            fx.object.scale.setScalar(1 + progress * 6);
            ((fx.object as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.95 * (1 - progress);
          });
          break;
        }
        case "pillar": {
          const pillar = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 90, 32, 1, true), glowMaterial(color, 0.7));
          pillar.position.y = 35;
          addFx(pillar, 0.9, (fx, progress) => {
            const width = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) * 0.9;
            fx.object.scale.set(Math.max(0.05, width), 1, Math.max(0.05, width));
            ((fx.object as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - progress);
          });
          break;
        }
        case "burst": {
          const count = 90;
          const positions = new Float32Array(count * 3);
          const velocities = new Float32Array(count * 3);
          for (let index = 0; index < count; index += 1) {
            const direction = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize().multiplyScalar(14 + Math.random() * 16);
            velocities.set([direction.x, direction.y, direction.z], index * 3);
            positions.set([0, metrics.centerY, 0], index * 3);
          }
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          const points = new THREE.Points(geometry, new THREE.PointsMaterial({ color, size: 1.1, map: sprite.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
          addFx(points, 0.8, (fx, progress, dt) => {
            for (let index = 0; index < count * 3; index += 1) positions[index] += velocities[index] * dt * (1 - progress);
            geometry.attributes.position.needsUpdate = true;
            ((fx.object as THREE.Points).material as THREE.PointsMaterial).opacity = 1 - progress;
          });
          break;
        }
        case "circle_charge": {
          addFx(new THREE.Group(), event.life ?? 1.2, (_fx, progress) => {
            circleBoost = Math.max(circleBoost, 1 + progress * 0.9);
            flash = Math.max(flash, progress * 0.5);
          });
          break;
        }
        case "beam": {
          const beamLength = Math.max(40, metrics.height * 2.4);
          const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, beamLength, 24, 1, true), glowMaterial(color, 0.85));
          beam.rotation.x = Math.PI / 2;
          beam.position.set(0, metrics.centerY * 0.7, beamLength / 2);
          addFx(beam, 0.75, (fx, progress, dt) => {
            fx.object.rotation.z += dt * 6;
            const width = progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) * 1.1;
            fx.object.scale.set(Math.max(0.05, width), 1, Math.max(0.05, width));
            ((fx.object as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - progress * progress);
          });
          const core = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, beamLength, 12, 1, true), glowMaterial(new THREE.Color("#ffffff"), 0.9));
          core.rotation.x = Math.PI / 2;
          core.position.copy(beam.position);
          addFx(core, 0.75, (fx, progress) => {
            ((fx.object as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - progress);
            fx.object.scale.setScalar(1 - progress * 0.6);
          });
          break;
        }
        case "muzzle": {
          const flashCone = new THREE.Mesh(new THREE.ConeGeometry(1.8, 5, 12), glowMaterial(new THREE.Color("#ffd27a"), 1));
          flashCone.rotation.x = Math.PI / 2;
          flashCone.position.set(0, metrics.centerY * 0.2, metrics.height * 0.6 + 3);
          addFx(flashCone, 0.16, (fx, progress) => {
            fx.object.scale.setScalar(1 - progress * 0.7);
            ((fx.object as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 1 - progress;
          });
          for (let index = 0; index < 18; index += 1) {
            const spark = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), glowMaterial(color, 1));
            spark.position.set(0, metrics.centerY * 0.2, metrics.height * 0.6 + 3);
            const velocity = new THREE.Vector3((Math.random() - 0.5) * 22, (Math.random() - 0.3) * 16, Math.random() * 34 + 8);
            addFx(spark, 0.35, (fx, _progress, dt) => {
              fx.object.position.addScaledVector(velocity, dt);
              velocity.y -= 22 * dt;
              ((fx.object as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - fx.age / 0.35);
            });
          }
          break;
        }
        case "wheel": {
          const radius = Math.max(4, metrics.height * 0.32);
          const wheel = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.55, 6, 32), glowMaterial(color, 0.75));
          wheel.position.set(0, metrics.centerY * 0.4, metrics.height * 0.45);
          addFx(wheel, 0.6, (fx, _progress, dt) => {
            fx.object.rotation.z += dt * 18;
            ((fx.object as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.75 * (1 - fx.age / 0.6);
          });
          break;
        }
        case "steam": {
          for (let index = 0; index < 14; index += 1) {
            const side = index % 2 === 0 ? 1 : -1;
            const puff = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), glowMaterial(new THREE.Color("#cfd8dc"), 0.45));
            puff.position.set(side * (2 + Math.random() * 2), metrics.centerY + (Math.random() - 0.5) * metrics.height * 0.5, (Math.random() - 0.5) * 3);
            const velocity = new THREE.Vector3(side * (4 + Math.random() * 6), 3 + Math.random() * 5, (Math.random() - 0.5) * 4);
            addFx(puff, 0.9, (fx, progress, delta) => {
              fx.object.position.addScaledVector(velocity, delta);
              fx.object.scale.setScalar(1 + progress * 2.5);
              ((fx.object as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - progress);
            });
          }
          break;
        }
        case "implode": {
          const count = 80;
          const starts = new Float32Array(count * 3);
          for (let index = 0; index < count; index += 1) {
            const direction = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(14 + Math.random() * 6);
            starts.set([direction.x, direction.y + metrics.centerY, direction.z], index * 3);
          }
          const positionsArray = starts.slice();
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute("position", new THREE.BufferAttribute(positionsArray, 3));
          const points = new THREE.Points(geometry, new THREE.PointsMaterial({ color, size: 1, map: sprite.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
          addFx(points, 0.9, (fx, progress) => {
            const pull = progress * progress;
            for (let index = 0; index < count; index += 1) {
              positionsArray[index * 3] = starts[index * 3] * (1 - pull);
              positionsArray[index * 3 + 1] = metrics.centerY + (starts[index * 3 + 1] - metrics.centerY) * (1 - pull);
              positionsArray[index * 3 + 2] = starts[index * 3 + 2] * (1 - pull);
            }
            geometry.attributes.position.needsUpdate = true;
            ((fx.object as THREE.Points).material as THREE.PointsMaterial).opacity = Math.min(1, progress * 3) * (1 - pull * 0.5);
          });
          break;
        }
        case "ring_spin": {
          const radius = Math.max(5, metrics.height * 0.4);
          const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.85, radius, 48), glowMaterial(color, 0.6));
          ring.position.set(0, metrics.centerY, 2);
          ring.rotation.x = 0.35;
          addFx(ring, event.life ?? 1, (fx, progress, dt) => {
            fx.object.rotation.z += dt * 3;
            fx.object.scale.setScalar(1 + progress * 0.35);
            ((fx.object as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - progress);
          });
          break;
        }
      }
    };

    const loop = () => {
      frame = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      realTimeRef.current += dt;
      const realTime = realTimeRef.current;
      const timeScale = realTime < freezeUntilRef.current ? 0.12 : 1;
      const { model: current, isPlaying, activeMode: modeId } = stateRef.current;
      const mode = modeId ? TEMPORARY_MODES[modeId] : null;
      const animation = current.animations;
      const speed = animation.speed * (mode?.speedMultiplier ?? 1);
      const amplitude = animation.amplitude;
      glowColor.set(current.palette.glow);
      tintColor.set(mode?.tint ?? current.palette.glow);

      if (isPlaying) time += dt * timeScale;
      controls.update();

      // --- cinema: camera shake, zoom punch, letterbox ---
      if (realTime < shakeRef.current.until && containerRef.current) {
        const fade = (shakeRef.current.until - realTime) / 0.3;
        const magnitude = shakeRef.current.strength * fade;
        containerRef.current.style.transform = `translate(${(Math.random() - 0.5) * magnitude * 16}px, ${(Math.random() - 0.5) * magnitude * 12}px)`;
      } else if (containerRef.current && containerRef.current.style.transform) {
        containerRef.current.style.transform = "";
      }
      const punch = punchRef.current;
      if (realTime > punch.holdUntil) punch.target = 1;
      punch.value += (punch.target - punch.value) * Math.min(1, dt * 9);
      if (Math.abs(punch.value - 1) > 0.001) {
        const offset = camera.position.clone().sub(controls.target);
        camera.position.copy(controls.target.clone().add(offset.multiplyScalar(1 / punch.value)));
      }
      const letterbox = letterboxRef.current;
      letterbox.current += (letterbox.target - letterbox.current) * Math.min(1, dt * 6);
      const barScale = letterbox.current < 0.002 ? 0 : letterbox.current;
      if (letterboxTopRef.current) letterboxTopRef.current.style.transform = `scaleY(${barScale})`;
      if (letterboxBottomRef.current) letterboxBottomRef.current.style.transform = `scaleY(${barScale})`;

      // --- base loop animation ---
      const position = new THREE.Vector3();
      const rotation = new THREE.Vector3();
      let scale = 1;
      if (isPlaying) {
        switch (animation.activeAnimation) {
          case "idle_float":
            position.y = Math.sin(time * 2 * speed) * 1.2 * amplitude;
            rotation.y = Math.sin(time * 0.5 * speed) * 0.05 * amplitude;
            break;
          case "orbital_spin":
            rotation.y = time * 1.2 * speed;
            break;
          case "pulse_glow":
            scale = 1 + Math.sin(time * 4 * speed) * 0.03 * amplitude;
            break;
          case "blade_swing":
            rotation.z = Math.sin(time * 3 * speed) * 0.4 * amplitude;
            rotation.x = Math.cos(time * 3 * speed) * 0.3 * amplitude;
            break;
          case "magic_cast":
            position.y = Math.abs(Math.sin(time * 2.5 * speed)) * 3.5 * amplitude;
            rotation.y = time * 1.5 * speed;
            break;
          case "hover_spin":
            position.y = Math.sin(time * 1.6 * speed) * 1.4 * amplitude;
            rotation.y = time * 0.9 * speed;
            break;
          case "heartbeat": {
            const beat = Math.pow(Math.max(0, Math.sin(time * 5 * speed)), 12) + 0.6 * Math.pow(Math.max(0, Math.sin(time * 5 * speed - 0.6)), 12);
            scale = 1 + beat * 0.07 * amplitude;
            break;
          }
          case "pendulum":
            rotation.z = Math.sin(time * 1.8 * speed) * 0.35 * amplitude;
            break;
          case "engine_idle":
            position.x = (Math.random() - 0.5) * 0.18 * amplitude;
            position.y = Math.sin(time * 40 * speed) * 0.08 * amplitude;
            rotation.x = Math.sin(time * 30) * 0.01 * amplitude;
            break;
          case "levitate_tilt":
            position.y = Math.sin(time * 1.4 * speed) * 1.6 * amplitude;
            rotation.x = Math.sin(time * 0.9 * speed) * 0.15 * amplitude;
            rotation.z = Math.cos(time * 0.7 * speed) * 0.1 * amplitude;
            break;
          case "wing_flutter":
            rotation.z = Math.sin(time * 6 * speed) * 0.15 * amplitude;
            position.y = Math.sin(time * 2 * speed) * 0.8 * amplitude;
            break;
          default:
            break;
        }
        if (animation.enableHover && animation.activeAnimation !== "idle_float" && animation.activeAnimation !== "magic_cast") {
          position.y += Math.sin(time * 2 * speed) * 0.6 * amplitude;
        }
      }
      if (mode && mode.shake > 0) {
        position.x += (Math.random() - 0.5) * mode.shake;
        position.z += (Math.random() - 0.5) * mode.shake;
      }

      // --- action timeline ---
      const action = actionRef.current;
      if (action) {
        const definition = ACTION_DEFINITIONS[action.id];
        action.elapsed += dt * timeScale;
        if (action.elapsed >= definition.duration) {
          actionRef.current = null;
          letterboxRef.current.target = 0;
        } else {
          const sample = sampleKeyframes(definition.keyframes, action.elapsed);
          position.add(new THREE.Vector3(...sample.position));
          rotation.x += THREE.MathUtils.degToRad(sample.rotation[0]);
          rotation.y += THREE.MathUtils.degToRad(sample.rotation[1]);
          rotation.z += THREE.MathUtils.degToRad(sample.rotation[2]);
          scale *= sample.scale;
          definition.fx.forEach((event, index) => {
            const fxKey = `f${index}`;
            if (!action.fired.has(fxKey) && action.elapsed >= event.time) {
              action.fired.add(fxKey);
              spawnFx(event);
            }
          });
          const cinema = definition.cinema;
          if (cinema) {
            letterboxRef.current.target = cinema.letterbox ?? 0;
            cinema.shake?.forEach((hit, index) => {
              const key = `s${index}`;
              if (!action.fired.has(key) && action.elapsed >= hit.at) {
                action.fired.add(key);
                shakeRef.current = { until: realTime + 0.3, strength: hit.strength };
              }
            });
            cinema.freeze?.forEach((stop, index) => {
              const key = `z${index}`;
              if (!action.fired.has(key) && action.elapsed >= stop.at) {
                action.fired.add(key);
                freezeUntilRef.current = realTime + stop.duration;
                flash = Math.max(flash, 0.4);
              }
            });
            if (cinema.zoom && !action.fired.has("zoom") && action.elapsed >= cinema.zoom.at) {
              action.fired.add("zoom");
              punchRef.current.target = cinema.zoom.amount;
              punchRef.current.holdUntil = realTime + 0.45;
            }
          }
        }
      }

      const editing = gizmoModeRef.current !== "none";
      if (editing) {
        rootGroup.position.set(0, 0, 0);
        rootGroup.rotation.set(0, 0, 0);
        rootGroup.scale.setScalar(1);
      } else {
        rootGroup.position.copy(position);
        rootGroup.rotation.set(rotation.x, rotation.y, rotation.z);
        rootGroup.scale.setScalar(scale * (mode?.scale ?? 1));
      }

      // --- transient fx ---
      circleBoost = Math.max(1, circleBoost - dt * 1.5);
      fxListRef.current = fxListRef.current.filter((fx) => {
        fx.age += dt * timeScale;
        const progress = Math.min(1, fx.age / fx.life);
        fx.update(fx, progress, dt);
        if (progress >= 1) {
          fxGroup.remove(fx.object);
          disposeObject3D(fx.object);
          return false;
        }
        return true;
      });
      flash = Math.max(0, flash - dt * 3);

      // --- materials (glow pulse, flicker, mode tint, opacity) ---
      modelGroup.children.forEach((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const material = child.material as THREE.MeshStandardMaterial;
        const data = child.userData as MeshRuntimeData;
        let intensity = data.baseEmissive;
        if (animation.enablePulse && intensity > 0) intensity *= 1 + 0.25 * Math.sin(time * 3 * speed);
        if (animation.enableFlicker && intensity > 0) intensity *= 0.92 + Math.random() * 0.08;
        material.emissive.copy(data.baseEmissiveColor);
        if (mode) {
          intensity = Math.max(intensity * mode.glow, mode.tintStrength * (0.5 + 0.15 * Math.sin(time * 6)));
          material.emissive.lerp(tintColor, data.baseEmissive > 0 ? mode.tintStrength * 0.5 : 1);
        }
        if (flash > 0.01) {
          material.emissive.lerp(glowColor, Math.min(1, flash));
          intensity += flash;
        }
        material.emissiveIntensity = intensity;
        const opacity = data.baseOpacity * (mode?.opacity ?? 1);
        const transparent = opacity < 0.999;
        if (material.transparent !== transparent) {
          material.transparent = transparent;
          material.needsUpdate = true;
        }
        material.opacity = opacity;

        // --- per-element transform choreography (spawn / morph) ---
        const anim = meshAnimRef.current.get(child.uuid);
        if (anim) {
          const elapsed = realTime - anim.start;
          if (anim.kind === "spawn") {
            const plan = anim.plan as SpawnPlan;
            const p = (elapsed - plan.delay) / plan.duration;
            if (p >= 1) meshAnimRef.current.delete(child.uuid);
            else if (p <= 0) {
              child.scale.setScalar(0.0001);
              material.transparent = true;
              material.opacity = 0;
            } else {
              const side = Math.sign(data.basePosition.x) || (hashString(child.name) > 0.5 ? 1 : -1);
              const pose = evaluateSpawn(plan.kind, p, side, hashString(child.name));
              child.position.set(data.basePosition.x + pose.pos[0], data.basePosition.y + pose.pos[1], data.basePosition.z + pose.pos[2]);
              child.rotation.set(
                data.baseRotation.x + THREE.MathUtils.degToRad(pose.rot[0]),
                data.baseRotation.y + THREE.MathUtils.degToRad(pose.rot[1]),
                data.baseRotation.z + THREE.MathUtils.degToRad(pose.rot[2]),
              );
              child.scale.setScalar(Math.max(0.0001, pose.scale));
              material.opacity = Math.min(material.opacity, Math.max(0, Math.min(1, pose.opacity)));
              if (material.opacity < 1) material.transparent = true;
            }
          } else {
            const plan = anim.plan as TransitionPlan;
            const p = elapsed / plan.duration;
            if (p >= 1) meshAnimRef.current.delete(child.uuid);
            else {
              const e = easeOutCubic(Math.min(1, Math.max(0, p)));
              child.position.set(
                THREE.MathUtils.lerp(plan.fromPosition[0], data.basePosition.x, e),
                THREE.MathUtils.lerp(plan.fromPosition[1], data.basePosition.y, e),
                THREE.MathUtils.lerp(plan.fromPosition[2], data.basePosition.z, e),
              );
              child.rotation.set(
                THREE.MathUtils.lerp(THREE.MathUtils.degToRad(plan.fromRotation[0]), data.baseRotation.x, e),
                THREE.MathUtils.lerp(THREE.MathUtils.degToRad(plan.fromRotation[1]), data.baseRotation.y, e),
                THREE.MathUtils.lerp(THREE.MathUtils.degToRad(plan.fromRotation[2]), data.baseRotation.z, e),
              );
              child.scale.set(
                THREE.MathUtils.lerp(plan.fromScale[0], 1, e),
                THREE.MathUtils.lerp(plan.fromScale[1], 1, e),
                THREE.MathUtils.lerp(plan.fromScale[2], 1, e),
              );
            }
          }
        }
      });

      // --- removed cubes play their death animation on the dying stage ---
      const dyingGroup = dyingGroupRef.current;
      if (dyingGroup) {
        for (let index = dyingGroup.children.length - 1; index >= 0; index -= 1) {
          const mesh = dyingGroup.children[index];
          if (!(mesh instanceof THREE.Mesh)) continue;
          const death = (mesh.userData as { death?: DeathRuntime }).death;
          if (!death) {
            dyingGroup.remove(mesh);
            disposeObject3D(mesh);
            continue;
          }
          const p = (realTime - death.start - death.plan.delay) / death.plan.duration;
          if (p >= 1) {
            dyingGroup.remove(mesh);
            disposeObject3D(mesh);
            continue;
          }
          if (p <= 0) continue;
          const pose = evaluateDeath(death.plan.kind, p, death.seed);
          mesh.position.set(death.basePosition.x + pose.pos[0], death.basePosition.y + pose.pos[1], death.basePosition.z + pose.pos[2]);
          mesh.rotation.set(
            death.baseRotation.x + THREE.MathUtils.degToRad(pose.rot[0]),
            death.baseRotation.y + THREE.MathUtils.degToRad(pose.rot[1]),
            death.baseRotation.z + THREE.MathUtils.degToRad(pose.rot[2]),
          );
          mesh.scale.setScalar(Math.max(0.0001, pose.scale));
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.transparent = true;
          material.opacity = death.baseOpacity * pose.opacity;
        }
      }

      // --- mode aura ---
      auraGroup.position.y = metricsRef.current.centerY;
      auraGroup.children.forEach((aura) => {
        aura.rotation.y += dt * ((aura.userData.spin as number | undefined) ?? 0);
        aura.children.forEach((part) => {
          const spin = part.userData.spin as number | undefined;
          if (spin) {
            part.rotation.z += dt * spin;
            part.rotation.y += dt * spin * 0.5;
          }
          if (part.userData.bob) part.position.y += Math.sin(time * 3) * 0.02;
        });
        aura.scale.setScalar(1 + Math.sin(time * 4) * 0.03);
      });

      // --- floating satellites ---
      floatingGroup.position.copy(position);
      const floating = current.floatingItems;
      const orbitTime = animation.enableOrbitals ? time * floating.orbitSpeed * (mode?.speedMultiplier ?? 1) : 0;
      floatingGroup.children.forEach((child, index, list) => {
        const angle = orbitTime + (index / list.length) * Math.PI * 2;
        child.position.set(
          Math.cos(angle) * floating.orbitRadius,
          floating.heightOffset + Math.sin(time * 3 + index) * floating.bobbingAmplitude,
          Math.sin(angle) * floating.orbitRadius,
        );
        child.rotation.set(time * 1.5, time * 2, 0);
      });

      // --- magic circle ---
      const circleGroup = magicCircleRef.current;
      if (circleGroup) {
        const pulse = animation.enablePulse ? 1 + Math.sin(time * 4) * 0.06 : 1;
        circleGroup.scale.setScalar(pulse * circleBoost);
        circleGroup.children.forEach((layer) => {
          const direction = (layer.userData.direction as number | undefined) ?? 1;
          const layerSpeed = (layer.userData.speed as number | undefined) ?? 1;
          if (isPlaying || action) layer.rotation.z += current.magicCircle.rotationSpeed * dt * 1.2 * direction * layerSpeed * (mode?.speedMultiplier ?? 1) * circleBoost * timeScale;
          const material = (layer as THREE.Mesh).material as THREE.MeshBasicMaterial;
          material.opacity = Math.min(1, ((layer.userData.baseOpacity as number | undefined) ?? 1) * (0.55 + current.magicCircle.emissiveIntensity * 0.2) + (circleBoost - 1));
        });
      }

      // --- particles ---
      const particles = particlesRef.current;
        if (particles && (isPlaying || action)) stepParticles(particles, dt * timeScale, time, mode?.speedMultiplier ?? 1);

      selectionBoxRef.current?.update();
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointerup", handlePointerUp);
      gizmo.detach();
      scene.remove(gizmoHelper);
      gizmo.dispose();
      gizmoRef.current = null;
      controls.dispose();
      sprite.dispose();
      disposeObject3D(scene);
      fxListRef.current = [];
      renderer.dispose();
      renderer.forceContextLoss();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      lightsRef.current = null;
      particlesRef.current = null;
      magicCircleRef.current = null;
      selectionBoxRef.current = null;
    };
  }, []);

  // ---------- lighting & grid ----------
  useEffect(() => {
    const lights = lightsRef.current;
    if (!lights) return;
    lights.grid.visible = showGrid;
    const presets = {
      minecraft: { ambient: 1.2, key: 0.4, rim: 0.2, keyColor: 0xffffff, rimColor: 0x99bbff },
      studio: { ambient: 0.5, key: 1.3, rim: 0.7, keyColor: 0xfff5ea, rimColor: 0x60a5fa },
      shaded: { ambient: 0.8, key: 0.9, rim: 0.3, keyColor: 0xffffff, rimColor: 0x99bbff },
    } as const;
    const preset = presets[lightingMode];
    lights.ambient.intensity = preset.ambient;
    lights.key.intensity = preset.key;
    lights.key.color.setHex(preset.keyColor);
    lights.rim.intensity = preset.rim;
    lights.rim.color.setHex(preset.rimColor);
  }, [lightingMode, showGrid]);

  // ---------- shared atlas texture (swapped in place when the atlas is painted) ----------
  useEffect(() => {
    if (!textureDataUrl) return;
    const image = new Image();
    const texture = new THREE.Texture(image);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.userData.keep = true;
    const previous = atlasTextureRef.current;
    image.onload = () => {
      texture.needsUpdate = true;
      atlasTextureRef.current = texture;
      modelGroupRef.current?.children.forEach((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const material = child.material as THREE.MeshStandardMaterial;
        material.map = texture;
        material.color.setHex(0xffffff);
        material.needsUpdate = true;
      });
      if (previous && previous !== texture) previous.dispose();
    };
    image.src = textureDataUrl;
    return () => {
      image.onload = null;
    };
  }, [textureDataUrl]);

  // ---------- model meshes ----------
  useEffect(() => {
    const modelGroup = modelGroupRef.current;
    const dyingGroup = dyingGroupRef.current;
    if (!modelGroup || !dyingGroup) return;

    // Diff against the previous element set and choreograph spawn / death before rebuilding.
    const plan = planTransform(prevElementsRef.current, model.elements);
    if (skipMorphRef.current) {
      plan.transitions.clear();
      skipMorphRef.current = false;
    }
    plan.deaths.forEach((deathPlan, id) => {
      const mesh = elementMeshMapRef.current.get(id);
      if (!mesh) return;
      modelGroup.remove(mesh);
      mesh.userData.death = {
        plan: deathPlan,
        start: realTimeRef.current,
        seed: hashString(id),
        basePosition: mesh.position.clone(),
        baseRotation: mesh.rotation.clone(),
        baseOpacity: (mesh.material as THREE.MeshStandardMaterial).opacity ?? 1,
      } satisfies DeathRuntime;
      dyingGroup.add(mesh);
    });
    elementMeshMapRef.current.clear();
    clearGroup(modelGroup);

    const texture = atlasTextureRef.current;

    const textureWidth = model.textureWidth;
    const textureHeight = model.textureHeight;
    const glowHex = model.palette.glow;
    const faceOrder = ["east", "west", "up", "down", "north", "south"] as const;
    let minY = Infinity;
    let maxY = -Infinity;

    model.elements.forEach((element) => {
      if (element.visible === false) return;
      const inflate = element.inflate ?? 0;
      const geometry = new THREE.BoxGeometry(
        Math.max(0.1, element.to[0] - element.from[0] + inflate * 2),
        Math.max(0.1, element.to[1] - element.from[1] + inflate * 2),
        Math.max(0.1, element.to[2] - element.from[2] + inflate * 2),
      );
      const uv = geometry.attributes.uv;
      faceOrder.forEach((direction, faceIndex) => {
        const face = element.faces[direction];
        const [u1, v1, u2, v2] = face
          ? [face.uv[0] / textureWidth, 1 - face.uv[3] / textureHeight, face.uv[2] / textureWidth, 1 - face.uv[1] / textureHeight]
          : [0, 0, 1, 1];
        const base = faceIndex * 4;
        uv.setXY(base, u1, v2);
        uv.setXY(base + 1, u2, v2);
        uv.setXY(base + 2, u1, v1);
        uv.setXY(base + 3, u2, v1);
      });
      uv.needsUpdate = true;

      const emissiveColor = element.emissive ? new THREE.Color(element.color || glowHex) : new THREE.Color(0x000000);
      const opacity = element.opacity ?? 1;
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        color: texture ? 0xffffff : element.color || 0xcccccc,
        roughness: 0.7,
        metalness: 0.15,
        wireframe,
        emissive: emissiveColor,
        emissiveIntensity: element.emissive ? 0.7 : 0,
        transparent: opacity < 1,
        opacity,
        depthWrite: opacity >= 1,
      });

      const center = [(element.from[0] + element.to[0]) / 2, (element.from[1] + element.to[1]) / 2, (element.from[2] + element.to[2]) / 2];
      geometry.translate(center[0] - element.origin[0], center[1] - element.origin[1], center[2] - element.origin[2]);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...element.origin);
      mesh.rotation.set(...(element.rotation.map((value) => THREE.MathUtils.degToRad(value)) as [number, number, number]));
      const runtime: MeshRuntimeData = {
        baseEmissive: element.emissive ? 0.7 : 0,
        baseEmissiveColor: emissiveColor.clone(),
        baseOpacity: opacity,
        basePosition: mesh.position.clone(),
        baseRotation: mesh.rotation.clone(),
      };
      mesh.userData = runtime;
      mesh.name = element.name;
      modelGroup.add(mesh);
      elementMeshMapRef.current.set(element.id, mesh);
      const spawn = plan.spawns.get(element.id);
      if (spawn) meshAnimRef.current.set(mesh.uuid, { kind: "spawn", plan: spawn, start: realTimeRef.current });
      else {
        const morph = plan.transitions.get(element.id);
        if (morph) meshAnimRef.current.set(mesh.uuid, { kind: "morph", plan: morph, start: realTimeRef.current });
      }
      minY = Math.min(minY, element.from[1], element.to[1]);
      maxY = Math.max(maxY, element.from[1], element.to[1]);
    });

    prevElementsRef.current = new Map(model.elements.map((element) => [element.id, element]));

    if (Number.isFinite(minY)) {
      metricsRef.current = { centerY: (minY + maxY) / 2, topY: maxY, height: maxY - minY };
    }

    }, [model.elements, model.palette.glow, model.textureWidth, model.textureHeight, wireframe]);

  // ---------- selection highlight ----------
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (selectionBoxRef.current) {
      scene.remove(selectionBoxRef.current);
      selectionBoxRef.current.dispose();
      selectionBoxRef.current = null;
    }
    const mesh = selectedElementId ? elementMeshMapRef.current.get(selectedElementId) : null;
    if (mesh) {
      const helper = new THREE.BoxHelper(mesh, 0x38bdf8);
      scene.add(helper);
      selectionBoxRef.current = helper;
    }
  }, [selectedElementId, model.elements]);

  // ---------- transform gizmo attachment ----------
  useEffect(() => {
    const active = editable && gizmoMode !== "none";
    gizmoModeRef.current = active ? gizmoMode : "none";
    const gizmo = gizmoRef.current;
    if (!gizmo) return;
    const mesh = selectedElementId ? elementMeshMapRef.current.get(selectedElementId) : undefined;
    if (active && mesh) {
      gizmo.setMode(gizmoMode as "translate" | "rotate" | "scale");
      gizmo.attach(mesh);
    } else {
      gizmo.detach();
    }
  }, [editable, gizmoMode, selectedElementId, model.elements]);

  // ---------- magic circle ----------
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    removeAndDispose(scene, magicCircleRef.current);
    magicCircleRef.current = null;
    if (!model.magicCircle.enabled) return;

    const config = model.magicCircle;
    const layerCount = Math.max(1, Math.min(4, config.layers ?? 1));
    const secondaryStyles = ["runic_ring", "hexagram", "arcane_clock", "grimoire_seal"] as const;
    const circleGroup = new THREE.Group();
    circleGroup.position.set(0, config.yOffset, 0);
    circleGroup.rotation.x = THREE.MathUtils.degToRad(config.tiltAngle);
    const images: HTMLImageElement[] = [];
    for (let layer = 0; layer < layerCount; layer += 1) {
      const image = new Image();
      const texture = new THREE.Texture(image);
      image.onload = () => {
        texture.needsUpdate = true;
      };
      const style = layer === 0 ? config.style : secondaryStyles[(layer - 1) % secondaryStyles.length];
      image.src = generateMagicCircleTexture(config.color, style, 256, { glyphs: layer === 0 ? config.glyphRing : layer % 2 === 1 });
      images.push(image);
      const radius = config.radius * (1 - layer * 0.26) * (layer === 0 ? 1 : 1.0);
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(radius * 2, radius * 2),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      plane.position.z = layer * 0.06;
      plane.userData = { direction: layer % 2 === 0 ? 1 : -1, speed: 1 + layer * 0.45, baseOpacity: 1 - layer * 0.15 };
      circleGroup.add(plane);
    }
    scene.add(circleGroup);
    magicCircleRef.current = circleGroup;

    return () => {
      images.forEach((image) => {
        image.onload = null;
      });
    };
  }, [model.magicCircle]);

  // ---------- floating satellites ----------
  useEffect(() => {
    const group = floatingGroupRef.current;
    if (!group) return;
    clearGroup(group);
    const config = model.floatingItems;
    if (!config.enabled) return;
    const color = new THREE.Color(config.color);
    for (let index = 0; index < config.count; index += 1) {
      const geometry =
        config.type === "shard"
          ? new THREE.ConeGeometry(0.8, 2.5, 4)
          : config.type === "orb"
            ? new THREE.SphereGeometry(1.2, 8, 8)
            : config.type === "blade_ring"
              ? new THREE.TorusGeometry(1.2, 0.3, 4, 8)
              : config.type === "crystal"
                ? new THREE.OctahedronGeometry(1.1, 0)
                : new THREE.BoxGeometry(1.4, 1.4, 1.4);
      group.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.8 })));
    }
  }, [model.floatingItems]);

  // ---------- particles ----------
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (particlesRef.current) {
      removeAndDispose(scene, particlesRef.current.points);
      particlesRef.current = null;
    }
    const config = model.particles;
    if (!config.enabled || config.type === "none") return;

    const count = config.density;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const primary = new THREE.Color(config.color);
    const secondary = new THREE.Color(config.secondaryColor || config.color);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size: ({ cherry: 1.1, lightning: 0.6, runes: 1.3, gears: 1.2, smoke: 2.2, stars: 0.5, bubbles: 1, glitch: 0.8, feathers: 1.3, ash: 0.6 } as Partial<Record<ParticleType, number>>)[config.type] ?? 0.9,
        vertexColors: true,
        map: createSquareSprite(),
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const state: ParticleState = { points, positions, velocities, phases, type: config.type, spread: config.spread, speed: config.speed };
    for (let index = 0; index < count; index += 1) {
      resetParticle(state, index, true);
      const mixed = primary.clone().lerp(secondary, Math.random());
      colors.set([mixed.r, mixed.g, mixed.b], index * 3);
    }
    scene.add(points);
    particlesRef.current = state;
  }, [model.particles]);

  // ---------- temporary mode aura ----------
  useEffect(() => {
    const auraGroup = auraGroupRef.current;
    if (!auraGroup) return;
    clearGroup(auraGroup);
    if (!activeMode) return;
    const color = new THREE.Color(TEMPORARY_MODES[activeMode].tint ?? model.palette.glow);
    auraGroup.add(createModeAura(activeMode, color, metricsRef.current));
  }, [activeMode, model.palette.glow]);

  return (
    <div ref={containerRef} className="relative h-full w-full cursor-grab select-none overflow-hidden active:cursor-grabbing">
      <div ref={letterboxTopRef} className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[16%] origin-top bg-black" style={{ transform: "scaleY(0)" }} />
      <div ref={letterboxBottomRef} className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[16%] origin-bottom bg-black" style={{ transform: "scaleY(0)" }} />
    </div>
  );
});
