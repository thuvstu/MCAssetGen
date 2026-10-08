import { encodePng } from "./png";
import { DEFAULT_PROFILE } from "./targets";
import type { GeneratedFile, MobDef, ModProject } from "./types";

/**
 * GeckoLib support for generated Fabric mods.
 *
 * Mobs marked with `geckolib: true` keep the base-entity spawn behaviour of
 * `ModMobs` but get a GeckoLib `GeoReplacedEntity` renderer, so the vanilla
 * model is replaced by a generated geo model + animations:
 *
 *   assets/<modid>/geo/entity/<mob>.geo.json
 *   assets/<modid>/animations/entity/<mob>.animation.json
 *   assets/<modid>/textures/entity/<mob>.png
 *
 * plus the Kotlin glue (`mobs/GeckoMobs.kt`, `client/GeckoMobRenderers.kt`) and
 * the Gradle dependency (`software.bernie.geckolib:geckolib-fabric-<mc>`).
 */

export const GECKOLIB_VERSION = "5.4.4";
/** GeckoLib 5.4.x is published for Minecraft 1.21.11 (Mojang mappings). */
const SUPPORTED_PROFILE = /^mc1_21_11/;
export const GECKOLIB_MAVEN = "https://dl.cloudsmith.io/public/geckolib3/geckolib/maven/";

export const geckolibMobs = (project: ModProject): MobDef[] =>
  (project.mobs ?? []).filter((mob) => mob.geckolib);

export const hasGeckolib = (project: ModProject): boolean =>
  geckolibMobs(project).length > 0 &&
  SUPPORTED_PROFILE.test(project.meta.env?.profile ?? DEFAULT_PROFILE);

const pascal = (value: string): string =>
  value
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");

/** Vanilla mobs that walk on four legs — everything else is treated as bipedal. */
const QUADRUPED = /COW|PIG|SHEEP|WOLF|CAT|OCELOT|HORSE|DONKEY|MULE|LLAMA|FOX|POLAR|PANDA|HOGLIN|RAVAGER|GOAT|FROG|CAMEL|SNIFFER|AXOLOTL|TURTLE/;

interface Bone {
  name: string;
  parent: string;
  pivot: [number, number, number];
  cubes: { origin: [number, number, number]; size: [number, number, number]; uv: [number, number] }[];
}

function bonesFor(mob: MobDef): Bone[] {
  const quadruped = QUADRUPED.test((mob.baseMob || "").toUpperCase());
  const root: Bone = { name: "root", parent: "", pivot: [0, 0, 0], cubes: [] };
  if (quadruped)
    return [
      root,
      { name: "body", parent: "root", pivot: [0, 12, 0], cubes: [{ origin: [-5, 10, -8], size: [10, 10, 16], uv: [28, 8] }] },
      { name: "head", parent: "body", pivot: [0, 16, -8], cubes: [{ origin: [-4, 12, -14], size: [8, 8, 6], uv: [0, 0] }] },
      { name: "leg_front_left", parent: "root", pivot: [3, 10, -5], cubes: [{ origin: [2, 0, -6], size: [3, 10, 3], uv: [0, 16] }] },
      { name: "leg_front_right", parent: "root", pivot: [-3, 10, -5], cubes: [{ origin: [-5, 0, -6], size: [3, 10, 3], uv: [0, 16] }] },
      { name: "leg_back_left", parent: "root", pivot: [3, 10, 5], cubes: [{ origin: [2, 0, 4], size: [3, 10, 3], uv: [0, 16] }] },
      { name: "leg_back_right", parent: "root", pivot: [-3, 10, 5], cubes: [{ origin: [-5, 0, 4], size: [3, 10, 3], uv: [0, 16] }] },
      { name: "tail", parent: "body", pivot: [0, 14, 8], cubes: [{ origin: [-1, 12, 8], size: [2, 2, 6], uv: [24, 0] }] },
    ];
  return [
    root,
    { name: "body", parent: "root", pivot: [0, 12, 0], cubes: [{ origin: [-4, 12, -2], size: [8, 12, 4], uv: [16, 16] }] },
    { name: "head", parent: "body", pivot: [0, 24, 0], cubes: [{ origin: [-4, 24, -4], size: [8, 8, 8], uv: [0, 0] }] },
    { name: "arm_right", parent: "body", pivot: [-5, 22, 0], cubes: [{ origin: [-7, 12, -2], size: [3, 10, 4], uv: [40, 16] }] },
    { name: "arm_left", parent: "body", pivot: [5, 22, 0], cubes: [{ origin: [4, 12, -2], size: [3, 10, 4], uv: [40, 16] }] },
    { name: "leg_right", parent: "root", pivot: [-2, 12, 0], cubes: [{ origin: [-4, 0, -2], size: [4, 12, 4], uv: [0, 16] }] },
    { name: "leg_left", parent: "root", pivot: [2, 12, 0], cubes: [{ origin: [0, 0, -2], size: [4, 12, 4], uv: [0, 16] }] },
  ];
}

/** Bedrock-style geometry JSON (format_version 1.12.0) understood by GeckoLib 4/5. */
export function geckolibGeoJson(mob: ModDef, namespace: string): string {
  const bones = bonesFor(mob as MobDef);
  return JSON.stringify(
    {
      format_version: "1.12.0",
      "minecraft:geometry": [
        {
          description: {
            identifier: `geometry.${namespace}.${mob.id}`,
            texture_width: 64,
            texture_height: 64,
            visible_bounds_width: 3,
            visible_bounds_height: 3,
            visible_bounds_offset: [0, 1.5, 0],
          },
          bones: bones.map((bone) => ({
            name: bone.name,
            ...(bone.parent ? { parent: bone.parent } : {}),
            pivot: bone.pivot,
            ...(bone.cubes.length
              ? {
                  cubes: bone.cubes.map((cube) => ({
                    origin: cube.origin,
                    size: cube.size,
                    uv: cube.uv,
                  })),
                }
              : {}),
          })),
        },
      ],
    },
    null,
    2,
  );
}

type ModDef = { id: string; baseMob?: string; geckolib?: boolean; scale?: number };

/** Idle + walk loops; animation names match the Kotlin `RawAnimation` keys. */
export function geckolibAnimationJson(mob: ModDef): string {
  const quadruped = QUADRUPED.test((mob.baseMob || "").toUpperCase());
  const legs = quadruped
    ? ["leg_front_left", "leg_front_right", "leg_back_left", "leg_back_right"]
    : ["leg_left", "leg_right"];
  const swing = (bone: string, sign: number) => ({
    [bone]: {
      rotation: {
        "0.0": [0, 0, 0],
        "0.5": [sign * 30, 0, 0],
        "1.0": [0, 0, 0],
      },
    },
  });
  return JSON.stringify(
    {
      format_version: "1.8.0",
      animations: {
        idle: {
          loop: true,
          animation_length: 4,
          bones: {
            head: { rotation: { "0.0": [0, 0, 0], "2.0": [0, 4, 0], "4.0": [0, 0, 0] } },
          },
        },
        walk: {
          loop: true,
          animation_length: 1,
          bones: Object.assign(
            {},
            ...legs.map((bone, index) => swing(bone, index % 2 === 0 ? 1 : -1)),
          ),
        },
        attack: {
          loop: false,
          animation_length: 0.5,
          bones: quadruped
            ? { head: { rotation: { "0.0": [0, 0, 0], "0.25": [18, 0, 0], "0.5": [0, 0, 0] } } }
            : {
                arm_right: { rotation: { "0.0": [0, 0, 0], "0.25": [-90, 0, 0], "0.5": [0, 0, 0] } },
                arm_left: { rotation: { "0.0": [0, 0, 0], "0.25": [-90, 0, 0], "0.5": [0, 0, 0] } },
              },
        },
      },
    },
    null,
    2,
  );
}

/** Flat 64x64 skin derived from the mob id, so every mob looks distinct. */
export function geckolibTexturePng(mob: ModDef): Uint8Array {
  const size = 64;
  const rgb = new Uint8Array(size * size * 3);
  let hash = 2166136261;
  for (const ch of mob.id) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  const hue = (hash % 360) / 360;
  const tint = [0, 1, 2].map((index) => {
    const k = (n: number) => (n + hue * 12) % 12;
    const a = 0.45 * Math.min(0.65, 1 - 0.65);
    const f = (n: number) => 0.55 - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(f(index * 4) * 255);
  });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 3;
      const noise = ((x * 7 + y * 13 + hash) % 17) - 8;
      rgb[offset] = Math.max(0, Math.min(255, tint[0] + noise * 2));
      rgb[offset + 1] = Math.max(0, Math.min(255, tint[1] + noise * 2));
      rgb[offset + 2] = Math.max(0, Math.min(255, tint[2] + noise * 2));
    }
  }
  return encodePng(size, size, rgb);
}

function toBase64(bytes: Uint8Array): string {
  const globalScope = globalThis as { btoa?: (text: string) => string; Buffer?: { from: (data: Uint8Array) => { toString: (encoding: string) => string } } };
  if (typeof globalScope.btoa === "function") {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return globalScope.btoa(binary);
  }
  return globalScope.Buffer ? globalScope.Buffer.from(bytes).toString("base64") : "";
}

/**
 * Kotlin: one self-contained client file.
 *
 * Everything GeckoLib-related lives in a single file so the generated project
 * needs no project-local imports: the animatable objects, the replaced-entity
 * renderers and the client initializer.
 */
export function geckolibClientBody(project: ModProject, mobs: MobDef[]): string {
  const modId = project.meta.modId;
  const objects = mobs
    .map((mob) => {
      const cls = `${pascal(mob.id)}Animatable`;
      const base = (mob.baseMob || "ZOMBIE").toUpperCase();
      return `/** ${mob.name || mob.id} — バニラの ${base} を GeckoLib モデルで置き換える */
object ${cls} : GeoReplacedEntity {
    private val cache: AnimatableInstanceCache = GeckoLibUtil.createInstanceCache(this)

    override fun getReplacingEntityType(): EntityType<*> = EntityType.${base}

    override fun getAnimatableInstanceCache(): AnimatableInstanceCache = cache

    override fun registerControllers(controllers: AnimatableManager.ControllerRegistrar) {
        controllers.add(
            AnimationController("movement", 5) { state ->
                state.setAndContinue(if (state.isMoving) RawAnimation.begin().thenLoop("walk") else RawAnimation.begin().thenLoop("idle"))
            }
        )
        controllers.add(
            AnimationController("attack", 0).triggerableAnim("attack", RawAnimation.begin().thenPlay("attack"))
        )
    }
}`;
    })
    .join("\n\n");
  const registers = mobs
    .map((mob) => {
      const cls = `${pascal(mob.id)}Animatable`;
      const base = (mob.baseMob || "ZOMBIE").toUpperCase();
      return `        EntityRendererRegistry.register(EntityType.${base}) { context ->
            GeoReplacedEntityRenderer(
                context,
                DefaultedEntityGeoModel<${cls}>(Identifier.of("${modId}", "${mob.id}")),
                ${cls},
            )
        }`;
    })
    .join("\n");
  return `/**
 * GeckoLib 5 (Fabric 1.21.11) の置き換え描画。
 * ModMobs が召喚するバニラ ${mobs.map((mob) => mob.baseMob).join(" / ")} を、
 * 生成した geo/entity と animations/entity のアセットで描画します。
 */

${objects}

/** クライアント初期化: 置き換えレンダラを登録 */
object GeckoMobRenderers : ClientModInitializer {
    override fun onInitializeClient() {
${registers}
    }
}
`;
}

/** GeckoLib assets + Kotlin glue + integration notes. */
export function geckolibMobFiles(project: ModProject): GeneratedFile[] {
  const mobs = geckolibMobs(project);
  // GeckoLib 5.4.x targets Minecraft 1.21.11; older profiles keep the base-entity mob.
  if (!mobs.length || !SUPPORTED_PROFILE.test(project.meta.env?.profile ?? DEFAULT_PROFILE)) return [];
  const modId = project.meta.modId;
  const files: GeneratedFile[] = [];
  for (const mob of mobs) {
    files.push({
      path: `src/main/resources/assets/${modId}/geo/entity/${mob.id}.geo.json`,
      content: geckolibGeoJson(mob as ModDef, modId),
      kind: "json",
    });
    files.push({
      path: `src/main/resources/assets/${modId}/animations/entity/${mob.id}.animation.json`,
      content: geckolibAnimationJson(mob as ModDef),
      kind: "json",
    });
    files.push({
      path: `src/main/resources/assets/${modId}/textures/entity/${mob.id}.png`,
      content: toBase64(geckolibTexturePng(mob as ModDef)),
      kind: "binary",
      encoding: "base64",
    });
  }
  files.push({
    path: "GECKOLIB.md",
    kind: "text",
    content: `# GeckoLib

このプロジェクトには GeckoLib 対応のモブが ${mobs.length} 体含まれます。

- Gradle: \`software.bernie.geckolib:geckolib-fabric-<minecraft>\` (maven: ${GECKOLIB_MAVEN})
- アセット: \`assets/${modId}/geo|animations|textures/entity/<mob>\`
- クライアント: \`${project.meta.packageName}.client.GeckoMobRenderers\` (fabric.mod.json の client entrypoint)
- サーバー: \`ModMobs.spawn("${mobs[0].id}", world, pos)\` で召喚

対象: ${mobs.map((mob) => `${mob.id} (${mob.baseMob})`).join(", ")}
`,
  });
  return files;
}
