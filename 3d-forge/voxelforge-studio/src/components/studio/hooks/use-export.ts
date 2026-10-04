"use client";

import { useCallback, useState } from "react";
import * as api from "@/lib/api-client";
import { saveBlob } from "@/lib/download";
import type { ExportFormat } from "@/lib/export";
import type { ModelSettings } from "@/lib/model-types";
import type { VariantFamily } from "@/lib/variants";
import type { ToastController } from "./use-toasts";

export interface ExportController {
  format: ExportFormat;
  setFormat: (format: ExportFormat) => void;
  family: VariantFamily;
  setFamily: (family: VariantFamily) => void;
  exporting: boolean;
  download: (
    settings: ModelSettings,
    overrides?: { format?: ExportFormat; family?: VariantFamily },
  ) => Promise<boolean>;
}

/** Requests an export from the server and hands the file to the browser. */
export function useExport(notify: ToastController["notify"]): ExportController {
  const [format, setFormat] = useState<ExportFormat>("bbmodel");
  const [family, setFamily] = useState<VariantFamily>("all");
  const [exporting, setExporting] = useState(false);

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
    [family, format, notify],
  );

  return { format, setFormat, family, setFamily, exporting, download };
}
