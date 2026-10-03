"use client";

import JSZip from "jszip";
import { texturePaths } from "./codegen";
import type { GeneratedFile, ModProject } from "./types";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 16x16 の仮テクスチャを生成（名前から色を決定） */
async function placeholderPng(name: string, kind: "item" | "block"): Promise<Blob | null> {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 16;
  const g = c.getContext("2d");
  if (!g) return null;
  const h = hash(name);
  const hue = h % 360;
  let seed = h;
  const rnd = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    return (seed >>> 16) / 65536;
  };
  if (kind === "block") {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const l = 35 + rnd() * 20 + (x === 0 || y === 0 ? 10 : 0) - (x === 15 || y === 15 ? 10 : 0);
        g.fillStyle = `hsl(${hue} 45% ${l}%)`;
        g.fillRect(x, y, 1, 1);
      }
  } else {
    g.clearRect(0, 0, 16, 16);
    // diagonal "stick" + gem
    for (let i = 2; i < 12; i++) {
      g.fillStyle = `hsl(30 40% ${30 + (i % 2) * 8}%)`;
      g.fillRect(i, 15 - i, 2, 2);
    }
    for (let y = 1; y < 7; y++)
      for (let x = 9; x < 15; x++) {
        const dx = x - 11.5;
        const dy = y - 3.5;
        if (dx * dx + dy * dy < 9) {
          g.fillStyle = `hsl(${hue} 70% ${45 + rnd() * 25}%)`;
          g.fillRect(x, y, 1, 1);
        }
      }
  }
  return new Promise((res) => c.toBlob((b) => res(b), "image/png"));
}

export async function downloadZip(project: ModProject, files: GeneratedFile[], withTextures = true) {
  const zip = new JSZip();
  const root = zip.folder(project.meta.modId)!;
  for (const f of files) root.file(f.path, f.content);
  if (withTextures) {
    const icon = await placeholderPng(project.meta.modId, "block");
    if (icon) root.file(`src/main/resources/assets/${project.meta.modId}/icon.png`, icon);
    for (const t of texturePaths(project)) {
      const png = await placeholderPng(t.name, t.kind);
      if (png) root.file(t.path, png);
    }
  }
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.meta.modId}-${project.meta.version}-src.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
