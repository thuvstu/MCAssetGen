export function sanitizeName(name: string) {
  const clean = name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
  return ["__proto__", "constructor", "prototype"].includes(clean) ? `item_${clean}` : clean;
}
