/**
 * 16× template regression guard.
 *
 * The 16× family is the shipped baseline: hashes live in the repo so any
 * accidental silhouette change is caught immediately.
 *
 *   npx tsx scripts/snapshot.ts            # compare against the baseline
 *   npx tsx scripts/snapshot.ts --write     # re-record after an intended change
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TEMPLATE_DEFS, getTemplate } from "@/lib/templates";

const BASELINE = join("scripts", "baseline-16x.txt");

function digest(): string {
  const lines: string[] = [];
  for (const def of TEMPLATE_DEFS) {
    const g = getTemplate(def.id, 16);
    const str = g.map((r) => r.join("")).join("\n");
    let filled = 0;
    for (const row of g) for (const ch of row) if (ch !== ".") filled++;
    lines.push(`${def.id} ${createHash("sha1").update(str).digest("hex")} px=${filled}`);
  }
  lines.push(`# defs=${TEMPLATE_DEFS.length} size=16`);
  return lines.sort().join("\n") + "\n";
}

const current = digest();

if (process.argv.includes("--write")) {
  writeFileSync(BASELINE, current);
  console.log(`recorded ${TEMPLATE_DEFS.length} template hashes -> ${BASELINE}`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error(`missing baseline ${BASELINE}; run: npx tsx scripts/snapshot.ts --write`);
  process.exit(1);
}

const expected = readFileSync(BASELINE, "utf8");
if (expected === current) {
  console.log(`OK: ${TEMPLATE_DEFS.length} templates byte-identical to the recorded 16× baseline`);
  process.exit(0);
}

const before = new Map(
  expected.trim().split("\n").map((l) => [l.split(" ")[0]!, l]),
);
let shown = 0;
for (const line of current.trim().split("\n")) {
  const id = line.split(" ")[0]!;
  const prev = before.get(id);
  if (prev !== line) {
    console.log(`CHANGED ${id}\n  before: ${prev ?? "(absent)"}\n  after:  ${line}`);
    shown++;
  }
}
for (const [id, line] of before) {
  if (!current.startsWith(id + " ") && !current.includes("\n" + id + " ")) {
    console.log(`REMOVED ${id}\n  before: ${line}`);
    shown++;
  }
}
console.error(`\n${shown} template(s) differ from the 16× baseline`);
process.exit(1);
