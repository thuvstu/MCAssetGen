"use client";

import React from "react";
import { Studio } from "@/lib/state/useStudioState";
import { THEME_LABELS, UPGRADE_TIERS } from "@/lib/themes";

function Item({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <span className="flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="lbl text-[8.5px] opacity-75">{k}</span>
      <span className={`num text-[11px] ${accent ? "text-ember-bright" : "text-bone/85"}`}>
        {v}
      </span>
    </span>
  );
}

export function StatusBar({ studio }: { studio: Studio }) {
  const { model, config } = studio;
  const { stats } = model;
  const tierRoman = UPGRADE_TIERS.find((t) => t.tier === config.upgradeTier)?.roman ?? "III";

  return (
    <footer className="relative z-20 flex items-center gap-5 overflow-x-auto border-t border-line bg-panel px-4 py-2 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.16] mix-blend-overlay"
        style={{ backgroundImage: "url(images/panel-metal.jpg)" }}
        aria-hidden
      />
      <Item k="VOXELS" v={String(stats.elementCount)} accent />
      <Item k="TRIS" v={stats.estimatedTriangles.toLocaleString()} />
      <Item k="BOUND" v={stats.size.join(" × ")} />
      <Item
        k="TIER"
        v={
          config.limitBreak === 2
            ? `${tierRoman} ★★`
            : config.limitBreak === 1
            ? `${tierRoman} ★`
            : tierRoman
        }
        accent={config.limitBreak > 0}
      />
      <Item k="FORM" v={config.weaponForm} />
      <Item k="MODE" v={config.tacticalMode} accent={config.tacticalMode !== "normal"} />
      <Item k="THEME" v={THEME_LABELS[config.theme].en} />
      <Item k="SEED" v={String(config.seed)} />
      <Item
        k="ANIM"
        v={config.animationEnabled ? config.animationMode : "paused"}
        accent={config.animationEnabled}
      />
    </footer>
  );
}
