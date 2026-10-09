export interface MobDropDef {
  item: string;
  countMin: number;
  countMax: number;
  chance: number;
}

export interface MobDef {
  id: string;
  name: string;
  baseMob: string;
  maxHealth: number;
  movementSpeed: number;
  attackDamage: number;
  drops: MobDropDef[];
  behavior: "hostile" | "neutral" | "passive";
  wearableArmorId?: string;
  spawnBiomes?: string[];
  spawnChance?: number;
}

export interface DropRuleItem {
  id: string;
  min: number;
  max: number;
  chance: number;
  nbt?: string;
}

export interface DropRule {
  id: string;
  name: string;
  targetMob: string;
  items: DropRuleItem[];
}

export interface MaterialDef {
  id: string;
  name: string;
  baseMaterial: string;
  damageMultiplier: number;
  speedMultiplier: number;
  durabilityMultiplier: number;
  description: string;
}

export interface ShopTrade {
  id: string;
  offerItem: string;
  offerCount: number;
  requiredItem1: string;
  requiredCount1: number;
  requiredItem2: string;
  requiredCount2: number;
}

export interface ShopDef {
  id: string;
  name: string;
  trades: ShopTrade[];
  openedByBlockId?: string;
}

export interface SkillPointDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: "INCREASE_MAX_HEALTH" | "INCREASE_MAX_MANA" | "INCREASE_DAMAGE" | "INCREASE_DEFENSE" | "INCREASE_SPEED" | "INCREASE_LUCK";
  amount: number;
}

export interface CustomEffectDef {
  id: string;
  name: string;
  color: string;
  category: "BENEFICIAL" | "HARMFUL" | "NEUTRAL";
  tickSkillId: string;
  intervalTicks: number;
  revive: boolean;
  reviveHealth: number;
  reviveSkillId: string;
}

export interface AdvancementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  frame: "task" | "goal" | "challenge";
  parent: string;
  kind: "MANUAL" | "OBTAIN_ITEM" | "KILL_MOB";
  item: string;
  mob: string;
  steps: number;
  rewardXp: number;
  hidden: boolean;
}
