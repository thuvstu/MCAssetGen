"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { CuboidElement, EffectPresetId, ElementMotion, ModelDisplaySettings } from "@/db/schema";
import { bobOffset, orbitRadians, pulseScale, spinRadians } from "@/lib/motion";
import { ATTACK_ANIMATIONS, ATTACK_DURATIONS, type AttackModeId } from "@/lib/visualStyles";
import { getEffectPreset, particlePosition, seedOf, type EffectBounds } from "@/lib/effects";
import {
  Box,
  Compass,
  Eye,
  Grid,
  Hand,
  Layers,
  Maximize2,
  RotateCcw,
  Sparkles,
  Sun,
} from "lucide-react";

export type ViewMode =
  | "free"
  | "thirdperson_righthand"
  | "firstperson_righthand"
  | "gui";

export type LightingPreset = "studio" | "daylight" | "nether" | "end";

interface Viewport3DProps {
  elements: CuboidElement[];
  textureDataUrl: string;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  displaySettings: ModelDisplaySettings;
  atlasResolution: number;
  previewFx?: boolean;
  effectColor?: string;
  attackMode?: AttackModeId | null;
  transformed?: boolean;
  transformLoop?: boolean;
  effectPreset?: EffectPresetId;
  /** Increment to replay the same attack mode. */
  attackKey?: number;
  onAttackComplete?: () => void;
}

interface PivotData {
  restPosition?: THREE.Vector3;
  restEuler?: THREE.Euler;
  motion?: ElementMotion | null;
  group?: string;
  role?: string;
  mesh?: THREE.Mesh;
  wasPulsing?: boolean;
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh;
    mesh.geometry?.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat?.dispose();
  });
}

/** Selection is drawn as helpers on top of the existing mesh, so clicking never rebuilds the scene. */
function applySelectionOutline(
  meshMap: Map<string, THREE.Mesh>,
  helpers: { current: THREE.Object3D[] },
  id: string | null
) {
  for (const h of helpers.current) {
    h.parent?.remove(h);
    disposeObject(h);
  }
  helpers.current = [];
  meshMap.forEach((mesh) => {
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (mat.userData.selected) {
      mat.emissive.setHex(mat.userData.baseEmissiveHex as number);
      mat.emissiveIntensity = mat.userData.baseEmissive as number;
      mat.userData.selected = false;
    }
  });
  if (!id) return;
  const mesh = meshMap.get(id);
  if (!mesh || !mesh.parent) return;
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({ color: 0x38bdf8 })
  );
  edges.position.copy(mesh.position);
  edges.scale.setScalar(1.03);
  edges.raycast = () => undefined;
  const gizmo = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b })
  );
  gizmo.raycast = () => undefined;
  mesh.parent.add(edges, gizmo);
  helpers.current = [edges, gizmo];
  const mat = mesh.material as THREE.MeshStandardMaterial;
  if ((mat.userData.baseEmissive as number) < 0.05) {
    mat.userData.selected = true;
    mat.emissive.setHex(0x1e3a8a);
    mat.emissiveIntensity = 0.3;
  }
}

function applyMinecraftFaceUVs(
  geometry: THREE.BoxGeometry,
  faces: CuboidElement["faces"]
) {
  const uvAttr = geometry.attributes.uv;
  if (!uvAttr) return;

  // Three.js BoxGeometry face order: 0: east (+x), 1: west (-x), 2: up (+y), 3: down (-y), 4: south (+z), 5: north (-z)
  const order: Array<keyof CuboidElement["faces"]> = [
    "east",
    "west",
    "up",
    "down",
    "south",
    "north",
  ];

  for (let faceIdx = 0; faceIdx < 6; faceIdx++) {
    const faceKey = order[faceIdx];
    const [u1, v1, u2, v2] = faces[faceKey].uv;

    const uL = u1 / 16;
    const uR = u2 / 16;
    const vT = 1 - v1 / 16;
    const vB = 1 - v2 / 16;

    const baseVertex = faceIdx * 4;
    // Vertex 0: top-left, 1: top-right, 2: bottom-left, 3: bottom-right
    uvAttr.setXY(baseVertex + 0, uL, vT);
    uvAttr.setXY(baseVertex + 1, uR, vT);
    uvAttr.setXY(baseVertex + 2, uL, vB);
    uvAttr.setXY(baseVertex + 3, uR, vB);
  }

  uvAttr.needsUpdate = true;
}

export default function Viewport3D({
  elements,
  textureDataUrl,
  selectedElementId,
  onSelectElement,
  displaySettings,
  atlasResolution,
  previewFx = false,
  effectColor = "#67e8f9",
  attackMode = null,
  transformed = false,
  transformLoop = false,
  effectPreset,
  attackKey = 0,
}: Viewport3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("free");
  const [lighting, setLighting] = useState<LightingPreset>("studio");
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showSteveArm, setShowSteveArm] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [animationEnabled, setAnimationEnabled] = useState<boolean>(true);
  const [localTransformed, setLocalTransformed] = useState<boolean>(transformed);
  const [localTransformLoop, setLocalTransformLoop] = useState<boolean>(transformLoop);
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  useEffect(() => {
    setLocalTransformed(transformed);
  }, [transformed]);

  useEffect(() => {
    setLocalTransformLoop(transformLoop);
  }, [transformLoop]);

  // References to Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRootRef = useRef<THREE.Group | null>(null);
  const gridGroupRef = useRef<THREE.Group | null>(null);
  const armGroupRef = useRef<THREE.Group | null>(null);
  const lightsGroupRef = useRef<THREE.Group | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const meshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const fxGroupRef = useRef<THREE.Group | null>(null);
  const animationEnabledRef = useRef(true);
  const frameKeyRef = useRef("");
  const swingRef = useRef<THREE.Group | null>(null);
  const attackStateRef = useRef<{ mode: AttackModeId | null; start: number }>({ mode: null, start: 0 });
  const tfSmoothRef = useRef(0);
  const liveRef = useRef({ transformed: false, transformLoop: false });
  const selectionHelpersRef = useRef<THREE.Object3D[]>([]);
  const selectedIdRef = useRef<string | null>(null);
  const textureSrcRef = useRef<string>("");

  // Initialize Scene, Camera, Renderer, Controls
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 500);
    camera.position.set(22, 18, 26);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 10, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.maxDistance = 95;
    controls.minDistance = 5;
    controls.update();
    controlsRef.current = controls;

    // Grid & Axis Helper Group
    const gridGroup = new THREE.Group();
    const mainGrid = new THREE.GridHelper(16, 16, 0x3b82f6, 0x262936);
    mainGrid.position.set(0, 0, 0);
    gridGroup.add(mainGrid);

    const outerGrid = new THREE.GridHelper(32, 32, 0x1e2230, 0x171a24);
    outerGrid.position.set(0, -0.02, 0);
    gridGroup.add(outerGrid);

    // X (Red), Y (Green), Z (Blue) Blockbench Origin Axis Lines
    const axisMatX = new THREE.LineBasicMaterial({ color: 0xef4444 });
    const axisGeoX = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-8, 0.02, 0),
      new THREE.Vector3(8, 0.02, 0),
    ]);
    gridGroup.add(new THREE.Line(axisGeoX, axisMatX));

    const axisMatZ = new THREE.LineBasicMaterial({ color: 0x3b82f6 });
    const axisGeoZ = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.02, -8),
      new THREE.Vector3(0, 0.02, 8),
    ]);
    gridGroup.add(new THREE.Line(axisGeoZ, axisMatZ));

    const axisMatY = new THREE.LineBasicMaterial({ color: 0x10b981 });
    const axisGeoY = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-8, 0, -8),
      new THREE.Vector3(-8, 16, -8),
    ]);
    gridGroup.add(new THREE.Line(axisGeoY, axisMatY));

    scene.add(gridGroup);
    gridGroupRef.current = gridGroup;

    // Steve Right Arm Reference Group (4x12x4 voxel arm)
    const armGroup = new THREE.Group();
    const armGeo = new THREE.BoxGeometry(4, 12, 4);
    const armMat = new THREE.MeshStandardMaterial({
      color: 0xb58463,
      roughness: 0.8,
      transparent: true,
      opacity: 0.65,
    });
    const sleeveGeo = new THREE.BoxGeometry(4.25, 4.5, 4.25);
    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.7,
      transparent: true,
      opacity: 0.7,
    });
    const armMesh = new THREE.Mesh(armGeo, armMat);
    armMesh.position.set(0, 2.5, 4.5);
    armMesh.rotation.x = THREE.MathUtils.degToRad(-70);
    const sleeveMesh = new THREE.Mesh(sleeveGeo, sleeveMat);
    sleeveMesh.position.set(0, 4.2, 7.5);
    sleeveMesh.rotation.x = THREE.MathUtils.degToRad(-70);
    armGroup.add(armMesh, sleeveMesh);
    armGroup.visible = false;
    scene.add(armGroup);
    armGroupRef.current = armGroup;

    // Lights Group
    const lightsGroup = new THREE.Group();
    scene.add(lightsGroup);
    lightsGroupRef.current = lightsGroup;

    // Swing pivot sits at the grip so attacks rotate the whole weapon from the hand.
    const swing = new THREE.Group();
    swing.position.set(0, 4, 0);
    scene.add(swing);
    swingRef.current = swing;
    const offset = new THREE.Group();
    offset.position.set(0, -4, 0);
    swing.add(offset);

    const modelRoot = new THREE.Group();
    offset.add(modelRoot);
    modelRootRef.current = modelRoot;

    // Particles live next to the model so they follow the swing.
    const fxGroup = new THREE.Group();
    offset.add(fxGroup);
    fxGroupRef.current = fxGroup;

    // Raycaster for clicking/hovering cuboids
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: MouseEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: MouseEvent) => {
      const dist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );
      if (dist > 5) return; // Dragging orbit camera, not a click

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const meshes = Array.from(meshMapRef.current.values());
      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const elId = hitMesh.userData.elementId;
        if (elId) {
          onSelectElement(elId);
        }
      } else {
        onSelectElement(null);
      }
    };

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const meshes = Array.from(meshMapRef.current.values());
      const intersects = raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        setHoveredName(hitMesh.userData.elementName || null);
        renderer.domElement.style.cursor = "pointer";
      } else {
        setHoveredName(null);
        renderer.domElement.style.cursor = "grab";
      }
    };

    renderer.domElement.addEventListener("mousedown", onPointerDown);
    renderer.domElement.addEventListener("mouseup", onPointerUp);
    renderer.domElement.addEventListener("mousemove", onPointerMove);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: cw, height: ch } = entry.contentRect;
        if (cw > 0 && ch > 0) {
          camera.aspect = cw / ch;
          camera.updateProjectionMatrix();
          renderer.setSize(cw, ch);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation loop — reads live state through refs, so prop changes are never stale.
    let reqId = 0;
    const d2r = THREE.MathUtils.degToRad;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const playing = animationEnabledRef.current;
      const now = performance.now();
      const seconds = now / 1000;

      let atk = { yaw: 0, pitch: 0, roll: 0, guard: 0, core: 0, trail: 0, transform: -1, scale: 1 };
      const st = attackStateRef.current;
      if (st.mode) {
        const dur = ATTACK_DURATIONS[st.mode];
        const meta = ATTACK_ANIMATIONS[st.mode];
        const phases = [meta.windup, meta.attack, meta.recover];
        const elapsed = (now - st.start) / 1000;
        if (elapsed > dur[0] + dur[1] + dur[2]) {
          attackStateRef.current = { mode: null, start: 0 };
        } else {
          let acc = 0;
          for (let i = 0; i < 3; i++) {
            if (elapsed <= acc + dur[i] || i === 2) {
              const k = Math.min(1, Math.max(0, (elapsed - acc) / dur[i]));
              const e = i === 1 ? 1 - Math.pow(1 - k, 2) : k * k * (3 - 2 * k);
              const ph = phases[i];
              const lerp = (r: [number, number]) => r[0] + (r[1] - r[0]) * e;
              atk = {
                yaw: lerp(ph.yaw),
                pitch: lerp(ph.pitch),
                roll: lerp(ph.roll),
                guard: lerp(ph.guardSwing),
                core: ph.coreLift * (i === 2 ? 1 - e : 1),
                trail: ph.trailStrength,
                transform: ph.transform ? lerp(ph.transform) : -1,
                scale: ph.scale ? lerp(ph.scale) : 1,
              };
              break;
            }
            acc += dur[i];
          }
        }
      }

      const swingGroup = swingRef.current;
      if (swingGroup) {
        swingGroup.rotation.set(d2r(atk.pitch), d2r(atk.yaw), d2r(atk.roll));
        swingGroup.scale.setScalar(atk.scale);
      }

      const live = liveRef.current;
      const tfBase = live.transformLoop ? 0.5 + 0.5 * Math.sin(seconds * 2.5) : live.transformed ? 1 : 0;
      const tfTarget = atk.transform >= 0 ? atk.transform : tfBase;
      tfSmoothRef.current += (tfTarget - tfSmoothRef.current) * (atk.transform >= 0 ? 0.5 : 0.14);
      const tf = tfSmoothRef.current;

      const root = modelRootRef.current;
      if (root) {
        for (const child of root.children) {
          const data = child.userData as PivotData;
          if (!data.restPosition || !data.restEuler) continue;
          child.position.copy(data.restPosition);
          child.rotation.copy(data.restEuler);
          child.scale.setScalar(1);
          const m = data.motion;
          if (m) {
            if (playing) {
              child.position.y += bobOffset(m, seconds);
              child.rotation.y += orbitRadians(m, seconds);
              if (m.spin) child.rotation[m.spin.axis] += spinRadians(m, seconds);
              if (m.scalePulse) child.scale.setScalar(pulseScale(m, seconds));
            }
            const td = m.transformDelta;
            if (td && tf > 0.001) {
              if (td.translation) {
                child.position.x += td.translation[0] * tf;
                child.position.y += td.translation[1] * tf;
                child.position.z += td.translation[2] * tf;
              }
              if (td.rotation) {
                child.rotation.x += d2r(td.rotation[0] * tf);
                child.rotation.y += d2r(td.rotation[1] * tf);
                child.rotation.z += d2r(td.rotation[2] * tf);
              }
              if (td.scale) {
                child.scale.set(
                  child.scale.x * (1 + (td.scale[0] - 1) * tf),
                  child.scale.y * (1 + (td.scale[1] - 1) * tf),
                  child.scale.z * (1 + (td.scale[2] - 1) * tf)
                );
              }
            }
          }
          if (atk.core !== 0 && (data.role === "gem" || data.role === "core")) child.position.y += atk.core * 0.25;
          if (atk.guard !== 0 && data.group === "guard") child.rotation.z += d2r(atk.guard * 0.15);

          const pulsing = playing && !!m?.pulse;
          const mesh = data.mesh;
          if (mesh && (pulsing || data.wasPulsing)) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (!mat.userData.selected) {
              const base = mat.userData.baseEmissive as number;
              mat.emissiveIntensity = pulsing
                ? base + 0.28 * (0.5 + 0.5 * Math.sin(seconds * 5 + (m?.phase ?? 0) * 6.2)) + atk.trail * 0.3
                : base;
            }
            data.wasPulsing = pulsing;
          }
        }
      }

      const fx = fxGroupRef.current;
      if (fx) {
        fx.visible = playing;
        const pts = fx.userData.points as THREE.Points | undefined;
        if (pts && playing) {
          const attr = pts.geometry.getAttribute("position") as THREE.BufferAttribute;
          const arr = attr.array as Float32Array;
          const preset = fx.userData.preset as EffectPresetId;
          const bounds = fx.userData.bounds as EffectBounds;
          const speed = 1 + atk.trail * 1.5;
          for (let i = 0; i < attr.count; i++) particlePosition(preset, i, seconds * speed, bounds, arr, i * 3);
          attr.needsUpdate = true;
        }
        const light = fx.getObjectByName("fx-light") as THREE.PointLight | undefined;
        if (light) light.intensity = (1 + Math.sin(seconds * 4.2) * 0.45) * (1 + atk.trail * 1.5);
      }

      if (controlsRef.current) controlsRef.current.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("mousedown", onPointerDown);
      renderer.domElement.removeEventListener("mouseup", onPointerUp);
      renderer.domElement.removeEventListener("mousemove", onPointerMove);
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Auto-Rotate, Grid, and Steve Arm Visibility
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2.2;
    }
    if (gridGroupRef.current) {
      gridGroupRef.current.visible = showGrid;
    }
    if (armGroupRef.current) {
      armGroupRef.current.visible =
        showSteveArm || viewMode === "thirdperson_righthand";
    }
  }, [autoRotate, showGrid, showSteveArm, viewMode]);

  // Update Lighting Preset
  useEffect(() => {
    const lightsGroup = lightsGroupRef.current;
    if (!lightsGroup) return;
    lightsGroup.clear();

    if (lighting === "studio") {
      const amb = new THREE.AmbientLight(0xffffff, 1.35);
      const key = new THREE.DirectionalLight(0xf8fafc, 1.8);
      key.position.set(20, 35, 25);
      const fill = new THREE.DirectionalLight(0x38bdf8, 0.75);
      fill.position.set(-22, 12, -15);
      const rim = new THREE.DirectionalLight(0x818cf8, 0.65);
      rim.position.set(0, -15, -25);
      lightsGroup.add(amb, key, fill, rim);
    } else if (lighting === "daylight") {
      const amb = new THREE.AmbientLight(0xfffbeb, 1.5);
      const sun = new THREE.DirectionalLight(0xfef08a, 2.2);
      sun.position.set(30, 45, 20);
      const sky = new THREE.HemisphereLight(0x7dd3fc, 0x334155, 0.9);
      lightsGroup.add(amb, sun, sky);
    } else if (lighting === "nether") {
      const amb = new THREE.AmbientLight(0xfca5a5, 0.95);
      const lava = new THREE.PointLight(0xf97316, 2.8, 70);
      lava.position.set(10, 4, 14);
      const rim = new THREE.DirectionalLight(0xe11d48, 1.6);
      rim.position.set(-18, 22, 18);
      lightsGroup.add(amb, lava, rim);
    } else {
      // "end"
      const amb = new THREE.AmbientLight(0xd8b4fe, 1.0);
      const endKey = new THREE.DirectionalLight(0xc084fc, 2.0);
      endKey.position.set(15, 30, 20);
      const cyanRim = new THREE.DirectionalLight(0x2dd4bf, 1.4);
      cyanRim.position.set(-20, 10, -20);
      lightsGroup.add(amb, endKey, cyanRim);
    }
  }, [lighting]);

  // Apply Camera & Display Mode Transforms
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const modelRoot = modelRootRef.current;
    if (!camera || !controls || !modelRoot) return;

    modelRoot.position.set(0, 0, 0);
    modelRoot.rotation.set(0, 0, 0);
    modelRoot.scale.set(1, 1, 1);

    if (viewMode === "free") {
      camera.position.set(22, 18, 26);
      controls.target.set(0, 10, 0);
      controls.update();
    } else if (viewMode === "thirdperson_righthand") {
      camera.position.set(18, 14, 18);
      controls.target.set(0, 8, 2);
      controls.update();
    } else if (viewMode === "firstperson_righthand") {
      camera.position.set(12, 13, 14);
      controls.target.set(0, 11, 0);
      controls.update();
    } else if (viewMode === "gui") {
      const gui = displaySettings.gui;
      camera.position.set(0, 11, 28);
      controls.target.set(0, 11, 0);
      modelRoot.rotation.set(
        THREE.MathUtils.degToRad(gui.rotation[0] * 0.35),
        THREE.MathUtils.degToRad(gui.rotation[1] * 0.35),
        THREE.MathUtils.degToRad(gui.rotation[2] * 0.45)
      );
      controls.update();
    }
  }, [viewMode, displaySettings]);

  useEffect(() => {
    liveRef.current = {
      transformed: localTransformed || transformed,
      transformLoop: localTransformLoop || transformLoop,
    };
  }, [localTransformed, transformed, localTransformLoop, transformLoop]);

  useEffect(() => {
    if (attackMode) attackStateRef.current = { mode: attackMode, start: performance.now() };
  }, [attackMode, attackKey]);

  useEffect(() => {
    selectedIdRef.current = selectedElementId;
    applySelectionOutline(meshMapRef.current, selectionHelpersRef, selectedElementId);
  }, [selectedElementId]);

  // Rebuild cuboid meshes. Old GPU resources are disposed; the texture is cached by source.
  useEffect(() => {
    const modelRoot = modelRootRef.current;
    if (!modelRoot) return;
    let cancelled = false;
    const glowColor = new THREE.Color(effectColor);

    const build = (tex: THREE.Texture | null) => {
      if (cancelled) return;
      for (const child of [...modelRoot.children]) {
        modelRoot.remove(child);
        disposeObject(child);
      }
      meshMapRef.current.clear();
      selectionHelpersRef.current = [];

      for (const el of elements) {
        if (!el.visible) continue;
        const w = Math.max(0.05, Math.abs(el.to[0] - el.from[0]));
        const h = Math.max(0.05, Math.abs(el.to[1] - el.from[1]));
        const d = Math.max(0.05, Math.abs(el.to[2] - el.from[2]));
        const centerX = (el.from[0] + el.to[0]) / 2 - 8;
        const centerY = (el.from[1] + el.to[1]) / 2;
        const centerZ = (el.from[2] + el.to[2]) / 2 - 8;
        const pivotX = el.origin[0] - 8;
        const pivotY = el.origin[1];
        const pivotZ = el.origin[2] - 8;

        const pivotGroup = new THREE.Group();
        pivotGroup.position.set(pivotX, pivotY, pivotZ);
        pivotGroup.rotation.order = "ZYX";
        const rad = THREE.MathUtils.degToRad(el.rotation.angle || 0);
        if (el.rotation.axis === "x") pivotGroup.rotation.x = rad;
        else if (el.rotation.axis === "y") pivotGroup.rotation.y = rad;
        else pivotGroup.rotation.z = rad;

        const geo = new THREE.BoxGeometry(w, h, d);
        applyMinecraftFaceUVs(geo, el.faces);
        const glow = el.materialRole === "gem" || el.materialRole === "core";
        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          roughness: glow ? 0.25 : 0.55,
          metalness: el.materialRole === "handle" ? 0.05 : 0.25,
          emissive: glow ? glowColor : new THREE.Color(0x000000),
          emissiveIntensity: glow ? 0.22 : 0,
          wireframe: showWireframe,
        });
        mat.userData = { baseEmissive: mat.emissiveIntensity, baseEmissiveHex: mat.emissive.getHex(), selected: false };

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(centerX - pivotX, centerY - pivotY, centerZ - pivotZ);
        mesh.userData = { elementId: el.id, elementName: el.name };
        pivotGroup.add(mesh);
        const data: PivotData = {
          motion: el.motion ?? null,
          restPosition: pivotGroup.position.clone(),
          restEuler: pivotGroup.rotation.clone(),
          group: el.group,
          role: el.materialRole,
          mesh,
        };
        pivotGroup.userData = data;
        meshMapRef.current.set(el.id, mesh);
        modelRoot.add(pivotGroup);
      }
      applySelectionOutline(meshMapRef.current, selectionHelpersRef, selectedIdRef.current);
    };

    if (!textureDataUrl) {
      build(null);
    } else if (textureSrcRef.current === textureDataUrl && textureRef.current) {
      build(textureRef.current);
    } else {
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        const tex = new THREE.Texture(img);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
        textureRef.current?.dispose();
        textureRef.current = tex;
        textureSrcRef.current = textureDataUrl;
        build(tex);
      };
      img.src = textureDataUrl;
    }
    return () => {
      cancelled = true;
    };
  }, [elements, textureDataUrl, showWireframe, effectColor]);

  useEffect(() => {
    animationEnabledRef.current = animationEnabled;
  }, [animationEnabled]);

  useEffect(() => {
    if (viewMode !== "free") {
      frameKeyRef.current = "";
      return;
    }
    if (!cameraRef.current || !controlsRef.current) return;
    let minY = Infinity;
    let maxY = -Infinity;
    let maxR = 1;
    for (const el of elements) {
      if (!el.visible) continue;
      minY = Math.min(minY, el.from[1], el.to[1]);
      maxY = Math.max(maxY, el.from[1], el.to[1]);
      const x = (el.from[0] + el.to[0]) / 2 - 8;
      const z = (el.from[2] + el.to[2]) / 2 - 8;
      maxR = Math.max(maxR, Math.hypot(x, z));
    }
    if (!Number.isFinite(minY)) return;
    const key = `${elements.length}:${Math.round(maxY)}:${Math.round(maxR)}`;
    if (key === frameKeyRef.current) return;
    frameKeyRef.current = key;
    const mid = (minY + maxY) / 2;
    const span = Math.max(8, maxY - minY);
    const dist = Math.min(78, Math.max(18, span * 0.78 + maxR * 1.7));
    controlsRef.current.target.set(0, mid, 0);
    cameraRef.current.position.set(dist * 0.58, mid + dist * 0.18, dist * 0.82);
    controlsRef.current.update();
  }, [elements, viewMode]);

  // Particle effect preset. Positions are recomputed every frame in the render loop.
  const resolvedPreset: EffectPresetId = effectPreset ?? (previewFx ? "mana" : "none");
  useEffect(() => {
    const fx = fxGroupRef.current;
    if (!fx) return;
    for (const child of [...fx.children]) {
      fx.remove(child);
      disposeObject(child);
    }
    fx.userData = {};
    const preset = getEffectPreset(resolvedPreset);
    if (preset.count === 0) return;

    let minY = Infinity;
    let maxY = -Infinity;
    let maxR = 1;
    let coreSum = 0;
    let coreN = 0;
    for (const el of elements) {
      if (!el.visible) continue;
      minY = Math.min(minY, el.from[1], el.to[1]);
      maxY = Math.max(maxY, el.from[1], el.to[1]);
      if (el.group !== "float") {
        maxR = Math.max(maxR, Math.abs((el.from[0] + el.to[0]) / 2 - 8) + 1);
      }
      if (el.materialRole === "gem" || el.materialRole === "core") {
        coreSum += (el.from[1] + el.to[1]) / 2;
        coreN += 1;
      }
    }
    if (!Number.isFinite(minY)) return;
    const bounds: EffectBounds = {
      minY,
      maxY,
      radius: Math.min(6, maxR),
      coreY: coreN > 0 ? coreSum / coreN : minY + (maxY - minY) * 0.6,
    };

    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 8, 8);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillRect(3, 1, 2, 6);
      ctx.fillRect(1, 3, 6, 2);
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillRect(2, 2, 4, 4);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;

    const positions = new Float32Array(preset.count * 3);
    const colors = new Float32Array(preset.count * 3);
    const c0 = new THREE.Color(preset.colors[0]);
    const c1 = new THREE.Color(preset.colors[1]);
    const tmp = new THREE.Color();
    for (let i = 0; i < preset.count; i++) {
      tmp.copy(c0).lerp(c1, seedOf(i, 7));
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
      particlePosition(preset.id, i, 0, bounds, positions, i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      map: tex,
      size: preset.size,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: preset.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      opacity: preset.additive ? 0.9 : 0.78,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    points.raycast = () => undefined;
    fx.add(points);

    const light = new THREE.PointLight(c1, 1.2, 24, 2);
    light.name = "fx-light";
    light.position.set(0, bounds.coreY, 0);
    fx.add(light);
    fx.userData = { points, preset: preset.id, bounds };
    return () => {
      tex.dispose();
    };
  }, [elements, resolvedPreset]);

  const resetCamera = () => {
    setViewMode("free");
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(22, 18, 26);
      controlsRef.current.target.set(0, 10, 0);
      controlsRef.current.update();
    }
  };

  const visibleCount = elements.filter((e) => e.visible).length;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#11131A] select-none overflow-hidden">
      {/* Radial Studio Lighting Backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(59, 130, 246, 0.11) 0%, rgba(17, 19, 26, 0.96) 75%)",
        }}
      />

      {/* Top Floating Viewport HUD Controls */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#141720]/90 border-b border-[#262936] backdrop-blur-md">
        {/* Camera / Display Context Switcher */}
        <div className="flex items-center gap-1 bg-[#0D0E12] p-1 rounded-md border border-[#262936]">
          {(
            [
              { id: "free", label: "3D Orbit", icon: Compass },
              { id: "thirdperson_righthand", label: "右持ち (3rd)", icon: Hand },
              { id: "firstperson_righthand", label: "一人称 (1st)", icon: Eye },
              { id: "gui", label: "インベントリ枠 (GUI)", icon: Maximize2 },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = viewMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setViewMode(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  active
                    ? "bg-[#3B82F6] text-white shadow-sm"
                    : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1E2230]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Viewport Overlay Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowWireframe((v) => !v)}
            title="ワイヤーフレーム表示切替"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              showWireframe
                ? "bg-[#3B82F6]/20 border-[#3B82F6] text-[#60A5FA]"
                : "bg-[#161922] border-[#262936] text-[#94A3B8] hover:text-white"
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Wire</span>
          </button>

          <button
            onClick={() => setShowGrid((v) => !v)}
            title="16x16 ブロックグリッド表示切替"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              showGrid
                ? "bg-[#10B981]/20 border-[#10B981] text-[#34D399]"
                : "bg-[#161922] border-[#262936] text-[#94A3B8] hover:text-white"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>16×16 Grid</span>
          </button>

          <button
            onClick={() => setShowSteveArm((v) => !v)}
            title="スティーブ右腕リファレンス表示"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              showSteveArm || viewMode === "thirdperson_righthand"
                ? "bg-[#F59E0B]/20 border-[#F59E0B] text-[#FBBF24]"
                : "bg-[#161922] border-[#262936] text-[#94A3B8] hover:text-white"
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Steve Hand</span>
          </button>

          <button
            onClick={() => setAutoRotate((v) => !v)}
            title="自動ターンテーブル回転"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              autoRotate
                ? "bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#C084FC]"
                : "bg-[#161922] border-[#262936] text-[#94A3B8] hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Turntable</span>
          </button>

          <button
            onClick={() => setAnimationEnabled((v) => !v)}
            title="浮遊クリスタル・パーティクルのアニメーション"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              animationEnabled
                ? "bg-[#10B981]/20 border-[#10B981] text-[#34D399]"
                : "bg-[#161922] border-[#262936] text-[#94A3B8] hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>魔力アニメ</span>
          </button>

          <button
            onClick={() => setLocalTransformed((v) => !v)}
            title="トランスフォーム展開形態の切り替え（バレル伸長・排熱ベント・シリンダー・レール開閉）"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              localTransformed
                ? "bg-[#EF4444]/20 border-[#EF4444] text-[#F87171]"
                : "bg-[#161922] border-[#262936] text-[#94A3B8] hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>変形展開</span>
          </button>

          <button
            onClick={() => setLocalTransformLoop((v) => !v)}
            title="メカニカルトランスフォーム変形ループ再生（変形展開↔収納の連続動作）"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              localTransformLoop
                ? "bg-[#F59E0B]/20 border-[#F59E0B] text-[#FBBF24]"
                : "bg-[#161922] border-[#262936] text-[#94A3B8] hover:text-white"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>変形ループ</span>
          </button>

          {/* Lighting Selector */}
          <div className="flex items-center gap-1 bg-[#0D0E12] px-2 py-1 rounded border border-[#262936]">
            <Sun className="w-3.5 h-3.5 text-[#F59E0B]" />
            <select
              value={lighting}
              onChange={(e) => setLighting(e.target.value as LightingPreset)}
              className="bg-transparent text-xs text-[#F1F5F9] focus:outline-none cursor-pointer"
            >
              <option value="studio" className="bg-[#161922]">
                Studio Light
              </option>
              <option value="daylight" className="bg-[#161922]">
                Overworld Sun
              </option>
              <option value="nether" className="bg-[#161922]">
                Nether Glow
              </option>
              <option value="end" className="bg-[#161922]">
                End Void
              </option>
            </select>
          </div>

          <button
            onClick={resetCamera}
            title="カメラ位置をリセット"
            className="p-1.5 rounded bg-[#161922] border border-[#262936] text-[#94A3B8] hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main WebGL Canvas Mount */}
      <div className="relative flex-1 w-full h-full min-h-[260px]">
        <div ref={mountRef} className="absolute inset-0 w-full h-full" />

        {/* Minecraft GUI Slot Frame Overlay when in GUI mode */}
        {viewMode === "gui" && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-56 h-56 border-4 border-[#373737] bg-[#8b8b8b]/10 shadow-[inset_-4px_-4px_0px_#ffffff40,inset_4px_4px_0px_#00000080] rounded-sm flex items-end justify-end p-2">
              <span className="font-mono text-xs text-white/80 bg-black/60 px-1.5 py-0.5 rounded">
                GUI Slot 16×16
              </span>
            </div>
          </div>
        )}

        {/* Bottom-Left Technical Telemetry Overlay */}
        <div className="absolute left-3 bottom-3 pointer-events-none flex flex-col gap-1.5 bg-[#0D0E12]/85 border border-[#262936] px-3 py-2 rounded-md backdrop-blur-md">
          <div className="flex items-center gap-3 text-[11px] font-mono text-[#94A3B8]">
            <span className="flex items-center gap-1 text-[#F1F5F9]">
              <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
              Cuboids: <strong>{visibleCount}</strong>/{elements.length}
            </span>
            <span>|</span>
            <span>
              UV Atlas:{" "}
              <strong className="text-[#10B981]">
                {atlasResolution}×{atlasResolution}px
              </strong>
            </span>
            <span>|</span>
            <span>
              Filter: <strong className="text-[#F59E0B]">Nearest (Pixel)</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="text-[#EF4444]">X: East/West</span>
            <span className="text-[#10B981]">Y: Up/Down</span>
            <span className="text-[#3B82F6]">Z: South/North</span>
            {hoveredName && (
              <span className="text-[#60A5FA] bg-[#3B82F6]/15 px-1.5 py-0.5 rounded">
                Hover: {hoveredName}
              </span>
            )}
          </div>
        </div>

        {/* Bottom-Right Controls Hint */}
        <div className="absolute right-3 bottom-3 pointer-events-none hidden sm:flex items-center gap-2 bg-[#0D0E12]/80 border border-[#262936] px-2.5 py-1.5 rounded text-[11px] text-[#64748B] font-mono">
          <span>左ドラッグ: 回転</span>
          <span>•</span>
          <span>右ドラッグ: パン</span>
          <span>•</span>
          <span>ホイール: ズーム</span>
          <span>•</span>
          <span>クリック: パーツ選択</span>
        </div>
      </div>
    </div>
  );
}
