"use client";

import { useCallback, useState } from "react";
import * as api from "@/lib/api-client";
import { DEFAULT_GECKOLIB_OPTIONS as DEFAULT_GECKOLIB_EXPORT } from "@/lib/export";
import { saveBlob } from "@/lib/download";
import type { ExportFormat, GeckolibGeneration } from "@/lib/export";
import type { ModelSettings } from "@/lib/model-types";
import type { VariantFamily } from "@/lib/variants";
import type { ToastController } from "./use-toasts";

export interface ExportController {
  format: ExportFormat;
  setFormat: (format: ExportFormat) => void;
  family: VariantFamily;
  setFamily: (family: VariantFamily) => void;
  /** GeckoLib export options (namespace / model id / API generation). */
  geckolib: GeckolibExportSettings;
  setGeckolib: (settings: Partial<GeckolibExportSettings>) => void;
  exporting: boolean;
  download: (
    settings: ModelSettings,
    overrides?: { format?: ExportFormat; family?: VariantFamily },
  ) => Promise<boolean>;
}

/** Requests an export from the server and hands the file to the browser. */
export interface GeckolibExportSettings {
  namespace: string;
  modelId: string;
  generation: GeckolibGeneration;
  mirrorX: boolean;
}

export function useExport(notify: ToastController["notify"]): ExportController {
  const [format, setFormat] = useState<ExportFormat>("bbmodel");
  const [family, setFamily] = useState<VariantFamily>("all");
  const [geckolib, setGeckolibState] = useState<GeckolibExportSettings>({
    namespace: DEFAULT_GECKOLIB_EXPORT.namespace,
    modelId: DEFAULT_GECKOLIB_EXPORT.modelId,
    generation: DEFAULT_GECKOLIB_EXPORT.generation,
    mirrorX: DEFAULT_GECKOLIB_EXPORT.mirrorX,
  });
  const [exporting, setExporting] = useState(false);
  const setGeckolib = useCallback(
    (settings: Partial<GeckolibExportSettings>) =>
      setGeckolibState((current) => ({ ...current, ...settings })),
    [],
  );

  const download = useCallback<ExportController["download"]>(
    async (settings, overrides) => {
      setExporting(true);
      try {
        const chosenFormat = overrides?.format ?? format;
        const chosenFamily = overrides?.family ?? family;
        const { blob, filename } = await api.exportModel(
          settings,
          chosenFormat,
          chosenFormat === "variantpack" ? chosenFamily : undefined,
          chosenFormat === "geckolib"
            ? {
                ...geckolib,
                modelId: geckolib.modelId || `voxelforge_${settings.kind}`,
              }
            : undefined,
        );
        saveBlob(blob, filename);
        notify("モデルを書き出しました。ダウンロードを確認してください。");
        return true;
      } catch (error) {
        notify(
          error instanceof Error
            ? error.message
            : "エクスポートできませんでした。",
          "error",
        );
        return false;
      } finally {
        setExporting(false);
      }
    },
    [family, format, geckolib, notify],
  );

  return {
    format,
    setFormat,
    family,
    setFamily,
    geckolib,
    setGeckolib,
    exporting,
    download,
  };
}
