import { strToU8, zipSync } from "fflate";
import { PNG } from "pngjs";
import { ACTIONS, actionPivotY, isActiveAction } from "../animation/actions";
import { FLOATING_LENGTH, floatingFrames } from "../animation/floating";
import { RIG_IDS, type GeneratedModel, type ModelCube, type Vec3 } from "../model-types";
import { decodeDataUrl } from "../atlas";

/**
 * GeckoLib export.
 *
 * The studio generates Java item models with one shared UV rectangle per cube.
 * GeckoLib (Bedrock geometry) instead box-unwraps every cube, so this module
 * packs each cube onto its own island of a dedicated square atlas and paints the
 * island from the studio texture. Geometry, atlas and animations therefore match
 * each other: what the blockbench export shows is what GeckoLib renders.
 *
 * Conventions:
 * - Bedrock mirrors Java models on the X axis, so cubes, pivots and the X
 *   component of animation channels are negated unless `mirrorX` is false.
 * - Animation names are plain (`floaters_orbit`, `action_slash`) because GeckoLib
 *   looks up the key inside `animations` as written.
 */

export const GECKOLIB_GENERATIONS = ["geckolib5", "geckolib4", "none"] as const;
export type GeckolibGeneration = (typeof GECKOLIB_GENERATIONS)[number];

export function isGeckolibGeneration(value: unknown): value is GeckolibGeneration {
  return GECKOLIB_GENERATIONS.includes(value as GeckolibGeneration);
}

export interface GeckolibOptions {
  /** Resource namespace used for every generated path. */
  namespace: string;
  /** Model id: file names and GeckoLib model location. */
  modelId: string;
  /** Java package of the generated glue classes. */
  javaPackage: string;
  /** Which GeckoLib API the generated Java targets. */
  generation: GeckolibGeneration;
  /** Mirror geometry and X animation channels (Bedrock convention). Default true. */
  mirrorX: boolean;
}

export const DEFAULT_GECKOLIB_OPTIONS: GeckolibOptions = {
  namespace: "voxelforge",
  modelId: "voxelforge_model",
  javaPackage: "com.example.voxelforge",
  generation: "geckolib5",
  mirrorX: true,
};

/** Bedrock geometry cube: origin corner + size + box-UV origin. */
export interface GeckolibCube {
  name: string;
  origin: Vec3;
  size: Vec3;
  uv: [number, number];
  emissive?: boolean;
}

export interface GeckolibBone {
  name: string;
  pivot: Vec3;
  cubes: GeckolibCube[];
}

export interface GeckolibLayout {
  bones: GeckolibBone[];
  /** Side length of the square atlas in pixels. */
  size: number;
  /** Animation clips that were written into the animation file. */
  clips: string[];
}

const ATLAS_SIZES = [64, 128, 256, 512, 1024] as const;
/** Extra pixel between islands so texture filtering cannot bleed across cubes. */
const ISLAND_PADDING = 1;

export function sanitizeModelId(input: string, fallback = DEFAULT_GECKOLIB_OPTIONS.modelId): string {
  const value = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!value) return fallback;
  return /^[a-z]/.test(value) ? value : `m_${value}`;
}

export function sanitizeNamespace(input: string, fallback = DEFAULT_GECKOLIB_OPTIONS.namespace): string {
  return sanitizeModelId(input, fallback);
}

export function sanitizePackage(input: string, namespace: string): string {
  const value = input
    .trim()
    .toLowerCase()
    .split(".")
    .map((part) => sanitizeModelId(part, "mod"))
    .filter(Boolean)
    .join(".");
  return value || `com.example.${namespace}`;
}

export function toPascalCase(id: string): string {
  return id
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");
}

export function resolveGeckolibOptions(
  model: GeneratedModel,
  overrides: Partial<GeckolibOptions> = {},
): GeckolibOptions {
  const namespace = sanitizeNamespace(overrides.namespace ?? DEFAULT_GECKOLIB_OPTIONS.namespace);
  const requestedId = overrides.modelId?.trim();
  const modelId = sanitizeModelId(
    requestedId ? requestedId : `voxelforge_${model.settings.kind}`,
  );
  const generation = isGeckolibGeneration(overrides.generation)
    ? overrides.generation
    : DEFAULT_GECKOLIB_OPTIONS.generation;
  return {
    namespace,
    modelId,
    javaPackage: sanitizePackage(
      overrides.javaPackage ?? `com.example.${namespace}`,
      namespace,
    ),
    generation,
    mirrorX: overrides.mirrorX ?? DEFAULT_GECKOLIB_OPTIONS.mirrorX,
  };
}

/* ---------------- geometry ---------------- */

/** Bone a cube belongs to: rig group, floater layer, or the model body. */
function boneOf(cube: ModelCube): string {
  if (cube.layer === "floater") return "floaters";
  return cube.rig ?? "body";
}

function cubeSize(cube: ModelCube): Vec3 {
  return [0, 1, 2].map((axis) =>
    Math.max(cube.to[axis] - cube.from[axis], 0.01),
  ) as Vec3;
}

function mirrorVector(value: Vec3, mirrorX: boolean): Vec3 {
  return mirrorX ? [-value[0], value[1], value[2]] : [value[0], value[1], value[2]];
}

/** Bedrock origin corner of a Java cube, mirrored on X when requested. */
function cubeOrigin(cube: ModelCube, mirrorX: boolean): Vec3 {
  return [
    mirrorX ? -cube.to[0] : cube.from[0],
    cube.from[1],
    cube.from[2],
  ];
}

function pivotOf(cubes: ModelCube[], mirrorX: boolean): Vec3 {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const cube of cubes)
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], cube.from[axis]);
      max[axis] = Math.max(max[axis], cube.to[axis]);
    }
  const centre = min.map((value, axis) => (value + max[axis]) / 2) as Vec3;
  return mirrorVector(centre, mirrorX);
}

const round = (value: number, decimals = 3): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/* ---------------- UV islands ---------------- */

interface Island {
  cube: ModelCube;
  width: number;
  height: number;
  x: number;
  y: number;
}

/** Box unwrap footprint: 2 * (width + depth) wide, depth + height tall. */
export function islandFootprint(cube: ModelCube): { width: number; height: number } {
  const [width, height, depth] = cubeSize(cube);
  return {
    width: Math.ceil(2 * (width + depth)) + ISLAND_PADDING,
    height: Math.ceil(depth + height) + ISLAND_PADDING,
  };
}

function packIslands(cubes: ModelCube[], size: number): Island[] | null {
  const islands: Island[] = cubes
    .map((cube) => ({ cube, ...islandFootprint(cube), x: 0, y: 0 }))
    .sort((a, b) => b.height - a.height || b.width - a.width);
  let x = 0;
  let y = 0;
  let shelf = 0;
  for (const island of islands) {
    if (island.width > size) return null;
    if (x + island.width > size) {
      x = 0;
      y += shelf;
      shelf = 0;
    }
    if (y + island.height > size) return null;
    island.x = x;
    island.y = y;
    x += island.width;
    shelf = Math.max(shelf, island.height);
  }
  return islands;
}

/** Geometry plus the packed UV layout used by both the geo JSON and the atlas. */
export function buildGeckolibLayout(
  model: GeneratedModel,
  options: GeckolibOptions,
): GeckolibLayout {
  const cubes = model.cubes.filter((cube) => !cube.hidden);
  let islands: Island[] | null = null;
  let size = ATLAS_SIZES[ATLAS_SIZES.length - 1];
  for (const candidate of ATLAS_SIZES) {
    islands = packIslands(cubes, candidate);
    if (islands) {
      size = candidate;
      break;
    }
  }
  if (!islands) throw new Error("UVアトラスに収まりませんでした。");

  const uvByCube = new Map<ModelCube, [number, number]>();
  for (const island of islands) uvByCube.set(island.cube, [island.x, island.y]);

  const bones: GeckolibBone[] = [];
  const boneByName = new Map<string, GeckolibBone>();
  const ensure = (name: string, cubes2: ModelCube[]): GeckolibBone => {
    const existing = boneByName.get(name);
    if (existing) return existing;
    const bone: GeckolibBone = {
      name,
      pivot: pivotOf(cubes2, options.mirrorX),
      cubes: [],
    };
    boneByName.set(name, bone);
    bones.push(bone);
    return bone;
  };

  // `body` first so the bone order stays stable between exports.
  ensure("body", cubes.filter((cube) => boneOf(cube) === "body"));
  for (const cube of cubes) {
    const name = boneOf(cube);
    const bone = ensure(
      name,
      cubes.filter((other) => boneOf(other) === name),
    );
    bone.cubes.push({
      name: cube.label ?? cube.name,
      origin: cubeOrigin(cube, options.mirrorX),
      size: cubeSize(cube),
      uv: uvByCube.get(cube) ?? [0, 0],
      ...(cube.emissive ? { emissive: true } : {}),
    });
  }

  const clips: string[] = [];
  if (boneByName.has("floaters") && model.settings.animation !== "none")
    clips.push(`floaters_${model.settings.animation}`);
  if (isActiveAction(model.settings.action)) clips.push(`action_${model.settings.action}`);

  return { bones: bones.filter((bone) => bone.cubes.length > 0), size, clips };
}

/* ---------------- geo / animation JSON ---------------- */

export function geckolibGeoModel(
  model: GeneratedModel,
  options: GeckolibOptions,
  layout = buildGeckolibLayout(model, options),
): string {
  const rootPivot = mirrorVector(
    [0, actionPivotY(model.settings.height), 0],
    options.mirrorX,
  );
  return JSON.stringify(
    {
      format_version: "1.12.0",
      "minecraft:geometry": [
        {
          description: {
            identifier: `geometry.${options.namespace}.${options.modelId}`,
            texture_width: layout.size,
            texture_height: layout.size,
            visible_bounds_width: 4,
            visible_bounds_height: 4,
            visible_bounds_offset: [0, 1, 0],
          },
          bones: [
            { name: "root", pivot: rootPivot.map((value) => round(value)) },
            ...layout.bones.map((bone) => ({
              name: bone.name,
              parent: "root",
              pivot: bone.pivot.map((value) => round(value)),
              cubes: bone.cubes.map((cube) => ({
                origin: cube.origin.map((value) => round(value)),
                size: cube.size.map((value) => round(value)),
                uv: cube.uv,
                ...(cube.emissive ? { render_type: "emissive" } : {}),
              })),
            })),
          ],
        },
      ],
    },
    null,
    2,
  );
}

type BedrockChannelValues = Record<string, [number, number, number]>;
interface BedrockBoneAnimation {
  rotation?: BedrockChannelValues;
  position?: BedrockChannelValues;
  scale?: BedrockChannelValues;
}

function channelKeyframes(
  keyframes: { time: number; value: Vec3 }[],
  mirrorX: boolean,
  flip: "rotation" | "position" | "scale",
): BedrockChannelValues {
  const result: BedrockChannelValues = {};
  for (const frame of keyframes) {
    const value =
      flip === "scale"
        ? frame.value
        : flip === "rotation"
          ? ([frame.value[0], -frame.value[1], -frame.value[2]] as Vec3)
          : ([frame.value[0], frame.value[1], frame.value[2]] as Vec3);
    const mirrored = mirrorX ? mirrorVector(value, true) : value;
    result[String(round(frame.time))] = mirrored.map((n) => round(n)) as [number, number, number];
  }
  return result;
}

export function geckolibAnimations(model: GeneratedModel, options: GeckolibOptions): string {
  const animations: Record<string, unknown> = {};
  const { settings } = model;

  if (settings.animation !== "none" && model.cubes.some((cube) => cube.layer === "floater")) {
    const frames = floatingFrames(settings.animation);
    const channel =
      settings.animation === "pulse"
        ? "scale"
        : settings.animation === "spin" || settings.animation === "sway"
          ? "rotation"
          : "position";
    const keys = channelKeyframes(
      frames.map((frame) => ({
        time: frame.time,
        value:
          channel === "scale"
            ? frame.scale
            : channel === "rotation"
              ? frame.rotation
              : frame.position,
      })),
      options.mirrorX,
      channel,
    );
    animations[`floaters_${settings.animation}`] = {
      loop: true,
      animation_length: FLOATING_LENGTH,
      bones: { floaters: { [channel]: keys } satisfies BedrockBoneAnimation },
    };
  }

  if (isActiveAction(settings.action)) {
    const action = ACTIONS[settings.action];
    const boneEntry = (
      frames: typeof action.keyframes,
    ): BedrockBoneAnimation => ({
      rotation: channelKeyframes(
        frames.map((frame) => ({ time: frame.time, value: frame.rotation })),
        options.mirrorX,
        "rotation",
      ),
      position: channelKeyframes(
        frames.map((frame) => ({ time: frame.time, value: frame.position })),
        options.mirrorX,
        "position",
      ),
      scale: channelKeyframes(
        frames.map((frame) => ({ time: frame.time, value: frame.scale })),
        options.mirrorX,
        "scale",
      ),
    });
    const bones: Record<string, BedrockBoneAnimation> = {
      root: boneEntry(action.keyframes),
    };
    for (const rig of RIG_IDS) {
      const frames = action.rigs?.[rig];
      if (frames && model.cubes.some((cube) => cube.rig === rig))
        bones[rig] = boneEntry(frames);
    }
    animations[`action_${settings.action}`] = {
      loop: false,
      animation_length: action.length,
      bones,
    };
  }

  return JSON.stringify(
    {
      format_version: "1.8.0",
      animations,
    },
    null,
    2,
  );
}

/* ---------------- atlas ---------------- */

type Rgba = [number, number, number, number];

function readSource(source: PNG, x: number, y: number): Rgba {
  const px = Math.min(Math.max(Math.round(x), 0), source.width - 1);
  const py = Math.min(Math.max(Math.round(y), 0), source.height - 1);
  const offset = (py * source.width + px) * 4;
  const data = source.data;
  return [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];
}

interface FaceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Box unwrap face rectangles, relative to the island origin. */
function boxFaces(width: number, height: number, depth: number): FaceRect[] {
  return [
    { x: depth, y: 0, width, height: depth }, // top
    { x: depth + width, y: 0, width, height: depth }, // bottom
    { x: 0, y: depth, width: depth, height }, // right
    { x: depth, y: depth, width, height }, // front
    { x: depth + width, y: depth, width: depth, height }, // left
    { x: depth + width + depth, y: depth, width, height }, // back
  ];
}

/** Paints every island from the studio texture: one box unwrap per cube. */
export function geckolibAtlas(
  model: GeneratedModel,
  layout: GeckolibLayout,
): Buffer {
  const source = PNG.sync.read(decodeDataUrl(model.texture.source));
  const atlas = new PNG({ width: layout.size, height: layout.size });
  atlas.data.fill(0);
  const visible = model.cubes.filter((cube) => !cube.hidden);
  const islandOrigin = new Map<string, [number, number]>();
  for (const bone of layout.bones)
    for (const cube of bone.cubes) islandOrigin.set(cube.name, cube.uv);
  const cubeFor = (name: string) =>
    visible.find((cube) => (cube.label ?? cube.name) === name) ?? visible[0];

  for (const bone of layout.bones) {
    for (const cube of bone.cubes) {
      const uv = islandOrigin.get(cube.name);
      if (!uv) continue;
      const sourceCube = cubeFor(cube.name);
      const [rectX, rectY, rectW, rectH] = sourceCube?.uv ?? [
        0,
        0,
        model.texture.width,
        model.texture.height,
      ];
      const [width, height, depth] = cube.size;
      for (const face of boxFaces(width, height, depth)) {
        const faceWidth = Math.max(Math.round(face.width), 1);
        const faceHeight = Math.max(Math.round(face.height), 1);
        for (let py = 0; py < faceHeight; py++) {
          for (let px = 0; px < faceWidth; px++) {
            const u = (px + 0.5) / faceWidth;
            const v = (py + 0.5) / faceHeight;
            const [r, g, b, a] = readSource(
              source,
              rectX + u * rectW,
              rectY + v * rectH,
            );
            const targetX = uv[0] + Math.round(face.x) + px;
            const targetY = uv[1] + Math.round(face.y) + py;
            if (targetX >= atlas.width || targetY >= atlas.height) continue;
            const offset = (targetY * atlas.width + targetX) * 4;
            atlas.data[offset] = r;
            atlas.data[offset + 1] = g;
            atlas.data[offset + 2] = b;
            atlas.data[offset + 3] = a;
          }
        }
      }
    }
  }
  return PNG.sync.write(atlas);
}

/* ---------------- Java glue ---------------- */

export function geckolibJavaSources(
  model: GeneratedModel,
  options: GeckolibOptions,
  layout = buildGeckolibLayout(model, options),
): Record<string, string> {
  const { namespace, modelId, javaPackage, generation } = options;
  const cls = toPascalCase(modelId);
  const path = javaPackage.replace(/\./g, "/");
  if (generation === "none") return {};

  const idleClip = layout.clips.find((clip) => clip.startsWith("floaters_"));
  const actionClip = layout.clips.find((clip) => clip.startsWith("action_"));
  const packageLine = `package ${javaPackage};`;
  const header = `// GeckoLib ${generation === "geckolib5" ? "5.x" : "4.x"} / Fabric. Generated by VoxelForge Studio.`;
  const itemClass = `${cls}Item`;

  const imports5 = [
    "java.util.function.Consumer",
    "net.minecraft.world.item.Item",
    "net.minecraft.world.item.ItemStack",
    "software.bernie.geckolib.animatable.GeoItem",
    "software.bernie.geckolib.animatable.client.GeoRenderProvider",
    "software.bernie.geckolib.animatable.instance.AnimatableInstanceCache",
    "software.bernie.geckolib.animatable.manager.AnimatableManager",
    "software.bernie.geckolib.animation.AnimationController",
    "software.bernie.geckolib.animation.RawAnimation",
    "software.bernie.geckolib.animation.state.PlayState",
    "software.bernie.geckolib.util.GeckoLibUtil",
  ];
  const imports4 = [
    "java.util.function.Consumer",
    "net.minecraft.world.item.Item",
    "software.bernie.geckolib.animatable.GeoItem",
    "software.bernie.geckolib.animatable.SingletonGeoAnimatable",
    "software.bernie.geckolib.animatable.instance.AnimatableInstanceCache",
    "software.bernie.geckolib.animation.AnimatableManager",
    "software.bernie.geckolib.animation.AnimationController",
    "software.bernie.geckolib.animation.PlayState",
    "software.bernie.geckolib.animation.RawAnimation",
    "software.bernie.geckolib.util.GeckoLibUtil",
  ];

  const controller5 = [
    ...(idleClip
      ? [
          `        controllers.add(new AnimationController<>("Idle", 5, state -> state.setAndContinue(IDLE)));`,
        ]
      : []),
    ...(actionClip
      ? [
          `        controllers.add(new AnimationController<>("Action", 0, state -> PlayState.STOP)`,
          `                .triggerableAnim("action", ACTION));`,
        ]
      : []),
  ];
  const controller4 = [
    ...(idleClip
      ? [
          `        controllers.add(new AnimationController<>(this, "Idle", 5, state -> state.setAndContinue(IDLE)));`,
        ]
      : []),
    ...(actionClip
      ? [
          `        controllers.add(new AnimationController<>(this, "Action", 0, state -> PlayState.STOP)`,
          `                .triggerableAnim("action", ACTION));`,
        ]
      : []),
  ];

  const itemJava = `${header}
${packageLine}

${(generation === "geckolib5" ? imports5 : imports4).map((line) => `import ${line};`).join("\n")}

public final class ${itemClass} extends Item implements GeoItem {
${idleClip ? `    private static final RawAnimation IDLE = RawAnimation.begin().thenLoop("${idleClip}");\n` : ""}${actionClip ? `    private static final RawAnimation ACTION = RawAnimation.begin().thenPlay("${actionClip}");\n` : ""}    private final AnimatableInstanceCache cache = GeckoLibUtil.createInstanceCache(this);

    public ${itemClass}(Item.Properties properties) {
        super(properties);
        // Server-side animation syncing and triggering.
        ${generation === "geckolib5" ? "GeoItem" : "SingletonGeoAnimatable"}.registerSyncedAnimatable(this);
    }

    @Override
    public void createGeoRenderer(Consumer<GeoRenderProvider> consumer) {
        consumer.accept(new GeoRenderProvider() {
            private ${cls}Renderer renderer;

            @Override
            public ${generation === "geckolib5" ? "net.minecraft.client.renderer.BlockEntityWithoutLevelRenderer" : "Object"} getGeoItemRenderer() {
                if (this.renderer == null) this.renderer = new ${cls}Renderer();
                return this.renderer;
            }
        });
    }

    @Override
    public void registerControllers(AnimatableManager.ControllerRegistrar controllers) {
${(generation === "geckolib5" ? controller5 : controller4).join("\n") || "        // No animations were written for this model."}
    }

    @Override
    public AnimatableInstanceCache getAnimatableInstanceCache() {
        return this.cache;
    }
}
`;

  const rendererJava = `${header}
${packageLine}

import net.minecraft.resources.ResourceLocation;
import software.bernie.geckolib.model.DefaultedItemGeoModel;
import software.bernie.geckolib.renderer.GeoItemRenderer;

public final class ${cls}Renderer extends GeoItemRenderer<${itemClass}> {
    public ${cls}Renderer() {
        // geo/item/${modelId}.geo.json, animations/item/${modelId}.animation.json, textures/item/${modelId}.png
        super(new DefaultedItemGeoModel<>(ResourceLocation.fromNamespaceAndPath("${namespace}", "${modelId}")));
    }
}
`;

  const registryJava = `${header}
${packageLine}

import net.minecraft.core.Registry;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.Rarity;

/** Registration snippet: call \`${cls}Registration.register()\` from your mod initializer. */
public final class ${cls}Registration {
    public static final Item ${modelId.toUpperCase()} = new ${itemClass}(
            new Item.Properties().stacksTo(1).rarity(Rarity.EPIC));

    public static void register() {
        Registry.register(BuiltInRegistries.ITEM,
                ResourceLocation.fromNamespaceAndPath("${namespace}", "${modelId}"), ${modelId.toUpperCase()});
    }

    private ${cls}Registration() {
    }
}
`;

  return {
    [`java/${path}/${itemClass}.java`]: itemJava,
    [`java/${path}/${cls}Renderer.java`]: rendererJava,
    [`java/${path}/${cls}Registration.java`]: registryJava,
  };
}

/* ---------------- dependency + docs ---------------- */

const GECKOLIB_MAVEN = "https://dl.cloudsmith.io/public/geckolib3/geckolib/maven/";

export function geckolibDependencySnippet(options: GeckolibOptions): string {
  const five = options.generation !== "geckolib4";
  return `## build.gradle.kts

\`\`\`kotlin
repositories {
    maven {
        name = "GeckoLib"
        url = uri("${GECKOLIB_MAVEN}")
        content { includeGroup("software.bernie.geckolib") }
    }
}

dependencies {
    modImplementation("software.bernie.geckolib:geckolib-fabric-\$minecraft_version:\$geckolib_version")
${five ? "" : "    implementation(\"com.eliotlash.mclib:mclib:20\")\n"}}

// gradle.properties
// geckolib_version=${five ? "5.4.x (Minecraft 1.21.11)" : "4.7.x (Minecraft 1.21.1)"}
\`\`\`

## fabric.mod.json

\`\`\`json
{ "depends": { "geckolib": ">=${five ? "5.4" : "4.7"}" } }
\`\`\`
`;
}

function readme(model: GeneratedModel, options: GeckolibOptions, layout: GeckolibLayout): string {
  const { namespace, modelId, generation } = options;
  const cls = toPascalCase(modelId);
  const bones = layout.bones.map((bone) => `\`${bone.name}\` (${bone.cubes.length} cubes)`).join(", ");
  return `# ${model.settings.name} — GeckoLib

対象: Minecraft Java 1.21.11 / Fabric / GeckoLib ${generation === "geckolib4" ? "4.7" : "5.4"}。
\`assets/\` を MOD の \`src/main/resources/\`、\`java/\` を \`src/main/java/\` にコピーしてください。

## 出力内容

- \`assets/${namespace}/geo/item/${modelId}.geo.json\` — Bedrock形式の ${layout.bones.length} ボーン / ${model.cubes.filter((c) => !c.hidden).length} キューブ
- \`assets/${namespace}/animations/item/${modelId}.animation.json\` — ${layout.clips.length ? layout.clips.map((clip) => `\`${clip}\``).join(", ") : "アニメーションなし"}
- \`assets/${namespace}/textures/item/${modelId}.png\` — ${layout.size}×${layout.size} の専用アトラス(キューブごとの島に展開済み)
- \`java/.../${cls}Item.java\` — GeoItem 本体とコントローラ
- \`java/.../${cls}Renderer.java\` — \`DefaultedItemGeoModel\` を使う GeoItemRenderer
- \`java/.../${cls}Registration.java\` — アイテム登録の雛形

ボーン: ${bones}

## 組み込み

${geckolibDependencySnippet(options)}
1. \`assets/\` と \`java/\` を MOD へコピーし、パッケージ名をMODに合わせます。
2. \`${cls}Registration.register()\` を ModInitializer から呼びます(1.21.4以降は \`assets/${namespace}/items/${modelId}.json\` のアイテム定義も必要です)。
3. アニメーションは \`${layout.clips[0] ?? "(なし)"}\` をループ再生し、${layout.clips.length > 1 ? `\`${layout.clips[1]}\` を右クリックなどで \`triggerAnim(...)\` すると発動します` : "発動アニメーションは含まれていません"}。

## 制限

- ここで生成するJavaは GeckoLib API 名を公式Wikiのサンプルに合わせた**雛形**です。このスタジオ内ではコンパイルしていません。導入先のマッピングに合わせて調整してください。
- Javaは GeckoLib 5.x (\`AnimatableManager\` は \`animatable.manager\`) を既定にしています。4.x では \`animation.AnimatableManager\` と \`new AnimationController<>(this, ...)\` に変わり、\`mclib\` 依存が追加で必要です。
- 発光キューブは \`render_type: emissive\` として書き出します。実際に光らせるには \`AutoGlowingGeoLayer\` かシェーダー側の対応が要ります。
- ゲーム内の性能値・レシピ・アイテム定義は含まれません(スタジオのリソースパック出力がバニラ用の見た目を担当します)。
`;
}

/* ---------------- bundle ---------------- */

export interface GeckolibBundle {
  zip: Uint8Array;
  files: string[];
  layout: GeckolibLayout;
}

export function geckolibFileList(
  model: GeneratedModel,
  options: GeckolibOptions,
  layout = buildGeckolibLayout(model, options),
): string[] {
  const { namespace, modelId } = options;
  const files = [
    `assets/${namespace}/geo/item/${modelId}.geo.json`,
    `assets/${namespace}/animations/item/${modelId}.animation.json`,
    `assets/${namespace}/textures/item/${modelId}.png`,
    "README.md",
    "dependencies/geckolib.gradle.kts",
  ];
  for (const path of Object.keys(geckolibJavaSources(model, options, layout))) files.push(path);
  return files;
}

/** Assembles the GeckoLib bundle: assets, Java glue, dependency snippet, README. */
export function toGeckolibBundle(
  model: GeneratedModel,
  overrides: Partial<GeckolibOptions> = {},
): GeckolibBundle {
  const options = resolveGeckolibOptions(model, overrides);
  const layout = buildGeckolibLayout(model, options);
  const { namespace, modelId } = options;
  const files: Record<string, Uint8Array> = {};

  files[`assets/${namespace}/geo/item/${modelId}.geo.json`] = strToU8(
    geckolibGeoModel(model, options, layout),
  );
  files[`assets/${namespace}/animations/item/${modelId}.animation.json`] = strToU8(
    geckolibAnimations(model, options),
  );
  files[`assets/${namespace}/textures/item/${modelId}.png`] = new Uint8Array(
    geckolibAtlas(model, layout),
  );
  files["dependencies/geckolib.gradle.kts"] = strToU8(geckolibDependencySnippet(options));
  files["README.md"] = strToU8(readme(model, options, layout));
  for (const [path, content] of Object.entries(geckolibJavaSources(model, options, layout)))
    files[path] = strToU8(content);

  return {
    zip: zipSync(files),
    files: geckolibFileList(model, options, layout),
    layout,
  };
}
