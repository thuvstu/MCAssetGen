"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { Pix } from "@/lib/pixel/core";
import type { RenderResult } from "@/lib/pixel/generator";
import type { MCElement, ModelSettings } from "@/lib/pixel/model3d";
import { pixToCanvas } from "@/lib/pixel/export";
import { buildBoxGeometry, buildHeightField, disposeGroup, previewGlowColor } from "@/lib/three/weaponGeometry";
import { buildWeaponGroup, createWeaponMaterials, disposeWeaponMaterials, type WeaponMaterials } from "@/lib/three/weaponMesh";

export type PreviewView = "iso" | "front" | "side" | "top" | "hand";
export type PreviewQuality = "sculpt" | "boxes";
export type PreviewOpts = {
  autoRotate: boolean;
  wireframe: boolean;
  bloom: boolean;
  particles: boolean;
  view: PreviewView;
  quality: PreviewQuality;
  studio: boolean;
};

type V3 = [number, number, number];
type SceneState = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  composer: EffectComposer;
  bloom: UnrealBloomPass;
  asset: THREE.Group;
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
  materials: WeaponMaterials;
  particles: THREE.Points | null;
  animationId: number;
  beganAt: number;
};

const VIEWS: Record<PreviewView, { position: V3; target: V3 }> = {
  iso: { position: [24, 15, 27], target: [8, 8, 8] },
  front: { position: [8, 8, 34], target: [8, 8, 8] },
  side: { position: [34, 8, 8], target: [8, 8, 8] },
  top: { position: [8, 34, 8.1], target: [8, 8, 8] },
  hand: { position: [17, 5, 21], target: [8, 7, 8] },
};

function makeParticles(color: THREE.Color): THREE.Points {
  const count = 90;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = 8 + (Math.random() - 0.5) * 17;
    positions[i * 3 + 1] = 3 + Math.random() * 15;
    positions[i * 3 + 2] = 8 + (Math.random() - 0.5) * 17;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color, size: 0.17, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  return new THREE.Points(geometry, material);
}

function disposeParticles(points: THREE.Points | null) {
  if (!points) return;
  points.geometry.dispose();
  const material = points.material;
  if (Array.isArray(material)) material.forEach((m) => m.dispose()); else material.dispose();
}

export default function Preview3D({
  frames, frameIndex, elements, opts, model, render, depth,
}: {
  frames: Pix[];
  frameIndex: number;
  elements: MCElement[];
  opts: PreviewOpts;
  model: ModelSettings;
  render: RenderResult | null;
  depth: Float32Array;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const state = useRef<SceneState | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // ---- renderer / scene bootstrap ----
  useEffect(() => {
    const host = mount.current;
    if (!host || !frames.length) return;
    const width = host.clientWidth || 300, height = host.clientHeight || 200;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1018);
    scene.fog = new THREE.FogExp2(0x0b0b12, 0.011);
    try {
      // Image-based lighting gives metals and gems believable reflections.
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch {
      scene.environment = null;
    }

    const camera = new THREE.PerspectiveCamera(38, Math.max(0.1, width / height), 0.1, 400);
    camera.position.set(...VIEWS.iso.position);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...VIEWS.iso.target);
    controls.enableDamping = true;
    controls.autoRotateSpeed = 2.2;
    controls.minDistance = 6;
    controls.maxDistance = 90;

    scene.add(new THREE.AmbientLight(0xb8c4e0, 0.35));
    const key = new THREE.DirectionalLight(0xfff4e8, 2.1);
    key.position.set(-11, 21, 17);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 70;
    key.shadow.bias = -0.0012;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x88aaff, 0.6);
    fill.position.set(17, 6, 8);
    const rim = new THREE.DirectionalLight(0xffc8a0, 0.85);
    rim.position.set(4, 9, -15);
    scene.add(fill, rim, new THREE.HemisphereLight(0x9eb8ff, 0x1a1210, 0.3));

    const grid = new THREE.GridHelper(32, 16, 0x3b4a6a, 0x1a2233);
    grid.position.set(8, 0, 8);
    scene.add(grid);
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(19, 56),
      new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.82, metalness: 0.25 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(8, -0.02, 8);
    floor.receiveShadow = true;
    scene.add(floor);

    const canvas = pixToCanvas(frames[0]);
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    const materials = createWeaponMaterials(texture, previewGlowColor(render));

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.42, 0.62, 0.5);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    const sceneState: SceneState = {
      renderer, scene, camera, controls, composer, bloom,
      asset: new THREE.Group(), canvas, texture, materials,
      particles: null, animationId: 0, beganAt: performance.now(),
    };
    scene.add(sceneState.asset);
    state.current = sceneState;

    const animate = (now: number) => {
      sceneState.animationId = requestAnimationFrame(animate);
      const live = optsRef.current;
      sceneState.controls.autoRotate = live.autoRotate;
      sceneState.bloom.strength = live.bloom ? 0.45 : 0;
      sceneState.controls.update();
      if (sceneState.particles) {
        const elapsed = (now - sceneState.beganAt) / 1000;
        sceneState.particles.rotation.y = elapsed * 0.16;
        const positions = sceneState.particles.geometry.getAttribute("position") as THREE.BufferAttribute;
        for (let i = 0; i < positions.count; i++) {
          const y = positions.getY(i) + 0.012 + (i % 5) * 0.004;
          positions.setY(i, y > 19 ? 3 : y);
        }
        positions.needsUpdate = true;
      }
      if (live.bloom) sceneState.composer.render(); else sceneState.renderer.render(sceneState.scene, sceneState.camera);
    };
    animate(performance.now());

    const observer = new ResizeObserver(() => {
      if (!host.clientWidth || !host.clientHeight) return;
      renderer.setSize(host.clientWidth, host.clientHeight);
      composer.setSize(host.clientWidth, host.clientHeight);
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
    });
    observer.observe(host);

    return () => {
      cancelAnimationFrame(sceneState.animationId);
      observer.disconnect();
      disposeGroup(sceneState.asset);
      disposeParticles(sceneState.particles);
      disposeWeaponMaterials(sceneState.materials);
      sceneState.texture.dispose();
      controls.dispose();
      composer.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
      state.current = null;
    };
    // Rebuilding the whole WebGL context is expensive; frame data is applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- camera presets ----
  useEffect(() => {
    const s = state.current;
    if (!s) return;
    const view = VIEWS[opts.view];
    s.camera.position.set(...view.position);
    s.controls.target.set(...view.target);
    s.controls.update();
  }, [opts.view]);

  useEffect(() => {
    const s = state.current;
    if (!s) return;
    s.scene.background = new THREE.Color(opts.studio ? 0x0e1018 : 0x08080d);
  }, [opts.studio]);

  // ---- animated texture upload (geometry stays untouched) ----
  useEffect(() => {
    const s = state.current;
    if (!s || !frames.length) return;
    const frame = frames[Math.min(frameIndex, frames.length - 1)];
    if (frame.w !== s.canvas.width || frame.h !== s.canvas.height) {
      const next = pixToCanvas(frame);
      s.canvas.width = next.width;
      s.canvas.height = next.height;
      s.canvas.getContext("2d")?.drawImage(next, 0, 0);
    } else {
      const ctx = s.canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, s.canvas.width, s.canvas.height);
        ctx.drawImage(pixToCanvas(frame), 0, 0);
      }
    }
    s.texture.needsUpdate = true;
    const glow = previewGlowColor(render);
    const gem = s.materials.gem as THREE.MeshPhysicalMaterial;
    const glowMat = s.materials.glow as THREE.MeshStandardMaterial;
    gem.emissive = glow;
    glowMat.emissive = glow;
  }, [frameIndex, frames, render]);

  // ---- geometry rebuild ----
  useEffect(() => {
    const s = state.current;
    if (!s || !frames.length) return;
    s.scene.remove(s.asset);
    disposeGroup(s.asset);
    const asset = new THREE.Group();
    const base = frames[0];
    const useParts = model.reconstruct !== "extrude" && !!render && render.pix.w === base.w;

    if (opts.quality === "sculpt" && useParts && render) {
      asset.add(buildWeaponGroup(render, model, s.materials));
    } else if (opts.quality === "sculpt") {
      asset.add(new THREE.Mesh(buildHeightField(base, depth, model), s.materials.metal));
    } else {
      asset.add(new THREE.Mesh(buildBoxGeometry(elements), s.materials.blade));
    }
    asset.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const material = object.material;
      if (Array.isArray(material)) material.forEach((m) => { m.wireframe = opts.wireframe; });
      else material.wireframe = opts.wireframe;
    });
    s.scene.add(asset);
    s.asset = asset;

    if (s.particles) {
      s.scene.remove(s.particles);
      disposeParticles(s.particles);
      s.particles = null;
    }
    if (opts.particles) {
      s.particles = makeParticles(previewGlowColor(render));
      s.scene.add(s.particles);
    }
  }, [depth, elements, frames, model, opts.particles, opts.quality, opts.wireframe, render]);

  return <div ref={mount} className="w-full h-full min-h-[200px] cursor-grab active:cursor-grabbing" />;
}
