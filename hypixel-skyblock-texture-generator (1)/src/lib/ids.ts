export function nid(prefix?: string): string {
  const raw = crypto.randomUUID().replaceAll("-", "");
  return prefix ? `${prefix}_${raw.slice(0, 16)}` : raw.slice(0, 20);
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000);
}
