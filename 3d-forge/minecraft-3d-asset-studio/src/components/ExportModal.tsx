"use client";

import React, { useState } from "react";
import { Download, Copy, Check, X, FileCode, Box, Image as ImageIcon, HelpCircle } from "lucide-react";
import { ModelData, VariantState } from "@/types/model";
import { exportToBlockbench } from "@/lib/exporters/blockbench";
import { exportToMinecraftJava } from "@/lib/exporters/minecraftJava";
import { exportBedrockAnimations, exportToMinecraftBedrock } from "@/lib/exporters/minecraftBedrock";
import { exportToOBJ } from "@/lib/exporters/objExporter";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: ModelData;
    textureDataUrl: string;
  baseModel?: ModelData;
  variant?: VariantState;
}

export function ExportModal({ isOpen, onClose, model, textureDataUrl, baseModel, variant }: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<"fabric" | "blockbench" | "java" | "bedrock" | "obj" | "guide">("fabric");
  const [copied, setCopied] = useState<boolean>(false);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [buildMessage, setBuildMessage] = useState<string>("");

  const handleBuildFabric = async () => {
    try {
      setIsBuilding(true);
      setBuildMessage("Gradle プロジェクトを生成しています...");
      const { exportFabricMod } = await import("@/lib/exporters/fabricMod");
      const { blob, fileName, itemCount } = await exportFabricMod(baseModel ?? model, variant ?? { tier: 0, limitBreak: 0, form: "base" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      setBuildMessage(`完了: ${itemCount} アイテム分の Fabric mod プロジェクトを書き出しました。`);
    } catch (error) {
      console.error("Fabric mod export failed", error);
      setBuildMessage("失敗: Fabric mod の生成に失敗しました。");
    } finally {
      setIsBuilding(false);
    }
  };

  if (!isOpen) return null;

  const fileNameBase = model.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");

  // Helper download function
  const triggerDownload = (filename: string, content: string, type: string = "application/json") => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const blockbenchJson = exportToBlockbench(model, textureDataUrl);
  const javaJson = exportToMinecraftJava(model, `item/${fileNameBase}`);
  const bedrockJson = exportToMinecraftBedrock(model);
  const objData = exportToOBJ(model);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-[#181a22] border border-[#2d3139] rounded-xl shadow-2xl overflow-hidden flex flex-col text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d3139] bg-[#1e212b]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export & Download Model</h2>
              <p className="text-xs text-neutral-400">
                Compatible with Blockbench 4.x, Minecraft Java Resource Packs, and Bedrock Editions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#282d3b] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-[#2d3139] bg-[#15171f] px-3">
          {[
            { id: "fabric" as const, label: "Fabric Mod (.zip)", icon: Download },
            { id: "blockbench" as const, label: "Blockbench (.bbmodel)", icon: Box },
            { id: "java" as const, label: "Minecraft Java (.json)", icon: FileCode },
            { id: "bedrock" as const, label: "Minecraft Bedrock (geo.json)", icon: FileCode },
            { id: "obj" as const, label: "Wavefront (.obj)", icon: Box },
            { id: "guide" as const, label: "Installation Guide", icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
                  isSelected
                    ? "border-emerald-500 text-white bg-[#1e212c]"
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-400" : "text-neutral-500"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
          {/* Tab 1: Blockbench */}
          {activeTab === "blockbench" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#1f232e] p-3 rounded-lg border border-[#2d3139]">
                <div>
                  <h4 className="font-bold text-sm text-white">Blockbench 4.x Project (.bbmodel)</h4>
                  <p className="text-xs text-neutral-400">
                    Full hierarchy with an animatable root bone, UV mappings, embedded texture, and 8 keyframed animations (idle, slash, thrust, combo, charge, cast, ultimate, transform). Opens directly in Blockbench desktop or web.
                  </p>
                </div>
                <button
                  onClick={() => triggerDownload(`${fileNameBase}.bbmodel`, blockbenchJson)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .bbmodel
                </button>
              </div>

              <div className="relative">
                <div className="flex justify-between items-center mb-1 text-xs text-neutral-400">
                  <span>File Preview</span>
                  <button
                    onClick={() => handleCopy(blockbenchJson)}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy Code"}
                  </button>
                </div>
                <pre className="bg-[#101217] p-3 rounded-lg border border-[#252832] font-mono text-[11px] text-neutral-300 max-h-60 overflow-y-auto">
                  {blockbenchJson.slice(0, 1500)}
                  {blockbenchJson.length > 1500 && "\n... [truncated]"}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 2: Minecraft Java */}
          {activeTab === "java" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#1f232e] p-3 rounded-lg border border-[#2d3139]">
                <div>
                  <h4 className="font-bold text-sm text-white">Minecraft Java Resource Pack Model</h4>
                  <p className="text-xs text-neutral-400">
                    Configured for <code>assets/minecraft/models/item/{fileNameBase}.json</code> with hand displays & GUI transforms.
                  </p>
                </div>
                <button
                  onClick={() => triggerDownload(`${fileNameBase}.json`, javaJson)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .json
                </button>
              </div>

              <div className="relative">
                <div className="flex justify-between items-center mb-1 text-xs text-neutral-400">
                  <span>Model JSON Preview</span>
                  <button
                    onClick={() => handleCopy(javaJson)}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy Code"}
                  </button>
                </div>
                <pre className="bg-[#101217] p-3 rounded-lg border border-[#252832] font-mono text-[11px] text-neutral-300 max-h-60 overflow-y-auto">
                  {javaJson.slice(0, 2000)}
                  {javaJson.length > 2000 && "\n... [truncated]"}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 3: Bedrock */}
          {activeTab === "bedrock" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#1f232e] p-3 rounded-lg border border-[#2d3139]">
                <div>
                  <h4 className="font-bold text-sm text-white">Minecraft Bedrock Edition Geometry</h4>
                  <p className="text-xs text-neutral-400">
                    Standard Bedrock 1.12.0 <code>geometry.{fileNameBase}.geo.json</code> for Bedrock resource & behavior packs.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => triggerDownload(`${fileNameBase}.geo.json`, bedrockJson)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .geo.json
                  </button>
                  <button
                    onClick={() => triggerDownload(`${fileNameBase}.animation.json`, exportBedrockAnimations(model))}
                    className="flex items-center gap-1.5 px-4 py-2 bg-fuchsia-700 hover:bg-fuchsia-600 text-white font-bold rounded-lg text-xs transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .animation.json
                  </button>
                </div>
              </div>

              <pre className="bg-[#101217] p-3 rounded-lg border border-[#252832] font-mono text-[11px] text-neutral-300 max-h-60 overflow-y-auto">
                {bedrockJson.slice(0, 2000)}
              </pre>
            </div>
          )}

          {/* Tab 4: OBJ / 3D */}
          {activeTab === "obj" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#1f232e] p-3 rounded-lg border border-[#2d3139]">
                <div>
                  <h4 className="font-bold text-sm text-white">Wavefront OBJ + MTL</h4>
                  <p className="text-xs text-neutral-400">
                    Universal 3D asset suitable for Blender, Maya, Unreal Engine, and Unity.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => triggerDownload(`${fileNameBase}.obj`, objData.obj, "text/plain")}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#282d3b] hover:bg-[#343a4c] text-white font-semibold rounded-lg text-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download OBJ
                  </button>
                  <button
                    onClick={() => triggerDownload(`${fileNameBase}.mtl`, objData.mtl, "text/plain")}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#282d3b] hover:bg-[#343a4c] text-white font-semibold rounded-lg text-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download MTL
                  </button>
                </div>
              </div>

              <pre className="bg-[#101217] p-3 rounded-lg border border-[#252832] font-mono text-[11px] text-neutral-300 max-h-60 overflow-y-auto">
                {objData.obj.slice(0, 1500)}
              </pre>
            </div>
          )}

          {/* Tab 0: Fabric Mod */}
          {activeTab === "fabric" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#1f232e] p-3 rounded-lg border border-[#2d3139]">
                <div>
                  <h4 className="font-bold text-sm text-white">Fabric Mod プロジェクト一式 (.zip)</h4>
                  <p className="text-xs text-neutral-400">
                    Gradle 設定・Java ソース・3Dモデル・テクスチャ・言語ファイルを同梱。<strong>そのまま <code>gradle build</code> できる</strong>プロジェクトです。
                  </p>
                </div>
                <button
                  onClick={handleBuildFabric}
                  disabled={isBuilding}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white font-bold rounded-lg text-xs transition shadow-sm disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isBuilding ? "生成中..." : "Fabric mod を書き出す"}
                </button>
              </div>

              {buildMessage && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-200">{buildMessage}</div>}

              <div className="rounded-lg border border-[#2d3139] bg-[#141721] p-3 text-xs leading-relaxed text-neutral-300 space-y-2">
                <p className="font-semibold text-white">ゲームに入れられるまでの流れ</p>
                <ol className="list-decimal list-inside space-y-1 text-neutral-300">
                  <li>上のボタンで zip をダウンロードして展開する</li>
                  <li>JDK 21 を用意し、フォルダ内で <code>gradle build</code> を実行</li>
                  <li><code>build/libs/*.jar</code> を <code>.minecraft/mods/</code> へ</li>
                  <li>Fabric Loader + Fabric API を導入して起動</li>
                  <li>クリエイティブタブ「MC3D Forge Weapons」から取得</li>
                </ol>
                <p className="text-[11px] text-neutral-400">
                  対応: Minecraft {`1.21.1`} / Fabric Loader 0.16.4+ / Fabric API 0.102.0+ / Java 21。
                  取得した各アイテムには、このエディタのモデル・UVテクスチャ・Blockbench 元データ・アニメーションキー（9本）が入っています。
                </p>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] leading-relaxed text-amber-200">
                <strong>正直な注意:</strong> アイテム登録・3Dモデル・テクスチャ・表示名までは mod に組み込まれます。
                近接武器は <code>SwordItem</code>（ネザライト基準）として登録され、強化段階・限界突破に応じて攻撃力・速度・レアリティ・光沢が自動設定されます。
                銃・弓・杖・魔導書・レリックは見た目用アイテムです（射撃/魔法の挙動は別途実装）。Minecraft の座標上限を超える大型モデルは自動で縮小フィットされます。
                インゲーム再生アニメーションは GeckoLib 導入が必要で、アニメーションキーは <code>extras/</code> に同梱しています。
              </div>
            </div>
          )}

          {/* Tab 5: Guide */}
          {activeTab === "guide" && (
            <div className="space-y-3 text-xs leading-relaxed text-neutral-300">
              <div className="p-3 bg-[#1e212b] rounded-lg border border-[#2d3139]">
                <h5 className="font-bold text-emerald-400 mb-1">How to open in Blockbench:</h5>
                <ol className="list-decimal list-inside space-y-1 text-neutral-300">
                  <li>Click <strong>Download .bbmodel</strong>.</li>
                  <li>Open <strong>Blockbench</strong> (desktop app or web app at web.blockbench.net).</li>
                  <li>Click <strong>File &gt; Open Model</strong> and select your downloaded <code>.bbmodel</code> file.</li>
                  <li>All box hierarchy, bone pivots, animations, and UV pixel atlas will be ready to animate or paint!</li>
                </ol>
              </div>

              <div className="p-3 bg-[#1e212b] rounded-lg border border-[#2d3139]">
                <h5 className="font-bold text-blue-400 mb-1">How to use in Minecraft Java Edition:</h5>
                <ol className="list-decimal list-inside space-y-1 text-neutral-300">
                  <li>In your Resource Pack, place the <code>.json</code> file into <code>assets/minecraft/models/item/</code>.</li>
                  <li>Save the Texture Atlas PNG as <code>assets/minecraft/textures/item/{fileNameBase}.png</code>.</li>
                  <li>Override any vanilla item (e.g. <code>diamond_sword.json</code>) with <code>overrides</code> using <code>custom_model_data</code>!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-[#2d3139] bg-[#1a1d26]">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#282d3b] hover:bg-[#343a4c] text-white rounded-lg text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
