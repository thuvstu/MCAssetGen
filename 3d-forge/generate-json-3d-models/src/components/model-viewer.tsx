"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { faceUv, gridOf, isTilted, poseOf, TILT, type FaceName, type Vec3, type VoxelCube, type VoxelModel } from "@/lib/models";
import { bodyAt, identity, motionAt, particleAt, planFor, transformAt, transformLength, type NodeTransform } from "@/lib/animation";
import { effectOf, normalizeExtras } from "@/lib/decor";
import { canShimmer, createShimmerFrames, createTextureCanvas } from "@/lib/texture";
import ModelThumbnail from "./model-thumbnail";
import { colorPixels } from "@/lib/color-textures";

export type CameraView = "perspective" | "front" | "top" | "right";
export interface ViewerApi { reset: () => void; zoom: (direction: number) => void; snapshot: () => string }
interface Props {
  model: VoxelModel;
  autoRotate: boolean;
  wireframe: boolean;
  showGrid: boolean;
  view: CameraView;
  onReady: (api: ViewerApi) => void;
  /** Animations run only while playing; `transformSignal` restarts the transform clip. */
  playing: boolean;
  transformSignal: number;
  transformLoop: boolean;
  selectedDecorId: string | null;
  onDecorationSelect: (id: string | null) => void;
}
// BoxGeometry emits faces in this order: +x, -x, +y, -y, +z, -z.
const THREE_FACE_ORDER: FaceName[] = ["east", "west", "up", "down", "south", "north"];
const PARTICLE_COUNT = 72;

function radialTexture(color: string, inner = "88") {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, color + inner); gradient.addColorStop(.5, color + "22"); gradient.addColorStop(1, color + "00");
  context.fillStyle = gradient; context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
const rad = (degrees: number) => THREE.MathUtils.degToRad(degrees);
/** Applies a node transform around a pivot. `base` is the group's resting position. */
function applyNode(group: THREE.Object3D, base: Vec3, node: NodeTransform) {
  group.position.set(base[0] + node.pos[0], base[1] + node.pos[1], base[2] + node.pos[2]);
  group.rotation.set(rad(node.rot[0]), rad(node.rot[1]), rad(node.rot[2]), "ZYX");
  group.scale.set(node.scale[0], node.scale[1], node.scale[2]);
}

export default function ModelViewer({ model, autoRotate, wireframe, showGrid, view, onReady, playing, transformSignal, transformLoop, selectedDecorId, onDecorationSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<{ controls: OrbitControls; camera: THREE.PerspectiveCamera; materials: THREE.MeshStandardMaterial[]; grid: THREE.GridHelper; focus: THREE.Vector3; restDistance: number; invalidate: () => void; select: (id: string | null) => void } | null>(null);
  const savedCamera = useRef<{ position: THREE.Vector3; target: THREE.Vector3; fitDistance: number } | null>(null);
  // Animation time and the transform clip live outside the scene so rebuilding the scene never makes them jump.
  const clock = useRef({ t: 0 });
  const clip = useRef({ start: -1, pending: false, signal: transformSignal });
  const flags = useRef({ autoRotate, wireframe, showGrid, view, playing, transformLoop });
  flags.current = { autoRotate, wireframe, showGrid, view, playing, transformLoop };
  const selection = useRef({ id: selectedDecorId, change: onDecorationSelect }); selection.current = { id: selectedDecorId, change: onDecorationSelect };
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (clip.current.signal !== transformSignal) { clip.current.signal = transformSignal; clip.current.pending = true; liveRef.current?.invalidate(); }
  }, [transformSignal]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch { setFallback(true); return; }
    setFallback(false);
    let needsRender = true;
    const invalidate = () => { needsRender = true; };
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.setAttribute("aria-label", `${model.name}のインタラクティブ3Dプレビュー。ドラッグで回転、スクロールで拡大縮小できます。`);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, .1, 200);
    const originalPosition = new THREE.Vector3(19, 13, 30);
    camera.position.copy(savedCamera.current?.position ?? originalPosition);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener("change", invalidate);
    controls.enableDamping = true;
    controls.dampingFactor = .065;
    controls.minDistance = 17;
    controls.maxDistance = 80;
    controls.autoRotateSpeed = .75;
    controls.target.copy(savedCamera.current?.target ?? new THREE.Vector3(0, -.2, 0));
    controls.autoRotate = flags.current.autoRotate;
    controls.update();

    scene.add(new THREE.HemisphereLight(0xe6dcff, 0x3a2f4a, 1.35));
    const keyLight = new THREE.DirectionalLight(0xfff4ea, 2.6);
    keyLight.position.set(-12, 24, 18);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    Object.assign(keyLight.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22 });
    keyLight.shadow.normalBias = .08;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x8f74e0, 1.25);
    fillLight.position.set(16, 5, -8);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xb9f0ff, .9);
    rimLight.position.set(6, 10, -20);
    scene.add(rimLight);

    const extras = normalizeExtras(model.extras), speed = extras.animation.speed;
    const shimmerFrames = canShimmer(model) ? createShimmerFrames(model) : null;
    const texture = model.texture?.source ? new THREE.Texture() : new THREE.CanvasTexture(shimmerFrames ? shimmerFrames[0] : createTextureCanvas(model));
    texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false; texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 1;
    let importedImage: HTMLImageElement | null = null;
    let disposed = false;
    if (model.texture?.source) {
      const image = new Image();
      importedImage = image;
      image.onload = () => { if (!disposed) { texture.image = image; texture.needsUpdate = true; invalidate(); } };
      image.onerror = () => { if (!disposed) setFallback(true); };
      image.src = model.texture.source;
    }
    const material = new THREE.MeshStandardMaterial({ map: texture, roughness: .78, metalness: .04, alphaTest: .025, wireframe: flags.current.wireframe });
    const glowMaterial = new THREE.MeshStandardMaterial({ map: texture, emissive: 0xffffff, emissiveMap: texture, emissiveIntensity: .48, roughness: .55, alphaTest: .025, wireframe: flags.current.wireframe });

    const tintedMaterials = new Map<string, THREE.MeshStandardMaterial>();
    const tintTextures = new Map<string, THREE.DataTexture>();
    const materialFor = (cube: VoxelCube) => {
      if (!cube.tint) return cube.glow ? glowMaterial : material;
      const key = cube.tint + (cube.glow ? "-glow" : "");
      if (tintedMaterials.has(key)) return tintedMaterials.get(key)!;
      let tex = tintTextures.get(cube.tint);
      if (!tex) {
        tex = new THREE.DataTexture(colorPixels(cube.tint), 16, 16, THREE.RGBAFormat);
        tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
        tintTextures.set(cube.tint, tex);
      }
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: .7, metalness: .05, wireframe: flags.current.wireframe,
        ...(cube.glow ? { emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .48 } : {}) });
      tintedMaterials.set(key, mat); return mat;
    };
    const meshes: THREE.Mesh[] = [];
    // root (transform animation) → modelGroup (placement + tilt) → body (idle animation) → grip / tip / decor
    const plan = planFor(model.cubes, extras);
    const root = new THREE.Group(), modelGroup = new THREE.Group(), body = new THREE.Group();
    const gripGroup = new THREE.Group(), tipGroup = new THREE.Group(), decorGroup = new THREE.Group();
    const tipBase: Vec3 = [0, plan.splitY - 8, 0];
    tipGroup.position.set(...tipBase);
    body.add(gripGroup, tipGroup, decorGroup); modelGroup.add(body); root.add(modelGroup); scene.add(root);
    const grid16 = gridOf(model);
    const addMesh = (cube: VoxelCube, parent: THREE.Object3D, pivot: Vec3) => {
      const geometry = new THREE.BoxGeometry(cube.to[0] - cube.from[0], cube.to[1] - cube.from[1], cube.to[2] - cube.from[2]);
      const uv = geometry.attributes.uv as THREE.BufferAttribute;
      THREE_FACE_ORDER.forEach((face, index) => {
        const [u1, v1, u2, v2] = faceUv(cube, face, 16, 16, grid16);
        const a = u1 / 16, b = u2 / 16, c = 1 - v1 / 16, d = 1 - v2 / 16;
        uv.setXY(index * 4, a, c); uv.setXY(index * 4 + 1, b, c); uv.setXY(index * 4 + 2, a, d); uv.setXY(index * 4 + 3, b, d);
      });
      uv.needsUpdate = true;
      const mesh = new THREE.Mesh(geometry, materialFor(cube));
      mesh.userData.decorId = cube.decorId; meshes.push(mesh);
      mesh.position.set((cube.from[0] + cube.to[0]) / 2 - pivot[0], (cube.from[1] + cube.to[1]) / 2 - pivot[1], (cube.from[2] + cube.to[2]) / 2 - pivot[2]);
      mesh.castShadow = true; mesh.receiveShadow = true;
      parent.add(mesh);
    };
    plan.grip.forEach(cube => addMesh(cube, gripGroup, [8, 8, 8]));
    plan.tip.forEach(cube => addMesh(cube, tipGroup, [8, plan.splitY, 8]));
    plan.decorStatic.forEach(cube => addMesh(cube, decorGroup, [8, 8, 8]));
    const nodes = plan.decorNodes.map(entry => {
      const group = new THREE.Group(), base: Vec3 = [entry.pivot[0] - 8, entry.pivot[1] - 8, entry.pivot[2] - 8];
      group.position.set(...base); decorGroup.add(group); addMesh(entry.cube, group, entry.pivot);
      return { group, base, motion: entry.motion };
    });
    const outlineMaterial = new THREE.LineBasicMaterial({ color: 0xefd8ff, transparent: true, opacity: .72, depthTest: false });
    let outlines: THREE.LineSegments[] = [];
    const select = (id: string | null) => {
      for (const line of outlines) { line.removeFromParent(); line.geometry.dispose(); }
      outlines = [];
      if (id) for (const mesh of meshes) if (mesh.userData.decorId === id) {
        const line = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), outlineMaterial);
        line.renderOrder = 10; mesh.add(line); outlines.push(line);
      }
      invalidate();
    };
    select(selection.current.id);
    const raycaster = new THREE.Raycaster();
    let pointerStart = { x: 0, y: 0 };
    const pointerDown = (event: PointerEvent) => { pointerStart = { x: event.clientX, y: event.clientY }; };
    const pointerUp = (event: PointerEvent) => {
      if (event.button !== 0 || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      selection.current.change(hit?.object.userData.decorId ?? null);
    };
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    // Same tilt as the exported element rotation (-45° around the model center) for tools, weapons and bows.
    const pose = poseOf(model);
    if (isTilted(pose)) modelGroup.rotation.z = THREE.MathUtils.degToRad(TILT);
    else if (pose === "sprite") modelGroup.position.z = 1.5;
    else if (model.kind === "chest") modelGroup.position.y = 1.2;
    else if (model.kind === "mushroom") modelGroup.position.y = .7;
    const bounds = new THREE.Box3().setFromObject(root);
    const focus = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const aspect = Math.max(.4, container.clientWidth / Math.max(1, container.clientHeight));
    const restDistance = Math.max(24, Math.max(size.y, size.x / aspect) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.25);
    originalPosition.copy(new THREE.Vector3(19, 13, 30).normalize().multiplyScalar(restDistance).add(focus));
    if (savedCamera.current) {
      const offset = savedCamera.current.position.clone().sub(savedCamera.current.target);
      const zoomRatio = offset.length() / savedCamera.current.fitDistance;
      camera.position.copy(offset.normalize().multiplyScalar(restDistance * Math.min(2, Math.max(.6, zoomRatio))).add(focus));
    } else camera.position.copy(originalPosition);
    controls.target.copy(focus);
    controls.minDistance = restDistance * .4;
    controls.maxDistance = Math.max(100, restDistance * 3);
    controls.update();

    // Particles live in world space around the item's resting bounds.
    const effect = effectOf(extras.effect);
    let particles: THREE.Points | null = null;
    const positions = new Float32Array(PARTICLE_COUNT * 3), colors = new Float32Array(PARTICLE_COUNT * 3);
    const spriteTexture = radialTexture("#ffffff", "ff");
    const particleMaterial = new THREE.PointsMaterial({ size: 1.5, map: spriteTexture, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    if (effect.id !== "none") { particles = new THREE.Points(particleGeometry, particleMaterial); particles.frustumCulled = false; scene.add(particles); }
    const box = { cx: focus.x, cy: focus.y, cz: focus.z, rx: Math.max(2, size.x / 2), ry: Math.max(3, size.y / 2), rz: Math.max(1.5, size.z / 2) };

    const grid = new THREE.GridHelper(100, 50, 0x686075, 0x48424f);
    grid.position.y = -9;
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMaterials.forEach(m => { m.transparent = true; m.opacity = .17; m.depthWrite = false; });
    grid.visible = flags.current.showGrid;
    scene.add(grid);
    const floorGlowTexture = radialTexture(model.palette[0]);
    const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), new THREE.MeshBasicMaterial({ map: floorGlowTexture, transparent: true, depthWrite: false, opacity: .8, blending: THREE.AdditiveBlending }));
    floorGlow.rotation.x = -Math.PI / 2; floorGlow.position.y = -9.01;
    scene.add(floorGlow);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: .32 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -9.03; ground.receiveShadow = true;
    scene.add(ground);
    if (model.cubes.some(cube => cube.glow)) {
      const glow = new THREE.PointLight(model.palette[1], 14, 26, 2);
      glow.position.set(0, 2, 6); scene.add(glow);
    }

    /** Advances every animated part to the current clock. Returns true while anything is still moving. */
    let lastShimmer = -1;
    const update = () => {
      const t = clock.current.t;
      let active = false;
      if (extras.animation.body !== "none") { applyNode(body, [0, 0, 0], bodyAt(extras.animation.body, t, speed)); active = true; }
      for (const node of nodes) { applyNode(node.group, node.base, motionAt(node.motion, t, speed)); active = true; }
      if (extras.animation.transform !== "none") {
        const state = clip.current, length = transformLength(speed);
        if (state.pending) { state.start = t; state.pending = false; }
        if (state.start >= 0) {
          let u = (t - state.start) / length;
          if (u > 1.35 && flags.current.transformLoop) { state.start = t; u = 0; }
          const pose = transformAt(extras.animation.transform, u);
          const finished = u >= 1 && !flags.current.transformLoop;
          applyNode(root, [0, 0, 0], finished ? identity() : pose.root);
          applyNode(tipGroup, tipBase, finished ? identity() : pose.tip);
          if (finished) state.start = -1; else active = true;
        }
      }
      if (particles) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const state = particleAt(effect.id, i, t, box, speed);
          const strength = state ? Math.max(0, Math.min(1, state.alpha)) * (.65 + .35 * state.size) : 0;
          positions[i * 3] = state?.x ?? 0; positions[i * 3 + 1] = state?.y ?? -100; positions[i * 3 + 2] = state?.z ?? 0;
          colors[i * 3] = effect.color[0] * strength; colors[i * 3 + 1] = effect.color[1] * strength; colors[i * 3 + 2] = effect.color[2] * strength;
        }
        particleGeometry.attributes.position.needsUpdate = true; particleGeometry.attributes.color.needsUpdate = true;
        active = true;
      }
      if (shimmerFrames) {
        const index = Math.floor(t / .15) % shimmerFrames.length;
        if (index !== lastShimmer) { lastShimmer = index; texture.image = shimmerFrames[index]; texture.needsUpdate = true; }
        active = true;
      }
      return active;
    };
    update();

    liveRef.current = { controls, camera, materials: [material, glowMaterial, ...tintedMaterials.values()], grid, focus, restDistance, invalidate, select };
    onReady({
      snapshot: () => { renderer.render(scene, camera); return renderer.domElement.toDataURL("image/png"); },
      reset: () => { camera.position.copy(originalPosition); controls.target.copy(focus); controls.update(); },
      zoom: direction => { camera.position.sub(controls.target).multiplyScalar(direction > 0 ? .85 : 1.15).add(controls.target); controls.update(); },
    });
    const resize = () => {
      const width = container.clientWidth, height = container.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height); invalidate();
    };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    let frame = 0, last = performance.now();
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const now = performance.now(), delta = Math.min(.1, (now - last) / 1000); last = now;
      if (document.hidden) return;
      if (flags.current.playing) clock.current.t += delta;
      // Keep updating while playing, or once to apply a pending transform restart.
      const moving = (flags.current.playing || clip.current.pending) ? update() : false;
      controls.update();
      if (needsRender || flags.current.autoRotate || moving) { renderer.render(scene, camera); needsRender = false; }
    };
    animate();
    return () => {
      savedCamera.current = { position: camera.position.clone(), target: controls.target.clone(), fitDistance: restDistance };
      cancelAnimationFrame(frame); observer.disconnect(); controls.removeEventListener("change", invalidate); controls.dispose(); liveRef.current = null;
      scene.traverse(object => { if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) object.geometry.dispose(); });
      [material, glowMaterial, ...gridMaterials, ground.material, floorGlow.material, particleMaterial, outlineMaterial, ...tintedMaterials.values()].forEach(m => m.dispose());
      disposed = true;
      if (importedImage) { importedImage.onload = null; importedImage.onerror = null; }
      renderer.domElement.removeEventListener("pointerdown", pointerDown); renderer.domElement.removeEventListener("pointerup", pointerUp);
      for (const texture of tintTextures.values()) texture.dispose();
      particleGeometry.dispose(); spriteTexture.dispose();
      texture.dispose(); floorGlowTexture.dispose(); importedImage = null;
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [model, onReady]);

  useEffect(() => { liveRef.current?.select(selectedDecorId); }, [selectedDecorId]);
  useEffect(() => { if (liveRef.current) { liveRef.current.controls.autoRotate = autoRotate; liveRef.current.invalidate(); } }, [autoRotate]);
  useEffect(() => { liveRef.current?.materials.forEach(material => { material.wireframe = wireframe; }); liveRef.current?.invalidate(); }, [wireframe]);
  useEffect(() => { if (liveRef.current) { liveRef.current.grid.visible = showGrid; liveRef.current.invalidate(); } }, [showGrid]);
  useEffect(() => {
    const live = liveRef.current;
    if (!live) return;
    const distance = live.restDistance;
    const offset = view === "front" ? new THREE.Vector3(0, 0, distance) : view === "top" ? new THREE.Vector3(0, distance, .01) : view === "right" ? new THREE.Vector3(distance, 0, 0) : new THREE.Vector3(19, 13, 30).normalize().multiplyScalar(distance);
    live.camera.position.copy(offset.add(live.focus));
    live.controls.target.copy(live.focus); live.controls.update();
    savedCamera.current = { position: live.camera.position.clone(), target: live.controls.target.clone(), fitDistance: live.restDistance };
  }, [view]);

  return <div ref={containerRef} className="three-container">
    {fallback && <div className="viewer-fallback"><ModelThumbnail model={model} /><span>静的プレビュー · 3D表示にはWebGLが必要です</span></div>}
  </div>;
}
