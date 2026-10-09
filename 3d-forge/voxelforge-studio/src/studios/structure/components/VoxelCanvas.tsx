import { useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { getBlock, isTransparent } from "../lib/minecraft-data";
import type { Structure, Vec3, VoxelSelection } from "../lib/structure";
import { mirrorPos, symmetryVariants } from "../lib/operations";

export type ToolId =
  | "brush" | "erase" | "fill" | "box" | "hollow" | "walls"
  | "sphere" | "hsphere" | "cylinder" | "line" | "picker" | "select";

export type LayerMode = "all" | "upto" | "single";

export interface VoxelCanvasProps {
  structure: Structure;
  tool: ToolId;
  layerMode: LayerMode;
  layerY: number;
  showGrid: boolean;
  showTransparent: boolean;
  autoRotate: boolean;
  pendingFirst: Vec3 | null;
  selection: VoxelSelection | null;
  mirrorX: boolean;
  mirrorZ: boolean;
  ghostColor: string;
  onCellAction: (pos: Vec3, erase: boolean) => void;
  onHover: (pos: Vec3 | null) => void;
  hoverPos: Vec3 | null;
}

const worldOf = (x: number, y: number, z: number, sx: number, sz: number): [number, number, number] => [
  x - sx / 2 + 0.5,
  y + 0.5,
  z - sz / 2 + 0.5,
];

function useCells(structure: Structure, layerMode: LayerMode, layerY: number, showTransparent: boolean) {
  return useMemo(() => {
    const [sx, sy, sz] = structure.size;
    const opaque: { pos: Vec3; color: string }[] = [];
    const transp: { pos: Vec3; color: string }[] = [];
    const visible = (y: number) => {
      if (layerMode === "all") return true;
      if (layerMode === "upto") return y <= layerY;
      return y === layerY;
    };
    for (let y = 0; y < sy; y++) {
      if (!visible(y)) continue;
      for (let z = 0; z < sz; z++) {
        for (let x = 0; x < sx; x++) {
          const c = structure.cells[(y * sz + z) * sx + x];
          if (!c) continue;
          const def = getBlock(c.id);
          const item = { pos: [x, y, z] as Vec3, color: def.color };
          if (def.transparent || isTransparent(c.id)) {
            if (showTransparent) transp.push(item);
          } else opaque.push(item);
        }
      }
    }
    return { opaque, transp };
  }, [structure, layerMode, layerY, showTransparent]);
}

function InstancedVoxels({
  items,
  sx, sz,
  transparent,
  onAction,
  onHoverMove,
}: {
  items: { pos: Vec3; color: string }[];
  sx: number;
  sz: number;
  transparent: boolean;
  onAction: (cell: Vec3, normal: Vec3, e: ThreeEvent<MouseEvent>) => void;
  onHoverMove: (cell: Vec3 | null, normal: Vec3 | null, e: ThreeEvent<PointerEvent>) => void;
  tool: ToolId;
}) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const downPos = useRef<{ x: number; y: number; btn: number } | null>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const col = new THREE.Color();
    const n = items.length;
    mesh.count = n;
    for (let i = 0; i < n; i++) {
      const [x, y, z] = items[i].pos;
      const [wx, wy, wz] = worldOf(x, y, z, sx, sz);
      m.makeTranslation(wx, wy, wz);
      mesh.setMatrixAt(i, m);
      try {
        col.set(items[i].color);
      } catch {
        col.set("#c83ac8");
      }
      mesh.setColorAt(i, col);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items, sx, sz]);

  const count = Math.max(1, items.length);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, count]}
      frustumCulled={false}
      onPointerDown={(e) => {
        downPos.current = { x: e.clientX, y: e.clientY, btn: e.button };
      }}
      onPointerUp={(e) => {
        const d = downPos.current;
        downPos.current = null;
        if (!d) return;
        const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
        if (moved > 6) return;
        if (e.instanceId === undefined) return;
        const hit = items[e.instanceId];
        if (!hit) return;
        const n = e.face?.normal ?? new THREE.Vector3(0, 1, 0);
        // ワールド法線→ローカル(回転なしなのでそのまま整数化)
        const normal: Vec3 = [Math.round(n.x), Math.round(n.y), Math.round(n.z)];
        e.stopPropagation();
        onAction(hit.pos, normal, e as unknown as ThreeEvent<MouseEvent>);
      }}
      onPointerMove={(e) => {
        if (e.instanceId === undefined) return;
        const hit = items[e.instanceId];
        if (!hit) return;
        e.stopPropagation();
        const n = e.face?.normal ?? new THREE.Vector3(0, 1, 0);
        onHoverMove(hit.pos, [Math.round(n.x), Math.round(n.y), Math.round(n.z)], e);
      }}
      onPointerOut={() => onHoverMove(null, null, null as unknown as ThreeEvent<PointerEvent>)}
    >
      <boxGeometry args={[0.96, 0.96, 0.96]} />
      {transparent ? (
        <meshStandardMaterial roughness={0.35} metalness={0.05} transparent opacity={0.72} depthWrite={false} />
      ) : (
        <meshStandardMaterial roughness={0.85} metalness={0.02} />
      )}
    </instancedMesh>
  );
}

function BoundsBox({ size }: { size: Vec3 }) {
  const [sx, sy, sz] = size;
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(sx, sy, sz)), [sx, sy, sz]);
  return (
    <lineSegments geometry={geo} position={[0, sy / 2, 0]}>
      <lineBasicMaterial color="#4ade80" transparent opacity={0.9} />
    </lineSegments>
  );
}

function Marker({ pos, size, color }: { pos: Vec3; size: Vec3; color: string }) {
  const [sx, , sz] = size;
  const [wx, wy, wz] = worldOf(pos[0], pos[1], pos[2], sx, sz);
  return (
    <mesh position={[wx, wy, wz]}>
      <boxGeometry args={[1.02, 1.02, 1.02]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.95} />
    </mesh>
  );
}

function ShapePreview({ a, b, size }: { a: Vec3; b: Vec3; size: Vec3 }) {
  const [sx, , sz] = size;
  const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]);
  const y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
  const z0 = Math.min(a[2], b[2]), z1 = Math.max(a[2], b[2]);
  const cx = (x0 + x1 + 1) / 2 - sx / 2;
  const cy = (y0 + y1 + 1) / 2;
  const cz = (z0 + z1 + 1) / 2 - sz / 2;
  return (
    <mesh position={[cx, cy, cz]}>
      <boxGeometry args={[x1 - x0 + 1, y1 - y0 + 1, z1 - z0 + 1]} />
      <meshBasicMaterial color="#4ade80" transparent opacity={0.22} depthWrite={false} />
    </mesh>
  );
}

/** 対称軸の可視化。ピンク=X軸対称、青=Z軸対称（レイキャスト対象外＝クリックを邪魔しない） */
function MirrorPlanes({ size, mirrorX, mirrorZ }: { size: Vec3; mirrorX: boolean; mirrorZ: boolean }) {
  const [sx, sy, sz] = size;
  return (
    <group>
      {mirrorX && (
        <mesh position={[0, sy / 2, 0]} rotation={[0, Math.PI / 2, 0]} raycast={() => null}>
          <planeGeometry args={[sz + 2, sy + 2]} />
          <meshBasicMaterial color="#f472b6" transparent opacity={0.09} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      {mirrorZ && (
        <mesh position={[0, sy / 2, 0]} raycast={() => null}>
          <planeGeometry args={[sx + 2, sy + 2]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.09} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

function SelectionBox({ selection, size }: { selection: VoxelSelection; size: Vec3 }) {
  const [sx, , sz] = size;
  const [x0, y0, z0] = selection.min;
  const [x1, y1, z1] = selection.max;
  const dx = x1 - x0 + 1, dy = y1 - y0 + 1, dz = z1 - z0 + 1;
  const cx = (x0 + x1 + 1) / 2 - sx / 2;
  const cy = (y0 + y1 + 1) / 2;
  const cz = (z0 + z1 + 1) / 2 - sz / 2;
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(dx + 0.06, dy + 0.06, dz + 0.06)), [dx, dy, dz]);
  return (
    <group position={[cx, cy, cz]}>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color="#38bdf8" transparent opacity={0.98} />
      </lineSegments>
      <mesh>
        <boxGeometry args={[dx, dy, dz]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.055} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Ghost({ pos, size, color }: { pos: Vec3; size: Vec3; color: string }) {
  const [sx, , sz] = size;
  const [wx, wy, wz] = worldOf(pos[0], pos[1], pos[2], sx, sz);
  return (
    <group position={[wx, wy, wz]}>
      <mesh>
        <boxGeometry args={[1.001, 1.001, 1.001]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <mesh>
        <boxGeometry args={[1.02, 1.02, 1.02]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function CameraRig({ size, resetKey }: { size: Vec3; resetKey: number }) {
  const { camera, controls } = useThree() as unknown as {
    camera: THREE.PerspectiveCamera;
    controls: { target: THREE.Vector3; update: () => void } | null;
  };
  useLayoutEffect(() => {
    const [sx, sy, sz] = size;
    const maxDim = Math.max(sx, sy, sz);
    const dist = maxDim * 1.9 + 6;
    camera.position.set(dist * 0.7, dist * 0.62, dist * 0.7);
    camera.near = 0.1;
    camera.far = 1000;
    camera.updateProjectionMatrix();
    if (controls) {
      controls.target.set(0, sy / 2 - 0.5, 0);
      controls.update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);
  return null;
}

function Scene(props: VoxelCanvasProps & { resetKey: number; ghostTarget: Vec3 | null; ghostErase: boolean; hoverNormal: Vec3 | null }) {
  const { structure, showGrid, autoRotate, pendingFirst, hoverPos, ghostTarget, ghostColor } = props;
  const [sx, sy, sz] = structure.size;
  const { opaque, transp } = useCells(structure, props.layerMode, props.layerY, props.showTransparent);
  const groundDown = useRef<{ x: number; y: number; button: number } | null>(null);

  const handleVoxelAction = useCallback(
    (cell: Vec3, normal: Vec3, e: ThreeEvent<MouseEvent>) => {
      const right = (e as unknown as { button?: number }).button === 2;
      // eraseツール or 右クリック → そのセル自体 / picker → そのセル / それ以外 → 法線方向
      if (props.tool === "erase" || right) {
        props.onCellAction(cell, true);
      } else if (props.tool === "picker" || props.tool === "fill") {
        props.onCellAction(cell, false);
      } else {
        // 形状ツールはセル自体を頂点として扱う
        if (["box", "hollow", "walls", "sphere", "hsphere", "cylinder", "line", "select"].includes(props.tool)) {
          props.onCellAction(cell, false);
        } else {
          const t: Vec3 = [cell[0] + normal[0], cell[1] + normal[1], cell[2] + normal[2]];
          // 範囲外ならセル自体にフォールバック
          if (t[0] < 0 || t[1] < 0 || t[2] < 0 || t[0] >= sx || t[1] >= sy || t[2] >= sz) {
            props.onCellAction(cell, false);
          } else {
            props.onCellAction(t, false);
          }
        }
      }
    },
    [props, sx, sy, sz]
  );

  const handleHoverMove = useCallback(
    (cell: Vec3 | null, normal: Vec3 | null) => {
      if (!cell || !normal) {
        props.onHover(null);
        return;
      }
      if (props.tool === "erase") {
        props.onHover(cell);
        return;
      }
      if (["box", "hollow", "walls", "sphere", "hsphere", "cylinder", "line", "select", "fill", "picker"].includes(props.tool)) {
        props.onHover(cell);
        return;
      }
      const t: Vec3 = [cell[0] + normal[0], cell[1] + normal[1], cell[2] + normal[2]];
      if (t[0] < 0 || t[1] < 0 || t[2] < 0 || t[0] >= sx || t[1] >= sy || t[2] >= sz) {
        props.onHover(cell);
      } else {
        // 既にブロックがある面に置こうとした場合はセル自体をハイライト
        const existing = structure.cells[(t[1] * sz + t[2]) * sx + t[0]];
        props.onHover(existing ? cell : t);
      }
    },
    [props, structure.cells, sx, sy, sz]
  );

  return (
    <>
      <CameraRig size={structure.size} resetKey={props.resetKey} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[12, 20, 8]} intensity={1.15} castShadow />
      <directionalLight position={[-10, 8, -10]} intensity={0.35} />
      <hemisphereLight args={["#bfe8ff", "#1a2b1a", 0.5]} />

      {showGrid && (
        <gridHelper args={[Math.max(sx, sz) + 8, Math.max(sx, sz) + 8, "#22c55e", "#1f3a2a"]} position={[0, 0.01, 0]} />
      )}
      {/* 地面クリック用プレーン */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerDown={(e) => {
          groundDown.current = { x: e.clientX, y: e.clientY, button: e.button };
        }}
        onPointerUp={(e) => {
          const d = groundDown.current;
          groundDown.current = null;
          if (!d) return;
          if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return;
          if (props.tool === "erase" || props.tool === "picker" || props.tool === "fill") return;
          const p = e.point;
          const gx = Math.floor(p.x + sx / 2);
          const gz = Math.floor(p.z + sz / 2);
          if (gx < 0 || gz < 0 || gx >= sx || gz >= sz) return;
          e.stopPropagation();
          props.onCellAction(
            [gx, props.layerMode === "single" ? Math.min(props.layerY, sy - 1) : 0, gz],
            d.button === 2
          );
        }}
        onPointerMove={(e) => {
          if (["box", "hollow", "walls", "sphere", "hsphere", "cylinder", "line", "select"].includes(props.tool)) return;
          const p = e.point;
          const gx = Math.floor(p.x + sx / 2);
          const gz = Math.floor(p.z + sz / 2);
          if (gx < 0 || gz < 0 || gx >= sx || gz >= sz) return;
          if (props.tool === "brush") props.onHover([gx, props.layerMode === "single" ? Math.min(props.layerY, sy - 1) : 0, gz]);
        }}
      >
        <planeGeometry args={[Math.max(sx, sz) + 8, Math.max(sx, sz) + 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {opaque.length > 0 && (
        <InstancedVoxels items={opaque} sx={sx} sz={sz} transparent={false} onAction={handleVoxelAction} onHoverMove={handleHoverMove} tool={props.tool} />
      )}
      {transp.length > 0 && (
        <InstancedVoxels items={transp} sx={sx} sz={sz} transparent onAction={handleVoxelAction} onHoverMove={handleHoverMove} tool={props.tool} />
      )}

      <BoundsBox size={structure.size} />
      <MirrorPlanes size={structure.size} mirrorX={props.mirrorX} mirrorZ={props.mirrorZ} />
      {ghostTarget &&
        !pendingFirst &&
        (props.tool === "brush" || props.tool === "erase") &&
        symmetryVariants(props.mirrorX, props.mirrorZ)
          .slice(1)
          .map((v) => {
            const q = mirrorPos(ghostTarget, structure.size, v);
            if (q.join() === ghostTarget.join()) return null;
            return (
              <Ghost
                key={`mirror-${v.flipX ? 1 : 0}${v.flipZ ? 1 : 0}`}
                pos={q}
                size={structure.size}
                color={props.tool === "erase" ? "#ef4444" : ghostColor}
              />
            );
          })}
      {props.selection && <SelectionBox selection={props.selection} size={structure.size} />}
      {pendingFirst && <Marker pos={pendingFirst} size={structure.size} color="#facc15" />}
      {pendingFirst && hoverPos && <ShapePreview a={pendingFirst} b={hoverPos} size={structure.size} />}
      {ghostTarget && !pendingFirst && props.tool !== "select" && (
        <Ghost pos={ghostTarget} size={structure.size} color={props.tool === "erase" ? "#ef4444" : ghostColor} />
      )}

      <OrbitControls
        makeDefault
        enableDamping
        autoRotate={autoRotate}
        autoRotateSpeed={1.2}
        maxPolarAngle={Math.PI / 2 + 0.15}
        minDistance={3}
        maxDistance={160}
      />
    </>
  );
}

export default function VoxelCanvas(props: VoxelCanvasProps) {
  const [resetKey, setResetKey] = useState(0);
  const erase = props.tool === "erase";
  // ゴースト位置: hoverPosをそのまま使う (Scene側で配置先に変換済み)
  const ghostTarget = props.hoverPos;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-emerald-900/60 bg-[#0a0f0d]">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true }}
        onContextMenu={(e) => e.preventDefault()}
        onPointerMissed={() => props.onHover(null)}
      >
        <color attach="background" args={["#0a0f0d"]} />
        <fog attach="fog" args={["#0a0f0d", 60, 140]} />
        <Scene {...props} resetKey={resetKey} ghostTarget={ghostTarget} ghostErase={erase} hoverNormal={null} />
      </Canvas>

      {/* オーバーレイUI */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
        <div className="rounded-md bg-black/60 px-2.5 py-1.5 font-mono text-[11px] leading-tight text-emerald-200 backdrop-blur">
          <div>
            size <span className="text-white">{props.structure.size.join(" × ")}</span>
          </div>
          <div>
            hover{" "}
            <span className="text-white">{props.hoverPos ? `[${props.hoverPos.join(", ")}]` : "—"}</span>
            {props.pendingFirst && (
              <span className="ml-2 text-yellow-300">始点 [{props.pendingFirst.join(", ")}]</span>
            )}
          </div>
          {props.selection && (
            <div className="text-sky-300">
              selection [{props.selection.min.join(",")}] - [{props.selection.max.join(",")}]
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-3 left-3 flex gap-2">
        <button
          onClick={() => setResetKey((k) => k + 1)}
          className="pointer-events-auto rounded-md border border-emerald-800 bg-black/60 px-2.5 py-1.5 text-[11px] text-emerald-200 backdrop-blur transition hover:bg-emerald-900/60"
        >
          視点をリセット
        </button>
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-black/60 px-2.5 py-1.5 text-[11px] text-zinc-400 backdrop-blur">
        左クリック: 設置 / 右クリック: 削除 ・ ドラッグ: 回転 ・ ホイール: ズーム
      </div>
    </div>
  );
}
