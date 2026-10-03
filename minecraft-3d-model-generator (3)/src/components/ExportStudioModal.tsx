"use client";

import React, { useMemo, useState } from "react";
import JSZip from "jszip";
import type { CuboidElement, EffectPresetId, ModelDisplaySettings } from "@/db/schema";
import {
  computeJavaFit,
  exportToBlockbenchBBModel,
  exportToMinecraftJSON,
} from "@/lib/voxelGenerator";
import { buildAuraFunction, hasMotion } from "@/lib/motion";
import {
  Check,
  Code2,
  Copy,
  Download,
  FileArchive,
  FileCode,
  Image as ImageIcon,
  Terminal,
  X,
} from "lucide-react";

interface ExportStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelName: string;
  modelSlug: string;
  resolution: number;
  elements: CuboidElement[];
  displaySettings: ModelDisplaySettings;
  textureDataUrl: string;
  effectPreset?: EffectPresetId;
  onExportSuccess?: () => void;
}

export default function ExportStudioModal({
  isOpen,
  onClose,
  modelName,
  modelSlug,
  resolution,
  elements,
  displaySettings,
  textureDataUrl,
  effectPreset,
  onExportSuccess,
}: ExportStudioModalProps) {
  const wantsAura = hasMotion(elements) || (!!effectPreset && effectPreset !== "none");
  const javaFit = computeJavaFit(elements);
  const [previewFormat, setPreviewFormat] = useState<"bbmodel" | "mcjson">(
    "bbmodel"
  );
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const safeSlug = useMemo(
    () =>
      (modelSlug || modelName || "voxelforge_weapon")
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_")
        .replace(/^_+|_+$/g, "") || "voxelforge_weapon",
    [modelSlug, modelName]
  );

  const bbModelString = useMemo(
    () =>
      exportToBlockbenchBBModel({
        name: modelName,
        slug: safeSlug,
        resolution,
        elements,
        display: displaySettings,
        textureDataUrl,
      }),
    [modelName, safeSlug, resolution, elements, displaySettings, textureDataUrl]
  );

  const mcJsonString = useMemo(
    () =>
      exportToMinecraftJSON({
        slug: safeSlug,
        resolution,
        elements,
        display: displaySettings,
      }),
    [safeSlug, resolution, elements, displaySettings]
  );

  if (!isOpen) return null;

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onExportSuccess?.();
  };

  const handleDownloadBBModel = () => {
    const blob = new Blob([bbModelString], { type: "application/json" });
    triggerDownload(blob, `${safeSlug}.bbmodel`);
  };

  const handleDownloadMCJson = () => {
    const blob = new Blob([mcJsonString], { type: "application/json" });
    triggerDownload(blob, `${safeSlug}.json`);
  };

  const handleDownloadPNG = () => {
    if (!textureDataUrl) return;
    const a = document.createElement("a");
    a.href = textureDataUrl;
    a.download = `${safeSlug}.png`;
    a.click();
    onExportSuccess?.();
  };

  const handleDownloadResourcePackZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // 1. pack.mcmeta (Minecraft 1.20 - 1.21+ compatible)
      const packMcmeta = {
        pack: {
          pack_format: 34,
          supported_formats: { min_inclusive: 15, max_inclusive: 48 },
          description: `§bVoxelForge 3D Pack: §f${modelName} (${resolution}x${resolution} UV)`,
        },
      };
      zip.file("pack.mcmeta", JSON.stringify(packMcmeta, null, 2));

      // 2. Item Model JSON in assets/minecraft/models/item/<slug>.json
      zip.file(`assets/minecraft/models/item/${safeSlug}.json`, mcJsonString);

      // 3. CustomModelData override for diamond_sword so it works immediately in-game
      const diamondSwordOverride = {
        parent: "minecraft:item/handheld",
        textures: {
          layer0: "minecraft:item/diamond_sword",
        },
        overrides: [
          {
            predicate: { custom_model_data: 1001 },
            model: `minecraft:item/${safeSlug}`,
          },
        ],
      };
      zip.file(
        "assets/minecraft/models/item/diamond_sword.json",
        JSON.stringify(diamondSwordOverride, null, 2)
      );

      // 4. UV Atlas PNG in assets/minecraft/textures/item/<slug>.png
      if (textureDataUrl.startsWith("data:image/png;base64,")) {
        const base64Data = textureDataUrl.replace(
          /^data:image\/png;base64,/,
          ""
        );
        zip.file(`assets/minecraft/textures/item/${safeSlug}.png`, base64Data, {
          base64: true,
        });
      }

      // 5. Also bundle the .bbmodel inside the zip root for convenience
      zip.file(`${safeSlug}.bbmodel`, bbModelString);

      if (wantsAura) {
        zip.file(
          "datapack/pack.mcmeta",
          JSON.stringify(
            {
              pack: {
                pack_format: 48,
                description: `VoxelForge aura for ${modelName}`,
              },
            },
            null,
            2
          )
        );
        zip.file(
          "datapack/data/voxelforge/function/idle_aura.mcfunction",
          buildAuraFunction(modelName, effectPreset)
        );
        zip.file(
          "datapack/data/minecraft/tags/function/tick.json",
          JSON.stringify({ values: ["voxelforge:idle_aura"] }, null, 2)
        );
      }

      const content = await zip.generateAsync({ type: "blob" });
      triggerDownload(content, `${safeSlug}_resourcepack.zip`);
    } finally {
      setIsZipping(false);
    }
  };

  const activeCode =
    previewFormat === "bbmodel" ? bbModelString : mcJsonString;

  const giveCommand = `/give @p minecraft:diamond_sword{CustomModelData:1001,display:{Name:'[{"text":"${modelName}","italic":false,"color":"aqua"}]'}} 1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-[#161922] border border-[#262936] rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#F1F5F9]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#141720] border-b border-[#262936]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#3B82F6]/20 border border-[#3B82F6] flex items-center justify-center text-[#60A5FA]">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Blockbench / Minecraft 3Dモデル エクスポートスタジオ
              </h2>
              <p className="text-xs text-[#94A3B8] font-mono">
                Model: {modelName} ({safeSlug}) • {elements.filter((e) => e.visible).length} Cuboids • {resolution}×{resolution}px UV Atlas
                {hasMotion(elements) ? " • idle_mana" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded bg-[#0D0E12] border border-[#262936] text-[#94A3B8] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {/* 4 Direct Export Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Blockbench .bbmodel */}
            <button
              onClick={handleDownloadBBModel}
              className="flex flex-col justify-between p-3.5 rounded-lg bg-[#0D0E12] border border-[#3B82F6]/60 hover:border-[#3B82F6] hover:bg-[#3B82F6]/10 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#3B82F6] text-white">
                  推奨 • Blockbench
                </span>
                <Download className="w-4 h-4 text-[#60A5FA] group-hover:translate-y-0.5 transition-transform" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  .bbmodel プロジェクト
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  テクスチャ埋め込み済み。Animate タブで idle_mana（魔力浮遊）や transform_overdrive（変形機構）を即再生可能。
                </p>
              </div>
            </button>

            {/* 2. Minecraft Java .json */}
            <button
              onClick={handleDownloadMCJson}
              className="flex flex-col justify-between p-3.5 rounded-lg bg-[#0D0E12] border border-[#262936] hover:border-[#10B981] hover:bg-[#10B981]/10 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10B981]/20 text-[#34D399]">
                  Minecraft Java
                </span>
                <FileCode className="w-4 h-4 text-[#34D399]" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  Item Model (.json)
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  models/item/{safeSlug}.json 準拠の3Dエレメント定義。
                </p>
              </div>
            </button>

            {/* 3. UV Atlas PNG */}
            <button
              onClick={handleDownloadPNG}
              className="flex flex-col justify-between p-3.5 rounded-lg bg-[#0D0E12] border border-[#262936] hover:border-[#F59E0B] hover:bg-[#F59E0B]/10 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F59E0B]/20 text-[#FBBF24]">
                  {resolution}×{resolution}px PNG
                </span>
                <ImageIcon className="w-4 h-4 text-[#FBBF24]" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  UVアトラス画像 (.png)
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  textures/item/{safeSlug}.png 透過対応ピクセルテクスチャ。
                </p>
              </div>
            </button>

            {/* 4. Complete Resource Pack .zip */}
            <button
              onClick={handleDownloadResourcePackZip}
              disabled={isZipping}
              className="flex flex-col justify-between p-3.5 rounded-lg bg-[#0D0E12] border border-[#8B5CF6]/60 hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/10 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#8B5CF6] text-white">
                  All-in-One ZIP
                </span>
                <FileArchive className="w-4 h-4 text-[#C084FC]" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {isZipping ? "ZIP生成中..." : "リソースパック (.zip)"}
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  resourcepacksフォルダに入れるだけでマイクラ内で即使用可能。
                </p>
              </div>
            </button>
          </div>

          {/* Minecraft In-Game Command Helper */}
          <div className="bg-[#0D0E12] border border-[#262936] rounded-lg p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#10B981]">
                <Terminal className="w-4 h-4" />
                <span>
                  Minecraft ゲーム内呼び出しコマンド (CustomModelData: 1001)
                </span>
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(giveCommand);
                  setCopiedCmd(true);
                  setTimeout(() => setCopiedCmd(false), 2000);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-[#161922] border border-[#262936] text-[#94A3B8] hover:text-white"
              >
                {copiedCmd ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="text-[#10B981]">コピー完了</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>コマンドをコピー</span>
                  </>
                )}
              </button>
            </div>
            <code className="block font-mono text-xs text-[#60A5FA] bg-[#141720] px-3 py-2 rounded border border-[#262936] overflow-x-auto">
              {giveCommand}
            </code>
            {javaFit.outOfRange && (
              <p className="text-[11px] leading-relaxed text-[#FBBF24]">
                モデルが Java の座標範囲 (-16〜32) を超えるため、item JSON では {Math.round(javaFit.scale * 100)}% に縮小し、display の scale を拡大して手持ちサイズを保っています。.bbmodel は原寸のままです。
              </p>
            )}
            {wantsAura && (
              <p className="text-[11px] leading-relaxed text-[#94A3B8]">
                Java のアイテムモデルは静止ポーズです。周回・自転・鼓動・変形は .bbmodel（Generic Model）の idle_mana / transform_overdrive で再生できます。ZIP の datapack/ をワールドの datapacks に入れて /reload すると、手に持っている間、選択中のエフェクトに対応したパーティクルが出ます。
              </p>
            )}
          </div>

          {/* Live Code Preview Inspector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-[#0D0E12] p-1 rounded border border-[#262936]">
                <button
                  onClick={() => setPreviewFormat("bbmodel")}
                  className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                    previewFormat === "bbmodel"
                      ? "bg-[#3B82F6] text-white"
                      : "text-[#94A3B8] hover:text-white"
                  }`}
                >
                  {safeSlug}.bbmodel (Blockbench v4.10)
                </button>
                <button
                  onClick={() => setPreviewFormat("mcjson")}
                  className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                    previewFormat === "mcjson"
                      ? "bg-[#10B981] text-black font-semibold"
                      : "text-[#94A3B8] hover:text-white"
                  }`}
                >
                  {safeSlug}.json (Minecraft Java Item)
                </button>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-[#0D0E12] border border-[#262936] text-[#94A3B8] hover:text-white"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="text-[#10B981]">JSONをコピーしました</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>JSON全文をコピー</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-[#0D0E12] border border-[#262936] rounded-lg p-3.5 font-mono text-[11px] text-[#94A3B8] max-h-60 overflow-auto leading-relaxed">
              {activeCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
