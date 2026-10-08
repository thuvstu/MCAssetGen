import { PNG } from "pngjs";

/**
 * Shared plumbing for the unified studio engine registry.
 *
 * Every generator in the repository is exposed through the same command shape
 * (`engine:command --flags`), reachable from `/api/studio/run` and from the
 * `mcasset` CLI, which is a plain HTTP client.
 */
export interface StudioFile {
  path: string;
  base64: string;
}

export interface StudioResult {
  ok: true;
  engine: string;
  command: string;
  /** CLI-style transcript. */
  text: string;
  files?: StudioFile[];
  data?: unknown;
}

export interface StudioFailure {
  ok: false;
  error: string;
}

export type StudioResponse = StudioResult | StudioFailure;

export interface StudioCommand {
  id: string;
  summary: string;
  args?: string[];
}

export type StudioGroup =
  | "3d"
  | "weapon"
  | "armor"
  | "mob"
  | "structure"
  | "texture"
  | "skyblock"
  | "mod";

export interface StudioEngine {
  id: string;
  label: string;
  group: StudioGroup;
  description: string;
  commands: StudioCommand[];
}

export type Args = Record<string, unknown>;

export interface RegisteredEngine extends StudioEngine {
  run(command: string, args: Args): StudioResult | Promise<StudioResult>;
}

export const asString = (args: Args, key: string, fallback = ""): string => {
  const value = args[key];
  return typeof value === "string" && value.length ? value : fallback;
};

export const asNumber = (args: Args, key: string, fallback: number): number => {
  const value = Number(args[key]);
  return Number.isFinite(value) ? value : fallback;
};

export const asBool = (args: Args, key: string, fallback = false): boolean => {
  const value = args[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true" || value === "1";
  return fallback;
};

export const file = (path: string, bytes: Uint8Array): StudioFile => ({
  path,
  base64: Buffer.from(bytes).toString("base64"),
});

export const jsonFile = (path: string, value: unknown): StudioFile =>
  file(path, new Uint8Array(Buffer.from(JSON.stringify(value, null, 2), "utf8")));

export const textFile = (path: string, value: string): StudioFile =>
  file(path, new Uint8Array(Buffer.from(value, "utf8")));

/** RGBA buffer → PNG bytes (the shared writer for the ported engines). */
export function rgbaToPng(
  width: number,
  height: number,
  data: Uint8ClampedArray | number[],
): Uint8Array {
  const png = new PNG({ width, height });
  png.data = Buffer.from(new Uint8ClampedArray(data).buffer);
  return new Uint8Array(PNG.sync.write(png));
}

/** Nearest-neighbour upscale, used where the CLI used to scale on write. */
export function scaleRgba(
  width: number,
  height: number,
  data: Uint8ClampedArray,
  size: number,
): { width: number; height: number; data: Uint8ClampedArray } {
  const scale = Math.max(1, Math.round(size / width));
  if (scale === 1) return { width, height, data };
  const out = new Uint8ClampedArray(width * scale * height * scale * 4);
  for (let y = 0; y < height * scale; y++) {
    for (let x = 0; x < width * scale; x++) {
      const si = (Math.floor(y / scale) * width + Math.floor(x / scale)) * 4;
      out.set(data.subarray(si, si + 4), (y * width * scale + x) * 4);
    }
  }
  return { width: width * scale, height: height * scale, data: out };
}

export const fail = (error: string): never => {
  throw new Error(error);
};
