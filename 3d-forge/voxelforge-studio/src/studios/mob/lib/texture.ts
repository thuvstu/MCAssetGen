import { resolveParts } from "@/studios/mob/lib/model";
import type { MobDraft, ResolvedPart, Vec3 } from "@/studios/mob/types";

export type FaceName = "north" | "south" | "east" | "west" | "up" | "down";

export interface PackedFace {
  partId: string;
  face: FaceName;
  u: number;
  v: number;
  w: number;
  h: number;
  color: string;
}

function shade(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  const r = Math.min(255, Math.max(0, Math.round(parseInt(n.slice(0, 2), 16) * amount)));
  const g = Math.min(255, Math.max(0, Math.round(parseInt(n.slice(2, 4), 16) * amount)));
  const b = Math.min(255, Math.max(0, Math.round(parseInt(n.slice(4, 6), 16) * amount)));
  return `rgb(${r},${g},${b})`;
}

const FACE_LIGHT: Record<FaceName, number> = {
  up: 1.05,
  down: 0.45,
  north: 0.82,
  south: 0.62,
  east: 0.74,
  west: 0.58,
};

function faceSize(size: Vec3, face: FaceName): [number, number] {
  const w = Math.max(1, Math.round(size[0]));
  const h = Math.max(1, Math.round(size[1]));
  const d = Math.max(1, Math.round(size[2]));
  if (face === "up" || face === "down") return [w, d];
  if (face === "east" || face === "west") return [d, h];
  return [w, h];
}

export function packTexture(mob: MobDraft): { size: number; faces: PackedFace[]; parts: ResolvedPart[] } {
  const parts = resolveParts(mob);
  const faces: PackedFace[] = [];
  const order: FaceName[] = ["north", "south", "east", "west", "up", "down"];
  let cursorX = 1;
  let cursorY = 1;
  let rowH = 0;
  let maxX = 2;
  const limit = 256;
  for (const part of parts) {
    for (const face of order) {
      const [w, h] = faceSize(part.size, face);
      if (cursorX + w + 1 > limit) {
        cursorX = 1;
        cursorY += rowH + 1;
        rowH = 0;
      }
      faces.push({
        partId: part.def.id,
        face,
        u: cursorX,
        v: cursorY,
        w,
        h,
        color: part.color,
      });
      cursorX += w + 1;
      rowH = Math.max(rowH, h);
      maxX = Math.max(maxX, cursorX);
    }
  }
  const usedH = cursorY + rowH + 1;
  const usedW = maxX + 1;
  const size = [64, 128, 256].find((n) => n >= usedW && n >= usedH) ?? 256;
  return { size, faces, parts };
}

export function drawTexture(mob: MobDraft): { canvas: HTMLCanvasElement; size: number; faces: PackedFace[] } {
  const { size, faces } = packTexture(mob);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { canvas, size, faces };
  ctx.fillStyle = "#1a120c";
  ctx.fillRect(0, 0, size, size);
  for (const face of faces) {
    ctx.fillStyle = shade(face.color, FACE_LIGHT[face.face]);
    ctx.fillRect(face.u, face.v, face.w, face.h);
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.strokeRect(face.u + 0.5, face.v + 0.5, face.w - 1, face.h - 1);
  }
  return { canvas, size, faces };
}
