import { writeFileSync } from "node:fs";
import { getItem } from "../src/lib/catalog";
import { generateTexture } from "../src/lib/generate";
import { encodePng } from "../src/lib/png";

const MECH_ITEMS = [
  { id: "gyrokinetic_wand", sig: "clockwork_steam", pal: "brass_clockwork", seed: 8812 },
  { id: "hyper_cleaver", sig: "clockwork_steam", pal: "brass_clockwork", seed: 9411 },
  { id: "plasma_chainsaw", sig: "cyber_matrix", pal: "cyber_neon", seed: 1042 },
  { id: "steampunk_railgun", sig: "clockwork_steam", pal: "dwarven_steam", seed: 7120 },
  { id: "flintlock_repeater", sig: "clockwork_steam", pal: "brass_clockwork", seed: 6314 },
  { id: "steam_pilebunker", sig: "clockwork_steam", pal: "dwarven_steam", seed: 4421 },
  { id: "artificer_wrench", sig: "clockwork_steam", pal: "brass_clockwork", seed: 3318 },
  { id: "automaton_blade", sig: "clockwork_steam", pal: "dwarven_steam", seed: 5519 },
  { id: "tachyon_cleaver", sig: "cyber_matrix", pal: "cyber_neon", seed: 2281 },
  { id: "mecha_gauntlet", sig: "clockwork_steam", pal: "brass_clockwork", seed: 9914 },
];

for (const m of MECH_ITEMS) {
  const item = getItem(m.id);
  if (!item) {
    console.error("Unknown item:", m.id);
    continue;
  }
  const tex = generateTexture({
    itemId: item.id,
    resolution: 64,
    seed: m.seed,
    styleMix: [{ id: m.pal, weight: 2 }],
    signatureMix: [{ id: m.sig, weight: 2 }],
    rarity: item.rarity,
    hueShift: 0,
    glow: 50,
    metallic: 65,
    chaos: 20,
    templateId: item.templates[0],
  });

  const png = encodePng(tex.width, tex.height, tex.pixels);
  writeFileSync(`public/masterworks/${item.id}.png`, Buffer.from(png));
  console.log(`Saved public/masterworks/${item.id}.png (${tex.width}x${tex.height})`);
}
