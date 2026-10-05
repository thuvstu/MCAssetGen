import { normalizeProjectMeta } from "./project";

const MAX_SIZE = 128;
const MAX_FRAMES = 64;

export type SafeProjectInput = {
  name: string;
  kind: string;
  width: number;
  height: number;
  frametime: number;
  interpolate: boolean;
  frames: number[][];
  meta: Record<string, unknown>;
  thumbnail: string | null;
};

const boundedInt = (value: unknown, fallback: number, min: number, max: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : fallback;
};

/** Validates only JSON-safe project data before it reaches PostgreSQL. */
export function validateProjectInput(raw: unknown): SafeProjectInput | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const body = raw as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  if (!name || !Array.isArray(body.frames) || !body.frames.length || body.frames.length > MAX_FRAMES) return null;
  const width = boundedInt(body.width, 16, 1, MAX_SIZE);
  const height = boundedInt(body.height, width, 1, MAX_SIZE);
  const expectedPixels = width * height;
  const frames: number[][] = [];
  for (const frame of body.frames) {
    if (!Array.isArray(frame) || frame.length !== expectedPixels) return null;
    frames.push(frame.map((pixel) => boundedInt(pixel, 0, 0, 0xffffffff)));
  }
  const meta = normalizeProjectMeta(body.meta, name);
  const thumbnail = typeof body.thumbnail === "string" && body.thumbnail.startsWith("data:image/") && body.thumbnail.length < 500_000
    ? body.thumbnail
    : null;
  return {
    name,
    kind: typeof body.kind === "string" ? body.kind.slice(0, 80) : meta.gen.shape,
    width,
    height,
    frametime: boundedInt(body.frametime, meta.anim.frametime, 1, 40),
    interpolate: typeof body.interpolate === "boolean" ? body.interpolate : meta.anim.interpolate,
    frames,
    meta: meta as unknown as Record<string, unknown>,
    thumbnail,
  };
}
