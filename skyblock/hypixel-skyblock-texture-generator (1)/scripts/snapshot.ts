/**
 * Dev tool: snapshots template material grids so refactors can be proven
 * regression-free.  npx tsx scripts/snapshot.ts [size]
 */
import { createHash } from "node:crypto";
import { TEMPLATE_DEFS, getTemplate } from "@/lib/templates";

const size = Number(process.argv[2] ?? 16);
for (const def of TEMPLATE_DEFS) {
  const g = getTemplate(def.id);
  const str = g.map((r) => r.join("")).join("\n");
  let filled = 0;
  for (const row of g) for (const ch of row) if (ch !== ".") filled++;
  console.log(`${def.id.padEnd(20)} ${createHash("sha1").update(str).digest("hex").slice(0, 16)} px=${filled}`);
}
console.log(`# size=${gSize()} defs=${TEMPLATE_DEFS.length}`);

function gSize(): number {
  return getTemplate(TEMPLATE_DEFS[0]!.id).length;
}
