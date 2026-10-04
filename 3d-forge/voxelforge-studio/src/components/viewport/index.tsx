"use client";
import { memo, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  ACTIONS,
  actionPivotY,
  isActiveAction,
  sampleAction,
} from "@/lib/animation/actions";
import { sampleFloating } from "@/lib/animation/floating";
import { EFFECT_PROFILES } from "@/lib/effect-profiles";
import {
  RIG_IDS,
  type AnimationStyle,
  type ActionStyle,
  type PartRig,
} from "@/lib/model-types";
import { createModelBatches, nameAtIntersection } from "./batched-model";
import {
  createPixelEffect,
  updatePixelEffect,
  type PixelEffect,
} from "./pixel-effects";
import ViewportFallback from "./fallback";
import { clearGroup, createGlowLight, createTexture } from "./model-objects";
import {
  BASE_ZOOM,
  cameraPositionFor,
  createScene,
  DEFAULT_ROTATION,
  type SceneHandles,
} from "./scene";
import type { ViewportProps } from "./types";
export type { ViewportProps } from "./types";

interface DynamicScene {
  texture?: THREE.Texture;
  particles?: PixelEffect;
  light?: THREE.PointLight;
  groups: Map<string, THREE.Group>;
  centres: Map<string, THREE.Vector3>;
  meshes: THREE.Mesh[];
  pivotY: number;
}
const empty = (): DynamicScene => ({
  groups: new Map(),
  centres: new Map(),
  meshes: [],
  pivotY: 0,
});
const DEG = Math.PI / 180;
function ModelViewport(props: ViewportProps) {
  const host = useRef<HTMLDivElement>(null),
    handles = useRef<SceneHandles | null>(null),
    dynamic = useRef<DynamicScene>(empty());
  const latest = useRef(props);
  latest.current = props;
  const motion = useRef({
    animation: "none" as AnimationStyle,
    action: "none" as ActionStyle,
    time: 0,
    lastScrub: -1,
  });
  const selection = useRef<THREE.LineSegments | null>(null);
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false);
  const invalidated = useRef(true),
    textureSource = useRef("");

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    const scene = createScene(container, (value) =>
      latest.current.onZoomChange(value),
    );
    if (!scene) {
      setFailed(true);
      return;
    }
    handles.current = scene;
    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      new THREE.LineBasicMaterial({ color: "#e4c8ff", depthTest: false }),
    );
    outline.renderOrder = 20;
    outline.visible = false;
    selection.current = outline;
    scene.contentGroup.add(outline);
    const resize = new ResizeObserver(() => {
      scene.resize();
      invalidated.current = true;
    });
    resize.observe(container);
    let visible = true;
    const intersection = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      invalidated.current = true;
    });
    intersection.observe(container);
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2(),
      down = new THREE.Vector2();
    const pointerDown = (e: PointerEvent) => down.set(e.clientX, e.clientY);
    const pointerUp = (e: PointerEvent) => {
      if (
        down.distanceTo(new THREE.Vector2(e.clientX, e.clientY)) > 5 ||
        !latest.current.onSelectCube
      )
        return;
      const rect = scene.renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, scene.camera);
      const hit = raycaster.intersectObjects(dynamic.current.meshes, false)[0];
      if (hit) {
        const name = nameAtIntersection(hit);
        if (name) latest.current.onSelectCube(name);
      }
    };
    scene.renderer.domElement.addEventListener("pointerdown", pointerDown);
    scene.renderer.domElement.addEventListener("pointerup", pointerUp);
    let frame = 0,
      last = performance.now(),
      elapsed = 0,
      lastEvent = 0;
    const render = () => {
      frame = requestAnimationFrame(render);
      const now = performance.now(),
        dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible || document.hidden) return;
      elapsed += dt;
      const m = motion.current,
        p = latest.current,
        d = dynamic.current;
      if (p.actionPlaying) m.time += dt;
      else if (m.lastScrub !== p.actionScrub) {
        m.time = isActiveAction(m.action)
          ? p.actionScrub * ACTIONS[m.action].length
          : 0;
        m.lastScrub = p.actionScrub;
      }
      let glow = 1;
      if (isActiveAction(m.action)) {
        const sample = sampleAction(m.action, m.time);
        scene.actionGroup.rotation.set(
          ...(sample.rotation.map((v) => v * DEG) as [number, number, number]),
        );
        scene.actionGroup.position.set(
          sample.position[0],
          d.pivotY + sample.position[1],
          sample.position[2],
        );
        scene.actionGroup.scale.set(...sample.scale);
        glow = sample.glow;
        for (const rig of RIG_IDS) {
          const group = d.groups.get(rig);
          if (!group) continue;
          const pose = sampleAction(m.action, m.time, rig),
            center = d.centres.get(rig)!;
          group.position.copy(center).add(new THREE.Vector3(...pose.position));
          group.rotation.set(
            ...(pose.rotation.map((v) => v * DEG) as [number, number, number]),
          );
          group.scale.set(...pose.scale);
        }
        if (now - lastEvent > 100 && p.actionPlaying) {
          container.dispatchEvent(
            new CustomEvent("voxel-motion-time", {
              bubbles: true,
              detail: {
                progress:
                  (m.time % ACTIONS[m.action].length) /
                  ACTIONS[m.action].length,
              },
            }),
          );
          lastEvent = now;
        }
      } else {
        scene.actionGroup.rotation.set(0, 0, 0);
        scene.actionGroup.position.set(0, d.pivotY, 0);
        scene.actionGroup.scale.set(1, 1, 1);
      }
      const floats = d.groups.get("floater");
      if (floats) {
        const pose = sampleFloating(m.animation, elapsed),
          c = d.centres.get("floater")!;
        floats.position.copy(c).add(new THREE.Vector3(...pose.position));
        floats.rotation.set(
          ...(pose.rotation.map((v) => v * DEG) as [number, number, number]),
        );
        floats.scale.set(...pose.scale);
      }
      if (d.particles) updatePixelEffect(d.particles, dt, elapsed, glow);
      if (d.light)
        d.light.intensity = 10 * glow * (0.9 + 0.1 * Math.sin(elapsed * 3.4));
      const changed = scene.controls.update();
      const animated =
        (isActiveAction(m.action) && p.actionPlaying) ||
        m.animation !== "none" ||
        !!d.particles ||
        !!d.light ||
        p.autoRotate;
      if (changed || animated || invalidated.current) {
        scene.renderer.render(scene.scene, scene.camera);
        invalidated.current = false;
      }
      container.dataset.modelBatches = String(d.meshes.length);
    };
    render();
    setReady(true);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      scene.renderer.domElement.removeEventListener("pointerdown", pointerDown);
      scene.renderer.domElement.removeEventListener("pointerup", pointerUp);
      dynamic.current.texture?.dispose();
      outline.removeFromParent();
      outline.geometry.dispose();
      (outline.material as THREE.Material).dispose();
      scene.dispose();
      handles.current = null;
      dynamic.current = empty();
      selection.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = handles.current;
    if (!scene) return;
    selection.current?.removeFromParent();
    // Groups contain merged meshes, so explicitly dispose recursively before removal.
    for (const group of dynamic.current.groups.values()) clearGroup(group);
    clearGroup(scene.contentGroup);
    clearGroup(scene.modelGroup, scene.actionGroup);
    const model = props.model,
      settings = model.settings,
      d = empty();
    let texture = dynamic.current.texture;
    if (!texture || textureSource.current !== model.texture.source) {
      texture?.dispose();
      texture = createTexture(model.texture.source, () => {
        invalidated.current = true;
      });
      textureSource.current = model.texture.source;
    }
    d.texture = texture;
    d.pivotY = actionPivotY(settings.height);
    scene.contentGroup.position.set(0, -d.pivotY, 0);
    for (const batch of createModelBatches(model, texture, props.wireframe)) {
      let group = d.groups.get(batch.key);
      if (!group) {
        group = new THREE.Group();
        group.position.copy(batch.center);
        d.centres.set(batch.key, batch.center);
        d.groups.set(batch.key, group);
        scene.contentGroup.add(group);
      }
      group.add(batch.mesh);
      d.meshes.push(batch.mesh);
    }
    const effect = settings.effect ?? "none",
      profile = EFFECT_PROFILES[effect];
    if (profile.light || settings.mode === "charged" || settings.limitBreak) {
      d.light = createGlowLight(
        profile.color ?? model.palette[4],
        settings.height * 0.25,
      );
      scene.contentGroup.add(d.light);
    }
    const pixels = createPixelEffect(effect, model.palette[4], settings.seed);
    if (pixels) {
      d.particles = pixels;
      scene.modelGroup.add(pixels.points);
    }
    dynamic.current = d;
    motion.current.animation = settings.animation ?? "none";
    motion.current.action = settings.action ?? "none";
    motion.current.time = 0;
    motion.current.lastScrub = -1;
    invalidated.current = true;
  }, [props.model, ready]);

  useEffect(() => {
    const helper = selection.current,
      scene = handles.current;
    if (!helper || !scene) return;
    const cube = props.model.cubes.find((c) => c.name === props.selectedCube);
    helper.visible = !!cube && !cube.hidden;
    if (cube) {
      const key = cube.layer === "floater" ? "floater" : (cube.rig ?? "body"),
        group = dynamic.current.groups.get(key) ?? scene.contentGroup;
      group.add(helper);
      const center = dynamic.current.centres.get(key) ?? new THREE.Vector3();
      helper.position.set(
        (cube.from[0] + cube.to[0]) / 2 - center.x,
        (cube.from[1] + cube.to[1]) / 2 - center.y,
        (cube.from[2] + cube.to[2]) / 2 - center.z,
      );
      helper.scale.set(
        cube.to[0] - cube.from[0] + 0.08,
        cube.to[1] - cube.from[1] + 0.08,
        cube.to[2] - cube.from[2] + 0.08,
      );
    }
    invalidated.current = true;
  }, [props.selectedCube, props.model, ready]);

  useEffect(() => {
    const scene = handles.current;
    if (!scene) return;
    scene.grid.visible = props.grid;
    scene.controls.autoRotate = props.autoRotate;
    scene.controls.mouseButtons.LEFT =
      props.tool === "pan" ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
    for (const mesh of dynamic.current.meshes)
      (mesh.material as THREE.MeshStandardMaterial).wireframe = props.wireframe;
    invalidated.current = true;
  }, [
    props.grid,
    props.wireframe,
    props.autoRotate,
    props.tool,
    props.model,
    ready,
  ]);
  useEffect(() => {
    const scene = handles.current;
    if (!scene) return;
    scene.camera.zoom = (props.zoom / 100) * BASE_ZOOM;
    scene.camera.updateProjectionMatrix();
    invalidated.current = true;
  }, [props.zoom, ready]);
  useEffect(() => {
    const scene = handles.current;
    if (!scene) return;
    scene.controls.target.set(0, 0, 0);
    scene.modelGroup.rotation.set(
      DEFAULT_ROTATION[0],
      DEFAULT_ROTATION[1],
      props.view === "perspective" ? DEFAULT_ROTATION[2] : 0,
    );
    scene.camera.position.set(...cameraPositionFor(props.view));
    scene.controls.update();
    invalidated.current = true;
  }, [props.view, props.resetKey, ready]);
  useEffect(() => {
    invalidated.current = true;
  }, [props.actionScrub, props.actionPlaying]);
  return (
    <div className="viewport-renderer" ref={host}>
      {(!ready || failed) && (
        <ViewportFallback
          cubes={props.model.cubes.filter((c) => !c.hidden)}
          label={props.model.settings.name}
        />
      )}
      {failed && (
        <span className="webgl-note">静止プレビュー · WebGL非対応</span>
      )}
    </div>
  );
}
export default memo(ModelViewport);
