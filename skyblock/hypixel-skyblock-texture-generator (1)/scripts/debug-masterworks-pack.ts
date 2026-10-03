import { readFile } from "node:fs/promises";
import path from "node:path";
import { decodePng } from "@/lib/png";
import { MASTERWORKS } from "@/lib/masterworks";

async function main() {
const rows = [];
for (const mw of MASTERWORKS) {
  const file = path.join(process.cwd(), "public", mw.file);
  try {
    const buf = new Uint8Array(await readFile(file));
    const d = decodePng(buf);
    if (d.width !== 64 || d.height !== 64) throw new Error(`bad size ${d.width}`);
    rows.push(mw.itemId);
  } catch (e) {
    console.log("FAIL", mw.itemId, (e as Error).message);
  }
}
console.log("decoded", rows.length, "of", MASTERWORKS.length);

}

void main();
