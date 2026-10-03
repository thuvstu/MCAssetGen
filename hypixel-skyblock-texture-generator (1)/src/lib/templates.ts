import {
  makeCtx,
  swap,
  validateGrid,
  type Ctx,
  type Grid,
} from "@/lib/draw";

/**
 * Templates describe silhouette + material only. Light, shadow, bevel, outline
 * and ornament are derived by the shading engine so every template renders
 * consistently in every "essence" (pack archetype).
 */
export type TemplateDef = {
  id: string;
  name: string;
  kind: "weapon" | "ranged" | "staff" | "tool" | "armor" | "accessory" | "creature";
  build: (c: Ctx) => void;
};

const M = {
  blade: "b",
  core: "B",
  iron: "m",
  gold: "M",
  gem: "g",
  wood: "w",
  leather: "l",
  cloth: "c",
  string: "s",
  energy: "e",
  bone: "k",
  fur: "p",
  rune: "r",
};

function classicSword(c: Ctx): void {
  c.antiBand(13, 13, 3, 15, 0, 12, M.blade);
  c.antiBand(14, 14, 3, 15, 0, 12, M.core);
  c.antiBand(15, 15, 4, 15, 1, 12, M.iron);
  c.set(15, 0, M.blade);
  c.set(14, 0, M.blade);
  c.thickLine(2, 8, 8, 14, 1, M.gold);
  c.set(2, 8, M.iron);
  c.set(8, 14, M.iron);
  c.set(5, 11, M.gem);
  c.line(4, 11, 1, 14, M.leather);
  c.set(0, 15, M.gold);
  c.set(1, 15, M.gold);
}

function broadSword(c: Ctx): void {
  c.antiBand(12, 12, 3, 15, 0, 12, M.blade);
  c.antiBand(13, 14, 3, 15, 0, 12, M.core);
  c.antiBand(15, 15, 4, 15, 1, 12, M.iron);
  c.set(15, 0, M.blade);
  c.set(14, 0, M.blade);
  c.set(15, 1, M.blade);
  c.thickLine(1, 7, 8, 14, 2, M.gold);
  c.set(1, 7, M.iron);
  c.set(8, 14, M.iron);
  c.set(4, 10, M.gem);
  c.line(4, 11, 1, 14, M.leather);
  c.set(0, 15, M.gold);
  c.set(1, 15, M.gold);
}

function greatSword(c: Ctx): void {
  c.antiBand(11, 11, 2, 15, 0, 13, M.blade);
  c.antiBand(12, 14, 2, 15, 0, 13, M.core);
  c.antiBand(15, 16, 3, 15, 1, 13, M.iron);
  c.antiBand(13, 13, 6, 12, 1, 7, M.gold);
  c.set(15, 0, M.blade);
  c.set(14, 0, M.blade);
  c.set(15, 1, M.blade);
  c.thickLine(0, 7, 8, 15, 2, M.gold);
  c.set(0, 7, M.iron);
  c.set(8, 15, M.iron);
  c.set(4, 11, M.gem);
  c.line(3, 12, 1, 14, M.leather);
  c.set(0, 15, M.gold);
}

function katana(c: Ctx): void {
  for (let t = 0; t <= 11; t++) {
    const x = 4 + t;
    const y = 13 - t - Math.floor((t * t) / 26);
    c.set( x, y, M.blade);
    c.set( x - 1, y + 1, M.core);
  }
  c.set( 15, 0, M.blade);
  c.ellipse( 4, 12, 1.7, 1.7, M.gold);
  c.line( 3, 13, 1, 15, M.leather);
  c.set( 0, 15, M.gold);
}

function dagger(c: Ctx): void {
  c.antiBand(13, 13, 6, 14, 1, 8, M.blade);
  c.antiBand(14, 14, 6, 14, 1, 8, M.core);
  c.antiBand(15, 15, 7, 14, 2, 8, M.iron);
  c.set(15, 0, M.blade);
  c.set(14, 1, M.blade);
  c.thickLine(5, 8, 10, 13, 1, M.gold);
  c.set(5, 8, M.iron);
  c.set(10, 13, M.iron);
  c.set(7, 10, M.gem);
  c.line(6, 10, 3, 13, M.leather);
  c.set(2, 14, M.gold);
  c.set(3, 14, M.gold);
}

function rapier(c: Ctx): void {
  c.antiBand( 15, 15, 5, 15, 0, 10, M.blade);
  c.set( 15, 0, M.blade);
  c.arc( 5, 10, 2.6, Math.PI * 0.55, Math.PI * 1.45, M.gold, 1);
  c.set( 5, 10, M.iron);
  c.line( 4, 11, 2, 13, M.leather);
  c.set( 1, 14, M.gold);
}

function scythe(c: Ctx): void {
  c.arc( 8, 9, 6.6, Math.PI * 1.08, Math.PI * 1.92, M.blade, 1);
  c.arc( 8, 9, 5.7, Math.PI * 1.12, Math.PI * 1.88, M.core, 1);
  c.thickLine( 8, 8, 3, 14, 1, M.wood);
  c.set( 6, 10, M.leather);
  c.set( 5, 11, M.leather);
  c.set( 2, 15, M.iron);
}

function witherBlade(c: Ctx): void {
  classicSword(c);
  swap(c.g, M.core, M.energy);
  c.antiBand(14, 14, 9, 13, 1, 5, M.core);
  c.ellipse(3, 6, 1.6, 1.6, M.bone);
  c.ellipse(9, 13, 1.6, 1.6, M.bone);
  c.set(3, 6, M.energy);
  c.set(9, 13, M.energy);
  c.set(2, 5, M.gold);
}

function bowLong(c: Ctx): void {
  c.arc( 10, 8, 6.4, Math.PI * 0.62, Math.PI * 1.38, M.wood, 2);
  c.set( 6, 13, M.gold);
  c.set( 6, 3, M.gold);
  c.line( 6, 3, 6, 13, M.string);
  c.thickLine( 3, 7, 3, 9, 1, M.leather);
  c.set( 4, 8, M.gold);
  c.set( 3, 8, M.gem);
}

function bowShort(c: Ctx): void {
  c.arc( 10, 8, 4.8, Math.PI * 0.6, Math.PI * 1.4, M.wood, 2);
  c.set( 7, 12, M.gold);
  c.set( 7, 4, M.gold);
  c.line( 7, 4, 7, 12, M.string);
  c.set( 5, 8, M.leather);
  c.set( 6, 8, M.gold);
}

function bowHeavy(c: Ctx): void {
  c.arc( 11, 8, 6.6, Math.PI * 0.6, Math.PI * 1.4, M.iron, 2);
  c.rect( 5, 1, 3, 2, M.gold);
  c.rect( 5, 13, 3, 2, M.gold);
  c.line( 6, 3, 6, 13, M.string);
  c.thickLine( 4, 6, 4, 10, 2, M.iron);
  c.set( 4, 8, M.gem);
  c.set( 3, 8, M.gold);
  c.set( 8, 4, M.energy);
  c.set( 8, 12, M.energy);
}

function crossbow(c: Ctx): void {
  c.thickLine( 2, 8, 11, 8, 2, M.wood);
  c.set( 2, 8, M.leather);
  c.set( 3, 9, M.leather);
  c.set( 5, 10, M.iron);
  c.line( 10, 2, 12, 6, M.gold);
  c.line( 12, 10, 10, 14, M.gold);
  c.line( 10, 2, 8, 8, M.string);
  c.line( 8, 8, 10, 14, M.string);
  c.line( 6, 7, 13, 7, M.iron);
  c.set( 14, 7, M.blade);
  c.set( 13, 6, M.blade);
}

function wand(c: Ctx): void {
  c.thickLine( 2, 14, 10, 6, 1, M.wood);
  c.set( 4, 12, M.leather);
  c.set( 5, 11, M.leather);
  c.line( 10, 6, 12, 3, M.gold);
  c.line( 10, 6, 13, 6, M.gold);
  c.ellipse( 13, 3, 2.1, 2.1, M.energy);
  c.set( 13, 3, M.gem);
  c.set( 12, 2, M.gem);
}

function sceptre(c: Ctx): void {
  c.thickLine( 3, 14, 8, 9, 1, M.wood);
  c.set( 5, 12, M.leather);
  c.set( 6, 11, M.leather);
  c.ellipse( 11, 5, 3.2, 3.2, M.gold, false);
  c.ellipse( 11, 5, 1.8, 1.8, M.gem);
  c.set( 11, 5, M.energy);
  c.set( 9, 2, M.gold);
  c.set( 11, 1, M.gold);
  c.set( 13, 2, M.gold);
  c.set( 8, 9, M.iron);
}

function orbStaff(c: Ctx): void {
  c.thickLine( 4, 15, 8, 10, 1, M.wood);
  c.set( 6, 13, M.leather);
  c.set( 7, 11, M.iron);
  c.ellipse( 10, 6, 3.6, 3.6, M.energy);
  c.ellipse( 10, 6, 2, 2, M.gem);
  c.set( 9, 5, M.blade);
  c.arc( 10, 6, 4.4, Math.PI * 0.15, Math.PI * 0.85, M.gold, 1);
}

function magicScythe(c: Ctx): void {
  c.thickLine( 3, 15, 11, 6, 1, M.wood);
  c.set( 5, 13, M.leather);
  c.arc( 10, 7, 5.4, Math.PI * 1.05, Math.PI * 1.95, M.energy, 1);
  c.arc( 10, 7, 4.6, Math.PI * 1.1, Math.PI * 1.9, M.blade, 1);
  c.set( 11, 6, M.gold);
}

function pickaxe(c: Ctx): void {
  c.arc( 8, 13, 7.4, Math.PI * 1.06, Math.PI * 1.94, M.iron, 2);
  c.arc( 8, 13, 6.5, Math.PI * 1.1, Math.PI * 1.9, M.gold, 1);
  c.thickLine( 8, 6, 8, 15, 1, M.wood);
  c.set( 8, 11, M.leather);
  c.set( 8, 12, M.leather);
  c.set( 8, 7, M.iron);
}

function battleAxe(c: Ctx): void {
  c.poly([
      [6, 2],
      [12, 3],
      [13, 7],
      [11, 11],
      [6, 10],
    ],
    M.iron,
  );
  c.line( 12, 3, 13, 7, M.blade);
  c.line( 13, 7, 11, 11, M.blade);
  c.set( 12, 5, M.gold);
  c.set( 12, 9, M.gold);
  c.thickLine( 6, 2, 3, 15, 1, M.wood);
  c.set( 5, 8, M.leather);
  c.set( 4, 11, M.leather);
}

function drill(c: Ctx): void {
  c.rect( 5, 3, 6, 8, M.iron);
  c.rect( 6, 4, 4, 2, M.gold);
  c.set( 7, 7, M.gem);
  c.set( 9, 5, M.energy);
  c.poly([
      [6, 11],
      [10, 11],
      [8, 15],
    ],
    M.gold,
  );
  c.set( 8, 14, M.blade);
  c.rect( 3, 6, 2, 4, M.leather);
  c.rect( 11, 6, 2, 3, M.iron);
  c.set( 12, 5, M.energy);
}

function hoe(c: Ctx): void {
  c.rect( 6, 3, 8, 2, M.gold);
  c.rect( 6, 5, 8, 1, M.iron);
  c.set( 13, 3, M.blade);
  c.thickLine( 7, 4, 3, 15, 1, M.wood);
  c.set( 5, 9, M.leather);
  c.set( 4, 12, M.leather);
}

function fishingRod(c: Ctx): void {
  c.thickLine( 2, 14, 12, 4, 1, M.wood);
  c.set( 3, 13, M.leather);
  c.set( 4, 12, M.leather);
  c.ellipse( 6, 10, 1.4, 1.4, M.gold);
  c.line( 12, 4, 14, 9, M.string);
  c.line( 14, 9, 12, 13, M.string);
  c.set( 12, 14, M.iron);
  c.set( 11, 13, M.gem);
}

function grapplingHook(c: Ctx): void {
  c.line( 2, 14, 9, 7, M.string);
  c.set( 3, 13, M.leather);
  c.set( 4, 12, M.leather);
  c.ellipse( 10, 6, 1.8, 1.8, M.iron);
  c.line( 10, 5, 8, 2, M.gold);
  c.line( 11, 5, 14, 3, M.gold);
  c.line( 11, 7, 14, 9, M.gold);
  c.set( 8, 2, M.blade);
  c.set( 14, 3, M.blade);
  c.set( 14, 9, M.blade);
}

function gauntlet(c: Ctx): void {
  c.poly([
      [3, 6],
      [12, 4],
      [13, 10],
      [9, 13],
      [4, 12],
    ],
    M.iron,
  );
  c.line( 3, 6, 12, 4, M.gold);
  c.set( 5, 3, M.gold);
  c.set( 8, 2, M.gold);
  c.set( 11, 2, M.gold);
  c.ellipse( 8, 8, 1.8, 1.8, M.gem);
  c.set( 8, 8, M.energy);
  c.rect( 4, 12, 5, 2, M.leather);
}

function helmFull(c: Ctx): void {
  c.ellipse( 8, 7, 5, 5, M.iron);
  c.line( 8, 1, 8, 4, M.gold);
  c.set( 7, 2, M.gold);
  c.set( 9, 2, M.gold);
  c.rect( 3, 7, 10, 1, M.gold);
  c.rect( 4, 8, 8, 3, ".");
  c.set( 5, 9, M.energy);
  c.set( 10, 9, M.energy);
  c.rect( 3, 8, 1, 4, M.iron);
  c.rect( 12, 8, 1, 4, M.iron);
  c.rect( 5, 12, 6, 2, M.iron);
  c.set( 8, 12, M.gold);
}

function helmHorned(c: Ctx): void {
  c.ellipse( 8, 8, 5, 4.4, M.iron);
  c.line( 4, 5, 1, 1, M.bone);
  c.line( 12, 5, 15, 1, M.bone);
  c.set( 2, 2, M.gold);
  c.set( 14, 2, M.gold);
  c.set( 6, 7, M.energy);
  c.set( 10, 7, M.energy);
  c.rect( 6, 10, 4, 2, M.gold);
  c.set( 8, 3, M.gold);
  c.set( 7, 4, M.iron);
  c.set( 9, 4, M.iron);
  c.rect( 4, 12, 8, 1, M.iron);
}

function helmHood(c: Ctx): void {
  c.poly([
      [3, 4],
      [8, 1],
      [13, 4],
      [14, 12],
      [11, 14],
      [5, 14],
      [2, 12],
    ],
    M.cloth,
  );
  c.poly([
      [5, 6],
      [11, 6],
      [11, 11],
      [8, 13],
      [5, 11],
    ],
    ".",
  );
  c.set( 6, 8, M.energy);
  c.set( 10, 8, M.energy);
  c.line( 4, 5, 8, 3, M.leather);
  c.line( 12, 5, 8, 3, M.leather);
  c.set( 8, 4, M.gold);
}

function helmCrown(c: Ctx): void {
  c.poly([
      [3, 9],
      [4, 4],
      [6, 7],
      [8, 2],
      [10, 7],
      [12, 4],
      [13, 9],
    ],
    M.gold,
  );
  c.rect( 3, 9, 11, 3, M.gold);
  c.rect( 3, 11, 11, 1, M.iron);
  c.set( 5, 10, M.gem);
  c.set( 8, 10, M.gem);
  c.set( 11, 10, M.gem);
  c.set( 8, 3, M.energy);
}

function chestPlate(c: Ctx): void {
  c.poly([
      [4, 4],
      [12, 4],
      [13, 13],
      [9, 15],
      [7, 15],
      [3, 13],
    ],
    M.iron,
  );
  c.ellipse( 3, 5, 2.2, 1.8, M.gold);
  c.ellipse( 13, 5, 2.2, 1.8, M.gold);
  c.rect( 6, 2, 4, 3, M.gold);
  c.line( 8, 5, 8, 14, M.gold);
  c.set( 8, 7, M.gem);
  c.rect( 4, 13, 9, 1, M.gold);
  c.set( 5, 9, M.leather);
  c.set( 11, 9, M.leather);
}

function chestRobe(c: Ctx): void {
  c.poly([
      [5, 2],
      [11, 2],
      [14, 15],
      [2, 15],
    ],
    M.cloth,
  );
  c.line( 5, 2, 3, 15, M.gold);
  c.line( 11, 2, 13, 15, M.gold);
  c.set( 8, 3, M.gem);
  c.set( 8, 6, M.rune);
  c.set( 7, 9, M.rune);
  c.set( 9, 9, M.rune);
  c.set( 8, 12, M.rune);
  c.rect( 6, 1, 4, 2, M.leather);
}

function chestLight(c: Ctx): void {
  c.poly([
      [4, 3],
      [12, 3],
      [12, 14],
      [4, 14],
    ],
    M.leather,
  );
  c.line( 5, 3, 11, 13, M.iron);
  c.line( 11, 3, 5, 13, M.iron);
  c.set( 8, 8, M.gold);
  c.rect( 4, 3, 8, 1, M.iron);
  c.rect( 4, 13, 8, 1, M.iron);
  c.set( 6, 5, M.gold);
  c.set( 10, 11, M.gold);
}

function leggings(c: Ctx): void {
  c.rect( 3, 2, 5, 12, M.iron);
  c.rect( 9, 2, 5, 12, M.iron);
  c.rect( 3, 1, 11, 2, M.gold);
  c.rect( 4, 7, 4, 2, M.gold);
  c.rect( 10, 7, 4, 2, M.gold);
  c.rect( 3, 13, 5, 1, M.leather);
  c.rect( 9, 13, 5, 1, M.leather);
  c.set( 5, 4, M.gem);
  c.set( 11, 4, M.gem);
}

function boots(c: Ctx): void {
  c.poly([
      [2, 5],
      [7, 5],
      [7, 11],
      [8, 12],
      [8, 14],
      [2, 14],
    ],
    M.iron,
  );
  c.poly([
      [9, 5],
      [14, 5],
      [14, 14],
      [8, 14],
      [8, 12],
      [9, 11],
    ],
    M.iron,
  );
  c.rect( 2, 13, 6, 2, M.gold);
  c.rect( 9, 13, 6, 2, M.gold);
  c.rect( 2, 4, 5, 1, M.leather);
  c.rect( 9, 4, 5, 1, M.leather);
  c.set( 4, 8, M.gem);
  c.set( 12, 8, M.gem);
}

function talisman(c: Ctx): void {
  c.ellipse( 8, 9, 4.6, 4.6, M.gold, false);
  c.ellipse( 8, 9, 3.4, 3.4, M.iron, false);
  c.ellipse( 8, 4, 1.9, 1.9, M.gem);
  c.set( 8, 9, M.energy);
  c.set( 5, 6, M.energy);
  c.set( 11, 12, M.energy);
  c.set( 6, 2, M.gold);
  c.set( 10, 2, M.gold);
}

function ring(c: Ctx): void {
  c.ellipse( 8, 10, 4.2, 4.2, M.gold, false);
  c.ellipse( 8, 10, 3.2, 3.2, M.iron, false);
  c.poly([
      [6, 2],
      [10, 2],
      [11, 5],
      [8, 7],
      [5, 5],
    ],
    M.gem,
  );
  c.set( 7, 3, M.energy);
  c.set( 5, 12, M.energy);
}

function artifact(c: Ctx): void {
  c.ellipse( 8, 8, 6, 6, M.iron);
  c.ellipse( 8, 8, 4.4, 4.4, M.gold);
  c.ellipse( 8, 8, 2.6, 2.6, M.gem);
  c.set( 8, 8, M.energy);
  c.set(8, 2, M.rune);
  c.set(8, 14, M.rune);
  c.set(2, 8, M.rune);
  c.set(14, 8, M.rune);
  c.set( 3, 3, M.gold);
  c.set( 13, 13, M.gold);
}

function powerOrb(c: Ctx): void {
  c.ellipse( 8, 8, 5.4, 5.4, M.energy);
  c.ellipse( 8, 8, 3.4, 3.4, M.gem);
  c.set( 6, 6, M.blade);
  c.set( 7, 5, M.blade);
  c.arc( 8, 8, 5.9, Math.PI * 0.1, Math.PI * 0.9, M.gold, 1);
  c.rect( 6, 14, 5, 1, M.iron);
  c.set( 11, 4, M.energy);
  c.set( 4, 11, M.energy);
}

function book(c: Ctx): void {
  c.rect( 2, 3, 12, 11, M.leather);
  c.rect( 4, 4, 9, 9, M.bone);
  c.rect( 2, 3, 2, 11, M.iron);
  c.line( 6, 6, 11, 6, M.rune);
  c.line( 6, 8, 11, 8, M.rune);
  c.line( 6, 10, 9, 10, M.rune);
  c.rect( 12, 7, 2, 3, M.gold);
  c.set( 8, 5, M.gem);
}

function potion(c: Ctx): void {
  c.rect( 7, 2, 3, 2, M.wood);
  c.rect( 7, 4, 3, 3, M.bone);
  c.ellipse( 8, 11, 4.2, 4.2, M.energy);
  c.ellipse( 8, 12, 3.2, 3, M.gem);
  c.set( 6, 9, M.blade);
  c.set( 7, 13, M.energy);
  c.set( 10, 10, M.energy);
  c.rect( 6, 6, 1, 2, M.bone);
  c.rect( 10, 6, 1, 2, M.bone);
}

function crystalShard(c: Ctx): void {
  c.poly([
      [8, 1],
      [12, 6],
      [10, 15],
      [6, 15],
      [4, 6],
    ],
    M.gem,
  );
  c.line( 8, 1, 8, 15, M.energy);
  c.set( 6, 5, M.blade);
  c.set( 5, 7, M.blade);
  c.poly([
      [12, 8],
      [15, 11],
      [13, 15],
      [11, 14],
    ],
    M.gem,
  );
  c.set( 13, 11, M.energy);
}

function scroll(c: Ctx): void {
  c.rect( 3, 4, 10, 9, M.bone);
  c.rect( 2, 2, 12, 2, M.leather);
  c.rect( 2, 13, 12, 2, M.leather);
  c.line( 5, 6, 11, 6, M.rune);
  c.line( 5, 8, 11, 8, M.rune);
  c.line( 5, 10, 9, 10, M.rune);
  c.ellipse( 8, 11, 1.6, 1.6, M.gold);
  c.set( 8, 11, M.gem);
}

function petDragon(c: Ctx): void {
  c.poly([
      [7, 8],
      [2, 2],
      [4, 9],
    ],
    M.fur,
  );
  c.poly([
      [9, 8],
      [14, 2],
      [12, 9],
    ],
    M.fur,
  );
  c.ellipse( 8, 10, 4, 3, M.fur);
  c.ellipse( 12, 6, 2.4, 2.1, M.fur);
  c.set( 11, 5, M.energy);
  c.set( 13, 5, M.energy);
  c.line( 10, 3, 9, 1, M.bone);
  c.line( 14, 4, 15, 2, M.bone);
  c.poly([
      [5, 11],
      [2, 14],
      [6, 13],
    ],
    M.fur,
  );
  c.rect( 7, 12, 3, 1, M.leather);
  c.set( 3, 3, M.gold);
  c.set( 13, 3, M.gold);
}

function petQuadruped(c: Ctx): void {
  c.ellipse( 8, 10, 5, 3, M.fur);
  c.ellipse( 12, 6, 2.6, 2.3, M.fur);
  c.poly([
      [10, 4],
      [11, 2],
      [12, 4],
    ],
    M.fur,
  );
  c.poly([
      [13, 4],
      [14, 2],
      [15, 4],
    ],
    M.fur,
  );
  c.set( 11, 6, M.energy);
  c.set( 14, 6, M.energy);
  c.rect( 4, 12, 2, 3, M.fur);
  c.rect( 7, 12, 2, 3, M.fur);
  c.rect( 11, 11, 2, 3, M.fur);
  c.line( 3, 9, 1, 6, M.fur);
  c.set( 6, 9, M.leather);
  c.set( 9, 10, M.leather);
  c.set( 12, 8, M.leather);
}

function petBird(c: Ctx): void {
  c.poly([
      [7, 9],
      [1, 3],
      [3, 10],
    ],
    M.fur,
  );
  c.poly([
      [9, 9],
      [15, 3],
      [13, 10],
    ],
    M.fur,
  );
  c.ellipse( 8, 10, 3.4, 3, M.fur);
  c.ellipse( 11, 6, 2.1, 1.9, M.fur);
  c.poly([
      [13, 6],
      [15, 7],
      [13, 8],
    ],
    M.gold,
  );
  c.set( 11, 5, M.energy);
  c.set( 10, 3, M.energy);
  c.set( 12, 3, M.energy);
  c.line( 6, 12, 3, 15, M.fur);
  c.set( 4, 14, M.gold);
}

function petBee(c: Ctx): void {
  c.ellipse( 6, 4, 3.2, 1.7, M.string);
  c.ellipse( 11, 4, 3.2, 1.7, M.string);
  c.ellipse( 8, 10, 4.2, 3.2, M.fur);
  c.set( 6, 9, M.leather);
  c.set( 6, 10, M.leather);
  c.set( 9, 9, M.leather);
  c.set( 9, 10, M.leather);
  c.set( 9, 11, M.leather);
  c.ellipse( 12, 8, 2.1, 2, M.fur);
  c.set( 12, 7, M.energy);
  c.set( 14, 8, M.energy);
  c.set( 3, 10, M.gold);
  c.line( 6, 13, 5, 15, M.iron);
  c.line( 10, 13, 11, 15, M.iron);
}

function petWhale(c: Ctx): void {
  c.ellipse( 8, 9, 6, 4, M.fur);
  c.poly([
      [2, 6],
      [0, 9],
      [2, 12],
      [4, 9],
    ],
    M.fur,
  );
  c.poly([
      [7, 5],
      [9, 2],
      [11, 5],
    ],
    M.fur,
  );
  c.arc( 8, 10, 5, Math.PI * 0.15, Math.PI * 0.85, M.leather, 2);
  c.set( 11, 8, M.energy);
  c.set( 13, 10, M.iron);
  c.set( 12, 4, M.energy);
}

function minion(c: Ctx): void {
  c.rect( 5, 2, 6, 5, M.fur);
  c.set( 6, 4, M.energy);
  c.set( 9, 4, M.energy);
  c.rect( 7, 6, 2, 1, M.iron);
  c.rect( 4, 7, 8, 6, M.leather);
  c.rect( 4, 10, 8, 1, M.iron);
  c.rect( 2, 8, 2, 4, M.fur);
  c.rect( 12, 8, 2, 4, M.fur);
  c.rect( 5, 13, 2, 2, M.iron);
  c.rect( 9, 13, 2, 2, M.iron);
  c.set( 8, 8, M.gold);
  c.line( 13, 7, 15, 5, M.gold);
}

function chainsawSword(c: Ctx): void {
  // Heavy industrial saw blade with mechanical motor
  c.antiBand(11, 11, 2, 15, 0, 13, M.blade);
  c.antiBand(12, 13, 2, 15, 0, 13, M.core);
  c.antiBand(14, 14, 3, 15, 1, 13, M.iron);
  // Saw teeth alternating
  for (let t = 2; t <= 12; t += 2) {
    c.set(15 - t, t - 1, M.blade);
  }
  c.rect(2, 8, 4, 4, M.iron);
  c.set(3, 9, M.gold);
  c.set(4, 10, M.energy);
  c.line(2, 12, 0, 14, M.leather);
  c.set(0, 15, M.iron);
}

function pistonSword(c: Ctx): void {
  // Hydraulic pile-driving mechanism on blade
  c.antiBand(12, 12, 3, 15, 0, 12, M.blade);
  c.antiBand(13, 13, 3, 15, 0, 12, M.core);
  c.antiBand(14, 15, 4, 15, 1, 12, M.iron);
  c.set(15, 0, M.blade);
  c.rect(5, 7, 3, 3, M.gold);
  c.set(6, 8, M.energy);
  c.thickLine(1, 9, 7, 15, 1, M.iron);
  c.line(3, 12, 1, 14, M.leather);
  c.set(0, 15, M.gold);
}

function railgunBow(c: Ctx): void {
  // Linear magnetic accelerator bow
  c.line(2, 8, 14, 8, M.iron);
  c.line(2, 6, 14, 6, M.gold);
  c.line(2, 10, 14, 10, M.gold);
  c.set(6, 7, M.energy);
  c.set(10, 7, M.energy);
  c.set(14, 7, M.blade);
  c.line(3, 3, 3, 13, M.string);
  c.rect(1, 7, 2, 3, M.leather);
  c.set(2, 8, M.iron);
}

function gyroStaff(c: Ctx): void {
  // Rotating clockwork gyroscope staff
  c.thickLine(3, 14, 9, 8, 1, M.wood);
  c.ellipse(11, 5, 4, 4, M.gold, false);
  c.ellipse(11, 5, 2.5, 2.5, M.iron, false);
  c.set(11, 5, M.energy);
  c.set(11, 1, M.gold);
  c.set(15, 5, M.gold);
  c.set(11, 9, M.gold);
  c.set(7, 5, M.gold);
  c.set(5, 12, M.leather);
}

function pilebunkerTool(c: Ctx): void {
  // Heavy steam-powered hydraulic arm
  c.poly([[3, 4], [12, 4], [14, 12], [4, 14]], M.iron);
  c.rect(6, 6, 5, 5, M.core);
  c.set(8, 8, M.energy);
  c.thickLine(7, 0, 9, 5, 2, M.blade);
  c.rect(4, 12, 8, 3, M.leather);
  c.set(4, 12, M.gold);
  c.set(11, 12, M.gold);
}

function wrenchTool(c: Ctx): void {
  // Massive adjustable artificer wrench
  c.thickLine(2, 14, 10, 6, 2, M.iron);
  c.poly([[9, 2], [14, 2], [15, 8], [11, 9], [7, 5]], M.gold);
  c.rect(11, 4, 3, 3, ".");
  c.set(8, 7, M.iron);
  c.set(4, 11, M.leather);
  c.set(1, 15, M.iron);
}

export const TEMPLATE_DEFS: TemplateDef[] = [
  { id: "sword_chainsaw", name: "Chainsaw Sword", kind: "weapon", build: chainsawSword },
  { id: "sword_piston", name: "Piston Sword", kind: "weapon", build: pistonSword },
  { id: "bow_railgun", name: "Railgun Bow", kind: "ranged", build: railgunBow },
  { id: "staff_gyro", name: "Gyrokinetic Wand", kind: "staff", build: gyroStaff },
  { id: "tool_pilebunker", name: "Steam Pilebunker", kind: "tool", build: pilebunkerTool },
  { id: "tool_wrench", name: "Artificer Wrench", kind: "tool", build: wrenchTool },
  { id: "sword_long", name: "Longsword", kind: "weapon", build: classicSword },
  { id: "sword_broad", name: "Broadsword", kind: "weapon", build: broadSword },
  { id: "sword_great", name: "Greatsword", kind: "weapon", build: greatSword },
  { id: "sword_katana", name: "Katana", kind: "weapon", build: katana },
  { id: "sword_dagger", name: "Dagger", kind: "weapon", build: dagger },
  { id: "sword_rapier", name: "Rapier", kind: "weapon", build: rapier },
  { id: "sword_scythe", name: "Scythe", kind: "weapon", build: scythe },
  { id: "sword_wither", name: "Wither Blade", kind: "weapon", build: witherBlade },
  { id: "bow_long", name: "Longbow", kind: "ranged", build: bowLong },
  { id: "bow_short", name: "Shortbow", kind: "ranged", build: bowShort },
  { id: "bow_heavy", name: "Heavy Bow", kind: "ranged", build: bowHeavy },
  { id: "bow_crossbow", name: "Crossbow", kind: "ranged", build: crossbow },
  { id: "staff_wand", name: "Wand", kind: "staff", build: wand },
  { id: "staff_sceptre", name: "Sceptre", kind: "staff", build: sceptre },
  { id: "staff_orb", name: "Orb Staff", kind: "staff", build: orbStaff },
  { id: "staff_scythe", name: "Magic Scythe", kind: "staff", build: magicScythe },
  { id: "tool_pickaxe", name: "Pickaxe", kind: "tool", build: pickaxe },
  { id: "tool_axe", name: "Battle Axe", kind: "tool", build: battleAxe },
  { id: "tool_drill", name: "Drill", kind: "tool", build: drill },
  { id: "tool_hoe", name: "Hoe", kind: "tool", build: hoe },
  { id: "tool_rod", name: "Fishing Rod", kind: "tool", build: fishingRod },
  { id: "tool_hook", name: "Grappling Hook", kind: "tool", build: grapplingHook },
  { id: "tool_gauntlet", name: "Gauntlet", kind: "tool", build: gauntlet },
  { id: "armor_helm_full", name: "Full Helm", kind: "armor", build: helmFull },
  { id: "armor_helm_horn", name: "Horned Helm", kind: "armor", build: helmHorned },
  { id: "armor_helm_hood", name: "Hood", kind: "armor", build: helmHood },
  { id: "armor_helm_crown", name: "Crown", kind: "armor", build: helmCrown },
  { id: "armor_chest_plate", name: "Chestplate", kind: "armor", build: chestPlate },
  { id: "armor_chest_robe", name: "Robe", kind: "armor", build: chestRobe },
  { id: "armor_chest_light", name: "Light Chest", kind: "armor", build: chestLight },
  { id: "armor_legs", name: "Leggings", kind: "armor", build: leggings },
  { id: "armor_boots", name: "Boots", kind: "armor", build: boots },
  { id: "acc_talisman", name: "Talisman", kind: "accessory", build: talisman },
  { id: "acc_ring", name: "Ring", kind: "accessory", build: ring },
  { id: "acc_artifact", name: "Artifact", kind: "accessory", build: artifact },
  { id: "acc_orb", name: "Power Orb", kind: "accessory", build: powerOrb },
  { id: "acc_book", name: "Book", kind: "accessory", build: book },
  { id: "acc_potion", name: "Potion", kind: "accessory", build: potion },
  { id: "acc_crystal", name: "Crystal", kind: "accessory", build: crystalShard },
  { id: "acc_scroll", name: "Scroll", kind: "accessory", build: scroll },
  { id: "pet_dragon", name: "Dragon Pet", kind: "creature", build: petDragon },
  { id: "pet_quadruped", name: "Beast Pet", kind: "creature", build: petQuadruped },
  { id: "pet_bird", name: "Bird Pet", kind: "creature", build: petBird },
  { id: "pet_bee", name: "Insect Pet", kind: "creature", build: petBee },
  { id: "pet_whale", name: "Aquatic Pet", kind: "creature", build: petWhale },
  { id: "minion_base", name: "Minion", kind: "creature", build: minion },
];

const cache = new Map<string, Grid>();

/** Builds the classic template family. 64 is intentionally a different API. */
export function getTemplate(id: string, size: 16 | 32 = 16): Grid {
  const def = TEMPLATE_DEFS.find((t) => t.id === id) ?? TEMPLATE_DEFS[0]!;
  const key = `${def.id}@${size}`;
  let g = cache.get(key);
  if (!g) {
    const c = makeCtx(size);
    def.build(c);
    g = c.g;
    validateGrid(g, def.id, size);
    cache.set(key, g);
  }
  return g.map((row) => [...row]);
}

export function templateIds(): string[] {
  return TEMPLATE_DEFS.map((t) => t.id);
}

/** Verifies legacy 16/32 templates. Native 64 has its own strict validator. */
export function validateAllTemplates(sizes: (16 | 32)[] = [16, 32]): void {
  for (const size of sizes) {
    for (const def of TEMPLATE_DEFS) {
      const c = makeCtx(size);
      def.build(c);
      validateGrid(c.g, `${def.id}@${size}`, size);
      let filled = 0;
      for (const row of c.g) for (const ch of row) if (ch !== ".") filled++;
      // Sub-pixel detail is worthless if the silhouette collapses: every
      // resolution must keep at least ~55% of the 16× coverage per cell.
      const minimum = Math.ceil(Math.max(16, 16 * (size / 16) ** 2 * 0.55));
      if (filled < minimum) {
        throw new Error(`template ${def.id}@${size}: coverage collapsed (${filled} < ${minimum})`);
      }
    }
  }
}
