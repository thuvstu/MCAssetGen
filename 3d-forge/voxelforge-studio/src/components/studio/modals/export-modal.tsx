"use client";

import {
  Bone,
  Box,
  Check,
  Download,
  FileImage,
  Info,
  Layers,
  LoaderCircle,
  Package,
  type LucideIcon,
} from "lucide-react";
import { VARIANT_FAMILIES } from "@/lib/variants";
import PixelArt from "@/components/pixel-art";
import Modal from "@/components/ui/modal";
import type { ExportFormat, GeckolibGeneration } from "@/lib/export";
import { TEMPLATES, type ModelKind } from "@/lib/model-types";
import { useStudioStore } from "../studio-context";

interface FormatOption {
  id: ExportFormat;
  title: string;
  ext: string;
  description: string;
  icon: LucideIcon;
}

const FORMATS: FormatOption[] = [
  {
    id: "bbmodel",
    title: "Blockbench",
    ext: ".bbmodel",
    description: "編集・仕上げ・可動パーツ・アニメーションを同梱",
    icon: Box,
  },
  {
    id: "resourcepack",
    title: "Minecraft リソースパック",
    ext: ".zip",
    description: "Java Edition 1.21.4 · モデル + PNG + 設定",
    icon: Package,
  },
  {
    id: "png",
    title: "UVテクスチャ",
    ext: ".png",
    description: "グラデーション・塗り込み済みのアトラス",
    icon: FileImage,
  },
  {
    id: "variantpack",
    title: "バリアント一式",
    ext: ".zip",
    description: "強化段階・形態・モード等を Custom Model Data で切替",
    icon: Layers,
  },
  {
    id: "geckolib",
    title: "GeckoLib MODアセット",
    ext: ".zip",
    description: "geo/animation/専用アトラス + GeoItem・Renderer のJava",
    icon: Bone,
  },
];

function replacedItemNote(kind: ModelKind): string {
  const item = TEMPLATES.find((t) => t.kind === kind)?.vanillaItem ?? "paper";
  return `minecraft:${item} を表示用に置き換えます（性能・ゲーム内挙動は変わりません）。`;
}

const GENERATION_LABELS: { id: GeckolibGeneration; label: string }[] = [
  { id: "geckolib5", label: "GeckoLib 5.x (1.21.11)" },
  { id: "geckolib4", label: "GeckoLib 4.x (1.21.1)" },
  { id: "none", label: "アセットのみ (Javaなし)" },
];

function formatNote(format: ExportFormat, kind: ModelKind): string {
  if (format === "resourcepack")
    return `ZIPをresourcepacksフォルダに入れて有効にしてください。${replacedItemNote(kind)}`;
  if (format === "bbmodel")
    return "Blockbench 4.10以降に対応。アニメーション付きは Generic Model 形式（アニメーションタブで再生可）、静止モデルは Java Block/Item 形式で書き出します。";
  if (format === "variantpack")
    return "各バリアントの .bbmodel と、custom_model_data で切り替わる 1.21.4 リソースパックをまとめます。README に /give コマンド付き。";
  if (format === "geckolib")
    return "geo.json / animation.json / キューブごとの島に展開した専用PNG / GeoItem・GeoItemRenderer のJava / 依存関係スニペットをまとめます。Blockbenchへは geo.json をそのまま読み込めます。";
  return "グラデーションとパーツの塗りを適用したPNGを書き出します。未加工時は元のPNGを維持します。";
}

export default function ExportModal() {
  const { studio, exporter, closeModal, downloadCurrentModel } =
    useStudioStore();
  const { model, dirty } = studio;

  return (
    <Modal
      title="モデルをエクスポート"
      eyebrow="READY FOR YOUR WORLD"
      onClose={closeModal}
    >
      <p className="modal-description">
        制作したモデルを、次のクリエイティブへ。
      </p>

      <div className="export-model-summary">
        <div className="export-model-art">
          <PixelArt kind={model.settings.kind} size={48} />
        </div>
        <div>
          <strong>{model.settings.name}</strong>
          <p>
            {model.cubes.length} キューブ<span>·</span>
            {model.texture.width} × {model.texture.height} テクスチャ
          </p>
        </div>
        <span className="ready-badge">
          <Check size={10} />
          Ready
        </span>
      </div>

      <div className="export-format-label">ファイル形式</div>
      <div className="export-options">
        {FORMATS.map((format) => (
          <button
            key={format.id}
            className={`export-option ${exporter.format === format.id ? "selected" : ""}`}
            onClick={() => exporter.setFormat(format.id)}
            aria-pressed={exporter.format === format.id}
          >
            <span className="export-option-icon">
              <format.icon size={22} />
            </span>
            <span>
              <strong>
                {format.title}
                <em>{format.ext}</em>
              </strong>
              <small>{format.description}</small>
            </span>
            <i>{exporter.format === format.id && <Check size={11} />}</i>
          </button>
        ))}
      </div>

      {exporter.format === "geckolib" && (
        <div className="export-family">
          <span>GeckoLib の世代とモデル名</span>
          <div className="variant-families">
            {GENERATION_LABELS.map((generation) => (
              <button
                key={generation.id}
                className={exporter.geckolib.generation === generation.id ? "selected" : ""}
                aria-pressed={exporter.geckolib.generation === generation.id}
                onClick={() => exporter.setGeckolib({ generation: generation.id })}
              >
                {generation.label}
              </button>
            ))}
          </div>
          <div className="export-geckolib-fields">
            <label>
              名前空間
              <input
                value={exporter.geckolib.namespace}
                onChange={(event) =>
                  exporter.setGeckolib({ namespace: event.target.value })
                }
              />
            </label>
            <label>
              モデルID
              <input
                value={exporter.geckolib.modelId}
                placeholder={`voxelforge_${model.settings.kind}`}
                onChange={(event) =>
                  exporter.setGeckolib({ modelId: event.target.value })
                }
              />
            </label>
            <label className="export-geckolib-toggle">
              <input
                type="checkbox"
                checked={exporter.geckolib.mirrorX}
                onChange={(event) =>
                  exporter.setGeckolib({ mirrorX: event.target.checked })
                }
              />
              X軸をBedrock規格に反転
            </label>
          </div>
        </div>
      )}

      {exporter.format === "variantpack" && (
        <div className="export-family">
          <span>含めるバリアント</span>
          <div className="variant-families">
            {VARIANT_FAMILIES.map((family) => (
              <button
                key={family.id}
                className={exporter.family === family.id ? "selected" : ""}
                aria-pressed={exporter.family === family.id}
                onClick={() => exporter.setFamily(family.id)}
              >
                {family.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="export-info">
        <Info size={14} />
        <p>
          {formatNote(exporter.format, model.settings.kind)}
          {dirty && (
            <b>
              {" "}
              未適用の生成・仕上げ設定は含まれません。パーツの編集は反映されます。
            </b>
          )}
        </p>
      </div>

      <div className="modal-actions">
        <button className="secondary-button" onClick={closeModal}>
          キャンセル
        </button>
        <button
          className="primary-button"
          disabled={exporter.exporting}
          onClick={() => void downloadCurrentModel()}
        >
          {exporter.exporting ? (
            <LoaderCircle size={16} className="spinning" />
          ) : (
            <Download size={16} />
          )}
          ダウンロード
        </button>
      </div>
    </Modal>
  );
}
