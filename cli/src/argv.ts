// Shared argv helpers for mcasset entries.
// The dispatcher sets MCASSET_CMD + MCASSET_ARGS (JSON array).
export function cmd(): string {
  return process.env.MCASSET_CMD ?? "";
}
export function args(): string[] {
  try {
    const parsed: unknown = JSON.parse(process.env.MCASSET_ARGS ?? "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
export function arg(name: string, fallback?: string): string | undefined {
  const list = args();
  const i = list.indexOf(`--${name}`);
  if (i >= 0 && i + 1 < list.length) return list[i + 1];
  return fallback;
}
export function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
