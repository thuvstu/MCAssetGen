import { useEffect, useRef, useState } from "react";
import { images } from "@/assets";
import { getArchetype } from "@/data/archetypes";
import { subscribeClock } from "@/lib/clock";
import { combatScore, estimateHitbox, rankOf, resolveParts } from "@/lib/model";
import { soundSynth } from "@/lib/audio";
import type { MobDraft, ResolvedPart, Vec3 } from "@/types";

type Pose = "idle" | "walk" | "attack" | "hurt" | "death" | "roar";

interface Props {
  mob: MobDraft;
  miniature?: boolean;
  selectedPart?: string | null;
  onSelectPart?: (id: string) => void;
  className?: string;
}

interface FaceDraw {
  partId: string;
  pts: [number, number][];
  depth: number;
  color: string;
  alpha: number;
  selected: boolean;
  eye: boolean;
}

function rotX(x: number, y: number, z: number, a: number): [number, number, number] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}
function rotY(x: number, y: number, z: number, a: number): [number, number, number] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c + z * s, y, -x * s + z * c];
}
function rotZ(x: number, y: number, z: number, a: number): [number, number, number] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c - y * s, x * s + y * c, z];
}

function applyAround(p: Vec3, pivot: Vec3, rot: Vec3, trans: Vec3): Vec3 {
  let x = p[0] - pivot[0];
  let y = p[1] - pivot[1];
  let z = p[2] - pivot[2];
  [x, y, z] = rotX(x, y, z, rot[0]);
  [x, y, z] = rotY(x, y, z, rot[1]);
  [x, y, z] = rotZ(x, y, z, rot[2]);
  return [x + pivot[0] + trans[0], y + pivot[1] + trans[1], z + pivot[2] + trans[2]];
}

function shade(hex: string, light: number): string {
  const n = hex.replace("#", "");
  if (n.length < 6) return hex;
  const ch = (i: number) => Math.min(255, Math.max(0, Math.round(parseInt(n.slice(i, i + 2), 16) * light)));
  return `rgb(${ch(0)},${ch(2)},${ch(4)})`;
}

function mixWhite(hex: string, t: number): string {
  const n = hex.replace("#", "");
  if (n.length < 6) return hex;
  const mix = (i: number) => {
    const c = parseInt(n.slice(i, i + 2), 16);
    return Math.round(c + (255 - c) * t);
  };
  return `rgb(${mix(0)},${mix(2)},${mix(4)})`;
}

function animOf(part: ResolvedPart, pose: Pose, time: number, hover: boolean) {
  const def = part.def;
  const rot: Vec3 = [(def.rotation[0] * Math.PI) / 180, (def.rotation[1] * Math.PI) / 180, (def.rotation[2] * Math.PI) / 180];
  const trans: Vec3 = [0, 0, 0];
  let pulse = 1;
  const walk = pose === "walk";
  const speed = walk ? 7.1 : 2.1;
  const s = Math.sin(time * speed + def.phase);
  if (def.anim === "swing" && walk) {
    const idx = def.axis === "y" ? 1 : def.axis === "z" ? 2 : 0;
    rot[idx] += s * def.amp;
  }
  if (pose === "attack" && def.group === "arm") {
    rot[0] += -1.05 + Math.sin(time * 5.4) * 0.8;
  } else if (pose === "attack" && def.anim === "swing" && def.group === "leg") {
    rot[0] += s * def.amp * 0.4;
  }
  if (def.anim === "flap") {
    rot[2] += Math.sin(time * (hover ? 8.2 : 3.4) + def.phase) * (hover ? 0.58 : 0.26);
  }
  if (def.anim === "wag") rot[1] += Math.sin(time * (walk ? 8 : 3.1) + def.phase) * def.amp;
  if (def.anim === "look" && pose !== "attack") {
    rot[1] += Math.sin(time * 0.72 + def.phase) * 0.2;
    rot[0] += Math.sin(time * 0.46 + def.phase) * 0.07;
  }
  if (def.anim === "look" && pose === "attack") rot[0] += 0.28;
  if (def.anim === "wave") {
    rot[1] += Math.sin(time * 3.05 + def.phase) * def.amp;
    rot[0] += Math.sin(time * 3.05 + def.phase) * 0.07;
  }
  if (def.anim === "bob") trans[1] += Math.sin(time * (walk ? 7.1 : 2.05)) * (walk ? 0.42 : 0.16);
  if (def.anim === "pulse") pulse = 1 + Math.sin(time * 2.5 + def.phase) * 0.045;
  if (pose === "hurt" && (def.group === "body" || def.group === "head")) rot[2] += 0.16;
  if (pose === "roar") {
    if (def.group === "head") {
      rot[0] += -0.45;
      rot[1] += Math.sin(time * 16) * 0.06;
    }
    if (def.group === "arm") rot[0] += -1.3;
  }
  if (pose === "death") {
    rot[2] += Math.PI / 2; // 横倒れ
    trans[1] -= 8;
  }
  return { rot, trans, pulse };
}

function toView(x: number, y: number, z: number, yaw: number, pitch: number): Vec3 {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const x1 = x * c - z * s;
  const z1 = x * s + z * c;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
}

function pointInPoly(x: number, y: number, pts: [number, number][]) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0];
    const yi = pts[i][1];
    const xj = pts[j][0];
    const yj = pts[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.00001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

const FACE_DEF: { ids: number[]; n: Vec3 }[] = [
  { ids: [0, 1, 3, 2], n: [0, 0, -1] },
  { ids: [4, 6, 7, 5], n: [0, 0, 1] },
  { ids: [0, 2, 6, 4], n: [-1, 0, 0] },
  { ids: [1, 5, 7, 3], n: [1, 0, 0] },
  { ids: [0, 4, 5, 1], n: [0, -1, 0] },
  { ids: [2, 3, 7, 6], n: [0, 1, 0] },
];

interface Spark {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  max: number;
}

export function Viewport({ mob, miniature, selectedPart, onSelectPart, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const yaw = useRef(Math.PI + 0.62);
  const pitch = useRef(0.48);
  const zoomUser = useRef(1);
  const auto = useRef(!!miniature);
  const poseRef = useRef<Pose>(miniature ? "walk" : "idle");
  const propsRef = useRef({ mob, miniature, selectedPart, onSelectPart });
  propsRef.current = { mob, miniature, selectedPart, onSelectPart };
  const facesRef = useRef<FaceDraw[]>([]);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const sparks = useRef<Spark[]>([]);
  const bg = useRef<HTMLImageElement | null>(null);
  const [pose, setPose] = useState<Pose>(miniature ? "walk" : "idle");
  const [spin, setSpin] = useState(!!miniature);
  const [hoverName, setHoverName] = useState<string | null>(null);
  poseRef.current = pose;
  auto.current = spin || !!miniature;

  useEffect(() => {
    const img = new Image();
    img.src = images.deepslate;
    img.onload = () => {
      bg.current = img;
    };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (miniature) return;
      e.preventDefault();
      zoomUser.current = Math.min(2.3, Math.max(0.45, zoomUser.current * (e.deltaY > 0 ? 0.92 : 1.08)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [miniature]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let last = performance.now();

    let miniKey = "";
    const draw = (time: number) => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (auto.current && !drag.current) yaw.current += dt * (miniature ? 0.35 : 0.28);
      if (miniature) {
        const key = `${Math.floor(time * 10)}:${propsRef.current.mob.uid}`;
        if (key === miniKey) return;
        miniKey = key;
      }

      const { mob: current, selectedPart: sel } = propsRef.current;
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, miniature ? 1.25 : 2);
      const w = Math.max(2, rect.width);
      const h = Math.max(2, rect.height);
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (bg.current && !miniature) {
        const iw = bg.current.width;
        const ih = bg.current.height;
        const scale = Math.max(w / iw, h / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        ctx.drawImage(bg.current, (w - dw) / 2, (h - dh) / 2, dw, dh);
      } else {
        ctx.fillStyle = "#12161a";
        ctx.fillRect(0, 0, w, h);
      }
      ctx.fillStyle = miniature ? "rgba(8,10,12,0.35)" : "rgba(8,10,12,0.42)";
      ctx.fillRect(0, 0, w, h);

      const arch = getArchetype(current.archetype);
      const parts = resolveParts(current);
      const byId = new Map(parts.map((p) => [p.def.id, p]));
      const poseNow = poseRef.current;
      const motion = arch.motion;
      const animCache = new Map<string, ReturnType<typeof animOf>>();
      const getAnim = (p: ResolvedPart) => {
        let a = animCache.get(p.def.id);
        if (!a) {
          a = animOf(p, poseNow, time, motion === "hover");
          animCache.set(p.def.id, a);
        }
        return a;
      };

      const squash = motion === "squash" ? Math.abs(Math.sin(time * 3)) : 0;
      const gy =
        (motion === "hover" ? Math.sin(time * 2) * 1.25 + 3.2 : 0) +
        (motion === "swim" ? Math.sin(time * 1.25) * 0.65 : 0) +
        (motion === "squash" ? squash * 1.7 : 0);
      const gx = poseNow === "hurt" ? 1.1 : 0;
      const gz = poseNow === "attack" ? -Math.max(0, Math.sin(time * 5.2)) * 1.7 : 0;

      const worldOf = (part: ResolvedPart) => {
        const corners: Vec3[] = [];
        const normals: Vec3[] = [];
        for (let i = 0; i < 8; i++) {
          let p: Vec3 = [
            part.origin[0] + ((i & 1) !== 0 ? part.size[0] : 0),
            part.origin[1] + ((i & 2) !== 0 ? part.size[1] : 0),
            part.origin[2] + ((i & 4) !== 0 ? part.size[2] : 0),
          ];
          const own = getAnim(part);
          p = [
            part.pivot[0] + (p[0] - part.pivot[0]) * own.pulse,
            part.pivot[1] + (p[1] - part.pivot[1]) * own.pulse,
            part.pivot[2] + (p[2] - part.pivot[2]) * own.pulse,
          ];
          p = applyAround(p, part.pivot, own.rot, own.trans);
          let cursor: ResolvedPart | undefined = part;
          const seen = new Set<string>([part.def.id]);
          let depth = 0;
          while (cursor.def.attach && depth < 5) {
            const parent = byId.get(cursor.def.attach);
            if (!parent || seen.has(parent.def.id)) break;
            seen.add(parent.def.id);
            const pa = getAnim(parent);
            p = applyAround(p, parent.pivot, pa.rot, pa.trans);
            cursor = parent;
            depth += 1;
          }
          let x = p[0];
          let y = p[1];
          let z = p[2];
          if (squash) {
            x *= 1 + squash * 0.07;
            y *= 1 - squash * 0.09;
            z *= 1 + squash * 0.07;
          }
          x = x * current.scale + gx;
          y = y * current.scale + gy;
          z = z * current.scale + gz;
          corners.push([x, y, z]);
        }
        const rotateNormal = (n: Vec3): Vec3 => {
          let p = applyAround(n, [0, 0, 0], getAnim(part).rot, [0, 0, 0]);
          let cursor: ResolvedPart | undefined = part;
          const seen = new Set<string>([part.def.id]);
          let depth = 0;
          while (cursor.def.attach && depth < 5) {
            const parent = byId.get(cursor.def.attach);
            if (!parent || seen.has(parent.def.id)) break;
            seen.add(parent.def.id);
            p = applyAround(p, [0, 0, 0], getAnim(parent).rot, [0, 0, 0]);
            cursor = parent;
            depth += 1;
          }
          return p;
        };
        for (const face of FACE_DEF) normals.push(rotateNormal(face.n));
        return { corners, normals };
      };

      const mobPoints: Vec3[] = [];
      const prepared = parts.map((part) => {
        const data = worldOf(part);
        mobPoints.push(...data.corners);
        return { part, ...data };
      });

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      const viewedBounds = mobPoints.map((p) => toView(p[0], p[1], p[2], yaw.current, pitch.current));
      for (const p of viewedBounds) {
        minX = Math.min(minX, p[0]);
        maxX = Math.max(maxX, p[0]);
        minY = Math.min(minY, p[1]);
        maxY = Math.max(maxY, p[1]);
      }
      if (!Number.isFinite(minX) || !Number.isFinite(maxX)) {
        minX = -8;
        maxX = 8;
        minY = 0;
        maxY = 24;
      }
      const spanX = Math.max(10, maxX - minX);
      const spanY = Math.max(10, maxY - minY);
      const fit = Math.min((w * (miniature ? 0.78 : 0.7)) / spanX, (h * (miniature ? 0.72 : 0.64)) / spanY);
      const zoom = fit * zoomUser.current;
      const cx = w / 2 - ((minX + maxX) / 2) * zoom;
      const cy = h / 2 + ((minY + maxY) / 2) * zoom + h * (miniature ? 0.02 : 0.03);
      const project = (x: number, y: number, z: number) => {
        const v = toView(x, y, z, yaw.current, pitch.current);
        return { sx: cx + v[0] * zoom, sy: cy - v[1] * zoom, depth: v[2], n: v };
      };

      const dim = current.spawn.dimensions[0];
      const floor =
        dim === "the_nether"
          ? { top: "#6d3330", side: "#4a2422", lite: "#8a4540" }
          : dim === "the_end"
            ? { top: "#d4d0a4", side: "#b4b08a", lite: "#ece8c0" }
            : current.spawn.biomes.includes("deep_dark")
              ? { top: "#14383a", side: "#1b2428", lite: "#1d5552" }
              : { top: "#5b9840", side: "#8a6840", lite: "#6cb14c" };
      const grid = miniature ? 1 : 2;
      const faces: FaceDraw[] = [];
      const pushBox = (
        origin: Vec3,
        size: Vec3,
        color: string,
        alpha: number,
        partId: string,
        selected: boolean,
        eye: boolean,
        normalsReady?: Vec3[],
        cornersReady?: Vec3[],
        sideColor?: string,
      ) => {
        const corners =
          cornersReady ??
          Array.from({ length: 8 }, (_, i) => {
            const p: Vec3 = [
              origin[0] + ((i & 1) !== 0 ? size[0] : 0),
              origin[1] + ((i & 2) !== 0 ? size[1] : 0),
              origin[2] + ((i & 4) !== 0 ? size[2] : 0),
            ];
            return p;
          });
        FACE_DEF.forEach((face, fi) => {
          const n = normalsReady ? normalsReady[fi] : face.n;
          const vn = toView(n[0], n[1], n[2], yaw.current, pitch.current);
          if (vn[2] <= 0.02) return;
          const pts = face.ids.map((id) => {
            const c = corners[id];
            const pr = project(c[0], c[1], c[2]);
            return [pr.sx, pr.sy, pr.depth] as [number, number, number];
          });
          const depth = pts.reduce((a, p) => a + p[2], 0) / pts.length;
          const lightDir = toView(0.32, 1, 0.22, yaw.current, pitch.current);
          const fillDir = toView(-0.4, 0.25, 0.6, yaw.current, pitch.current);
          const ln = Math.hypot(lightDir[0], lightDir[1], lightDir[2]) || 1;
          const fn = Math.hypot(vn[0], vn[1], vn[2]) || 1;
          const nd = Math.max(0, (vn[0] * lightDir[0] + vn[1] * lightDir[1] + vn[2] * lightDir[2]) / (fn * ln));
          const fd = Math.max(0, (vn[0] * fillDir[0] + vn[1] * fillDir[1] + vn[2] * fillDir[2]) / (fn * (Math.hypot(fillDir[0], fillDir[1], fillDir[2]) || 1)));
          let bright = 0.34 + nd * 0.58 + fd * 0.16;
          if (eye) bright += 0.4;
          if (current.glow && eye) bright += 0.25;
          let col = sideColor && n[1] <= 0.6 ? sideColor : color;
          if (poseNow === "hurt" && partId) col = mixWhite(col, 0.5);
          faces.push({
            partId,
            pts: pts.map((p) => [p[0], p[1]]),
            depth,
            color: shade(col, bright),
            alpha,
            selected,
            eye,
          });
        });
      };

      for (let x = -grid; x <= grid; x++) {
        for (let z = -grid; z <= grid; z++) {
          const center = x === 0 && z === 0;
          pushBox([x * 16, -16, z * 16], [16, 16, 16], center ? floor.lite : floor.top, 1, "", false, false, undefined, undefined, floor.side);
        }
      }

      if (current.glow && !miniature) {
        const c = project(0, 12 * current.scale, 0);
        const grd = ctx.createRadialGradient(c.sx, c.sy, 8, c.sx, c.sy, 140 * zoomUser.current);
        grd.addColorStop(0, `${current.colors.accent}55`);
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(c.sx, c.sy, 160, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const item of prepared) {
        pushBox(
          [0, 0, 0],
          [1, 1, 1],
          item.part.color,
          item.part.opacity,
          item.part.def.id,
          item.part.def.id === sel,
          item.part.def.slot === "eye",
          item.normals,
          item.corners,
        );
      }

      const floorFaces = faces.filter((f) => !f.partId);
      const mobFaces = faces.filter((f) => f.partId);
      floorFaces.sort((a, b) => a.depth - b.depth);
      mobFaces.sort((a, b) => a.depth - b.depth);
      const paint = (list: FaceDraw[]) => {
        for (const face of list) {
          ctx.beginPath();
          face.pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
          ctx.closePath();
          ctx.globalAlpha = face.alpha;
          ctx.fillStyle = face.color;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.lineWidth = miniature ? 0.6 : 1;
          ctx.strokeStyle = face.selected ? "rgba(61,220,132,0.95)" : "rgba(0,0,0,0.38)";
          ctx.stroke();
        }
      };
      paint(floorFaces);
      const foot = project(0, 0.2, 0);
      const radius = Math.max(18, ((estimateHitbox(current).width * 16) / 2) * zoom * 0.85);
      ctx.beginPath();
      ctx.ellipse(foot.sx, foot.sy, radius, radius * 0.42, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.fill();
      paint(mobFaces);
      facesRef.current = mobFaces;

      if (current.particles !== "none") {
        const bounds = estimateHitbox(current);
        if (sparks.current.length < (miniature ? 8 : 22) && Math.random() < 0.6) {
          sparks.current.push({
            x: (Math.random() - 0.5) * bounds.width * 16,
            y: Math.random() * bounds.height * 16,
            z: (Math.random() - 0.5) * bounds.width * 16,
            vx: (Math.random() - 0.5) * 0.4,
            vy: current.particles === "cherry" || current.particles === "ash" || current.particles === "drip" ? -0.4 : 0.5,
            vz: (Math.random() - 0.5) * 0.4,
            life: 0,
            max: 1.2 + Math.random(),
          });
        }
        const color =
          current.particles === "soul"
            ? "#7ee0e0"
            : current.particles === "enchant"
              ? "#c9a6ff"
              : current.particles === "spore"
                ? "#b6e37a"
                : current.particles === "electric"
                  ? "#d7c6ff"
                  : current.particles === "cherry"
                    ? "#ffb7c5"
                    : current.particles === "drip"
                      ? "#8ec8ff"
                      : current.particles === "ash"
                        ? "#b9b2a8"
                        : current.particles === "note"
                          ? "#e2b657"
                          : "#ff9a3c";
        sparks.current = sparks.current.filter((s) => s.life < s.max);
        for (const s of sparks.current) {
          s.life += dt;
          s.x += s.vx;
          s.y += s.vy;
          s.z += s.vz;
          const p = project(s.x, s.y, s.z);
          ctx.globalAlpha = 1 - s.life / s.max;
          ctx.fillStyle = color;
          ctx.fillRect(p.sx, p.sy, miniature ? 2 : 3, miniature ? 2 : 3);
          ctx.globalAlpha = 1;
        }
      } else {
        sparks.current = [];
      }

      if (!miniature) {
        const grd = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.72);
        grd.addColorStop(0, "transparent");
        grd.addColorStop(1, "rgba(0,0,0,0.35)");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
      }
    };

    const stop = subscribeClock(draw);
    const ro = new ResizeObserver(() => draw(performance.now() / 1000));
    ro.observe(wrap);
    return () => {
      stop();
      ro.disconnect();
    };
  }, [miniature]);

  const pick = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best: FaceDraw | null = null;
    for (const face of facesRef.current) {
      if (!face.partId) continue;
      if (!pointInPoly(x, y, face.pts)) continue;
      if (!best || face.depth > best.depth) best = face;
    }
    return best;
  };

  const box = estimateHitbox(mob);
  const score = combatScore(mob);
  const rank = rankOf(score);
  const arch = getArchetype(mob.archetype);

  return (
    <div ref={wrapRef} className={`relative h-full min-h-[280px] overflow-hidden bg-[#101214] ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => {
          if (miniature) return;
          drag.current = { x: e.clientX, y: e.clientY, moved: false };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (miniature) return;
          if (drag.current) {
            const dx = e.clientX - drag.current.x;
            const dy = e.clientY - drag.current.y;
            if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true;
            yaw.current += dx * 0.01;
            pitch.current = Math.min(1.35, Math.max(0.08, pitch.current + dy * 0.008));
            drag.current.x = e.clientX;
            drag.current.y = e.clientY;
          } else {
            const hit = pick(e.clientX, e.clientY);
            const part = hit ? resolveParts(mob).find((p) => p.def.id === hit.partId) : undefined;
            setHoverName(part?.def.name ?? null);
          }
        }}
        onPointerUp={(e) => {
          if (miniature) return;
          const moved = drag.current?.moved;
          drag.current = null;
          if (!moved) {
            const hit = pick(e.clientX, e.clientY);
            if (hit?.partId) onSelectPart?.(hit.partId);
          }
        }}
        onPointerLeave={() => setHoverName(null)}
      />
      {!miniature && (
        <>
          <div className="pointer-events-none absolute left-4 top-4 max-w-[70%]">
            <div className="text-[10px] font-semibold tracking-[0.22em] text-emerald">LIVE PREVIEW</div>
            <div className="mt-1 truncate text-2xl font-black tracking-tight text-cream">{mob.displayName}</div>
            <div className="mt-0.5 font-mono text-[11px] text-muted">
              {mob.modId}:{mob.entityId}
            </div>
          </div>
          <div className="pointer-events-none absolute right-4 top-4 flex flex-col items-end gap-1">
            <span className="rounded-full bg-black/40 px-2 py-0.5 font-mono text-[11px] text-gold ring-1 ring-gold/30">{rank}</span>
            <span className="rounded-full bg-black/35 px-2 py-0.5 text-[10px] text-cream/80">{arch.name} · {arch.variants.find((v) => v.id === mob.variant)?.name}</span>
          </div>
          <div className="pointer-events-none absolute bottom-16 left-4 font-mono text-[10px] text-cream/70">
            当たり {box.width} × {box.height} · 目 {box.eye} · 戦闘力 {score}
            {hoverName ? ` · ${hoverName}` : " · ドラッグで回転"}
          </div>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/55 p-1 backdrop-blur-md">
            {(
              [
                ["idle", "待機", () => {}],
                ["walk", "歩行", () => soundSynth.playStep(1.0)],
                ["attack", "攻撃", () => soundSynth.playAttack(1.0, mob.behaviors.includes("ranged"))],
                ["roar", "咆哮", () => soundSynth.playAmbient(1.2, true, mob.undead, false)],
                ["hurt", "被弾", () => soundSynth.playHurt(1.0, mob.armor > 8)],
                ["death", "死亡", () => soundSynth.playDeath(1.0)],
              ] as [Pose, string, () => void][]
            ).map(([p, label, triggerSound]) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPose(p);
                  triggerSound();
                }}
                className={`rounded-full px-2.5 py-1 text-[11px] ${pose === p ? "bg-emerald text-ink font-bold" : "text-cream/80 hover:bg-white/10"}`}
              >
                {label}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-white/15" />
            <button type="button" className="rounded-full px-2 py-1 text-[11px] text-cream/80 hover:bg-white/10" onClick={() => { yaw.current = Math.PI; pitch.current = 0.18; }}>
              正面
            </button>
            <button type="button" className="rounded-full px-2 py-1 text-[11px] text-cream/80 hover:bg-white/10" onClick={() => { yaw.current = Math.PI + Math.PI / 2; pitch.current = 0.32; }}>
              横
            </button>
            <button type="button" className="rounded-full px-2 py-1 text-[11px] text-cream/80 hover:bg-white/10" onClick={() => { yaw.current = Math.PI + 0.62; pitch.current = 0.48; zoomUser.current = 1; }}>
              斜め
            </button>
            <button
              type="button"
              onClick={() => setSpin((v) => !v)}
              className={`rounded-full px-2.5 py-1 text-[11px] ${spin ? "bg-gold text-ink" : "text-cream/80 hover:bg-white/10"}`}
            >
              回転
            </button>
            <button
              type="button"
              className="rounded-full px-2 py-1 text-[11px] text-cream/80 hover:bg-white/10"
              onClick={() => {
                const c = canvasRef.current;
                if (!c) return;
                const a = document.createElement("a");
                a.href = c.toDataURL("image/png");
                a.download = `${mob.entityId}-preview.png`;
                a.click();
              }}
            >
              PNG
            </button>
          </div>
        </>
      )}
    </div>
  );
}
