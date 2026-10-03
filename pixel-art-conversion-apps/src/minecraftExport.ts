import JSZip from "jszip";

export interface TextureTarget {
  id: string;
  name: string;
  category: "block" | "item" | "painting" | "pack_icon";
  path: string; // relative to assets/minecraft/textures/
  recommendedSize: number; // e.g. 16, 32, 64
  description: string;
}

export const TEXTURE_TARGETS: TextureTarget[] = [
  // Blocks
  { id: "diamond_block", name: "ダイヤモンドブロック", category: "block", path: "block/diamond_block.png", recommendedSize: 16, description: "高級感ある青く輝くブロック" },
  { id: "dirt", name: "土ブロック", category: "block", path: "block/dirt.png", recommendedSize: 16, description: "ワールドの基本となる土" },
  { id: "stone", name: "石", category: "block", path: "block/stone.png", recommendedSize: 16, description: "地下を構成する標準的な石" },
  { id: "cobblestone", name: "丸石", category: "block", path: "block/cobblestone.png", recommendedSize: 16, description: "採掘した石ブロック" },
  { id: "oak_planks", name: "オークの板材", category: "block", path: "block/oak_planks.png", recommendedSize: 16, description: "建築の王道となる木材" },
  { id: "obsidian", name: "黒曜石", category: "block", path: "block/obsidian.png", recommendedSize: 16, description: "ネザーゲートを作る堅牢なブロック" },
  { id: "gold_block", name: "金ブロック", category: "block", path: "block/gold_block.png", recommendedSize: 16, description: "黄金色に輝くブロック" },
  { id: "iron_block", name: "鉄ブロック", category: "block", path: "block/iron_block.png", recommendedSize: 16, description: "金属質の白いブロック" },
  { id: "emerald_block", name: "エメラルドブロック", category: "block", path: "block/emerald_block.png", recommendedSize: 16, description: "深い緑の宝石ブロック" },
  { id: "tnt_side", name: "TNT (側面)", category: "block", path: "block/tnt_side.png", recommendedSize: 16, description: "爆薬ブロックの横面" },
  { id: "crafting_table_top", name: "作業台 (天面)", category: "block", path: "block/crafting_table_top.png", recommendedSize: 16, description: "クラフトの天面グリッド" },
  { id: "bookshelf", name: "本棚", category: "block", path: "block/bookshelf.png", recommendedSize: 16, description: "エンチャント部屋の本棚" },
  { id: "bricks", name: "レンガ", category: "block", path: "block/bricks.png", recommendedSize: 16, description: "焼きレンガのブロック" },
  { id: "glass", name: "ガラス", category: "block", path: "block/glass.png", recommendedSize: 16, description: "透明なガラス窓" },
  { id: "crying_obsidian", name: "泣く黒曜石", category: "block", path: "block/crying_obsidian.png", recommendedSize: 16, description: "紫の粒子を放つ神秘の黒曜石" },

  // Items
  { id: "diamond_sword", name: "ダイヤの剣", category: "item", path: "item/diamond_sword.png", recommendedSize: 16, description: "定番の最強武器テクスチャ" },
  { id: "netherite_sword", name: "ネザライトの剣", category: "item", path: "item/netherite_sword.png", recommendedSize: 16, description: "漆黒の最高位武器" },
  { id: "golden_apple", name: "金色のリンゴ", category: "item", path: "item/golden_apple.png", recommendedSize: 16, description: "特殊効果を付与する至高の食料" },
  { id: "totem_of_undying", name: "不死のトーテム", category: "item", path: "item/totem_of_undying.png", recommendedSize: 16, description: "プレイヤーの死を防ぐトーテム" },
  { id: "ender_pearl", name: "エンダーパール", category: "item", path: "item/ender_pearl.png", recommendedSize: 16, description: "テレポートするパール" },
  { id: "diamond", name: "ダイヤモンド", category: "item", path: "item/diamond.png", recommendedSize: 16, description: "鉱石の王様" },

  // Paintings
  { id: "painting_alban", name: "絵画: Alban (16x16)", category: "painting", path: "painting/alban.png", recommendedSize: 16, description: "小さな額縁絵画" },
  { id: "painting_aztec", name: "絵画: Aztec (16x16)", category: "painting", path: "painting/aztec.png", recommendedSize: 16, description: "アステカ風の絵画" },
  { id: "painting_bust", name: "絵画: Bust (32x32)", category: "painting", path: "painting/bust.png", recommendedSize: 32, description: "中型サイズの胸像絵画" },
  { id: "painting_match", name: "絵画: Match (32x32)", category: "painting", path: "painting/match.png", recommendedSize: 32, description: "中型サイズのマッチ絵画" },
  { id: "painting_pointer", name: "絵画: Pointer (64x64)", category: "painting", path: "painting/pointer.png", recommendedSize: 64, description: "壁一面の大型アート" },
  { id: "painting_pigscene", name: "絵画: Pigscene (64x64)", category: "painting", path: "painting/pigscene.png", recommendedSize: 64, description: "大型サイズの絵画" },

  // Pack Icon
  { id: "pack_icon", name: "パックアイコン (pack.png)", category: "pack_icon", path: "pack.png", recommendedSize: 64, description: "リソースパック選択画面に表示される顔" },
];

export const MC_VERSIONS = [
  { label: "Java 1.20.5 - 1.21.x (最新・推奨)", format: 34 },
  { label: "Java 1.20.2 - 1.20.4", format: 22 },
  { label: "Java 1.20 - 1.20.1", format: 15 },
  { label: "Java 1.19.4", format: 13 },
  { label: "Java 1.19 - 1.19.3", format: 12 },
  { label: "Java 1.18.x", format: 8 },
  { label: "Java 1.16.2 - 1.16.5", format: 6 },
  { label: "Java 1.12.2 (レガシー)", format: 3 },
];

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob([]));
    }, "image/png");
  });
}

export interface PackExportOptions {
  edition: "java" | "bedrock";
  packName: string;
  packDescription: string;
  targetIds: string[]; // selected texture target ids
  customTargetId?: string; // e.g. "block/custom_block"
  packFormat: number;
}

export async function exportMinecraftPack(
  canvas: HTMLCanvasElement,
  options: PackExportOptions
): Promise<{ blob: Blob; fileName: string }> {
  const zip = new JSZip();
  const pngBlob = await canvasToBlob(canvas);
  const cleanPackName = options.packName.trim().replace(/[^a-zA-Z0-9_\-\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, "_") || "MyPixelArtPack";

  if (options.edition === "java") {
    // 1. pack.mcmeta
    const mcmeta = {
      pack: {
        pack_format: options.packFormat,
        description: options.packDescription || "Created with Pixel Art MC Pack Maker",
      },
    };
    zip.file("pack.mcmeta", JSON.stringify(mcmeta, null, 2));

    // 2. pack.png (create a 64x64 or native version for the icon)
    zip.file("pack.png", pngBlob);

    // 3. Put textures in assets/minecraft/textures/...
    const targets = TEXTURE_TARGETS.filter((t) => options.targetIds.includes(t.id));

    // If custom target is provided
    if (options.customTargetId && options.customTargetId.trim()) {
      let customPath = options.customTargetId.trim();
      if (!customPath.endsWith(".png")) customPath += ".png";
      if (!customPath.startsWith("block/") && !customPath.startsWith("item/")) {
        customPath = "block/" + customPath;
      }
      zip.file(`assets/minecraft/textures/${customPath}`, pngBlob);
    }

    for (const target of targets) {
      if (target.category === "pack_icon") {
        // already wrote pack.png
        continue;
      }
      zip.file(`assets/minecraft/textures/${target.path}`, pngBlob);
    }

    // 4. Generate README.txt with installation tips
    const readme = `=== ${options.packName} ===
Minecraft Java Edition リソースパック

【導入方法】
1. Minecraft を起動し、「設定」>「リソースパック」を選択します。
2. 「パックフォルダーを開く」をクリックします。
3. このZIPファイルをそのまま開いたフォルダーに移動します（解凍する必要はありません）。
4. Minecraftの画面に戻り、左側の利用可能なパック一覧から本パックの「▶」をクリックして有効化します。
5. 「完了」を押すとテクスチャが適用されます！

含まれるテクスチャ:
${targets.map((t) => `- ${t.name} (assets/minecraft/textures/${t.path})`).join("\n")}
${options.customTargetId ? `- カスタム (${options.customTargetId})` : ""}

Pixel Art Generator で作成されました。
`;
    zip.file("README_導入手順.txt", readme);

    const blob = await zip.generateAsync({ type: "blob" });
    return { blob, fileName: `${cleanPackName}_Java.zip` };
  } else {
    // Bedrock Edition (.mcpack)
    const headerUUID = generateUUID();
    const moduleUUID = generateUUID();

    const manifest = {
      format_version: 2,
      header: {
        description: options.packDescription || "Custom Pixel Art Texture Pack",
        name: options.packName || "PixelArtTexture",
        uuid: headerUUID,
        version: [1, 0, 0],
        min_engine_version: [1, 20, 0],
      },
      modules: [
        {
          description: options.packDescription || "Custom Pixel Art Texture Pack",
          type: "resources",
          uuid: moduleUUID,
          version: [1, 0, 0],
        },
      ],
    };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    zip.file("pack_icon.png", pngBlob);

    // Bedrock textures: textures/blocks/ or textures/items/
    const targets = TEXTURE_TARGETS.filter((t) => options.targetIds.includes(t.id));
    for (const target of targets) {
      if (target.category === "pack_icon") continue;
      // In bedrock, it's often textures/blocks/stone.png or textures/items/diamond_sword.png
      const bedrockPath = target.path.startsWith("block/")
        ? target.path.replace("block/", "blocks/")
        : target.path.startsWith("item/")
        ? target.path.replace("item/", "items/")
        : target.path;
      zip.file(`textures/${bedrockPath}`, pngBlob);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    return { blob, fileName: `${cleanPackName}_Bedrock.mcpack` };
  }
}
