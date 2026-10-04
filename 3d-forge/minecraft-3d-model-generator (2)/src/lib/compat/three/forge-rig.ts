import * as THREE from "three";
import type { Atlas, Box, Cell, ClipMap, FaceKey, Mat, V3 } from "../forge-types2";
import type { Generated } from "../forge-index";

export interface RigNode {
  obj: THREE.Object3D;
  base: V3;
  clips: ClipMap;
}

export interface Rig {
  root: THREE.Group;
  nodes: RigNode[];
  rootNode: RigNode;
  materials: Record<Mat, THREE.MeshStandardMaterial>;
  /** gen.boxes と同じ順で並ぶメッシュ（アトラスからの選択ハイライト用） */
  meshes: THREE.Mesh[];
  baseMaterials: THREE.Material[];
  highlight: THREE.MeshStandardMaterial;
  dispose: () => void;
}

/** BoxGeometry の面順（+x,-x,+y,-y,+z,-z） */
const FACE_ORDER: FaceKey[] = ["east", "west", "up", "down", "south", "north"];
const D2R = Math.PI / 180;

function geometryFor(b: Box, cell: Cell | undefined, S: number) {
  const w = b.to[0] - b.from[0];
  const h = b.to[1] - b.from[1];
  const d = b.to[2] - b.from[2];
  const geo = new THREE.BoxGeometry(w, h, d);
  if (!cell) return geo;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let f = 0; f < 6; f++) {
    const [u0, v0, u1, v1] = cell.faces[FACE_ORDER[f]];
    for (let i = 0; i < 4; i++) {
      const idx = f * 4 + i;
      const su = uv.getX(idx);
      const sv = uv.getY(idx);
      uv.setXY(idx, (u0 + (u1 - u0) * su) / S, 1 - (v0 + (1 - sv) * (v1 - v0)) / S);
    }
  }
  uv.needsUpdate = true;
  return geo;
}

export function makeMaterials(map: THREE.Texture | null, emissive: number) {
  const mk = (mat: Mat) => {
    const glowish = mat === "glow" || mat === "fx" || mat === "gem";
    const params: THREE.MeshStandardMaterialParameters = {
      color: "#ffffff",
      roughness: mat === "metal" ? 0.3 : mat === "gem" ? 0.18 : mat === "shade" ? 0.9 : glowish ? 0.5 : 0.68,
      metalness: mat === "metal" ? 0.82 : mat === "gem" ? 0.25 : 0.06,
      emissive: new THREE.Color(glowish ? "#ffffff" : "#000000"),
      emissiveIntensity: glowish ? emissive * (mat === "gem" ? 0.55 : mat === "glow" ? 0.9 : 1.1) : 0,
    };
    if (map) {
      params.map = map;
      if (glowish) params.emissiveMap = map;
    }
    const m = new THREE.MeshStandardMaterial(params);
    m.name = mat;
    return m;
  };
  return {
    base: mk("base"),
    shade: mk("shade"),
    metal: mk("metal"),
    glow: mk("glow"),
    fx: mk("fx"),
    gem: mk("gem"),
  } as Record<Mat, THREE.MeshStandardMaterial>;
}

export function buildRig(
  gen: Generated,
  atlas: Atlas,
  map: THREE.Texture | null,
  opts: { wire: boolean; emissive: number; rootClips: ClipMap }
): Rig {
  const S = atlas.size;
  const materials = makeMaterials(map, opts.emissive);
  const geoCache = new Map<string, THREE.BufferGeometry>();
  const extra: THREE.BufferGeometry[] = [];
  const lineMat = new THREE.LineBasicMaterial({ color: "#0E0D0C", transparent: true, opacity: 0.6 });
  const fxLine = new THREE.LineBasicMaterial({ color: "#D9482B", transparent: true, opacity: 0.9 });
  const highlight = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    emissive: new THREE.Color("#D9482B"),
    emissiveIntensity: 1.15,
    roughness: 0.35,
    metalness: 0.1,
  });
  const meshes: THREE.Mesh[] = [];
  const baseMaterials: THREE.Material[] = [];

  const root = new THREE.Group();
  root.name = "forge_root";
  const pivot: V3 = [8, 0, 8];
  const rootObj = new THREE.Group();
  rootObj.name = "root";
  rootObj.position.set(...pivot);
  rootObj.rotation.order = "ZYX";
  root.add(rootObj);
  const rootNode: RigNode = { obj: rootObj, base: pivot, clips: opts.rootClips };

  const nodes: RigNode[] = [];
  const nodeOf = new Map<string, THREE.Object3D>();
  gen.groups.forEach((g) => {
    const o = new THREE.Group();
    o.name = g.id;
    o.rotation.order = "ZYX";
    const base: V3 = [g.origin[0] - pivot[0], g.origin[1] - pivot[1], g.origin[2] - pivot[2]];
    o.position.set(...base);
    rootObj.add(o);
    nodeOf.set(g.id, o);
    nodes.push({ obj: o, base, clips: g.clips });
  });
  const groupOrigin = new Map(gen.groups.map((g) => [g.id, g.origin]));

  gen.boxes.forEach((b) => {
    const cell = atlas.cellOf.get(b.id);
    const key = `${cell?.key ?? b.id}|${b.to[0] - b.from[0]}|${b.to[1] - b.from[1]}|${b.to[2] - b.from[2]}|${b.rot ? `${b.rot.axis}${b.rot.angle}` : ""}`;
    let geo = geoCache.get(key);
    if (!geo) {
      geo = geometryFor(b, cell, S);
      geoCache.set(key, geo);
    }
    const mesh = new THREE.Mesh(geo, materials[b.mat]);
    mesh.name = b.name;
    mesh.castShadow = b.mat !== "fx";
    mesh.receiveShadow = true;
    const parent = nodeOf.get(b.group) ?? rootObj;
    const go = groupOrigin.get(b.group) ?? pivot;
    const c: V3 = [(b.from[0] + b.to[0]) / 2, (b.from[1] + b.to[1]) / 2, (b.from[2] + b.to[2]) / 2];
    if (b.rot) {
      const pv = new THREE.Group();
      pv.position.set(b.rot.origin[0] - go[0], b.rot.origin[1] - go[1], b.rot.origin[2] - go[2]);
      pv.rotation[b.rot.axis] = b.rot.angle * D2R;
      mesh.position.set(c[0] - b.rot.origin[0], c[1] - b.rot.origin[1], c[2] - b.rot.origin[2]);
      pv.add(mesh);
      parent.add(pv);
    } else {
      mesh.position.set(c[0] - go[0], c[1] - go[1], c[2] - go[2]);
      parent.add(mesh);
    }
    if (opts.wire) {
      const eg = new THREE.EdgesGeometry(geo, 1);
      extra.push(eg);
      const ls = new THREE.LineSegments(eg, b.mat === "fx" || b.mat === "glow" ? fxLine : lineMat);
      mesh.add(ls);
    }
    meshes.push(mesh);
    baseMaterials.push(materials[b.mat]);
  });

  return {
    root,
    nodes,
    rootNode,
    materials,
    meshes,
    baseMaterials,
    highlight,
    dispose: () => {
      geoCache.forEach((g) => g.dispose());
      extra.forEach((g) => g.dispose());
      Object.values(materials).forEach((m) => m.dispose());
      lineMat.dispose();
      fxLine.dispose();
      highlight.dispose();
    },
  };
}

/** アトラスのネット（UV共有単位）に対応するメッシュ集合を光らせる */
export function setHighlight(rig: Rig, gen: Generated, atlas: Atlas, cellKey: string | null, limit = 64) {
  if (!cellKey) {
    rig.meshes.forEach((m, i) => (m.material = rig.baseMaterials[i]));
    return 0;
  }
  let hit = 0;
  rig.meshes.forEach((m, i) => {
    const b = gen.boxes[i];
    const on = atlas.cellOf.get(b.id)?.key === cellKey && hit < limit;
    if (on) hit++;
    m.material = on ? rig.highlight : rig.baseMaterials[i];
  });
  return hit;
}

/* ─────────── 幻影（遅延ポーズを追うゴーストリグ） ─────────── */
export interface Ghost {
  root: THREE.Group;
  targets: { obj: THREE.Object3D; base: V3 }[];
  material: THREE.MeshBasicMaterial;
}

export const GHOST_STRIDE = 7;

/** 同一ジオメトリを共有した半透明の複製を n 本つくる（コストはドローコールのみ） */
export function buildGhosts(rig: Rig, nodes: RigNode[], n: number, color: string): Ghost[] {
  const out: Ghost[] = [];
  for (let i = 0; i < n; i++) {
    const clone = rig.root.clone(true);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.4 * Math.pow(0.6, i),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const kill: THREE.Object3D[] = [];
    clone.traverse((o) => {
      o.castShadow = false;
      o.receiveShadow = false;
      if ((o as THREE.LineSegments).isLineSegments) kill.push(o);
      else if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = material;
      o.frustumCulled = false; // 複製直後に姿勢が入るまで正しい包围盒が使われないため
    });
    kill.forEach((o) => o.parent?.remove(o));
    // 元リグのボーンは複製後も名前辿りで一致する（rootObj は "root"）
    const targets = nodes.map((nd) => ({
      obj: clone.getObjectByName(nd.obj.name) ?? new THREE.Object3D(),
      base: nd.base,
    }));
    out.push({ root: clone, targets, material });
  }
  return out;
}

export function disposeGhosts(ghosts: Ghost[]) {
  ghosts.forEach((g) => {
    g.material.dispose();
    g.root.clear();
  });
}

/** ポーズを適用（プレビュー毎フレーム） */
export function applyPose(n: RigNode, pos: V3, rot: V3, scale: number) {
  n.obj.position.set(n.base[0] + pos[0], n.base[1] + pos[1], n.base[2] + pos[2]);
  n.obj.rotation.set(rot[0] * D2R, rot[1] * D2R, rot[2] * D2R, "ZYX");
  n.obj.scale.setScalar(Math.max(0.0001, scale));
}
