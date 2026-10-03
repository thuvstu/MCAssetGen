import { bloodscythe, cursed, mace, ornspear } from "./dark";
import { armor, crown, shield } from "./gear";
import { relic, sigil, staff, tome } from "./magic";
import { chainsaw, gun, railgun } from "./tech";
import type { KindDef } from "./types";
import { axe, bow, spear, sword } from "./weapons";

export type { KindDef } from "./types";

export const KINDS: KindDef[] = [
  sword, axe, spear, bow, mace, ornspear,
  chainsaw, gun, railgun,
  cursed, bloodscythe,
  staff, tome, sigil, relic,
  shield, armor, crown,
];
export const FAMILIES: KindDef["family"][] = ["武器", "機巧", "凶刃", "魔導", "防具", "装飾"];
export const kindById = (id: string) => KINDS.find((k) => k.id === id) ?? KINDS[0];
