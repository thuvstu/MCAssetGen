"use client";

import { useState } from "react";
import { BLOCK_SOUNDS, BLOCK_TEXTURES, ITEM_TEXTURES, newBlock, newItem, newOre } from "@/studios/fabric/lib/mod/catalog";
import { resolveEnv } from "@/studios/fabric/lib/mod/targets";
import { Card, DiagnosticRow, Field, ListDetail, NumInput, Select, TextArea, TextInput, TextureUpload, Toggle, slug, uniqueId, type TabProps } from "./ui";

export const skillOptions = (p: TabProps["project"]) => [
  { value: "", label: "(なし)" },
  ...p.skills.map((s) => ({ value: s.id, label: `${s.name} (${s.id})` })),
];

export function TexturePicker({ value, onChange, list }: { value: string; onChange: (v: string) => void; list: string[] }) {
  return (
    <div>
      <div className="flex gap-2">
        <div className="flex-1">
          <TextInput mono value={value} onChange={onChange} list={list === ITEM_TEXTURES ? "item-tex" : "block-tex"} />
        </div>
      </div>
      <datalist id={list === ITEM_TEXTURES ? "item-tex" : "block-tex"}>{list.map((t) => <option key={t} value={t} />)}</datalist>
      <p className="mt-1 text-[11px] text-slate-500">バニラのテクスチャを参照します(独自テクスチャは不要)。</p>
    </div>
  );
}

