"use client";
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { clipAnims, clipById, evaluate, rootIdle } from "@/lib/forge";
import { clamp, mix } from "@/lib/forge/util";
import { playhead } from "@/lib/playhead";
import {
  applyPose,
  buildGhosts,
  buildRig,
  disposeGhosts,
  GHOST_STRIDE,
  setHighlight,
  type Rig,
} from "@/lib/three/rig";

const D2R = Math.PI / 180;
const ORIGIN = new THREE.Vector3(0, 0, 0);

interface Ctrls {
  target: THREE.Vector3;
  update: () => void;
  addEventListener: (type: string, fn: () => void) => void;
  removeEventListener: (type: string, fn: () => void) => void;
}
import { useForge, type ViewKey } from "@/lib/store";
import { useDerived } from "../ForgeProvider";
import StageHud from "./StageHud";

const VIEWS: Record<ViewKey, [number, number, number]> = {
  persp: [0.58, 0.28, 0.82],
  front: [0, 0, 1],
  side: [1, 0, 0.001],
  top: [0.001, 1, 0.001],
};

function Backdrop() {
  const scene = useThree((s) => s.scene);
  const size = useThree((s) => s.size);
  const tex = useMemo(() => {
    const t = new THREE.TextureLoader().load("/images/stage.jpg", () => fit());
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const fit = () => {
    const img = tex.image as HTMLImageElement | undefined;
    if (!img || !img.width) return;
    const ca = size.width / Math.max(1, size.height);
    const ia = img.width / img.height;
    if (ca > ia) {
      tex.repeat.set(1, ia / ca);
      tex.offset.set(0, (1 - ia / ca) / 2);
    } else {
      tex.repeat.set(ca / ia, 1);
      tex.offset.set((1 - ca / ia) / 2, 0);
    }
  };
  useEffect(() => {
    scene.background = tex;
    fit();
    return () => {
      scene.background = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, tex, size.width, size.height]);
  useEffect(() => () => tex.dispose(), [tex]);
  return null;
}

function CameraRig({ span }: { span: number }) {
  const view = useForge((s) => s.view);
  const kind = useForge((s) => s.params.kind);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as Ctrls | null;
  const spanRef = useRef(span);
  const want = useRef<THREE.Vector3 | null>(null);
  useEffect(() => {
    spanRef.current = span;
  }, [span]);
  // 視点・型の切替時だけ構図を取り直し、滑らかに寄せる（スライダー操作中に飛ばない）
  useEffect(() => {
    const d = Math.max(26, spanRef.current * 2.1);
    want.current = new THREE.Vector3(...VIEWS[view]).normalize().multiplyScalar(d);
  }, [view, kind]);
  useEffect(() => {
    const c = controls;
    if (!c) return;
    const stop = () => {
      want.current = null;
    };
    c.addEventListener("start", stop);
    return () => c.removeEventListener("start", stop);
  }, [controls]);
  useFrame(() => {
    const target = want.current;
    if (!target) return;
    camera.position.lerp(target, 0.14);
    if (controls) {
      controls.target.lerp(ORIGIN, 0.2);
      controls.update();
    }
    if (camera.position.distanceTo(target) < 0.08) {
      camera.position.copy(target);
      want.current = null;
    }
  });
  return null;
}

function Capture() {
  const gl = useThree((s) => s.gl);
  const setCapture = useForge((s) => s.setCapture);
  useEffect(() => {
    setCapture(() => {
      try {
        const src = gl.domElement;
        const S = 192;
        const c = document.createElement("canvas");
        c.width = S;
        c.height = S;
        const ctx = c.getContext("2d");
        if (!ctx) return null;
        const m = Math.min(src.width, src.height);
        ctx.drawImage(src, (src.width - m) / 2, (src.height - m) / 2, m, m, 0, 0, S, S);
        return c.toDataURL("image/webp", 0.82);
      } catch {
        return null;
      }
    });
    return () => setCapture(null);
  }, [gl, setCapture]);
  return null;
}

const ZERO: [number, number, number] = [0, 0, 0];

function ModelView({ texture }: { texture: THREE.Texture }) {
  const { gen, atlas } = useDerived();
  const wire = useForge((s) => s.params.view.wire);
  const emissive = useForge((s) => s.params.view.emissive);
  const phantom = useForge((s) => s.params.view.phantom);
  const phantomGap = useForge((s) => s.params.view.phantomGap);
  const glow = useForge((s) => s.params.palette.glow);
  const anim = useForge((s) => s.params.anim);
  const clip = useForge((s) => s.clip);
  const playToken = useForge((s) => s.playToken);
  const scrub = useForge((s) => s.scrub);
  const endClip = useForge((s) => s.endClip);
  const hoverCell = useForge((s) => s.hoverCell);
  const idle = useMemo(() => rootIdle(anim), [anim]);

  const rig = useMemo<Rig>(
    () => buildRig(gen, atlas, texture, { wire, emissive: 1, rootClips: { ...gen.rootClips, idle } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gen, atlas, texture, wire]
  );
  const prev = useRef<Rig | null>(null);
  const loopT = useRef(0);
  const actT = useRef(0);
  const pop = useRef(1);
  const outer = useRef<THREE.Group>(null);

  // クリップ切替時に前の姿勢から補間して繋ぐ
  const all = useMemo(() => [rig.rootNode, ...rig.nodes], [rig]);
  const poses = useMemo(
    () => ({
      from: all.map(() => ({ pos: [0, 0, 0] as number[], rot: [0, 0, 0] as number[], scale: 1 })),
      last: all.map(() => ({ pos: [0, 0, 0] as number[], rot: [0, 0, 0] as number[], scale: 1 })),
    }),
    [all]
  );
  const blend = useRef(1);

  // ── 幻影：過去フレームの姿勢をなぞるゴースト（ジオメトリは共有、追加はドローコールのみ）
  const ghostCount = useMemo(() => {
    if (!phantom) return 0;
    const n = gen.boxes.length;
    const cap = n > 900 ? 0 : n > 500 ? 2 : n > 260 ? 3 : phantom;
    return Math.min(phantom, cap);
  }, [phantom, gen.boxes.length]);
  const ghosts = useMemo(
    () => (ghostCount ? buildGhosts(rig, all, ghostCount, mix(glow, "#ffffff", 0.5)) : []),
    [rig, all, ghostCount, glow]
  );
  useEffect(() => () => disposeGhosts(ghosts), [ghosts]);
  const stride = all.length * GHOST_STRIDE;
  const histCap = Math.max(4, ghostCount * Math.max(2, phantomGap) + 3);
  const hist = useRef<Float32Array[]>([]);
  const head = useRef(0);
  useEffect(() => {
    hist.current = Array.from({ length: histCap }, () => new Float32Array(stride));
    head.current = 0;
  }, [histCap, stride]);

  // アトラスで触ったネットの要素だけを光らせる
  useEffect(() => {
    setHighlight(rig, gen, atlas, hoverCell);
  }, [rig, gen, atlas, hoverCell]);

  useEffect(() => {
    pop.current = 1;
    if (prev.current && prev.current !== rig) prev.current.dispose();
    prev.current = rig;
  }, [rig]);
  useEffect(() => () => prev.current?.dispose(), []);
  useEffect(() => {
    rig.rootNode.clips.idle = idle;
  }, [rig, idle]);
  // 動作クリップの再生開始
  useEffect(() => {
    actT.current = 0;
    poses.last.forEach((p, i) => {
      poses.from[i].pos = [...p.pos];
      poses.from[i].rot = [...p.rot];
      poses.from[i].scale = p.scale;
    });
    blend.current = 0;
  }, [playToken, clip, poses]);

  useEffect(() => {
    (["glow", "fx", "gem"] as const).forEach((k) => {
      rig.materials[k].emissiveIntensity = emissive * (k === "gem" ? 0.55 : k === "glow" ? 0.9 : 1.1);
    });
  }, [rig, emissive]);

  const cy = (gen.bounds.min[1] + gen.bounds.max[1]) / 2;

  useFrame((_, delta) => {
    const dt = Math.min(0.05, delta);
    const acting = clip !== "idle";
    const def = clipById(clip);
    const manual = scrub !== null;
    let t01: number;
    if (manual) t01 = clamp(scrub as number, 0, 1);
    else if (acting) {
      actT.current += dt * anim.speed;
      t01 = actT.current / def.length;
      if (t01 >= 1) {
        t01 = 1;
        endClip();
      }
    } else {
      if (anim.on) loopT.current += dt * anim.speed;
      t01 = anim.on ? (loopT.current / anim.loop) % 1 : 0;
    }
    playhead.t01 = t01;
    playhead.clip = clip;
    playhead.length = acting ? def.length : anim.loop;
    playhead.playing = !manual && (acting || anim.on);
    const key = acting ? clip : "idle";
    blend.current = Math.min(1, blend.current + dt / 0.22);
    const w = blend.current * blend.current * (3 - 2 * blend.current);

    for (let i = 0; i < all.length; i++) {
      const n = all[i];
      const isRoot = i === 0;
      const specs = clipAnims(n.clips, key);
      let target: { pos: readonly number[]; rot: readonly number[]; scale: number };
      if (isRoot && !acting && !anim.on) target = { pos: ZERO, rot: [0, -24, 0], scale: 1 };
      else if (!specs.length) target = { pos: ZERO, rot: ZERO, scale: 1 };
      else target = evaluate(specs, t01);

      const f = poses.from[i];
      const out = poses.last[i];
      for (let k = 0; k < 3; k++) {
        out.pos[k] = w >= 1 ? target.pos[k] : f.pos[k] + (target.pos[k] - f.pos[k]) * w;
        out.rot[k] = w >= 1 ? target.rot[k] : f.rot[k] + (target.rot[k] - f.rot[k]) * w;
      }
      out.scale = w >= 1 ? target.scale : f.scale + (target.scale - f.scale) * w;
      applyPose(n, out.pos as [number, number, number], out.rot as [number, number, number], out.scale);
    }

    // 幻影へ過去姿勢を配る
    if (ghostCount && hist.current.length) {
      const slot = hist.current[head.current];
      if (slot) {
        for (let i = 0; i < all.length; i++) {
          const p = poses.last[i];
          const o = i * GHOST_STRIDE;
          slot[o] = p.pos[0];
          slot[o + 1] = p.pos[1];
          slot[o + 2] = p.pos[2];
          slot[o + 3] = p.rot[0];
          slot[o + 4] = p.rot[1];
          slot[o + 5] = p.rot[2];
          slot[o + 6] = p.scale;
        }
      }
      head.current = (head.current + 1) % hist.current.length;
      const gap = Math.max(2, phantomGap);
      for (let gi = 0; gi < ghosts.length; gi++) {
        const src = hist.current[((head.current - 1 - (gi + 1) * gap) % hist.current.length + hist.current.length) % hist.current.length];
        if (!src) continue;
        const gs = ghosts[gi].targets;
        for (let i = 0; i < gs.length; i++) {
          const t = gs[i];
          const o = i * GHOST_STRIDE;
          t.obj.position.set(t.base[0] + src[o], t.base[1] + src[o + 1], t.base[2] + src[o + 2]);
          t.obj.rotation.set(src[o + 3] * D2R, src[o + 4] * D2R, src[o + 5] * D2R, "ZYX");
          t.obj.scale.setScalar(Math.max(0.0001, src[o + 6]));
        }
      }
    }

    if (outer.current) {
      if (pop.current > 0) pop.current = Math.max(0, pop.current - dt / 0.18);
      outer.current.scale.setScalar(1 - 0.08 * pop.current * pop.current);
    }
  });

  return (
    <group ref={outer}>
      <group position={[-8, -cy, -8]}>
        <primitive object={rig.root} />
        {ghosts.map((g, i) => (
          <primitive key={`gh${i}`} object={g.root} />
        ))}
      </group>
    </group>
  );
}

function TextureBridge() {
  const { canvas, texVersion } = useDerived();
  const texRef = useRef<THREE.CanvasTexture | null>(null);
  const texture = useMemo(() => {
    if (!canvas) return null;
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    return t;
  }, [canvas]);
  useEffect(() => {
    texRef.current = texture;
  }, [texture]);
  // アトラスが描き直されたらGPUへ再転送
  useEffect(() => {
    if (texRef.current) texRef.current.needsUpdate = true;
  }, [texVersion]);
  useEffect(() => {
    const t = texture;
    return () => {
      t?.dispose();
    };
  }, [texture]);
  return texture ? <ModelView texture={texture} /> : null;
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.55} color="#f6eedd" />
      <hemisphereLight args={["#dfe8ff", "#2a1d12", 0.45]} />
      <directionalLight
        position={[12, 22, 14]}
        intensity={2.2}
        color="#fff4e2"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
      />
      <directionalLight position={[-16, 6, -10]} intensity={0.8} color="#93b6dd" />
      <pointLight position={[-8, -4, -14]} intensity={80} distance={50} decay={2} color="#D9482B" />
    </>
  );
}

export default function Stage() {
  const { gen } = useDerived();
  const bloom = useForge((s) => s.params.view.bloom);
  const grid = useForge((s) => s.params.view.grid);
  const h = gen.bounds.max[1] - gen.bounds.min[1];
  const w = Math.max(gen.bounds.max[0] - gen.bounds.min[0], gen.bounds.max[2] - gen.bounds.min[2]);
  const span = Math.max(h, w);
  const floor = -(h / 2) - 0.6;

  return (
    <div className="absolute inset-0 overflow-hidden bg-stage">
      <Canvas
        className="!absolute inset-0"
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        camera={{ position: [16, 8, 22], fov: 30, near: 0.5, far: 400 }}
      >
        <Backdrop />
        <Lights />
        {grid && (
          <>
            <gridHelper args={[64, 64, "#4a4132", "#241f19"]} position={[0, floor - 0.02, 0]} />
            <gridHelper args={[16, 16, "#8a7240", "#3a3126"]} position={[0, floor, 0]} />
          </>
        )}
        <TextureBridge />
        <ContactShadows position={[0, floor + 0.05, 0]} scale={48} blur={2.4} opacity={0.6} far={30} color="#000000" />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          minDistance={10}
          maxDistance={110}
          minPolarAngle={0.12}
          maxPolarAngle={Math.PI * 0.94}
        />
        <CameraRig span={span} />
        <Capture />
        {bloom > 0 ? (
          <EffectComposer multisampling={4}>
            <Bloom intensity={bloom * 0.9} luminanceThreshold={0.62} luminanceSmoothing={0.25} mipmapBlur radius={0.72} />
            <Vignette eskil={false} offset={0.28} darkness={0.62} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        ) : (
          <></>
        )}
      </Canvas>
      <StageHud />
    </div>
  );
}
