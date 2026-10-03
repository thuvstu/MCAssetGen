"use client";

import { useEffect, useState } from "react";
import { Download, LoaderCircle, Package, RefreshCw } from "lucide-react";
import ViewportFallback from "@/components/viewport/fallback";
import * as api from "@/lib/api-client";
import { VARIANT_FAMILIES, type VariantFamily } from "@/lib/variants";
import { useStudioStore } from "./studio-context";

/**
 * Family browser: previews every derived model of the current design and
 * exports them together as a Custom Model Data resource pack.
 */
export default function VariantsPanel() {
  const { studio, exporter, setTab, notify } = useStudioStore();
  const [family, setFamily] = useState<VariantFamily>("tiers");
  const [variants, setVariants] = useState<api.VariantPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const base = studio.model.settings;

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .requestVariants(base, family)
      .then((list) => {
        if (active) setVariants(list);
      })
      .catch((error: Error) => {
        if (active) notify(error.message, "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [base, family, notify, refreshKey]);

  const openVariant = (variant: api.VariantPreview) => {
    studio.applyPartial(variant.settings);
    setTab("preview");
  };

  const description = VARIANT_FAMILIES.find(
    (item) => item.id === family,
  )?.description;

  return (
    <div className="variants-panel">
      <div className="variants-toolbar">
        <div
          className="variant-families"
          role="tablist"
          aria-label="バリアントの種類"
        >
          {VARIANT_FAMILIES.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={family === item.id}
              className={family === item.id ? "selected" : ""}
              onClick={() => setFamily(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="variants-actions">
          <button
            className="icon-button small"
            title="再生成"
            aria-label="バリアントを再生成"
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            <RefreshCw size={13} />
          </button>
          <button
            className="variants-export"
            disabled={exporter.exporting || loading}
            onClick={() =>
              void exporter.download(studio.model.settings, {
                format: "variantpack",
                family,
              })
            }
          >
            {exporter.exporting ? (
              <LoaderCircle size={13} className="spinning" />
            ) : (
              <Package size={13} />
            )}
            一式をZIPで書き出し
          </button>
        </div>
      </div>
      <p className="variants-description">
        {description} · クリックで編集に読み込み · ZIPはCustom Model
        Data付きリソースパック＋全.bbmodel
      </p>

      {loading && variants.length === 0 ? (
        <div className="variants-loading">
          <LoaderCircle size={22} className="spinning" />
          バリアントを生成中…
        </div>
      ) : (
        <div className={`variants-grid ${loading ? "is-refreshing" : ""}`}>
          {variants.map((variant, index) => (
            <button
              key={variant.key}
              className="variant-card"
              onClick={() => openVariant(variant)}
              disabled={studio.busy}
              title={`${variant.settings.name} を編集に読み込む`}
            >
              <span className="variant-thumb">
                <ViewportFallback
                  cubes={variant.cubes}
                  label={variant.settings.name}
                  className="variant-svg"
                />
                <em>CMD {index + 1}</em>
              </span>
              <span className="variant-label">{variant.label}</span>
              <span className="variant-meta">
                {variant.cubes.length} キューブ
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="variants-footnote">
        <Download size={11} />
        ゲーム内の強化・形態変化・一時モードは、アイテムの custom_model_data
        を書き換えて切り替えます（README にコマンド例）。
      </p>
    </div>
  );
}
