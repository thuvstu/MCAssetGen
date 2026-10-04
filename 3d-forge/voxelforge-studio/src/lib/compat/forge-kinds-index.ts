import { bloodscythe, cursed, mace, ornspear } from "./forge-kinds-dark";
import { armor, crown, shield } from "./forge-kinds-gear";
import { relic, sigil, staff, tome } from "./forge-kinds-magic";
import { chainsaw, gun, railgun } from "./forge-kinds-tech";
import type { KindDef } from "./forge-kinds-types";
import { axe, bow, spear, sword } from "./forge-kinds-weapons";

export type { KindDef } from "./forge-kinds-types";

export const KINDS: KindDef[] = [
  sword, axe, spear, bow, mace, ornspear,
  chainsaw, gun, railgun,
  cursed, bloodscythe,
  staff, tome, sigil, relic,
  shield, armor, crown,
];
export const FAMILIES: KindDef["family"][] = ["武器", "機巧", "凶刃", "魔導", "防具", "装飾"];
export const kindById = (id: string) => KINDS.find((k) => k.id === id) ?? KINDS[0];
