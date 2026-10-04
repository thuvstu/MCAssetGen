import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { CLIPS, clipAnims, evaluate, sampleCount, type Atlas, type Generated, type Params } from "./forge-index";
import { slug } from "./forge-util";
import { buildRig, type RigNode } from "./three/forge-rig";
import { clipLength, download, rootClipMap } from "./forge-exp-formats";

const D2R = Math.PI / 180;

function tracksFor(n: RigNode, clip: string, length: number, loop: boolean) {
  const anims = clipAnims(n.clips, clip);
  if (!anims.length) return [];
  const N = sampleCount(anims, loop);
  const times: number[] = [];
  const pos: number[] = [];
  const quat: number[] = [];
  const scl: number[] = [];
  const e = new THREE.Euler();
  const q = new THREE.Quaternion();
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = evaluate(anims, t);
    times.push(t * length);
    pos.push(n.base[0] + p.pos[0], n.base[1] + p.pos[1], n.base[2] + p.pos[2]);
    e.set(p.rot[0] * D2R, p.rot[1] * D2R, p.rot[2] * D2R, "ZYX");
    q.setFromEuler(e);
    quat.push(q.x, q.y, q.z, q.w);
    const s = Math.max(0.0001, p.scale);
    scl.push(s, s, s);
  }
  const name = n.obj.name;
  return [
    new THREE.VectorKeyframeTrack(`${name}.position`, times, pos),
    new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, times, quat),
    new THREE.VectorKeyframeTrack(`${name}.scale`, times, scl),
  ];
}

export async function exportGlb(p: Params, gen: Generated, atlas: Atlas, canvas: HTMLCanvasElement | null) {
  let tex: THREE.Texture | null = null;
  if (canvas) {
    tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.flipY = true;
  }
  const rig = buildRig(gen, atlas, tex, { wire: false, emissive: 1, rootClips: rootClipMap(p, gen) });
  rig.root.position.set(-8, 0, -8);
  try {
    const all = [rig.rootNode, ...rig.nodes];
    const clips = CLIPS.map((c) => {
      const length = clipLength(c.id, p);
      const tracks = all.flatMap((n) => tracksFor(n, c.id, length, c.loop));
      return tracks.length ? new THREE.AnimationClip(c.id, length, tracks) : null;
    }).filter((c): c is THREE.AnimationClip => !!c);
    const exporter = new GLTFExporter();
    const out = (await exporter.parseAsync(rig.root, { binary: true, animations: clips })) as ArrayBuffer;
    download(`${slug(p.name)}.glb`, new Blob([out], { type: "model/gltf-binary" }));
    return clips.length;
  } finally {
    rig.dispose();
    tex?.dispose();
  }
}
