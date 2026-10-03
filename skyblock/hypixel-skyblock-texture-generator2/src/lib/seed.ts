import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { packs, textures } from "@/db/schema";
import { CATALOG_MAP } from "@/lib/catalog";
import { generateTexture } from "@/lib/generate";
import { nid } from "@/lib/ids";
import { ensureSchema } from "@/lib/bootstrap";
import { loadMasterworkPixels } from "@/lib/masterwork-pixels";
import type { Rarity } from "@/lib/rarity";
import type { MixEntry } from "@/lib/styles";

type DemoSpec = {
  id: string;
  name: string;
  author: string;
  description: string;
  styleId: string;
  signatureId: string;
  resolution: 16 | 32 | 64;
  itemIds: string[];
  paletteMix: MixEntry[];
  signatureMix: MixEntry[];
  hueShift: number;
  glow: number;
  metallic: number;
  chaos: number;
  /** Store authored masterwork art instead of procedural output. */
  useMasterworks?: boolean;
};

const DEMOS: DemoSpec[] = [
  {
    id: "demo_catacomb",
    name: "Catacomb Reliquary",
    author: "SkyForge",
    description:
      "地下墓地のインクと骨。ImperiaL 系の重厚な画法でダンジョン武器を宝器として再鍛造。",
    styleId: "catacomb_ink",
    signatureId: "imperial_ornate",
    resolution: 16,
    itemIds: [
      "hyperion",
      "livid_dagger",
      "shadow_fury",
      "dark_claymore",
      "spirit_sceptre",
      "necron_helmet",
      "necron_chestplate",
      "wither_shield_scroll",
    ],
    paletteMix: [
      { id: "catacomb_ink", weight: 2 },
      { id: "wither_sovereign", weight: 1 },
    ],
    signatureMix: [
      { id: "imperial_ornate", weight: 2 },
      { id: "depth_3d", weight: 1 },
    ],
    hueShift: -6,
    glow: 42,
    metallic: 58,
    chaos: 22,
  },
  {
    id: "demo_reborn",
    name: "Reborn Clarity Set",
    author: "SkyForge",
    description:
      "clean & detailed。メニューに並んだ瞬間に何が何か分かる、硬い輪郭と明るい内リムの基本形。",
    styleId: "reborn_flare",
    signatureId: "reborn_clean",
    resolution: 16,
    itemIds: [
      "aspect_of_the_dragons",
      "terminator",
      "juju_shortbow",
      "superior_helmet",
      "superior_chestplate",
      "tiger_pet",
      "midas_sword",
      "enchanted_book",
    ],
    paletteMix: [
      { id: "reborn_flare", weight: 2 },
      { id: "dragonwake", weight: 1 },
    ],
    signatureMix: [{ id: "reborn_clean", weight: 1 }],
    hueShift: 0,
    glow: 50,
    metallic: 55,
    chaos: 28,
  },
  {
    id: "demo_gemnest",
    name: "Gemnest Excavation",
    author: "SkyForge",
    description: "結晶洞窟の鉱脈を刃と拳に。Faithful 系のなめらかなランプで採掘装備を描写。",
    styleId: "gemnest",
    signatureId: "faithful_smooth",
    resolution: 32,
    itemIds: [
      "titanium_drill",
      "gemstone_gauntlet",
      "stonk",
      "gemstone_mixture",
      "hegemony_artifact",
      "plasmaflux",
      "treecapitator",
      "mathematical_hoe",
    ],
    paletteMix: [
      { id: "gemnest", weight: 2 },
      { id: "mithril_vein", weight: 1 },
    ],
    signatureMix: [
      { id: "faithful_smooth", weight: 2 },
      { id: "reborn_clean", weight: 1 },
    ],
    hueShift: 10,
    glow: 55,
    metallic: 44,
    chaos: 30,
  },
  {
    id: "demo_fairy",
    name: "Fairy Atelier Souvenirs",
    author: "SkyForge",
    description: "パステルと金箔。Vanilla+ の節度でまとめた、土産物のようなアクセとペット。",
    styleId: "fairy_atelier",
    signatureId: "vanilla_plus",
    resolution: 16,
    itemIds: [
      "bee_pet",
      "griffin_pet",
      "black_cat_pet",
      "speed_talisman",
      "treasure_ring",
      "flower_of_truth",
      "critical_potion",
      "relic_of_power",
    ],
    paletteMix: [
      { id: "fairy_atelier", weight: 3 },
      { id: "midas_gild", weight: 1 },
    ],
    signatureMix: [
      { id: "vanilla_plus", weight: 2 },
      { id: "skypixel_crisp", weight: 1 },
    ],
    hueShift: 6,
    glow: 34,
    metallic: 32,
    chaos: 16,
  },
  {
    id: "demo_void",
    name: "Void Neon Armory",
    author: "SkyForge",
    description: "虚空とネオンブルーム。発光体が輪郭から溢れるエンド系の武器庫。",
    styleId: "voidthorn",
    signatureId: "neon_bloom",
    resolution: 16,
    itemIds: [
      "aspect_of_the_void",
      "astraea",
      "scylla",
      "valkyrie",
      "enderman_pet",
      "implosion_scroll",
      "storm_helmet",
      "aurora_chestplate",
    ],
    paletteMix: [
      { id: "voidthorn", weight: 2 },
      { id: "gemnest", weight: 1 },
    ],
    signatureMix: [
      { id: "neon_bloom", weight: 2 },
      { id: "reborn_clean", weight: 1 },
    ],
    hueShift: -12,
    glow: 78,
    metallic: 48,
    chaos: 46,
  },
  {
    id: "demo_royal64",
    name: "Sovereign Regalia 64x",
    author: "SkyForge",
    description:
      "TRUE NATIVE 64×64。16/32型を使わず、64座標の別シルエット・曲線・刻印・ファセットを描く最高精細セット。Overhaulの精細設計とImperiaL系の王室装飾を調合。",
    styleId: "wither_sovereign",
    signatureId: "overhaul_intricate",
    resolution: 64,
    itemIds: [
      "astraea",
      "valkyrie",
      "necron_helmet",
      "necron_chestplate",
      "necron_leggings",
      "necron_boots",
      "golden_dragon_pet",
      "hegemony_artifact",
    ],
    paletteMix: [
      { id: "wither_sovereign", weight: 2 },
      { id: "midas_gild", weight: 1 },
    ],
    signatureMix: [
      { id: "overhaul_intricate", weight: 2 },
      { id: "imperial_ornate", weight: 1 },
    ],
    hueShift: -4,
    glow: 46,
    metallic: 68,
    chaos: 24,
  },
  {
    id: "demo_masterworks",
    name: "Masterwork Foundations 64x",
    author: "SkyForge Atelier",
    description:
      "手描き基準で起こしたオリジナル原画のみで構成した 64×64 ショーケース。剣・弓・杖・防具・ペット・道具を横断し、そのまま編集・再配布できる完成テクスチャ集。",
    styleId: "wither_sovereign",
    signatureId: "overhaul_intricate",
    resolution: 64,
    useMasterworks: true,
    itemIds: [
      "hyperion",
      "scylla",
      "midas_sword",
      "flower_of_truth",
      "terminator",
      "runaans_bow",
      "spirit_sceptre",
      "superior_helmet",
      "superior_chestplate",
      "golden_dragon_pet",
      "phoenix_pet",
      "gemstone_gauntlet",
    ],
    paletteMix: [
      { id: "wither_sovereign", weight: 2 },
      { id: "dragonwake", weight: 1 },
    ],
    signatureMix: [
      { id: "overhaul_intricate", weight: 2 },
      { id: "reborn_clean", weight: 1 },
    ],
    hueShift: 0,
    glow: 50,
    metallic: 60,
    chaos: 0,
  },
  {
    id: "demo_mechworks",
    name: "Machineworks Arsenal",
    author: "SkyForge Forge",
    description:
      "ドリル系統・機械部品・歯車刃をマシンワークス画法で鍛造した機械装備一式。鋼・真鍮・ティールの動力を基調に、鋲とリブで動力源を表現する。",
    styleId: "lin_mechworks",
    signatureId: "sig_mechworks",
    resolution: 64,
    itemIds: [
      "divans_drill",
      "titanium_drill",
      "titanium_drill_dr_x455",
      "gemstone_drill_lt_522",
      "halberd_of_the_shredded",
      "anti_sentient_pickaxe",
      "hyperion",
      "terminator",
      "titanium_plated_drill_engine",
      "perfectly_cut_fuel_tank",
    ],
    paletteMix: [
      { id: "lin_mechworks", weight: 2 },
      { id: "mithril_vein", weight: 1 },
    ],
    signatureMix: [
      { id: "sig_mechworks", weight: 2 },
      { id: "overhaul_intricate", weight: 1 },
    ],
    hueShift: -6,
    glow: 42,
    metallic: 74,
    chaos: 18,
  },
];


export async function ensureDemoPacks(): Promise<void> {
  await ensureSchema();
  const ids = DEMOS.map((d) => d.id);
  const existing = await db
    .select({ id: packs.id, resolution: packs.resolution, styleId: packs.styleId, signatureId: packs.signatureId })
    .from(packs)
    .where(inArray(packs.id, ids));
  const byId = new Map(existing.map((row) => [row.id, row]));
  const pending = DEMOS.filter((demo) => {
    const row = byId.get(demo.id);
    return (
      !row ||
      row.resolution !== demo.resolution ||
      row.styleId !== demo.styleId ||
      row.signatureId !== demo.signatureId
    );
  });
  if (!pending.length) return;

  for (const demo of pending) {
    const current = byId.get(demo.id);
    const values = {
      name: demo.name,
      author: demo.author,
      description: demo.description,
      resolution: demo.resolution,
      styleId: demo.styleId,
      signatureId: demo.signatureId,
      isPublic: true,
      updatedAt: new Date(),
    };
    if (current) {
      await db.update(packs).set(values).where(eq(packs.id, demo.id));
      await db.delete(textures).where(eq(textures.packId, demo.id));
    } else {
      await db.insert(packs).values({
        id: demo.id,
        ...values,
        downloads: 60 + demo.itemIds.length * 11,
        likes: 18 + demo.itemIds.length * 3,
      });
    }

    for (const [index, itemId] of demo.itemIds.entries()) {
      const item = CATALOG_MAP[itemId];
      if (!item) continue;
      const seed = 2000 + index * 853 + demo.name.length * 37;

      // Masterwork showcases store the authored 64px art itself, so the
      // gallery opens on finished pieces rather than procedural drafts.
      if (demo.useMasterworks) {
        const pixels = await loadMasterworkPixels(itemId);
        if (pixels) {
          await db.insert(textures).values({
            id: nid("tex"),
            packId: demo.id,
            itemId,
            name: item.name,
            category: item.category,
            rarity: item.rarity,
            styleMix: demo.paletteMix,
            signatureMix: demo.signatureMix,
            seed,
            resolution: 64,
            pixels,
            hueShift: 0,
            glow: demo.glow,
            metallic: demo.metallic,
            chaos: 0,
            templateId: `masterwork:${itemId}`,
          });
          continue;
        }
      }

      const generated = generateTexture({
        itemId,
        resolution: demo.resolution,
        seed,
        styleMix: demo.paletteMix,
        signatureMix: demo.signatureMix,
        rarity: item.rarity as Rarity,
        hueShift: demo.hueShift,
        glow: demo.glow,
        metallic: demo.metallic,
        chaos: demo.chaos,
      });
      await db.insert(textures).values({
        id: nid("tex"),
        packId: demo.id,
        itemId,
        name: item.name,
        category: item.category,
        rarity: item.rarity,
        styleMix: demo.paletteMix,
        signatureMix: demo.signatureMix,
        seed,
        resolution: demo.resolution,
        pixels: generated.pixels,
        hueShift: demo.hueShift,
        glow: demo.glow,
        metallic: demo.metallic,
        chaos: demo.chaos,
        templateId: generated.templateId,
      });
    }
  }
}
