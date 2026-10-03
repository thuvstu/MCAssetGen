"use client";

import React, { useState } from "react";
import { GeneratedModel } from "@/lib/types";
import { toBBModel } from "@/lib/export/bbmodel";
import { toBedrockGeometry, toJavaModel, toWavefront } from "@/lib/export/minecraft";
import {
  createResourcePack,
  createThemeArsenalPack,
  createTierProgressionPack,
  downloadFile,
} from "@/lib/export/resourcepack";
import { paintAtlas } from "@/lib/atlas";
import { sanitizeIdentifier } from "@/lib/color";
import { THEME_LABELS } from "@/lib/themes";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  model: GeneratedModel;
}

function Row({
  idx,
  title,
  desc,
  tag,
  children,
}: {
  idx: string;
  title: string;
  desc: string;
  tag?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line-soft px-6 py-5 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2.5">
          <span className="num text-[10px] text-ember">{idx}</span>
          <h3 className="mincho text-[16px] font-bold leading-snug text-bone">{title}</h3>
        </div>
        <p className="mt-1.5 max-w-[54ch] text-[11px] leading-[1.85] text-ash">{desc}</p>
        {tag && <div className="lbl mt-2 text-ember-bright">{tag}</div>}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function ExportModal({ open, onClose, model }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "single" | "tiers" | "arsenal">(null);
  if (!open) return null;

  const base = sanitizeIdentifier(model.config.name);
  const res = model.config.textureResolution;

  const run = async (key: "single" | "tiers" | "arsenal", fn: () => Promise<Blob>, name: string) => {
    setBusy(key);
    try {
      downloadFile(await fn(), name, "application/zip");
    } finally {
      setBusy(null);
    }
  };

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden border border-line bg-panel-2 shadow-[0_50px_140px_-50px_#000]">
        {/* header */}
        <div className="flex items-end justify-between border-b border-line px-6 py-5">
          <div>
            <div className="lbl">EXPORT</div>
            <h2 className="mincho mt-2 text-[24px] font-bold leading-none text-bone">
              モデルの出力
            </h2>
          </div>
          <div className="flex items-center gap-5">
            <div className="hidden text-right sm:block">
              <div className="num text-[11px] text-bone">{base}</div>
              <div className="lbl mt-1.5">
                TIER {model.config.upgradeTier} · {model.stats.elementCount} ELS · {res}PX
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 text-ash hover:text-bone" title="閉じる">
              <X className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Row
            idx="01"
            title="Blockbench プロジェクト"
            tag=".BBMODEL — 6 ANIMATION TRACKS 同梱"
            desc="ボーン階層（BladeL/R・Core・Funnel・Halo・Seal・Astral・Floating）、マテリアル別UV、待機・三連撃・次元斬・魔法詠唱・変形・覚醒の6種アニメーショントラックを含む完全プロジェクト。"
          >
            <button
              className="btn btn-solid"
              onClick={() =>
                downloadFile(toBBModel(model), `${base}.bbmodel`, "application/json")
              }
            >
              .bbmodel
            </button>
          </Row>

          <Row
            idx="02"
            title="Minecraft リソースパック"
            tag="単体モデル · 即インストール"
            desc="pack.mcmeta / アイテムモデルJSON / テクスチャPNG / 編集用bbmodel / 同梱README をまとめた、resourcepacksフォルダへ入れるだけで動くパック。"
          >
            <button
              className="btn"
              disabled={busy !== null}
              onClick={() =>
                run("single", () => createResourcePack(model), `${base}_ResourcePack.zip`)
              }
            >
              {busy === "single" ? "生成中…" : ".zip"}
            </button>
          </Row>

          <Row
            idx="03"
            title="同一武器 全7段階 進化パック"
            tag="CUSTOM MODEL DATA 1001–1007"
            desc="壱式(粗製)〜伍式(神話)＋★限界突破＋★★神格解放の7モデル、7個のbbmodel、CustomModelData設定、/giveコマンド一覧を一括同梱します。"
          >
            <button
              className="btn"
              disabled={busy !== null}
              onClick={() =>
                run("tiers", () => createTierProgressionPack(model.config), `${base}_Evolution.zip`)
              }
            >
              {busy === "tiers" ? "生成中…" : "7段階 .zip"}
            </button>
          </Row>

          <Row
            idx="04"
            title={`${THEME_LABELS[model.config.theme].ja} 全14種 兵装一式`}
            tag="CUSTOM MODEL DATA 2001–2014"
            desc="剣・大剣・短剣・大鎌・戦斧・魔導杖・魔槍・長弓・魔盾・神冠・背翼・水晶核・魔導書・守護像の全14種を、同一テーマ・現在ティアの仕様で一括パック化します。"
          >
            <button
              className="btn"
              disabled={busy !== null}
              onClick={() =>
                run(
                  "arsenal",
                  () => createThemeArsenalPack(model.config),
                  `${model.config.theme}_Arsenal.zip`
                )
              }
            >
              {busy === "arsenal" ? "生成中…" : "14種一式 .zip"}
            </button>
          </Row>

          <Row
            idx="05"
            title="Java Edition モデル JSON"
            tag="1.14 – 1.21+"
            desc="要素ごとに入ったマテリアル別UVを持つ標準 item モデル。既存リソースパックへの差し替えに。"
          >
            <button
              className="btn"
              onClick={() => downloadFile(toJavaModel(model), `${base}.json`)}
            >
              .json
            </button>
            <button className="btn" onClick={() => copy("java", toJavaModel(model))}>
              {copied === "java" ? "コピー済" : "コピー"}
            </button>
          </Row>

          <Row
            idx="06"
            title="Bedrock 幾何学モデル / OBJ + MTL / テクスチャ"
            tag=".GEO.JSON · .OBJ · .PNG"
            desc="統合版向け geometry JSON、Blender・Unity向け Wavefront OBJ+MTL、ピクセルテクスチャアトラスの単体書き出し。"
          >
            <button
              className="btn"
              onClick={() => downloadFile(toBedrockGeometry(model), `${base}.geo.json`)}
            >
              .geo
            </button>
            <button
              className="btn"
              onClick={() => {
                const { obj, mtl } = toWavefront(model);
                downloadFile(obj, `${base}.obj`, "text/plain");
                setTimeout(() => downloadFile(mtl, `${base}.mtl`, "text/plain"), 250);
              }}
            >
              .obj
            </button>
            <button
              className="btn"
              onClick={() =>
                paintAtlas(model.palette, res, model.config.atlasPattern).toBlob((b) => {
                  if (b) downloadFile(b, `${base}_${res}.png`, "image/png");
                })
              }
            >
              .png
            </button>
          </Row>
        </div>

        <div className="border-t border-line px-6 py-3.5">
          <span className="text-[10.5px] leading-relaxed text-ash">
            Blockbench で開くには{" "}
            <a
              href="https://web.blockbench.net/"
              target="_blank"
              rel="noreferrer"
              className="text-ember-bright underline underline-offset-2"
            >
              web.blockbench.net
            </a>{" "}
            に .bbmodel をドラッグ＆ドロップしてください。
          </span>
        </div>
      </div>
    </div>
  );
}
