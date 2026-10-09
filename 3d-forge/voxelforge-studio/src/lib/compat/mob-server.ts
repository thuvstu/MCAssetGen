import { strToU8, zipSync } from "fflate";
import {
  animationController,
  animationJson,
  bedrockLangs,
  behaviorEntity,
  biomeModifier,
  blockbenchModel,
  bpManifest,
  clientEntity,
  designJson,
  fabricJava,
  geometryJson,
  langFiles,
  lootTable,
  neoJava,
  readme,
  rpManifest,
  spawnEggModel,
  spawnRulesJson,
  bedrockLootTable,
} from "./mob-export";
import { buildFabric12111Project } from "./mob-fabric";
import { packBoxUV } from "./mob-boxuv";
import { renderEntityTexturePng } from "./mob-texture-server";
import { packTexture, FACE_LIGHT } from "./mob-texture";
import {
  canvasToPng,
  createCanvas,
  parseColor,
  fillRect,
  setPixel,
  strokeRect,
} from "./pixel-canvas";
import { pascal } from "./mob-model";
import type { MobDraft } from "./mob-types";

/**
 * Server-side adapters for the mob maker.
 *
 * The browser version rendered with `<canvas>` and zipped with JSZip; the studio
 * renders with pngjs (see pixel-canvas) and zips with fflate. File layouts and
 * names match the original exporter so existing docs stay correct.
 */

const hashNoise = (seed: number): number => {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

/** Java-style entity texture (DOM非依存: mob-texture-server と共通実装). */
export function renderMobTexture(mob: MobDraft): { png: Uint8Array; size: number } {
  return renderEntityTexturePng(mob);
}

/** Bedrock box-UV texture: per-pixel noise, transparent unused area. */
export function renderMobBoxUvTexture(mob: MobDraft): {
  png: Uint8Array;
  size: number;
} {
  const atlas = packBoxUV(mob);
  const canvas = createCanvas(atlas.size, atlas.size);
  let seed = 1;
  const paint = (
    rx: number,
    ry: number,
    rw: number,
    rh: number,
    base: string,
    light: number,
  ) => {
    const [r, g, b] = parseColor(base);
    for (let py = 0; py < rh; py++) {
      for (let px = 0; px < rw; px++) {
        seed += 1;
        const n = 0.9 + hashNoise(seed) * 0.2;
        setPixel(canvas, rx + px, ry + py, [
          Math.min(255, Math.round(r * light * n)),
          Math.min(255, Math.round(g * light * n)),
          Math.min(255, Math.round(b * light * n)),
          255,
        ]);
      }
    }
  };
  for (const entry of atlas.entries) {
    const { u, v, w, h, d, color } = entry;
    paint(u + d, v, w, d, color, FACE_LIGHT.up);
    paint(u + d + w, v, w, d, color, FACE_LIGHT.down);
    paint(u, v + d, d, h, color, FACE_LIGHT.east);
    paint(u + d, v + d, w, h, color, FACE_LIGHT.north);
    paint(u + d + w, v + d, d, h, color, FACE_LIGHT.west);
    paint(u + 2 * d + w, v + d, w, h, color, FACE_LIGHT.south);
  }
  return { png: canvasToPng(canvas), size: atlas.size };
}

export interface MobBundle {
  zip: Uint8Array;
  files: string[];
}

function text(value: string): Uint8Array {
  return strToU8(value);
}

/** Bedrock behaviour + resource pack as a single .mcaddon. */
export function buildMobMcaddon(mob: MobDraft): MobBundle {
  const texture = renderMobTexture(mob);
  const id = mob.entityId;
  const bp = `${id}_BP`;
  const rp = `${id}_RP`;
  const langs = bedrockLangs(mob);
  const files: Record<string, Uint8Array> = {
    [`${bp}/manifest.json`]: text(bpManifest(mob, crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID())),
    [`${bp}/entities/${id}.json`]: text(behaviorEntity(mob)),
    [`${bp}/loot_tables/entities/${id}.json`]: text(bedrockLootTable(mob)),
    [`${bp}/spawn_rules/${id}.json`]: text(spawnRulesJson(mob)),
    [`${rp}/manifest.json`]: text(rpManifest(mob, crypto.randomUUID(), crypto.randomUUID())),
    [`${rp}/entity/${id}.entity.json`]: text(clientEntity(mob)),
    [`${rp}/models/entity/${id}.geo.json`]: text(
      geometryJson(mob, packTexture(mob).faces, texture.size),
    ),
    [`${rp}/animations/${id}.animation.json`]: text(animationJson(mob)),
    [`${rp}/animation_controllers/${id}.controllers.json`]: text(animationController(mob)),
    [`${rp}/textures/entity/${id}.png`]: texture.png,
    [`${rp}/texts/en_US.lang`]: text(langs.en),
    [`${rp}/texts/ja_JP.lang`]: text(langs.ja),
    [`${rp}/texts/languages.json`]: text(JSON.stringify(["en_US", "ja_JP"])),
  };
  return { zip: zipSync(files), files: Object.keys(files).sort() };
}

/** Everything the mob maker offers: Fabric project, Bedrock draft, Java drafts. */
export function buildMobBundle(mob: MobDraft): MobBundle {
  const id = mob.entityId;
  const mod = mob.modId;
  const texture = renderMobTexture(mob);
  const boxTexture = renderMobBoxUvTexture(mob);
  const fabric = buildFabric12111Project(mob);
  const lang = langFiles(mob);
  const files: Record<string, Uint8Array> = {
    "README.txt": text(readme(mob)),
    [`design/${id}.mobforge.json`]: text(designJson(mob)),
    [`models/${id}.bbmodel`]: text(blockbenchModel(mob)),
    [`fabric-1.21.11/${fabric.texturePath}`]: boxTexture.png,
    [`java/fabric-1.20.1/${pascal(id)}Entity.java`]: text(fabricJava(mob, "1.20.1")),
    [`java/fabric-1.21.1/${pascal(id)}Entity.java`]: text(fabricJava(mob, "1.21.1")),
    [`java/neoforge-1.21.1/${pascal(id)}Entity.java`]: text(neoJava(mob, "1.21.1")),
    [`java/neoforge-1.21.4/${pascal(id)}Entity.java`]: text(neoJava(mob, "1.21.4")),
    [`data/${mod}/loot_table/entities/${id}.json`]: text(lootTable(mob)),
    [`data/${mod}/neoforge/biome_modifier/${id}.json`]: text(biomeModifier(mob)),
    [`assets/${mod}/lang/ja_jp.json`]: text(lang.ja),
    [`assets/${mod}/lang/en_us.json`]: text(lang.en),
    [`assets/${mod}/models/item/${id}_spawn_egg.json`]: text(spawnEggModel()),
    [`bedrock/entities/${id}.behavior.json`]: text(behaviorEntity(mob)),
    [`bedrock/spawn_rules/${id}.json`]: text(spawnRulesJson(mob)),
    [`bedrock/loot_tables/entities/${id}.json`]: text(bedrockLootTable(mob)),
    [`bedrock/entity/${id}.entity.json`]: text(clientEntity(mob)),
    [`bedrock/models/entity/${id}.geo.json`]: text(
      geometryJson(mob, packTexture(mob).faces, texture.size),
    ),
    [`bedrock/animations/${id}.animation.json`]: text(animationJson(mob)),
    [`bedrock/animation_controllers/${id}.controller.json`]: text(animationController(mob)),
    [`bedrock/textures/entity/${id}.png`]: texture.png,
    [`bedrock/uv-map.json`]: text(
      JSON.stringify(
        packTexture(mob).faces.map((face) => ({
          part: face.partId,
          face: face.face,
          uv: [face.u, face.v],
          size: [face.w, face.h],
          color: face.color,
        })),
        null,
        2,
      ),
    ),
  };
  for (const [path, content] of Object.entries(fabric.files))
    files[`fabric-1.21.11/${path}`] = text(content);
  return { zip: zipSync(files), files: Object.keys(files).sort() };
}

/** Fabric 1.21.11 Gradle project only. */
export function buildMobFabricProject(mob: MobDraft): MobBundle {
  const fabric = buildFabric12111Project(mob);
  const files: Record<string, Uint8Array> = {};
  for (const [path, content] of Object.entries(fabric.files))
    files[path] = text(content);
  files[fabric.texturePath] = renderMobBoxUvTexture(mob).png;
  return { zip: zipSync(files), files: Object.keys(files).sort() };
}

/* ---------------- GeckoLib ---------------- */

/** Plain animation names for GeckoLib (`idle` / `walk`). */
export function geckolibMobAnimationJson(mob: MobDraft): string {
  const source = JSON.parse(animationJson(mob)) as {
    animations: Record<string, { animation_length?: number; loop?: boolean; bones?: unknown }>;
  };
  const animations: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source.animations)) {
    const name = key.split(".").pop() ?? key;
    animations[name] = value;
  }
  return JSON.stringify({ format_version: "1.8.0", animations }, null, 2);
}

export function geckolibMobGeoJson(mob: MobDraft): string {
  return geometryJson(mob, packTexture(mob).faces, renderMobTexture(mob).size);
}

/**
 * GeckoLib entity glue: entity class additions plus a GeoEntityRenderer.
 * Mirrors the armor module's approach (Java, GeckoLib API names from the wiki).
 */
export function geckolibMobSources(mob: MobDraft): Record<string, string> {
  const cls = pascal(mob.entityId);
  const pkg = `com.example.${mob.modId}`;
  const path = pkg.replace(/\./g, "/");
  const entity = `${cls}Entity`;
  const renderer = `Geo${cls}Renderer`;

  const rendererJava = `package ${pkg}.client;

// GeckoLib entity renderer (Java). GeoEntityRenderer replaces the vanilla renderer.
import net.minecraft.client.renderer.entity.EntityRendererProvider;
import software.bernie.geckolib.model.DefaultedEntityGeoModel;
import software.bernie.geckolib.renderer.GeoEntityRenderer;

public final class ${renderer} extends GeoEntityRenderer<${entity}> {
    public ${renderer}(EntityRendererProvider.Context context) {
        // geo/entity/${mob.entityId}.geo.json, animations/entity/${mob.entityId}.animation.json
        super(context, new DefaultedEntityGeoModel<>(net.minecraft.resources.ResourceLocation.fromNamespaceAndPath("${mob.modId}", "${mob.entityId}")));
    }
}
`;

  const entitySnippet = `// Add to ${entity}.java (GeckoLib 5 / Fabric):
//   public class ${entity} extends PathfinderMob implements GeoEntity {
//       private static final RawAnimation WALK = RawAnimation.begin().thenLoop("walk");
//       private final AnimatableInstanceCache cache = GeckoLibUtil.createInstanceCache(this);
//
//       @Override
//       public void registerControllers(AnimatableManager.ControllerRegistrar controllers) {
//           controllers.add(new AnimationController<>("Walk", 5, state ->
//                   this.getDeltaMovement().horizontalDistanceSqr() > 1.0e-6
//                           ? state.setAndContinue(WALK)
//                           : PlayState.STOP));
//       }
//
//       @Override
//       public AnimatableInstanceCache getAnimatableInstanceCache() {
//           return this.cache;
//       }
//   }
//
// Client: EntityRendererRegistry.register(${cls}ModEntities.${mob.entityId.toUpperCase()}, ${renderer}::new);
`;

  return {
    [`java/${path}/client/${renderer}.java`]: rendererJava,
    [`java/${path}/${cls}GeoEntitySnippet.java.txt`]: entitySnippet,
  };
}

/** GeckoLib-ready mob asset + source bundle. */
export function buildMobGeckolibBundle(mob: MobDraft): MobBundle {
  const texture = renderMobBoxUvTexture(mob);
  const files: Record<string, Uint8Array> = {
    [`assets/${mob.modId}/geo/entity/${mob.entityId}.geo.json`]: text(geckolibMobGeoJson(mob)),
    [`assets/${mob.modId}/animations/entity/${mob.entityId}.animation.json`]: text(
      geckolibMobAnimationJson(mob),
    ),
    [`assets/${mob.modId}/textures/entity/${mob.entityId}.png`]: texture.png,
    "README.md": text(
      [
        `# ${mob.displayName} — GeckoLib`,
        "",
        `- geo/entity/${mob.entityId}.geo.json: Bedrock 1.12.0 geometry (${mob.entityId})`,
        `- animations/entity/${mob.entityId}.animation.json: ループアニメーション idle / walk`,
        `- textures/entity/${mob.entityId}.png: box-UV テクスチャ (${texture.size}px)`,
        "",
        "GeckoLib 5.x を build.gradle.kts に追加し、`GeoEntity` を実装したエンティティと",
        "`GeoEntityRenderer` を登録してください。生成したJava雛形は未コンパイルです。",
        "",
      ].join("\n"),
    ),
  };
  for (const [filePath, content] of Object.entries(geckolibMobSources(mob)))
    files[filePath] = text(content);
  return { zip: zipSync(files), files: Object.keys(files).sort() };
}
