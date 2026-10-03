"use client";

import React, { useEffect, useState } from "react";
import { useStudioState } from "@/lib/state/useStudioState";
import { Header } from "@/components/studio/Header";
import { Rail, PanelId } from "@/components/studio/Rail";
import { Inspector } from "@/components/studio/Inspector";
import { StatusBar } from "@/components/studio/StatusBar";
import { Viewport3D } from "@/components/Viewport3D";
import { ExportModal } from "@/components/modals/ExportModal";
import { SaveModal, VaultModal } from "@/components/modals/SaveModals";
import {
  CATEGORIES,
  DEFAULT_CONFIG,
  THEME_LABELS,
  UPGRADE_TIERS,
} from "@/lib/themes";

const PANEL_BY_KEY: Record<string, PanelId> = {
  "1": "type",
  "2": "evolution",
  "3": "shape",
  "4": "floating",
  "5": "motion",
  "6": "colors",
};

export default function Page() {
  const studio = useStudioState();
  const { config, model } = studio;

  const [panel, setPanel] = useState<PanelId>("evolution");
  const [modal, setModal] = useState<null | "export" | "save" | "vault">(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  useEffect(() => {
    const onPanel = (e: Event) => {
      const id = PANEL_BY_KEY[(e as CustomEvent).detail as string];
      if (id) setPanel(id);
    };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable))
        return;
      if (e.key === "Escape") setModal(null);
      if (e.key.toLowerCase() === "e" && !e.metaKey && !e.ctrlKey) setModal("export");
      if (e.key.toLowerCase() === "s" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setModal("save");
      }
    };
    window.addEventListener("studio-panel", onPanel);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("studio-panel", onPanel);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const categoryMeta = CATEGORIES.find((c) => c.id === config.category);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-ink text-bone lg:h-[100dvh] lg:overflow-hidden">
      <Header
        studio={studio}
        onExport={() => setModal("export")}
        onSave={() => setModal("save")}
        onVault={() => setModal("vault")}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <Rail active={panel} onSelect={setPanel} />

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* ── viewport column with catalogue plate header ── */}
          <section className="flex min-h-0 flex-1 flex-col px-4 pt-5 sm:px-7">
            {/* plate: giant mincho name + evolution scale */}
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-line pb-3">
              <div className="min-w-0">
                <h1 className="mincho text-[clamp(25px,3.2vw,42px)] font-bold leading-[1.15] tracking-tight text-bone">
                  {config.name}
                </h1>
                <div className="mt-2.5 flex items-center gap-2.5">
                  <span className="num text-[10px] text-ember">{categoryMeta?.en}</span>
                  <span className="h-2.5 w-px bg-line" />
                  <span className="text-[11px] text-ash">{categoryMeta?.ja}</span>
                  <span className="h-2.5 w-px bg-line" />
                  <span className="text-[11px] text-ash">
                    {THEME_LABELS[config.theme].ja}
                  </span>
                </div>
              </div>

              {/* typographic evolution scale */}
              <div className="flex items-end gap-5">
                <div>
                  <div className="lbl mb-2">UPGRADE</div>
                  <div className="flex items-end gap-3">
                    {UPGRADE_TIERS.map((t) => {
                      const on = config.upgradeTier === t.tier;
                      return (
                        <button
                          key={t.tier}
                          onClick={() => studio.setUpgradeTier(t.tier)}
                          title={t.ja}
                          className={`font-latin text-[13px] font-semibold leading-none transition-all ${
                            on
                              ? "text-ember-bright"
                              : "text-ash/50 hover:text-bone"
                          }`}
                          style={{
                            fontSize: on ? 20 : 13,
                            borderBottom: on
                              ? "2px solid var(--color-ember)"
                              : "2px solid transparent",
                            paddingBottom: 4,
                          }}
                        >
                          {t.roman}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="lbl mb-2">LIMIT</div>
                  <button
                    onClick={() =>
                      studio.setLimitBreak(
                        (((config.limitBreak + 1) % 3) as 0 | 1 | 2)
                      )
                    }
                    className={`font-latin text-[13px] font-semibold leading-none tracking-[0.12em] transition-colors ${
                      config.limitBreak === 2
                        ? "text-arcana"
                        : config.limitBreak === 1
                        ? "text-ember-bright"
                        : "text-ash/50 hover:text-bone"
                    }`}
                    style={{ paddingBottom: 4 }}
                  >
                    {config.limitBreak === 2
                      ? "★★ GENESIS"
                      : config.limitBreak === 1
                      ? "★ OVERLIMIT"
                      : "— STANDARD"}
                  </button>
                </div>
              </div>
            </div>

            {/* meta rule line */}
            <div className="flex items-center gap-3 border-b border-line-soft py-2">
              <span className="lbl">
                {config.weaponForm.toUpperCase()} · {config.tacticalMode.toUpperCase()}
              </span>
              <span className="h-px flex-1 bg-line-soft" />
              <span className="num text-[10px] text-ash">
                {model.stats.size.join(" × ")} UNITS
              </span>
            </div>

            <Viewport3D
              model={model}
              className="mt-4 h-[56vh] min-h-[380px] border border-line lg:h-auto lg:min-h-0 lg:flex-1"
              onSnapshot={setSnapshot}
              onTriggerAnim={studio.triggerAnimation}
            />
          </section>

          {/* inspector column */}
          <aside className="flex min-h-0 w-full shrink-0 flex-col border-t border-line bg-panel-2/60 lg:w-[392px] lg:border-l lg:border-t-0">
            <Inspector panel={panel} studio={studio} />
          </aside>
        </div>
      </div>

      <StatusBar studio={studio} />

      <ExportModal
        open={modal === "export"}
        onClose={() => setModal(null)}
        model={model}
      />
      <SaveModal
        open={modal === "save"}
        onClose={() => setModal(null)}
        config={config}
        preview={snapshot}
      />
      <VaultModal
        open={modal === "vault"}
        onClose={() => setModal(null)}
        onLoad={(cfg) => studio.replace({ ...DEFAULT_CONFIG, ...cfg })}
      />
    </div>
  );
}
