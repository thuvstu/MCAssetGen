"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyDecorations, createDecoration, newDecorationId, randomDecorations } from "@/lib/decorations/decorations";
import { generateTemplate } from "@/lib/generators/templates";
import { generateProceduralAtlas } from "@/lib/generators/textureBaker";
import { cloneElement, createElement, getPalette, normalizeModelData, rescaleModelUvs } from "@/lib/model/modelUtils";
import { buildPart } from "@/lib/parts/partLibrary";
import { bakeVariant, buildVariant, DEFAULT_VARIANT, isDefaultVariant, rethemeModel } from "@/lib/variants/variantEngine";
import {
  AnimationConfig,
  ColorPalette,
  DecorationInstance,
  DecorationType,
  ElementTransform,
  FloatingItemConfig,
  MagicCircleConfig,
  ModelArchetype,
  ModelData,
  ModelElement,
  ModelTheme,
  ParticleEffectConfig,
  TextureResolution,
  VariantState,
  Vector3,
} from "@/types/model";

const DEFAULT_ARCHETYPE: ModelArchetype = "sword";
const DEFAULT_THEME: ModelTheme = "void";
const DEFAULT_RESOLUTION: TextureResolution = 32;
const HISTORY_LIMIT = 80;
const COALESCE_MS = 700;

const snap = (value: number) => Math.round(value * 100) / 100;

function bakeTexture(base: ModelData, variant: VariantState): string {
  const display = buildVariant(base, variant);
  return generateProceduralAtlas(display.palette, base.textureWidth, variant);
}

function textureSignature(model: ModelData): string {
  return `${model.palette.primary}|${model.palette.glow}|${model.palette.accent}|${model.textureWidth}`;
}

export function useModelWorkspace() {
  const [baseModel, setBaseModel] = useState<ModelData>(() => generateTemplate(DEFAULT_ARCHETYPE, DEFAULT_THEME, DEFAULT_RESOLUTION));
  const [variant, setVariant] = useState<VariantState>(DEFAULT_VARIANT);
  const [textureDataUrl, setTextureDataUrl] = useState("");
  const [selectedElementId, setSelectedElementId] = useState<string | null>("blade_lower");
  const [history, setHistory] = useState({ undo: 0, redo: 0 });

  const baseRef = useRef(baseModel);
  const variantRef = useRef(variant);
  const pastRef = useRef<ModelData[]>([]);
  const futureRef = useRef<ModelData[]>([]);
  const lastTagRef = useRef<{ tag: string; time: number } | null>(null);
  const initialRef = useRef({ palette: getPalette(DEFAULT_THEME), resolution: DEFAULT_RESOLUTION });

  const model = useMemo(() => buildVariant(baseModel, variant), [baseModel, variant]);
  const isVariantActive = !isDefaultVariant(variant);

  useEffect(() => {
    setTextureDataUrl(generateProceduralAtlas(initialRef.current.palette, initialRef.current.resolution));
  }, []);

  const syncHistory = useCallback(() => setHistory({ undo: pastRef.current.length, redo: futureRef.current.length }), []);

  /** Every base-model mutation goes through here. `tag` coalesces rapid edits (sliders, typing) into one undo step. */
  const commitBase = useCallback(
    (updater: (current: ModelData) => ModelData, tag?: string) => {
      const previous = baseRef.current;
      const next = updater(previous);
      if (next === previous) return previous;
      const now = Date.now();
      const last = lastTagRef.current;
      const coalesce = Boolean(tag && last && last.tag === tag && now - last.time < COALESCE_MS);
      if (!coalesce) pastRef.current = [...pastRef.current.slice(-(HISTORY_LIMIT - 1)), previous];
      futureRef.current = [];
      lastTagRef.current = tag ? { tag, time: now } : null;
      baseRef.current = next;
      setBaseModel(next);
      syncHistory();
      return next;
    },
    [syncHistory],
  );

  const restore = useCallback(
    (target: ModelData, current: ModelData) => {
      baseRef.current = target;
      setBaseModel(target);
      lastTagRef.current = null;
      if (textureSignature(target) !== textureSignature(current)) setTextureDataUrl(bakeTexture(target, variantRef.current));
      setSelectedElementId((selected) => (selected && target.elements.some((element) => element.id === selected) ? selected : null));
      syncHistory();
    },
    [syncHistory],
  );

  const undo = useCallback(() => {
    const previous = pastRef.current.pop();
    if (!previous) return false;
    const current = baseRef.current;
    futureRef.current.push(current);
    restore(previous, current);
    return true;
  }, [restore]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return false;
    const current = baseRef.current;
    pastRef.current.push(current);
    restore(next, current);
    return true;
  }, [restore]);

  const commitVariant = useCallback((next: VariantState) => {
    variantRef.current = next;
    setVariant(next);
  }, []);

  // ---------- variants ----------
  const updateVariant = useCallback(
    (partial: Partial<VariantState>) => {
      const next = { ...variantRef.current, ...partial };
      commitVariant(next);
      setTextureDataUrl(bakeTexture(baseRef.current, next));
      return next;
    },
    [commitVariant],
  );

  const resetVariant = useCallback(() => {
    commitVariant(DEFAULT_VARIANT);
    setTextureDataUrl(bakeTexture(baseRef.current, DEFAULT_VARIANT));
  }, [commitVariant]);

  const bakeCurrentVariant = useCallback(() => {
    const display = buildVariant(baseRef.current, variantRef.current);
    commitBase(() => bakeVariant(display));
    commitVariant(DEFAULT_VARIANT);
  }, [commitBase, commitVariant]);

  const retheme = useCallback(
    (theme: ModelTheme) => {
      const next = commitBase((current) => rethemeModel(current, theme));
      setTextureDataUrl(bakeTexture(next, variantRef.current));
    },
    [commitBase],
  );

  const loadArchetype = useCallback(
    (type: ModelArchetype) => {
      const current = baseRef.current;
      const next = commitBase(() => ({ ...generateTemplate(type, current.theme, current.textureWidth), decorations: current.decorations ?? [] }));
      setTextureDataUrl(bakeTexture(next, variantRef.current));
      setSelectedElementId(next.elements[0]?.id ?? null);
      return next;
    },
    [commitBase],
  );

  // ---------- cube editing ----------
  const mapElement = useCallback(
    (id: string, map: (element: ModelElement) => ModelElement, tag?: string) =>
      commitBase((current) => ({ ...current, elements: current.elements.map((element) => (element.id === id ? map(element) : element)) }), tag),
    [commitBase],
  );

  const updateElement = useCallback((element: ModelElement) => mapElement(element.id, () => element, `el-${element.id}`), [mapElement]);

  const transformElement = useCallback(
    (id: string, change: ElementTransform) =>
      mapElement(id, (element) => {
        const origin: Vector3 = [element.origin[0] + change.translate[0], element.origin[1] + change.translate[1], element.origin[2] + change.translate[2]];
        const from: Vector3 = [0, 0, 0];
        const to: Vector3 = [0, 0, 0];
        for (let axis = 0; axis < 3; axis += 1) {
          const center = (element.from[axis] + element.to[axis]) / 2;
          const half = (Math.abs(element.to[axis] - element.from[axis]) / 2) * Math.abs(change.scale[axis]);
          // Geometry is offset from the pivot in local space, so the gizmo scales that offset too.
          const nextCenter = origin[axis] + (center - element.origin[axis]) * change.scale[axis];
          from[axis] = snap(nextCenter - half);
          to[axis] = snap(nextCenter + half);
        }
        return { ...element, origin: origin.map(snap) as Vector3, from, to, rotation: change.rotation.map(snap) as Vector3 };
      }),
    [mapElement],
  );

  const nudgeElement = useCallback(
    (id: string, delta: Vector3) =>
      mapElement(
        id,
        (element) => ({
          ...element,
          from: element.from.map((value, axis) => snap(value + delta[axis])) as Vector3,
          to: element.to.map((value, axis) => snap(value + delta[axis])) as Vector3,
          origin: element.origin.map((value, axis) => snap(value + delta[axis])) as Vector3,
        }),
        `nudge-${id}`,
      ),
    [mapElement],
  );

  const addElement = useCallback(() => {
    const current = baseRef.current;
    const element = createElement(current.elements.length, current.textureWidth, current.palette.primary);
    commitBase(() => ({ ...current, elements: [...current.elements, element] }));
    setSelectedElementId(element.id);
    return element.id;
  }, [commitBase]);

  const deleteElement = useCallback(
    (id: string) => {
      commitBase((current) => ({
        ...current,
        elements: current.elements.filter((element) => element.id !== id),
        groups: current.groups.map((group) => ({ ...group, childrenIds: group.childrenIds.filter((childId) => childId !== id) })),
      }));
      setSelectedElementId((current) => (current === id ? null : current));
    },
    [commitBase],
  );

  const duplicateElement = useCallback(
    (id: string) => {
      const target = baseRef.current.elements.find((element) => element.id === id);
      if (!target) return;
      const duplicate = cloneElement(target);
      commitBase((current) => ({ ...current, elements: [...current.elements, duplicate] }));
      setSelectedElementId(duplicate.id);
    },
    [commitBase],
  );

  const mirrorElement = useCallback(
    (id: string) => {
      const target = baseRef.current.elements.find((element) => element.id === id);
      if (!target) return;
      const mirrored: ModelElement = {
        ...cloneElement(target),
        name: `${target.name} (Mirror)`,
        from: [-target.to[0], target.from[1], target.from[2]],
        to: [-target.from[0], target.to[1], target.to[2]],
        origin: [-target.origin[0], target.origin[1], target.origin[2]],
        rotation: [target.rotation[0], -target.rotation[1], -target.rotation[2]],
      };
      commitBase((current) => ({ ...current, elements: [...current.elements, mirrored] }));
      setSelectedElementId(mirrored.id);
    },
    [commitBase],
  );

  const insertPart = useCallback(
    (partId: string, anchor: Vector3) => {
      const current = baseRef.current;
      const parts = buildPart(partId, anchor, current.palette, current.textureWidth);
      if (parts.length === 0) return 0;
      commitBase(() => {
        const groups = current.groups.some((group) => group.id === "parts")
          ? current.groups.map((group) => (group.id === "parts" ? { ...group, childrenIds: [...group.childrenIds, ...parts.map((part) => part.id)] } : group))
          : [...current.groups, { id: "parts", name: "Added Parts", pivot: [0, 0, 0] as Vector3, rotation: [0, 0, 0] as Vector3, childrenIds: parts.map((part) => part.id) }];
        return { ...current, elements: [...current.elements, ...parts], groups };
      });
      setSelectedElementId(parts[0].id);
      return parts.length;
    },
    [commitBase],
  );

  // ---------- decorations ----------
  const setDecorations = useCallback(
    (map: (list: DecorationInstance[]) => DecorationInstance[], tag?: string) => commitBase((current) => ({ ...current, decorations: map(current.decorations ?? []) }), tag),
    [commitBase],
  );
  const addDecoration = useCallback((type: DecorationType) => setDecorations((list) => [...list, createDecoration(type)]), [setDecorations]);
  const updateDecoration = useCallback((inst: DecorationInstance) => setDecorations((list) => list.map((item) => (item.id === inst.id ? inst : item)), `deco-${inst.id}`), [setDecorations]);
  const removeDecoration = useCallback((id: string) => setDecorations((list) => list.filter((item) => item.id !== id)), [setDecorations]);
  const duplicateDecoration = useCallback(
    (id: string) => setDecorations((list) => list.flatMap((item) => (item.id === id ? [item, { ...item, id: newDecorationId(), offsetZ: item.offsetZ, height: Math.max(-0.1, item.height - 0.12) }] : [item]))),
    [setDecorations],
  );
  const randomizeDecorations = useCallback(() => setDecorations((list) => [...list, ...randomDecorations(3)]), [setDecorations]);
  const clearDecorations = useCallback(() => setDecorations(() => []), [setDecorations]);
  const bakeDecorations = useCallback(() => commitBase((current) => bakeVariant(applyDecorations(current))), [commitBase]);

  // ---------- whole-model operations ----------
  const generateModel = useCallback(
    (type: ModelArchetype, theme: ModelTheme, resolution: TextureResolution) => {
      const next = commitBase(() => generateTemplate(type, theme, resolution));
      commitVariant(DEFAULT_VARIANT);
      setTextureDataUrl(generateProceduralAtlas(next.palette, resolution));
      setSelectedElementId(next.elements[0]?.id ?? null);
      return next;
    },
    [commitBase, commitVariant],
  );

  const loadModel = useCallback(
    (candidate: unknown, texture: string) => {
      const next = normalizeModelData(candidate);
      if (!next) return false;
      commitBase(() => ({ ...next, variant: undefined }));
      commitVariant(DEFAULT_VARIANT);
      setTextureDataUrl(texture.startsWith("data:image/") && texture.length > 400 ? texture : generateProceduralAtlas(next.palette, next.textureWidth));
      setSelectedElementId(next.elements[0]?.id ?? null);
      return true;
    },
    [commitBase, commitVariant],
  );

  const selectPalette = useCallback(
    (palette: ColorPalette) => {
      const next = commitBase((current) => {
        const oldColors = new Set([current.palette.primary, current.palette.secondary, current.palette.accent, current.palette.glow]);
        return {
          ...current,
          theme: palette.id,
          palette,
          elements: current.elements.map((element) => ({ ...element, color: element.color && oldColors.has(element.color) ? palette.primary : element.color })),
          floatingItems: { ...current.floatingItems, color: palette.glow },
          magicCircle: { ...current.magicCircle, color: palette.glow },
          particles: { ...current.particles, color: palette.glow, secondaryColor: palette.accent },
        };
      });
      setTextureDataUrl(bakeTexture(next, variantRef.current));
    },
    [commitBase],
  );

  const updateResolution = useCallback(
    (resolution: TextureResolution) => {
      const next = commitBase((current) => rescaleModelUvs(current, resolution));
      setTextureDataUrl(bakeTexture(next, variantRef.current));
    },
    [commitBase],
  );

  const updateFloatingItems = useCallback((floatingItems: FloatingItemConfig) => commitBase((current) => ({ ...current, floatingItems }), "fx-floating"), [commitBase]);
  const updateMagicCircle = useCallback((magicCircle: MagicCircleConfig) => commitBase((current) => ({ ...current, magicCircle }), "fx-circle"), [commitBase]);
  const updateParticles = useCallback((particles: ParticleEffectConfig) => commitBase((current) => ({ ...current, particles }), "fx-particles"), [commitBase]);
  const updateAnimations = useCallback((animations: AnimationConfig) => commitBase((current) => ({ ...current, animations }), "fx-anim"), [commitBase]);
  const updateModelName = useCallback((name: string) => commitBase((current) => ({ ...current, name: name.slice(0, 120) }), "name"), [commitBase]);

  return {
    model,
    baseModel,
    variant,
    isVariantActive,
    textureDataUrl,
    selectedElementId,
    canUndo: history.undo > 0,
    canRedo: history.redo > 0,
    setTextureDataUrl,
    setSelectedElementId,
    undo,
    redo,
    updateVariant,
    resetVariant,
    bakeCurrentVariant,
    retheme,
    loadArchetype,
    updateModelName,
    updateElement,
    transformElement,
    nudgeElement,
    addElement,
    deleteElement,
    duplicateElement,
    mirrorElement,
    insertPart,
    addDecoration,
    updateDecoration,
    removeDecoration,
    duplicateDecoration,
    randomizeDecorations,
    clearDecorations,
    bakeDecorations,
    generateModel,
    loadModel,
    selectPalette,
    updateResolution,
    updateFloatingItems,
    updateMagicCircle,
    updateParticles,
    updateAnimations,
  };
}
