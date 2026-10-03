"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { GeneratedModel, GroupName, VoxelPart } from "@/lib/generator";
import { buildTextureCanvas } from "@/lib/bbmodel";
import { generateModeOverlay } from "@/lib/generator";
import type { ActionKind, ModelSpec, ModeKind, ParticleKind } from "@/lib/spec";

const ALL_GROUPS: GroupName[] = ["root", "blade", "head", "floating", "particles", "wings", "aura", "trail", "mode", "phantom", "circle"];

// Particle system configuration per ParticleKind
const PARTICLE_CONFIG: Record<ParticleKind, { count: number; size: number; color1: string; color2: string; speed: number; spread: number; drift: "up" | "down" | "orbit" | "radial" }> = {
  none:    { count: 0,   size: 0,   color1: "#000000", color2: "#000000", speed: 0,   spread: 0,   drift: "up" },
  embers:  { count: 70, size: 0.9, color1: "#ff7a20", color2: "#ffcc44", speed: 1.8, spread: 18,  drift: "up" },
  snow:    { count: 90, size: 0.7, color1: "#c8eeff", color2: "#ffffff", speed: 0.6, spread: 22,  drift: "down" },
  sparks:  { count: 70, size: 0.7, color1: "#ffe94f", color2: "#fff6b0", speed: 2.4, spread: 14,  drift: "radial" },
  runes:   { count: 60,  size: 1.1, color1: "#c08aff", color2: "#ff8aff", speed: 0.4, spread: 16,  drift: "orbit" },
  petals:  { count: 90,  size: 0.8, color1: "#ff90c0", color2: "#ffd0e8", speed: 0.7, spread: 20,  drift: "down" },
  bubbles: { count: 80,  size: 1.0, color1: "#5cc8ff", color2: "#b3f0ff", speed: 1.0, spread: 16,  drift: "up" },
  dust:    { count: 110, size: 0.5, color1: "#c8b898", color2: "#e8d8b8", speed: 0.35, spread: 20, drift: "down" },
  souls:   { count: 70,  size: 1.2, color1: "#90c0ff", color2: "#d0e8ff", speed: 0.8, spread: 18,  drift: "orbit" },
  slime:   { count: 75,  size: 1.0, color1: "#60d030", color2: "#a0f060", speed: 0.65, spread: 16, drift: "down" },
  smoke:   { count: 85,  size: 1.3, color1: "#6a6a70", color2: "#a0a0a8", speed: 0.9, spread: 17,  drift: "up" },
  stardust:{ count: 90, size: 0.65, color1: "#ffe8a0", color2: "#fff8d0", speed: 0.55, spread: 22, drift: "radial" },
  blood:   { count: 70, size: 0.85, color1: "#ff2040", color2: "#8a1018", speed: 1.4, spread: 16, drift: "down" },
  oil:     { count: 55, size: 0.9, color1: "#3a3a20", color2: "#6a6a30", speed: 0.5, spread: 14, drift: "down" },
  glyphs:  { count: 50, size: 1.1, color1: "#80ffd0", color2: "#c0ffe8", speed: 0.45, spread: 18, drift: "orbit" },
  shrapnel:{ count: 80, size: 0.7, color1: "#c0c0c8", color2: "#ffe080", speed: 2.2, spread: 16, drift: "radial" },
};

interface ViewerProps {
  model: GeneratedModel;
  spec: ModelSpec;
  mode: ModeKind;
  action: { type: ActionKind; nonce: number } | null;
}

interface ParticleSystem {
  points: THREE.Points;
  positions: Float32Array;
  velocities: Float32Array;
  basePositions: Float32Array;
  count: number;
  drift: string;
  speed: number;
  spread: number;
}

export default function Viewer({ model, spec, mode, action }: ViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const specRef = useRef(spec);
  specRef.current = spec;
  const actionRef = useRef<{ type: ActionKind; t0: number } | null>(null);
  useEffect(() => {
    if (action) actionRef.current = { type: action.type, t0: performance.now() };
  }, [action]);

  const stateRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    root: THREE.Group;
    groups: Map<string, THREE.Group>;
    atlas: THREE.CanvasTexture | null;
    clock: THREE.Clock;
    glowLight: THREE.PointLight;
    ambientParticles: ParticleSystem | null;
    raf: number;
    ro: ResizeObserver;
    lastType: string;
  } | null>(null);

  // --- scene init (once) ------------------------------------------------------
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0c1016, 0.004);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;

    // Lighting
    scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x1a2030, 0.9));
    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(30, 50, 25);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    scene.add(dir);
    const rim = new THREE.DirectionalLight(0x88aaff, 0.5);
    rim.position.set(-25, 10, -30);
    scene.add(rim);
    const glowLight = new THREE.PointLight(0xffffff, 30, 200);
    glowLight.position.set(0, 20, 40);
    scene.add(glowLight);

    const grid = new THREE.GridHelper(160, 32, 0x2c3a52, 0x1a2333);
    grid.position.y = -40;
    scene.add(grid);

    const root = new THREE.Group();
    scene.add(root);

    const clock = new THREE.Clock();
    let ambientParticles: ParticleSystem | null = null;

    // --- ambient particle system builder -----------------------------------
    const rebuildParticles = (cfg: typeof PARTICLE_CONFIG[ParticleKind]) => {
      if (ambientParticles) {
        scene.remove(ambientParticles.points);
        ambientParticles.points.geometry.dispose();
        (ambientParticles.points.material as THREE.PointsMaterial).dispose();
        ambientParticles = null;
      }
      if (cfg.count === 0) return;
      const n = cfg.count;
      const positions = new Float32Array(n * 3);
      const basePositions = new Float32Array(n * 3);
      const velocities = new Float32Array(n * 3);
      const s = cfg.spread;
      for (let i = 0; i < n; i++) {
        const x = (Math.random() - 0.5) * s * 2;
        const y = (Math.random() - 0.5) * s * 2;
        const z = (Math.random() - 0.5) * s * 2;
        positions.set([x, y, z], i * 3);
        basePositions.set([x, y, z], i * 3);
        velocities.set([(Math.random() - 0.5) * cfg.speed * 0.01, (Math.random() - 0.5) * cfg.speed * 0.01, (Math.random() - 0.5) * cfg.speed * 0.01], i * 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        size: cfg.size,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        sizeAttenuation: true,
      });
      // vertex colors: two-color gradient
      const colors = new Float32Array(n * 3);
      const c1 = new THREE.Color(cfg.color1);
      const c2 = new THREE.Color(cfg.color2);
      for (let i = 0; i < n; i++) {
        const t = Math.random();
        const c = c1.clone().lerp(c2, t);
        colors.set([c.r, c.g, c.b], i * 3);
      }
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      ambientParticles = {
        points, positions, velocities, basePositions,
        count: n, drift: cfg.drift, speed: cfg.speed, spread: cfg.spread,
      };
    };

    // --- render loop ---------------------------------------------------------
    const loop = () => {
      const st = stateRef.current;
      if (!st) return;
      const dt = st.clock.getDelta();
      const t = st.clock.elapsedTime;
      st.controls.update();

      const g = st.groups;
      const anim = specRef.current.animation;
      const floating = g.get("floating");
      const particles = g.get("particles");
      const blade = g.get("blade");
      const head = g.get("head");
      const wings = g.get("wings");
      const aura = g.get("aura");
      const trail = g.get("trail");
      const phantom = g.get("phantom");
      const circle = g.get("circle");

      if (floating) {
        if (anim === "spin") floating.rotation.y += dt * 1.6;
        if (anim === "bob") floating.position.y = Math.sin(t * 2.2) * 1.4;
        if (anim === "pulse") { floating.scale.setScalar(1 + Math.sin(t * 3) * 0.16); floating.rotation.y += dt * 0.8; }
        if (anim === "sway") floating.rotation.z = Math.sin(t * 1.6) * 0.06;
        if (anim === "breathe") { floating.scale.setScalar(1 + Math.sin(t * 1.5) * 0.06); floating.position.y = Math.sin(t * 1.2); }
        if (anim === "thrum") floating.scale.setScalar(1 + Math.sin(t * 12) * 0.03);
        if (anim === "orbit") floating.rotation.y += dt * 2.4;
        if (anim === "flicker") floating.scale.setScalar(0.85 + Math.abs(Math.sin(t * 18)) * 0.3);
        if (anim === "whirl") { floating.rotation.y += dt * 4; floating.position.y = Math.sin(t * 6) * 0.6; }
      }
      if (particles) {
        if (anim === "spin") particles.rotation.y -= dt * 0.9;
        if (anim === "bob") particles.position.y = Math.sin(t * 1.4 + 1) * 1.8;
        if (anim === "pulse") particles.scale.setScalar(1 + Math.sin(t * 3 + 0.5) * 0.12);
        if (anim === "breathe") particles.scale.setScalar(1 + Math.sin(t * 1.8) * 0.08);
        if (anim === "thrum") particles.scale.setScalar(1 + Math.sin(t * 10) * 0.04);
      }
      if (blade && (anim === "sway" || anim === "bob")) blade.rotation.z = Math.sin(t * 1.8) * (anim === "sway" ? 0.07 : 0.03);
      if (blade && anim === "slash") blade.rotation.z = Math.sin(t * 8) * 0.18;
      if (blade && anim === "whirl") blade.rotation.y += dt * 3.2;
      if (head && anim === "sway") head.rotation.z = Math.sin(t * 1.5) * 0.05;
      if (wings && anim === "sway") wings.rotation.y = Math.sin(t * 2.2) * 0.25;
      if (wings && anim === "whirl") wings.rotation.y += dt * 2.5;
      if (aura) {
        aura.rotation.y += dt * 0.25;
        if (anim === "pulse" || anim === "breathe") aura.scale.setScalar(1 + Math.sin(t * 2) * 0.06);
      }
      if (trail) {
        trail.rotation.y -= dt * 0.4;
        if (anim === "bob") trail.position.y = Math.sin(t * 1.6 + 0.8) * 0.8;
      }
      if (phantom) {
        phantom.rotation.y += dt * 0.35;
        if (anim === "bob") phantom.position.y = Math.sin(t * 1.2 + 1.2) * 1.2;
        if (anim === "breathe") phantom.scale.setScalar(1 + Math.sin(t * 1.5 + 1) * 0.08);
        if (anim === "orbit") phantom.rotation.y += dt * 1.2;
      }
      if (circle) {
        circle.rotation.y += dt * (anim === "whirl" ? 2.8 : 0.7);
        if (anim === "flicker") circle.scale.setScalar(0.9 + Math.abs(Math.sin(t * 10)) * 0.2);
      }

      // action animation (attack / cast)
      const act = actionRef.current;
      if (act) {
        const el = (performance.now() - act.t0) / 1000;
        if (el > 2.2) {
          actionRef.current = null;
        } else if (act.type === "attack") {
          let z = 0;
          if (el < 0.3) z = (-55 * el) / 0.3;
          else if (el < 0.55) z = -55 + (115 * (el - 0.3)) / 0.25;
          else if (el < 1.2) z = 60 * (1 - (el - 0.55) / 0.65);
          st.root.rotation.z = (z * Math.PI) / 180;
          const burst = Math.sin(Math.min(el / 0.55, 1) * Math.PI);
          if (floating) floating.position.y += burst * 3;
          if (particles) particles.scale.multiplyScalar(1 + burst * 0.4);
          if (aura) aura.scale.multiplyScalar(1 + burst * 0.5);
          if (phantom) phantom.scale.multiplyScalar(1 + burst * 0.3);
          st.glowLight.intensity = 40 + burst * 90;
        } else {
          let fy = 0, fs = 1, ps = 1;
          if (el < 0.5) { const p = el / 0.5; fy = p * 4; fs = 1 - 0.4 * p; ps = 1 - 0.5 * p; }
          else if (el < 0.75) { const p = (el - 0.5) / 0.25; fy = 4 + p * 3; fs = 0.6 + 1.4 * p; ps = 0.5 + 1.8 * p; }
          else if (el < 1.6) { const p = (el - 0.75) / 0.85; fy = 7 * (1 - p); fs = 2 - p; ps = 2.3 - 1.3 * p; }
          st.root.rotation.z = (10 * Math.sin(Math.min(el / 1.6, 1) * Math.PI) * Math.PI) / 180;
          if (floating) { floating.position.y += fy; floating.scale.multiplyScalar(fs); }
          if (particles) particles.scale.multiplyScalar(ps);
          if (aura) aura.scale.multiplyScalar(1 + 0.8 * Math.sin(Math.min(el / 0.75, 1) * Math.PI));
          st.glowLight.intensity = 40 + 120 * Math.sin(Math.min(Math.max(el - 0.35, 0) / 0.4, 1) * Math.PI);
        }
      }

      st.glowLight.intensity = Math.max(st.glowLight.intensity, 20 + specRef.current.glowIntensity * 40 + Math.sin(t * 2.5) * 8);

      // update ambient particles
      const ap = ambientParticles;
      if (ap) {
        const pos = ap.points.geometry.getAttribute("position") as THREE.BufferAttribute;
        const arr = pos.array as Float32Array;
        for (let i = 0; i < ap.count; i++) {
          const i3 = i * 3;
          if (ap.drift === "up") {
            arr[i3 + 1] += ap.speed * 0.012 * (1 + Math.sin(t + i) * 0.3);
            if (arr[i3 + 1] > ap.spread) arr[i3 + 1] = -ap.spread;
            arr[i3] += Math.sin(t * 0.5 + i * 0.1) * 0.008;
          } else if (ap.drift === "down") {
            arr[i3 + 1] -= ap.speed * 0.01;
            if (arr[i3 + 1] < -ap.spread) arr[i3 + 1] = ap.spread;
            arr[i3] += Math.sin(t * 0.3 + i * 0.15) * 0.012;
          } else if (ap.drift === "orbit") {
            const ang = t * 0.35 + i * 0.2;
            const r = ap.spread * (0.7 + Math.sin(i * 0.5) * 0.3);
            arr[i3] = Math.cos(ang) * r;
            arr[i3 + 2] = Math.sin(ang) * r;
            arr[i3 + 1] = Math.sin(t * 0.7 + i * 0.3) * ap.spread * 0.4;
          } else if (ap.drift === "radial") {
            const d = Math.sqrt(arr[i3] ** 2 + arr[i3 + 1] ** 2 + arr[i3 + 2] ** 2) + 0.001;
            arr[i3] += (arr[i3] / d) * ap.speed * 0.015;
            arr[i3 + 1] += (arr[i3 + 1] / d) * ap.speed * 0.015;
            arr[i3 + 2] += (arr[i3 + 2] / d) * ap.speed * 0.015;
            if (d > ap.spread * 1.2) {
              arr[i3] = (Math.random() - 0.5) * 2;
              arr[i3 + 1] = (Math.random() - 0.5) * 2;
              arr[i3 + 2] = (Math.random() - 0.5) * 2;
            }
          }
        }
        pos.needsUpdate = true;
        (ap.points.material as THREE.PointsMaterial).opacity = 0.55 + Math.sin(t * 1.5) * 0.15;
      }

      st.renderer.render(st.scene, st.camera);
      st.raf = requestAnimationFrame(loop);
    };

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);
    onResize();

    stateRef.current = { scene, camera, renderer, controls, root, groups: new Map(), atlas: null, clock, glowLight, ambientParticles, raf: 0, ro, lastType: "" };
    stateRef.current.raf = requestAnimationFrame(loop);

    // expose rebuild for external use
    (stateRef.current as Record<string, unknown>).__rebuildParticles = rebuildParticles;

    return () => {
      const st = stateRef.current;
      if (!st) return;
      cancelAnimationFrame(st.raf);
      st.ro.disconnect();
      st.controls.dispose();
      st.renderer.dispose();
      mount.removeChild(st.renderer.domElement);
      st.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => { const mm = m as THREE.MeshStandardMaterial; mm.map?.dispose(); mm.emissiveMap?.dispose(); mm.dispose(); });
        }
      });
      stateRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // rebuild geometry + particles when model/spec/mode changes
  useEffect(() => {
    const st = stateRef.current;
    if (!st) return;
    const { root, groups } = st;

    root.clear();
    groups.clear();
    st.atlas?.dispose();

    const canvas = buildTextureCanvas(spec, model.palette);
    const atlas = new THREE.CanvasTexture(canvas);
    atlas.magFilter = THREE.NearestFilter;
    atlas.minFilter = THREE.NearestFilter;
    atlas.generateMipmaps = false;
    st.atlas = atlas;

    const groupObjs = new Map<string, THREE.Group>();
    for (const name of ALL_GROUPS) {
      const g = new THREE.Group();
      g.name = name;
      groupObjs.set(name, g);
      root.add(g);
    }

    const allParts: VoxelPart[] = [...model.parts, ...generateModeOverlay(spec, mode, model.parts)];
    const emissiveBoost = mode === "charge" ? 1.7 : mode === "focus" ? 1.35 : 1;
    const geoCache = new Map<string, THREE.BoxGeometry>();
    const matCache = new Map<string, THREE.MeshStandardMaterial>();

    const materialFor = (part: VoxelPart): THREE.MeshStandardMaterial => {
      const style = part.group === "phantom" ? "phantom" : part.group === "aura" || part.group === "trail" || part.group === "circle" ? "fx" : part.emissive ? "emi" : "std";
      const key = `${part.tile}:${style}`;
      const cached = matCache.get(key);
      if (cached) return cached;
      const color = model.palette[part.tile] ?? "#ffffff";
      const map = atlas.clone();
      map.repeat.set(1 / model.palette.length, 1);
      map.offset.set(part.tile / model.palette.length, 0);
      const mat = new THREE.MeshStandardMaterial({
        map,
        color: 0xffffff,
        roughness: style === "std" ? 0.85 : 0.45,
        metalness: 0.08,
      });
      if (part.emissive || style !== "std") {
        mat.emissive = new THREE.Color(color);
        mat.emissiveMap = map;
        mat.emissiveIntensity = (0.55 + spec.glowIntensity * 1.1) * emissiveBoost;
      }
      if (style === "fx") {
        mat.transparent = true;
        mat.opacity = 0.55;
        mat.emissiveIntensity = (1.2 + spec.glowIntensity * 1.5) * emissiveBoost;
      }
      if (style === "phantom") {
        mat.transparent = true;
        mat.opacity = 0.18;
        mat.emissiveIntensity = 1.8 + spec.glowIntensity * 1.2;
        mat.depthWrite = false;
      }
      matCache.set(key, mat);
      return mat;
    };

    for (const part of allParts) {
      const [x0, y0, z0] = part.from;
      const [x1, y1, z1] = part.to;
      const key = `${(x1 - x0).toFixed(2)},${(y1 - y0).toFixed(2)},${(z1 - z0).toFixed(2)}`;
      let geo = geoCache.get(key);
      if (!geo) { geo = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); geoCache.set(key, geo); }
      const mesh = new THREE.Mesh(geo, materialFor(part));
      mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      groupObjs.get(part.group)?.add(mesh);
    }

    // rebuild ambient particles for current particle kind
    const rebuildFn = (st as Record<string, unknown>).__rebuildParticles as ((c: typeof PARTICLE_CONFIG[ParticleKind]) => void) | undefined;
    if (rebuildFn) rebuildFn(PARTICLE_CONFIG[spec.particles] ?? PARTICLE_CONFIG.none);

    // frame camera (only re-home when the weapon type changes)
    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    root.position.y = -center.y;
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z, model.radius);
    if (st.lastType !== spec.type) {
      st.camera.position.set(radius * 1.05, radius * 0.55, radius * 1.35);
      st.controls.target.set(0, 0, 0);
      st.controls.update();
      st.lastType = spec.type;
    }

    const grid = st.scene.children.find((c) => c instanceof THREE.GridHelper) as THREE.GridHelper | undefined;
    if (grid) grid.position.y = -size.y / 2 - root.position.y - 4;

    st.glowLight.color = new THREE.Color(spec.glowColor);
    groups.clear();
    groupObjs.forEach((g, k) => groups.set(k, g));
  }, [model, spec, mode]);

  return <div ref={mountRef} className="absolute inset-0" />;
}