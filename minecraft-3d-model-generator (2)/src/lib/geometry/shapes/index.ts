import type { ModelKind } from "../../model-types";
import type { ShapeBuilder } from "../builder";
import { buildAxe } from "./axe";
import { buildBlock } from "./block";
import { buildCannon } from "./cannon";
import { buildDrill } from "./drill";
import { buildMechBlade } from "./mechblade";
import { buildPickaxe } from "./pickaxe";
import { buildShield } from "./shield";
import { buildStaff } from "./staff";
import { buildSword } from "./sword";
import {
  buildBloodBlade,
  buildBloodStaff,
  buildCursedBlade,
  buildElderStaff,
  buildGrimoire,
  buildMagicCircle,
  buildRelic,
  buildRuneBlade,
} from "./arcane";
import {
  buildBow,
  buildChainsaw,
  buildMace,
  buildPistol,
  buildRailgun,
  buildRifle,
  buildSpear,
} from "./armory";

export const SHAPE_BUILDERS: Readonly<Record<ModelKind, ShapeBuilder>> = {
  sword: buildSword,
  pickaxe: buildPickaxe,
  axe: buildAxe,
  shield: buildShield,
  staff: buildStaff,
  block: buildBlock,
  drill: buildDrill,
  cannon: buildCannon,
  mechblade: buildMechBlade,
  runeblade: buildRuneBlade,
  cursedblade: buildCursedBlade,
  bloodblade: buildBloodBlade,
  elderstaff: buildElderStaff,
  bloodstaff: buildBloodStaff,
  grimoire: buildGrimoire,
  magiccircle: buildMagicCircle,
  bow: buildBow,
  rifle: buildRifle,
  pistol: buildPistol,
  railgun: buildRailgun,
  chainsaw: buildChainsaw,
  relic: buildRelic,
  spear: buildSpear,
  mace: buildMace,
};
