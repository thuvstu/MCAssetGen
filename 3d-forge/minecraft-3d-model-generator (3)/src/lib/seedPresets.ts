import type { NewVoxelModelRow } from "@/db/schema";
import {
  ARCHETYPE_CATALOG,
  generateArchetypeElements,
  generatePixelAtlasMatrix,
  getDefaultDisplaySettings,
  type ArchetypeId,
  type MaterialPresetId,
} from "./voxelGenerator";
import { matrixToPngDataUrl } from "./pngEncoder";

export function buildSeedPresetModels(): NewVoxelModelRow[] {
  const specs: Array<{
    name: string;
    slug: string;
    description: string;
    archetype: ArchetypeId;
    materialPreset: MaterialPresetId;
    resolution: number;
    downloadsCount: number;
  }> = [
    {
      name: "蒼輝のダイヤ・ブロードソード",
      slug: "radiant_diamond_broadsword",
      description:
        "32x32高精細UVアトラスと多段ベベル刃・ソウルジェムクロスガードを備えた王道ダイヤモンド剣。",
      archetype: "sword",
      materialPreset: "diamond",
      resolution: 32,
      downloadsCount: 142,
    },
    {
      name: "古代ネザライトの魔王大剣",
      slug: "ancient_netherite_greatsword",
      description:
        "マグマルーンが脈動する重厚な両手クレイモア。Blockbench 22.5°回転ウィングガード対応。",
      archetype: "greatsword",
      materialPreset: "netherite",
      resolution: 32,
      downloadsCount: 218,
    },
    {
      name: "紅月・ブラッドムーン打刀",
      slug: "bloodmoon_crimson_katana",
      description:
        "緩やかな反り（Sori）を多段ボクセルで表現し、刃文と鍔（Tsuba）を精密にUVパッキングした日本刀。",
      archetype: "katana",
      materialPreset: "crimson",
      resolution: 32,
      downloadsCount: 189,
    },
    {
      name: "翠玉ヴァルキリーの両刃戦斧",
      slug: "emerald_valkyrie_battleaxe",
      description:
        "三日月型の両刃ブレードとアーマーピアース穂先を持つエメラルド重装バトルアックス。",
      archetype: "axe",
      materialPreset: "emerald",
      resolution: 32,
      downloadsCount: 96,
    },
    {
      name: "星晶アメジストの大魔導杖",
      slug: "astral_amethyst_archmage_staff",
      description:
        "45°回転させた八面体マナ結晶コアが杖頭クラウンに浮遊するアークメイジスタッフ。",
      archetype: "staff",
      materialPreset: "amethyst",
      resolution: 32,
      downloadsCount: 164,
    },
    {
      name: "ディープダーク・ウォーデンピッケル",
      slug: "warden_sculk_pickaxe",
      description:
        "22.5°傾斜ツインピック穂先とスカルク発光テクスチャを備えた高耐久マイニングツルハシ。",
      archetype: "pickaxe",
      materialPreset: "sculk",
      resolution: 32,
      downloadsCount: 115,
    },
    {
      name: "蒼雷の機巧銃剣・リボルバー",
      slug: "lightning_revolver_gunblade",
      description:
        "回転シリンダーと伸縮バレル、放熱フィンを備えた変形ガンブレード。トランスフォームで射撃形態へ展開！",
      archetype: "gunblade",
      materialPreset: "diamond",
      resolution: 32,
      downloadsCount: 280,
    },
    {
      name: "超伝導可変レールキャノン",
      slug: "overclock_rail_cannon",
      description:
        "ツイン加速レールが展開する重砲。超伝導プラズマコア露出＆放熱シャッター可変機構搭載。",
      archetype: "rail_cannon",
      materialPreset: "sculk",
      resolution: 32,
      downloadsCount: 340,
    },
    {
      name: "紅蓮の機巧鋸刃・チェンソー",
      slug: "crimson_ripper_chainsaw",
      description:
        "超硬タングステン鋸歯とデュアルエキゾーストマフラーを持つ重装チェンソー。シュレッダー変形対応。",
      archetype: "chainsaw_blade",
      materialPreset: "crimson",
      resolution: 32,
      downloadsCount: 235,
    },
    { name: "禍津の魔剣", slug: "magatsu_cursed_blade", description: "髑髏の柄頭、開く魔眼、ギザ刃と周回する呪鎖。呪煙エフェクト付き。", archetype: "cursed_blade", materialPreset: "abyss", resolution: 32, downloadsCount: 412 },
    { name: "鮮血の大鎌サングイン", slug: "sanguine_blood_scythe", description: "脈打つ心臓核と三日月刃、滴る血の雫。血霧エフェクト付き。", archetype: "blood_scythe", materialPreset: "blood", resolution: 32, downloadsCount: 377 },
    { name: "星詠みの魔導書", slug: "astral_grimoire", description: "魔眼の封印と浮遊頁、三重魔法陣とジャイロ環が回る魔導書。", archetype: "grimoire", materialPreset: "amethyst", resolution: 32, downloadsCount: 356 },
    { name: "熾天使の聖杖", slug: "seraph_holy_scepter", description: "回転する聖晶と十字、熾天使の翼と光輪の王笏。", archetype: "scepter", materialPreset: "holy", resolution: 32, downloadsCount: 298 },
    { name: "帝国儀礼の装飾槍", slug: "imperial_ornate_spear", description: "金帯・宝石鋲・軍旗・房飾り・副刃・光輪まで盛った儀礼槍。", archetype: "ornate_spear", materialPreset: "gold", resolution: 32, downloadsCount: 264 },
    { name: "翠風のリカーブ長弓", slug: "emerald_recurve_bow", description: "変形展開で弦が引き絞られ矢がしなる長弓。", archetype: "bow", materialPreset: "emerald", resolution: 32, downloadsCount: 221 },
    { name: "タクティカル突撃銃", slug: "tactical_assault_rifle", description: "光学照準器とM-LOKハンドガード、湾曲弾倉の近代ライフル。", archetype: "assault_rifle", materialPreset: "gunmetal", resolution: 32, downloadsCount: 305 },
    { name: "古代の聖遺物", slug: "ancient_relic", description: "鉤爪の台座に浮かぶ心核と二重環、周回する破片。", archetype: "relic", materialPreset: "holy", resolution: 32, downloadsCount: 247 },
    { name: "雷鳴のコイルレールガン", slug: "thunder_coil_railgun", description: "回転コイルと脈動コンデンサ、展開レールの電磁砲。", archetype: "railgun", materialPreset: "iron", resolution: 32, downloadsCount: 289 },
  ];

  return specs.map((s) => {
    const meta =
      ARCHETYPE_CATALOG.find((a) => a.id === s.archetype) || ARCHETYPE_CATALOG[0];
    const params = { ...meta.defaultParams };
    const elements = generateArchetypeElements(s.archetype, params, s.resolution);
    const matrix = generatePixelAtlasMatrix(
      elements,
      s.materialPreset,
      s.resolution,
      params.shadingStyle
    );
    const textureDataUrl = matrixToPngDataUrl(matrix);
    const display = getDefaultDisplaySettings(s.archetype);

    return {
      name: s.name,
      slug: s.slug,
      description: s.description,
      archetype: s.archetype,
      materialPreset: s.materialPreset,
      atlasResolution: s.resolution,
      paramsJson: params,
      elementsJson: elements,
      displayJson: display,
      textureDataUrl,
      isPreset: true,
      downloadsCount: s.downloadsCount,
    };
  });
}
