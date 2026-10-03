"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AnimationMode, GeneratedModel } from "@/lib/types";
import { CATEGORIES } from "@/lib/themes";
import {
  Camera as CameraIcon,
  Crosshair,
  Grid3x3,
  Box as BoxIcon,
  Sparkles,
  SunMedium,
} from "lucide-react";

export type CameraPreset = "free" | "gui" | "first" | "third";

interface Props {
  model: GeneratedModel;
  className?: string;
  onSnapshot?: (dataUrl: string) => void;
  onTriggerAnim?: (anim: AnimationMode) => void;
}

/**
 * Forge viewport with articulated multi-bone hierarchy (BladeL, BladeR, Core,
 * Seal, Funnel, Halo, Astral, ModeVFX, Floating), procedural combat slash
 * trails, magic circles, shockwaves, and instrument-grade caliper rulers.
 */
export function Viewport3D({ model, className = "", onSnapshot, onTriggerAnim }: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  const [grid, setGrid] = useState(true);
  const [lighting, setLighting] = useState(true);
  const [wire, setWire] = useState(false);
  const [particles, setParticles] = useState(true);
  const [preset, setPreset] = useState<CameraPreset>("free");
  const [frameToken, setFrameToken] = useState(0);
  const [glError, setGlError] = useState(false);

  const scene = useRef<THREE.Scene | null>(null);
  const renderer = useRef<THREE.WebGLRenderer | null>(null);
  const camera = useRef<THREE.PerspectiveCamera | null>(null);

  const rootGroup = useRef<THREE.Group | null>(null);
  const bodyGroup = useRef<THREE.Group | null>(null);
  const bladeLGroup = useRef<THREE.Group | null>(null);
  const bladeRGroup = useRef<THREE.Group | null>(null);
  const coreGroup = useRef<THREE.Group | null>(null);
  const sealGroup = useRef<THREE.Group | null>(null);
  const funnelGroup = useRef<THREE.Group | null>(null);
  const haloGroup = useRef<THREE.Group | null>(null);
  const astralGroup = useRef<THREE.Group | null>(null);
  const modeVfxGroup = useRef<THREE.Group | null>(null);
  const floatGroup = useRef<THREE.Group | null>(null);
  // --- mechanical / modern bones ---
  const chainGroup = useRef<THREE.Group | null>(null);
  const gearGroup = useRef<THREE.Group | null>(null);
  const pistonGroup = useRef<THREE.Group | null>(null);
  const breechGroup = useRef<THREE.Group | null>(null);
  const magazineGroup = useRef<THREE.Group | null>(null);
  const muzzleGroup = useRef<THREE.Group | null>(null);
  const railGroup = useRef<THREE.Group | null>(null);
  const bannerGroup = useRef<THREE.Group | null>(null);

  const slashTrailMesh = useRef<THREE.Mesh | null>(null);
  const groundCircleGroup = useRef<THREE.Group | null>(null);
  const castBeamMesh = useRef<THREE.Mesh | null>(null);
  const shockwaveMesh = useRef<THREE.Mesh | null>(null);

  const pSystem = useRef<THREE.Points | null>(null);
  const gridHelper = useRef<THREE.GridHelper | null>(null);
  const rimLight = useRef<THREE.PointLight | null>(null);
  const keyLight = useRef<THREE.DirectionalLight | null>(null);
  const prevMats = useRef<THREE.Material[]>([]);

  const orbit = useRef({ theta: 0.72, phi: 1.05, radius: 34 });
  const target = useRef(new THREE.Vector3(8, 12, 8));
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const presetRef = useRef<CameraPreset>("free");
  const modelRef = useRef(model);
  modelRef.current = model;

  /* ---------------- scene setup ---------------- */
  useEffect(() => {
    if (!holder.current || !canvas.current) return;
    const w = holder.current.clientWidth || 800;
    const h = holder.current.clientHeight || 520;

    const sc = new THREE.Scene();
    scene.current = sc;

    const cam = new THREE.PerspectiveCamera(42, w / h, 0.1, 600);
    camera.current = cam;

    let r: THREE.WebGLRenderer;
    try {
      r = new THREE.WebGLRenderer({
        canvas: canvas.current,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
    } catch {
      setGlError(true);
      return;
    }
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.setSize(w, h, false);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.current = r;

    sc.add(new THREE.AmbientLight(0xffffff, 0.58));

    const key = new THREE.DirectionalLight(0xfff0dd, 2.1);
    key.position.set(26, 42, 20);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -45;
    key.shadow.camera.right = 45;
    key.shadow.camera.top = 65;
    key.shadow.camera.bottom = -15;
    sc.add(key);
    keyLight.current = key;

    const fill = new THREE.DirectionalLight(0x8fb6ff, 0.72);
    fill.position.set(-30, 12, -24);
    sc.add(fill);

    const rim = new THREE.PointLight(0xe2622c, 3.2, 75, 2);
    rim.position.set(-6, 20, -8);
    sc.add(rim);
    rimLight.current = rim;

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(28, 48),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.55,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(8, 0.02, 8);
    sc.add(floor);

    const gHelper = new THREE.GridHelper(32, 32, 0x9be7ff, 0x1e3540);
    gHelper.position.set(8, 0.07, 8);
    (gHelper.material as THREE.Material).transparent = true;
    (gHelper.material as THREE.Material).opacity = 0.42;
    sc.add(gHelper);
    gridHelper.current = gHelper;

    const root = new THREE.Group();
    const body = new THREE.Group();
    const bladeL = new THREE.Group();
    const bladeR = new THREE.Group();
    const core = new THREE.Group();
    const seal = new THREE.Group();
    const funnel = new THREE.Group();
    const halo = new THREE.Group();
    const astral = new THREE.Group();
    const modeVfx = new THREE.Group();
    const floating = new THREE.Group();

    const chain = new THREE.Group();
    const gear = new THREE.Group();
    const piston = new THREE.Group();
    const breech = new THREE.Group();
    const magazine = new THREE.Group();
    const muzzle = new THREE.Group();
    const rail = new THREE.Group();
    const banner = new THREE.Group();

    root.add(body, bladeL, bladeR, core, seal, astral, modeVfx);
    root.add(chain, gear, piston, breech, magazine, muzzle, rail, banner);
    sc.add(root, funnel, halo, floating);

    rootGroup.current = root;
    bodyGroup.current = body;
    bladeLGroup.current = bladeL;
    bladeRGroup.current = bladeR;
    coreGroup.current = core;
    sealGroup.current = seal;
    funnelGroup.current = funnel;
    haloGroup.current = halo;
    astralGroup.current = astral;
    modeVfxGroup.current = modeVfx;
    floatGroup.current = floating;
    chainGroup.current = chain;
    gearGroup.current = gear;
    pistonGroup.current = piston;
    breechGroup.current = breech;
    magazineGroup.current = magazine;
    muzzleGroup.current = muzzle;
    railGroup.current = rail;
    bannerGroup.current = banner;

    // slash crescent
    const slashMesh = new THREE.Mesh(
      new THREE.RingGeometry(9, 17, 32, 1, 0, Math.PI * 1.15),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    slashMesh.position.set(8, 13, 8);
    sc.add(slashMesh);
    slashTrailMesh.current = slashMesh;

    // ground magic circle
    const mCircle = new THREE.Group();
    mCircle.position.set(8, 0.15, 8);
    const outerRing = new THREE.Mesh(
      new THREE.RingGeometry(11, 12.2, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    outerRing.rotation.x = -Math.PI / 2;
    const innerSquare = new THREE.Mesh(
      new THREE.RingGeometry(6.5, 7.4, 6),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    innerSquare.rotation.x = -Math.PI / 2;
    mCircle.add(outerRing, innerSquare);
    sc.add(mCircle);
    groundCircleGroup.current = mCircle;

    // magic cast beam
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 2.2, 34, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    beam.position.set(8, 22, 8);
    sc.add(beam);
    castBeamMesh.current = beam;

    // dimensional cleave shockwave
    const wave = new THREE.Mesh(
      new THREE.RingGeometry(2, 3.8, 36),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    wave.rotation.x = -Math.PI / 2;
    wave.position.set(8, 0.25, 8);
    sc.add(wave);
    shockwaveMesh.current = wave;

    const ro = new ResizeObserver(() => {
      if (!holder.current || !renderer.current || !camera.current) return;
      const cw = holder.current.clientWidth;
      const ch = holder.current.clientHeight;
      if (!cw || !ch) return;
      camera.current.aspect = cw / ch;
      camera.current.updateProjectionMatrix();
      renderer.current.setSize(cw, ch, false);
    });
    ro.observe(holder.current);

    let raf = 0;
    const clock = new THREE.Clock();
    const slashMat = slashMesh.material as THREE.MeshBasicMaterial;
    const beamMat = beam.material as THREE.MeshBasicMaterial;
    const waveMat = wave.material as THREE.MeshBasicMaterial;

    const resetSubBones = () => {
      root.position.set(0, 0, 0);
      root.rotation.set(0, 0, 0);
      root.scale.setScalar(1);
      bladeL.position.set(0, 0, 0);
      bladeR.position.set(0, 0, 0);
      core.position.set(0, 0, 0);
      core.rotation.set(0, 0, 0);
      core.scale.setScalar(1);
      seal.position.set(0, 0, 0);
      seal.scale.setScalar(1);
      funnel.position.set(0, 0, 0);
      funnel.rotation.set(0, 0, 0);
      astral.scale.setScalar(1);
      chain.position.set(0, 0, 0);
      gear.rotation.set(0, 0, 0);
      piston.position.set(0, 0, 0);
      piston.scale.setScalar(1);
      breech.position.set(0, 0, 0);
      magazine.position.set(0, 0, 0);
      magazine.rotation.set(0, 0, 0);
      muzzle.scale.setScalar(1);
      rail.scale.setScalar(1);
      banner.rotation.set(0, 0, 0);
      slashMat.opacity = 0;
      beamMat.opacity = 0;
      waveMat.opacity = 0;
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const t = clock.getElapsedTime();

      if (presetRef.current === "free" && camera.current) {
        const { theta, phi, radius } = orbit.current;
        const tg = target.current;
        camera.current.position.set(
          tg.x + radius * Math.sin(phi) * Math.sin(theta),
          tg.y + radius * Math.cos(phi),
          tg.z + radius * Math.sin(phi) * Math.cos(theta)
        );
        camera.current.lookAt(tg);
      }

      const activeModel = modelRef.current;
      const cfg = activeModel.config;
      const modeBoost =
        cfg.tacticalMode === "overdrive" ? 1.65 : cfg.tacticalMode === "thunder_clad" ? 1.45 : 1;
      const sp = (cfg.animationSpeed || 1) * modeBoost;
      const amp = cfg.floatAmplitude || 0.8;

      resetSubBones();

      const showCircle =
        cfg.animationMode === "magic_cast" ||
        cfg.animationMode === "limit_burst" ||
        cfg.tacticalMode !== "normal" ||
        cfg.limitBreak > 0;
      outerRing.material.opacity = showCircle ? 0.42 + Math.sin(t * 3) * 0.15 : 0;
      innerSquare.material.opacity = showCircle ? 0.35 + Math.cos(t * 3) * 0.12 : 0;
      mCircle.rotation.y = t * 0.65 * sp;
      innerSquare.rotation.z = -t * 1.1 * sp;

      halo.rotation.z = -t * 0.45 * sp;
      halo.position.y = Math.sin(t * 2 * sp) * 0.5 * amp;
      modeVfx.position.y = Math.sin(t * 4 * sp) * 0.35;

      if (cfg.animationEnabled && cfg.animationMode !== "off") {
        switch (cfg.animationMode) {
          case "idle_float": {
            root.position.y = Math.sin(t * 1.9 * sp) * 0.95 * amp;
            root.rotation.y = Math.sin(t * 0.7 * sp) * 0.14;
            root.rotation.z = Math.cos(t * 1.1 * sp) * 0.05;
            funnel.position.y = Math.sin(t * 2.2 * sp + 1) * 1.2 * amp;
            break;
          }
          case "orbit_spin": {
            root.position.y = Math.sin(t * 2 * sp) * 0.55 * amp;
            root.rotation.y = t * 1.1 * sp;
            funnel.rotation.y = -t * 0.8 * sp;
            break;
          }
          case "magic_pulse": {
            const p = 1 + Math.sin(t * 3.4 * sp) * 0.06 * amp;
            root.scale.setScalar(p);
            root.position.y = Math.sin(t * 1.6 * sp) * 0.75;
            core.scale.setScalar(1 + Math.sin(t * 6 * sp) * 0.18);
            astral.scale.setScalar(1 + Math.sin(t * 3.4 * sp) * 0.08);
            break;
          }
          case "combat_swing": {
            const cyc = (t * 2.6 * sp) % (Math.PI * 2);
            root.rotation.x = Math.sin(cyc) * 0.55;
            root.rotation.z = Math.cos(cyc) * 0.42;
            root.position.y = Math.sin(cyc) * 0.7;
            slashMesh.rotation.set(Math.PI / 3, cyc, cyc * 1.2);
            slashMat.opacity = Math.max(0, Math.sin(cyc) * 0.65);
            break;
          }
          case "combo_slash": {
            const period = 2.4;
            const phase = ((t * sp) % period) / period;
            if (phase < 0.32) {
              const u = phase / 0.32;
              const swing = Math.sin(u * Math.PI);
              root.rotation.x = -0.6 + u * 1.5;
              root.rotation.z = 0.7 - u * 1.4;
              root.position.y = swing * 1.5;
              slashMesh.rotation.set(0.8, u * 3, 0.6);
              slashMat.opacity = swing * 0.75;
            } else if (phase < 0.64) {
              const u = (phase - 0.32) / 0.32;
              const swing = Math.sin(u * Math.PI);
              root.rotation.x = 0.9 - u * 1.7;
              root.rotation.z = -0.7 + u * 1.5;
              root.position.y = swing * 2.0;
              slashMesh.rotation.set(-0.8, -u * 3.2, -0.5);
              slashMat.opacity = swing * 0.75;
            } else {
              const u = (phase - 0.64) / 0.36;
              const swing = Math.sin(u * Math.PI);
              root.rotation.y = u * Math.PI * 2;
              root.rotation.x = swing * 0.5;
              root.position.y = swing * 2.8;
              funnel.rotation.y = -u * Math.PI * 2;
              funnel.position.y = swing * 3.5;
              slashMesh.rotation.set(Math.PI / 2, 0, u * Math.PI * 4);
              slashMat.opacity = swing * 0.85;
            }
            break;
          }
          case "charge_cleave": {
            const period = 2.8;
            const phase = ((t * sp) % period) / period;
            if (phase < 0.55) {
              const u = phase / 0.55;
              const ease = Math.sin((u * Math.PI) / 2);
              root.position.y = ease * 4.2;
              root.rotation.x = -ease * 0.45;
              bladeL.position.x = -ease * 2.2;
              bladeR.position.x = ease * 2.2;
              core.scale.setScalar(1 + ease * 0.35);
              funnel.position.y = ease * 5.0;
            } else if (phase < 0.75) {
              const u = (phase - 0.55) / 0.2;
              root.position.y = 4.2 * (1 - u);
              root.rotation.x = -0.45 + u * 1.65;
              bladeL.position.x = -2.2;
              bladeR.position.x = 2.2;
              slashMesh.rotation.set(0, Math.PI / 2, u * Math.PI);
              slashMat.opacity = 0.9;
            } else {
              const u = (phase - 0.75) / 0.25;
              root.rotation.x = 1.2 * (1 - u);
              bladeL.position.x = -2.2 * (1 - u);
              bladeR.position.x = 2.2 * (1 - u);
              wave.scale.setScalar(1 + u * 7);
              waveMat.opacity = (1 - u) * 0.85;
            }
            break;
          }
          case "magic_cast": {
            const period = 3.0;
            const phase = ((t * sp) % period) / period;
            const hover = Math.sin(phase * Math.PI);
            root.position.y = 2.5 + Math.sin(phase * Math.PI * 2) * 1.2;
            root.rotation.y = phase * Math.PI * 2;
            bladeL.position.x = -hover * 1.4;
            bladeR.position.x = hover * 1.4;
            halo.rotation.z = -t * 2.4 * sp;
            funnel.rotation.y = t * 1.8 * sp;
            funnel.position.y = 3.2 + Math.cos(t * 3 * sp) * 1.5;
            if (phase > 0.25 && phase < 0.85) {
              const bPhase = Math.sin(((phase - 0.25) / 0.6) * Math.PI);
              beamMat.opacity = bPhase * 0.55;
              beam.scale.set(0.8 + bPhase * 0.9, 1, 0.8 + bPhase * 0.9);
              beam.rotation.y = t * 5;
            }
            break;
          }
          case "form_morph": {
            const morph = (Math.sin(t * 1.6 * sp) + 1) / 2;
            root.position.y = morph * 2.2;
            root.rotation.y = Math.sin(t * 0.8 * sp) * 0.35;
            bladeL.position.x = -morph * 2.6;
            bladeR.position.x = morph * 2.6;
            bladeL.position.y = morph * 0.9;
            bladeR.position.y = morph * 0.9;
            seal.scale.set(1 + morph * 0.45, Math.max(0.15, 1 - morph * 0.75), 1 + morph * 0.45);
            seal.position.y = -morph * 3.5;
            core.scale.setScalar(1 + morph * 0.3);
            astral.scale.setScalar(0.65 + morph * 0.45);
            funnel.position.y = morph * 3.0;
            break;
          }
          case "limit_burst": {
            const period = 2.6;
            const phase = ((t * sp) % period) / period;
            if (phase < 0.35) {
              const u = phase / 0.35;
              root.position.x = Math.sin(t * 45) * 0.25 * u;
              root.scale.setScalar(1 - u * 0.12);
            } else {
              const u = (phase - 0.35) / 0.65;
              const burst = Math.sin(u * Math.PI);
              root.position.y = burst * 3.4;
              root.rotation.y = u * Math.PI * 2;
              bladeL.position.x = -burst * 2.0;
              bladeR.position.x = burst * 2.0;
              astral.scale.setScalar(1 + burst * 0.35);
              funnel.position.y = burst * 4.2;
              funnel.rotation.y = -u * Math.PI * 2;
              wave.scale.setScalar(1 + u * 8.5);
              waveMat.opacity = (1 - u) * 0.8;
              beamMat.opacity = burst * 0.45;
            }
            break;
          }

          /* ---------- CHAINSAW: 鋸回転・空吹かし ---------- */
          case "chainsaw_rev": {
            // chain links are spaced ~3.6u along the bar — shifting by that
            // modulo makes the loop read as continuous travel
            chain.position.x = (t * 26 * sp) % 3.6;
            gear.rotation.z = -t * 9 * sp;
            // two-stroke engine vibration + throttle blips
            const blip = Math.max(0, Math.sin(t * 2.2 * sp));
            const shake = 0.16 + blip * 0.42;
            root.position.y = Math.sin(t * 54 * sp) * shake * 0.4;
            root.position.x = Math.sin(t * 41 * sp) * shake * 0.3;
            root.rotation.z = Math.sin(t * 36 * sp) * shake * 0.035;
            root.rotation.x = -blip * 0.12;
            piston.position.y = Math.sin(t * 30 * sp) * 0.45;
            modeVfx.scale.setScalar(1 + blip * 0.16);
            break;
          }

          /* ---------- GUN: 射撃反動 ---------- */
          case "gun_recoil": {
            const period = 0.52;
            const phase = ((t * sp) % period) / period;
            if (phase < 0.22) {
              // slide blow-back + muzzle climb
              const u = phase / 0.22;
              breech.position.z = -2.9 * u;
              root.rotation.x = -0.3 * u;
              root.position.z = -1.5 * u;
              muzzle.scale.setScalar(1 + (1 - u) * 1.9);
              beam.scale.set(0.35, 0.22, 0.35);
              beamMat.opacity = (1 - u) * 0.6;
            } else {
              // counter-recoil return
              const u = (phase - 0.22) / 0.78;
              const ease = 1 - Math.pow(1 - u, 3);
              breech.position.z = -2.9 * (1 - ease);
              root.rotation.x = -0.3 * (1 - ease);
              root.position.z = -1.5 * (1 - ease);
            }
            gear.rotation.z = -t * 3 * sp;
            break;
          }

          /* ---------- GUN: 排莢・再装填 ---------- */
          case "reload_cycle": {
            const period = 3.2;
            const phase = ((t * sp) % period) / period;
            if (phase < 0.18) {
              // mag release — drops away
              const u = phase / 0.18;
              magazine.position.y = -14 * u * u;
              magazine.rotation.z = u * 0.55;
              root.rotation.z = u * 0.25;
            } else if (phase < 0.46) {
              magazine.position.y = -14;
              magazine.rotation.z = 0.55;
              root.rotation.z = 0.25;
            } else if (phase < 0.72) {
              // fresh mag slams home
              const u = (phase - 0.46) / 0.26;
              const ease = 1 - Math.pow(1 - u, 4);
              magazine.position.y = -14 * (1 - ease);
              magazine.rotation.z = 0.55 * (1 - ease);
              root.rotation.z = 0.25 * (1 - ease);
            } else {
              // charging handle cycles the breech
              const u = (phase - 0.72) / 0.28;
              const kick = Math.sin(u * Math.PI);
              breech.position.z = -3.4 * kick;
              root.position.z = -0.8 * kick;
              gear.rotation.z = -u * Math.PI * 2;
              piston.position.y = -kick * 1.2;
            }
            break;
          }

          /* ---------- RAILGUN: 電磁加速・発射 ---------- */
          case "railgun_charge": {
            const period = 3.4;
            const phase = ((t * sp) % period) / period;
            if (phase < 0.62) {
              // capacitors spool, coils pulse tighter and tighter
              const u = phase / 0.62;
              const freq = 6 + u * 46;
              const pulse = (Math.sin(t * freq) + 1) / 2;
              rail.scale.set(1 + pulse * 0.07 * u, 1 + pulse * 0.07 * u, 1);
              core.scale.setScalar(1 + u * 0.6 + pulse * 0.22 * u);
              muzzle.scale.setScalar(1 + u * 0.3);
              root.position.x = Math.sin(t * 40) * 0.1 * u;
              root.position.y = u * 0.8;
              beamMat.opacity = u * 0.12;
              beam.scale.set(0.3 + u * 0.3, 0.5, 0.3 + u * 0.3);
            } else if (phase < 0.74) {
              // DISCHARGE
              const u = (phase - 0.62) / 0.12;
              const flash = Math.sin(u * Math.PI);
              beamMat.opacity = flash * 0.95;
              beam.scale.set(1 + flash * 2.4, 1.8, 1 + flash * 2.4);
              beam.rotation.y = t * 22;
              muzzle.scale.setScalar(1 + flash * 2.6);
              core.scale.setScalar(1.6 - flash * 0.5);
              // violent rearward recoil
              root.position.z = -flash * 5.4;
              root.rotation.x = -flash * 0.42;
              wave.scale.setScalar(1 + u * 6);
              waveMat.opacity = flash * 0.8;
            } else {
              // hydraulic settle
              const u = (phase - 0.74) / 0.26;
              const ease = 1 - Math.pow(1 - u, 3);
              root.position.z = -5.4 * (1 - ease);
              root.rotation.x = -0.42 * (1 - ease);
              core.scale.setScalar(1.1 - 0.1 * ease);
              piston.position.y = -(1 - ease) * 1.4;
            }
            break;
          }

          /* ---------- MACE: 叩き潰し ---------- */
          case "mace_smash": {
            const period = 2.2;
            const phase = ((t * sp) % period) / period;
            if (phase < 0.45) {
              // wind up overhead
              const u = phase / 0.45;
              const ease = Math.sin((u * Math.PI) / 2);
              root.rotation.x = -ease * 1.25;
              root.position.y = ease * 4.6;
              root.position.z = -ease * 2.4;
            } else if (phase < 0.6) {
              // SLAM
              const u = (phase - 0.45) / 0.15;
              const ease = u * u;
              root.rotation.x = -1.25 + ease * 2.5;
              root.position.y = 4.6 - ease * 6.4;
              root.position.z = -2.4 + ease * 3.6;
              slashMesh.rotation.set(Math.PI / 2.1, 0, 0);
              slashMat.opacity = ease * 0.5;
            } else {
              // impact shockwave + recovery
              const u = (phase - 0.6) / 0.4;
              wave.scale.setScalar(1 + u * 9);
              waveMat.opacity = (1 - u) * 0.9;
              root.rotation.x = 1.25 * (1 - u) * (1 - u);
              root.position.y = -1.8 * (1 - u) * (1 - u);
              root.position.z = 1.2 * (1 - u);
            }
            break;
          }

          /* ---------- SPEAR: 連続刺突 ---------- */
          case "spear_thrust": {
            const period = 1.8;
            const phase = ((t * sp) % period) / period;
            const jab = (u: number) => Math.sin(Math.min(1, u) * Math.PI);
            let push = 0;
            if (phase < 0.22) push = jab(phase / 0.22) * 6.5;
            else if (phase < 0.44) push = jab((phase - 0.22) / 0.22) * 6.5;
            else if (phase < 0.72) push = jab((phase - 0.44) / 0.28) * 10.5;
            root.position.z = push;
            root.rotation.x = -push * 0.022;
            root.position.y = Math.sin(t * 3 * sp) * 0.3;
            banner.rotation.x = -push * 0.05;
            banner.rotation.z = Math.sin(t * 5 * sp) * 0.14;
            chain.position.z = -push * 0.25;
            if (push > 4) {
              slashMesh.rotation.set(0, Math.PI / 2, Math.PI / 2);
              slashMat.opacity = (push - 4) * 0.07;
            }
            break;
          }

          /* ---------- BLOOD: 吸血脈動 ---------- */
          case "blood_drain": {
            // slow systolic pulse running up the weapon
            const beat = Math.pow((Math.sin(t * 2.4 * sp) + 1) / 2, 3);
            root.scale.set(1 + beat * 0.045, 1 - beat * 0.02, 1 + beat * 0.045);
            root.position.y = Math.sin(t * 1.2 * sp) * 0.7 - beat * 0.5;
            core.scale.setScalar(1 + beat * 0.55);
            modeVfx.scale.setScalar(1 + beat * 0.18);
            modeVfx.position.y = -beat * 1.4;
            piston.scale.set(1, 1 + beat * 0.3, 1);
            halo.scale.setScalar(1 + beat * 0.2);
            floating.position.y -= beat * 0.6;
            beamMat.opacity = beat * 0.14;
            break;
          }

          /* ---------- MECH: 機械展開 ---------- */
          case "mech_deploy": {
            const period = 3.6;
            const phase = ((t * sp) % period) / period;
            const open =
              phase < 0.4
                ? phase / 0.4
                : phase < 0.72
                ? 1
                : 1 - (phase - 0.72) / 0.28;
            const ease = open * open * (3 - 2 * open);
            gear.rotation.z = -t * 5 * sp;
            piston.position.y = ease * 2.6;
            piston.scale.set(1, 1 + ease * 0.45, 1);
            breech.position.z = -ease * 2.2;
            rail.scale.set(1 + ease * 0.22, 1 + ease * 0.22, 1);
            muzzle.scale.setScalar(1 + ease * 0.35);
            bladeL.position.x = -ease * 2.4;
            bladeR.position.x = ease * 2.4;
            modeVfx.scale.setScalar(1 + ease * 0.3);
            root.position.y = ease * 1.6;
            root.rotation.y = Math.sin(t * 0.6 * sp) * 0.3;
            magazine.position.y = -ease * 1.2;
            break;
          }
        }

        if (floatGroup.current) {
          floatGroup.current.rotation.y = t * 0.9 * sp;
          floatGroup.current.position.y = Math.sin(t * 2.3 * sp) * 0.8 * amp;
        }
      }

      if (pSystem.current) {
        const arr = pSystem.current.geometry.attributes.position.array as Float32Array;
        const rise = 0.08 * activeModel.config.particleSpeed * modeBoost;
        const stats = activeModel.stats;
        for (let i = 1; i < arr.length; i += 3) {
          arr[i] += rise;
          if (arr[i] > stats.center[1] + stats.size[1] * 0.75 + 10) {
            arr[i] = 1.5;
          }
        }
        pSystem.current.geometry.attributes.position.needsUpdate = true;
        pSystem.current.rotation.y += 0.003 * modeBoost;
      }

      renderer.current?.render(sc, camera.current!);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.current?.dispose();
    };
  }, []);

  /* ---------------- geometry rebuild ---------------- */
  useEffect(() => {
    const sc = scene.current;
    if (!sc || !bodyGroup.current) return;

    const allGroups = [
      bodyGroup.current,
      bladeLGroup.current,
      bladeRGroup.current,
      coreGroup.current,
      sealGroup.current,
      funnelGroup.current,
      haloGroup.current,
      astralGroup.current,
      modeVfxGroup.current,
      floatGroup.current,
      chainGroup.current,
      gearGroup.current,
      pistonGroup.current,
      breechGroup.current,
      magazineGroup.current,
      muzzleGroup.current,
      railGroup.current,
      bannerGroup.current,
    ];

    allGroups.forEach((g) => {
      if (!g) return;
      while (g.children.length) {
        const child = g.children[0] as THREE.Mesh;
        g.remove(child);
        child.geometry?.dispose();
      }
    });

    if (pSystem.current) {
      sc.remove(pSystem.current);
      pSystem.current.geometry.dispose();
      (pSystem.current.material as THREE.Material).dispose();
      pSystem.current = null;
    }

    prevMats.current.forEach((m) => m.dispose());
    prevMats.current = [];

    const { palette, config } = model;
    if (rimLight.current) rimLight.current.color.set(palette.accent);
    if (keyLight.current) keyLight.current.intensity = lighting ? 2.1 : 1.0;

    if (slashTrailMesh.current) {
      (slashTrailMesh.current.material as THREE.MeshBasicMaterial).color.set(palette.glow);
    }
    if (castBeamMesh.current) {
      (castBeamMesh.current.material as THREE.MeshBasicMaterial).color.set(palette.gem);
    }
    if (shockwaveMesh.current) {
      (shockwaveMesh.current.material as THREE.MeshBasicMaterial).color.set(palette.glow);
    }
    if (groundCircleGroup.current) {
      groundCircleGroup.current.children.forEach((c, idx) => {
        ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).color.set(
          idx === 0 ? palette.accent : palette.glow
        );
      });
    }

    const mats = new Map<string, THREE.MeshStandardMaterial>();
    const matFor = (color: string, emissive: boolean, group: string) => {
      const isAstral = group === "Astral";
      const key = `${color}|${emissive}|${wire}|${isAstral}`;
      const hit = mats.get(key);
      if (hit) return hit;
      const m = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: emissive ? 0.24 : 0.6,
        metalness: emissive ? 0.08 : 0.48,
        emissive: new THREE.Color(emissive ? color : "#000000"),
        emissiveIntensity: emissive ? config.bloomIntensity : 0,
        wireframe: wire,
        transparent: isAstral,
        opacity: isAstral ? 0.72 : 1,
      });
      mats.set(key, m);
      prevMats.current.push(m);
      return m;
    };

    for (const el of model.elements) {
      const sx = Math.max(0.12, Math.abs(el.to[0] - el.from[0]));
      const sy = Math.max(0.12, Math.abs(el.to[1] - el.from[1]));
      const sz = Math.max(0.12, Math.abs(el.to[2] - el.from[2]));
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(sx, sy, sz),
        matFor(el.color, !!el.emissive, el.group)
      );
      mesh.position.set(
        (el.from[0] + el.to[0]) / 2,
        (el.from[1] + el.to[1]) / 2,
        (el.from[2] + el.to[2]) / 2
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      switch (el.group) {
        case "BladeL":
          bladeLGroup.current?.add(mesh);
          break;
        case "BladeR":
          bladeRGroup.current?.add(mesh);
          break;
        case "Core":
          coreGroup.current?.add(mesh);
          break;
        case "Seal":
          sealGroup.current?.add(mesh);
          break;
        case "Funnel":
          funnelGroup.current?.add(mesh);
          break;
        case "Halo":
          haloGroup.current?.add(mesh);
          break;
        case "Astral":
          astralGroup.current?.add(mesh);
          break;
        case "ModeVFX":
          modeVfxGroup.current?.add(mesh);
          break;
        case "Floating":
          floatGroup.current?.add(mesh);
          break;
        case "Chain":
          chainGroup.current?.add(mesh);
          break;
        case "Gear":
          gearGroup.current?.add(mesh);
          break;
        case "Piston":
          pistonGroup.current?.add(mesh);
          break;
        case "Barrel":
        case "Breech":
          breechGroup.current?.add(mesh);
          break;
        case "Magazine":
          magazineGroup.current?.add(mesh);
          break;
        case "Muzzle":
          muzzleGroup.current?.add(mesh);
          break;
        case "Rail":
        case "Coil":
          railGroup.current?.add(mesh);
          break;
        case "Banner":
          bannerGroup.current?.add(mesh);
          break;
        default:
          bodyGroup.current?.add(mesh);
      }
    }

    if (particles && config.particleEffect !== "none") {
      const n =
        config.particleDensity +
        config.limitBreak * 25 +
        (config.tacticalMode !== "normal" ? 25 : 0);
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(n * 3);
      const col = new Float32Array(n * 3);
      const a = new THREE.Color(palette.gem);
      const b = new THREE.Color(palette.glow);
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = 2.5 + Math.random() * (config.floatingRadius + 6);
        pos[i * 3] = 8 + Math.cos(ang) * rad;
        pos[i * 3 + 1] = 1 + Math.random() * (model.stats.size[1] + 10);
        pos[i * 3 + 2] = 8 + Math.sin(ang) * rad;
        const c = Math.random() > 0.45 ? a : b;
        col[i * 3] = c.r;
        col[i * 3 + 1] = c.g;
        col[i * 3 + 2] = c.b;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const pmat = new THREE.PointsMaterial({
        size: 0.6,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      prevMats.current.push(pmat);
      const sys = new THREE.Points(geo, pmat);
      sc.add(sys);
      pSystem.current = sys;
    }
  }, [model, wire, particles, lighting]);

  useEffect(() => {
    if (gridHelper.current) gridHelper.current.visible = grid;
  }, [grid]);

  /* ---------------- camera ---------------- */
  useEffect(() => {
    const c = model.stats.center;
    target.current.set(c[0], c[1], c[2]);
  }, [model.stats.center]);

  presetRef.current = preset;

  useEffect(() => {
    const radius =
      preset === "gui"
        ? modelRef.current.stats.radius * 2.6
        : preset === "first"
        ? modelRef.current.stats.radius * 2.2
        : preset === "third"
        ? modelRef.current.stats.radius * 3.1
        : modelRef.current.stats.radius * 2.7;

    const theta =
      preset === "gui"
        ? Math.PI / 4
        : preset === "first"
        ? 0.12
        : preset === "third"
        ? Math.PI * 0.75
        : 0.72;
    const phi = preset === "first" ? 1.45 : preset === "third" ? 1.25 : 1.05;

    orbit.current = { theta, phi, radius };

    if (camera.current) {
      const c = target.current;
      camera.current.position.set(
        c.x + radius * Math.sin(phi) * Math.sin(theta),
        c.y + radius * Math.cos(phi),
        c.z + radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.current.lookAt(c);
    }
  }, [preset, frameToken]);

  /* ---------------- pointer ---------------- */
  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    orbit.current.theta -= dx * 0.008;
    orbit.current.phi = Math.max(0.15, Math.min(Math.PI - 0.15, orbit.current.phi - dy * 0.008));
    last.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => {
    dragging.current = false;
  };
  const onWheel = (e: React.WheelEvent) => {
    orbit.current.radius = Math.max(8, Math.min(130, orbit.current.radius + e.deltaY * 0.03));
  };

  const snapshot = useCallback(() => {
    if (!renderer.current) return;
    const url = renderer.current.domElement.toDataURL("image/png");
    onSnapshot?.(url);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${model.config.name}_render.png`;
    a.click();
  }, [model.config.name, onSnapshot]);

  const cfg = model.config;
  const toolOn = "text-bone";
  const toolOff = "text-ash/70 hover:text-bone";

  // the action deck adapts to what the weapon actually is
  const family = CATEGORIES.find((c) => c.id === cfg.category)?.family ?? "melee";
  const actionDeck: [AnimationMode, string][] = (() => {
    const base: [AnimationMode, string][] = [["idle_float", "待機"]];
    if (cfg.category === "chainsaw")
      return [...base, ["chainsaw_rev", "空吹かし"], ["combo_slash", "斬り刻み"],
        ["mech_deploy", "機械展開"], ["limit_burst", "覚醒"]];
    if (cfg.category === "gun")
      return [...base, ["gun_recoil", "連射"], ["reload_cycle", "再装填"],
        ["mech_deploy", "機械展開"], ["limit_burst", "覚醒"]];
    if (cfg.category === "railgun")
      return [...base, ["railgun_charge", "電磁発射"], ["reload_cycle", "排莢"],
        ["mech_deploy", "機械展開"], ["limit_burst", "覚醒"]];
    if (cfg.category === "crossbow")
      return [...base, ["reload_cycle", "巻上装填"], ["gun_recoil", "射出"],
        ["mech_deploy", "機械展開"], ["limit_burst", "覚醒"]];
    if (cfg.category === "mace")
      return [...base, ["mace_smash", "叩き潰し"], ["combo_slash", "三連撃"],
        ["blood_drain", "吸血脈動"], ["limit_burst", "覚醒"]];
    if (cfg.category === "spear" || cfg.category === "spear_ornate")
      return [...base, ["spear_thrust", "連続刺突"], ["charge_cleave", "次元斬"],
        ["magic_cast", "魔法詠唱"], ["limit_burst", "覚醒"]];
    if (family === "caster")
      return [...base, ["magic_cast", "魔法詠唱"], ["magic_pulse", "脈動"],
        ["blood_drain", "吸血脈動"], ["limit_burst", "覚醒"]];
    if (family === "ranged")
      return [...base, ["gun_recoil", "射撃"], ["reload_cycle", "再装填"],
        ["magic_cast", "魔法詠唱"], ["limit_burst", "覚醒"]];
    return [...base, ["combo_slash", "三連撃"], ["charge_cleave", "次元斬"],
      ["magic_cast", "魔法詠唱"], ["form_morph", "変形"], ["limit_burst", "覚醒"]];
  })();

  return (
    <div
      ref={holder}
      className={`relative overflow-hidden ${className}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onWheel={onWheel}
    >
      {/* forge backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url(images/forge-backdrop.jpg)",
          filter: "saturate(0.75) brightness(0.5)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(115% 85% at 50% 42%, rgba(10,10,11,0.12) 0%, rgba(10,10,11,0.7) 58%, rgba(10,10,11,0.96) 100%)",
        }}
        aria-hidden
      />

      {glError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-8">
          <div className="max-w-sm border border-ember/50 bg-ink/90 p-6">
            <div className="lbl text-ember">WEBGL UNAVAILABLE</div>
            <p className="mt-3 text-[12px] leading-relaxed text-ash">
              このブラウザでは3Dプレビューを初期化できませんでした。モデルの生成・書き出しは通常どおり動作します。
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3">
              <div>
                <div className="lbl">ELS</div>
                <div className="num mt-1 text-[15px] text-bone">{model.stats.elementCount}</div>
              </div>
              <div>
                <div className="lbl">TRIS</div>
                <div className="num mt-1 text-[15px] text-bone">
                  {model.stats.estimatedTriangles.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="lbl">BOUND</div>
                <div className="num mt-1 text-[15px] text-bone">{model.stats.size[1]}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <canvas
        ref={canvas}
        className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
      />

      {/* ── instrument caliper rulers ── */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-9 border-r border-white/[0.07] bg-black/25">
        <div className="ruler-tick-y absolute inset-y-0 left-0 w-2 opacity-70" />
        <div className="ruler-tick-y absolute inset-y-0 left-2 w-4 opacity-35" />
        <span className="lbl absolute bottom-3 left-3 text-[8px] text-bone/70">
          H {model.stats.size[1]}
        </span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 border-t border-white/[0.07] bg-black/25">
        <div className="ruler-tick-x absolute inset-x-0 bottom-0 h-2 opacity-70" />
        <div className="ruler-tick-x absolute inset-x-0 bottom-2 h-4 opacity-35" />
        <span className="lbl absolute bottom-2.5 right-3 text-[8px] text-bone/70">
          W {model.stats.size[0]} × D {model.stats.size[2]}
        </span>
      </div>

      {/* vertical spec caption on the right edge */}
      <div
        className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 lg:block"
        aria-hidden
      >
        <span
          className="lbl block text-[8.5px] text-bone/35"
          style={{ writingMode: "vertical-rl" }}
        >
          {cfg.category} / {cfg.theme} / TIER {cfg.upgradeTier} / SEED {cfg.seed}
        </span>
      </div>

      {/* ── top-left: camera view modes ── */}
      <div className="absolute left-11 top-3 flex items-center gap-4">
        {(
          [
            ["free", "ORBIT"],
            ["gui", "GUI"],
            ["first", "1ST"],
            ["third", "3RD"],
          ] as [CameraPreset, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setPreset(id)}
            className={`border-b pb-1 font-latin text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors ${
              preset === id
                ? "border-ember text-ember-bright"
                : "border-transparent text-ash hover:text-bone"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── top-right: view tools (icon only) ── */}
      <div className="absolute right-3 top-2.5 flex items-center">
        <button
          onClick={() => setGrid(!grid)}
          title="グリッド"
          className={`p-2 transition-colors ${grid ? toolOn : toolOff}`}
        >
          <Grid3x3 className="h-[15px] w-[15px]" strokeWidth={1.5} />
        </button>
        <span className="h-3.5 w-px bg-white/15" />
        <button
          onClick={() => setLighting(!lighting)}
          title="照明"
          className={`p-2 transition-colors ${lighting ? toolOn : toolOff}`}
        >
          <SunMedium className="h-[15px] w-[15px]" strokeWidth={1.5} />
        </button>
        <span className="h-3.5 w-px bg-white/15" />
        <button
          onClick={() => setParticles(!particles)}
          title="パーティクル"
          className={`p-2 transition-colors ${particles ? toolOn : toolOff}`}
        >
          <Sparkles className="h-[15px] w-[15px]" strokeWidth={1.5} />
        </button>
        <span className="h-3.5 w-px bg-white/15" />
        <button
          onClick={() => setWire(!wire)}
          title="ワイヤーフレーム"
          className={`p-2 transition-colors ${wire ? toolOn : toolOff}`}
        >
          <BoxIcon className="h-[15px] w-[15px]" strokeWidth={1.5} />
        </button>
        <span className="h-3.5 w-px bg-white/15" />
        <button
          onClick={() => setFrameToken((t) => t + 1)}
          title="フレームを合わせる"
          className="p-2 text-ash transition-colors hover:text-bone"
        >
          <Crosshair className="h-[15px] w-[15px]" strokeWidth={1.5} />
        </button>
        <span className="h-3.5 w-px bg-white/15" />
        <button
          onClick={snapshot}
          title="PNGスクリーンショット"
          className="p-2 text-ash transition-colors hover:text-bone"
        >
          <CameraIcon className="h-[15px] w-[15px]" strokeWidth={1.5} />
        </button>
      </div>

      {/* ── bottom: action deck (single typographic row) ── */}
      {onTriggerAnim && (
        <div className="absolute bottom-8 left-11 right-3 flex flex-wrap items-center gap-x-1 gap-y-0.5">
          <span className="lbl pr-2 text-[8.5px] text-bone/45">ACTION</span>
          {actionDeck.map(([animId, label]) => {
            const active = cfg.animationEnabled && cfg.animationMode === animId;
            return (
              <button
                key={animId}
                onClick={() => onTriggerAnim(animId)}
                className={`act ${active ? "act-on" : ""}`}
              >
                <span
                  className={`h-[3px] w-[3px] ${active ? "bg-ember" : "bg-white/25"}`}
                />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
