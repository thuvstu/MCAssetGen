import type { Config } from "./data";

export const EVOLUTION_STAGES = [
  { label: "原型", subtitle: "Proto", suffix: "I" },
  { label: "鍛成", subtitle: "Forged", suffix: "II" },
  { label: "覚醒", subtitle: "Awakened", suffix: "III" },
  { label: "真・完成", subtitle: "Ascended", suffix: "IV" },
] as const;

/**
 * Upgrade a single item family without replacing its defining silhouette or element.
 * The lineage stays recognizable in a crowded server inventory: progressively richer
 * metalwork, gems, secondary objects and finally a luminous signature effect.
 */
export function evolveRelic(source: Config, stage: number): Config {
  const index = Math.max(0, Math.min(EVOLUTION_STAGES.length - 1, Math.floor(stage)));
  const baseName = source.name.replace(/\s+\[[IVX]+\]$/, "");
  const common = { ...source, name: `${baseName} [${EVOLUTION_STAGES[index].suffix}]` };

  switch (index) {
    case 0:
      return {
        ...common,
        rarity: "common", form: "classic", bands: 0, coreSize: source.coreSize * 0.78,
        accentGems: 0, ornament: "none", floater: "none", floaterCount: 0,
        glow: 0, particles: 0, aura: false, rays: false, trail: false,
        magicCircle: false, glint: false, pulse: false, rimLight: false,
        finish: "vanilla", outline: "color",
      };
    case 1:
      return {
        ...common,
        rarity: "uncommon", form: "classic", bands: Math.max(1, Math.min(source.bands, 2)),
        coreSize: source.coreSize * 0.88, accentGems: 1,
        ornament: "none", floater: "none", floaterCount: 0,
        glow: 14, particles: 0, aura: false, rays: false,
        trail: false, magicCircle: false, glint: false,
        pulse: false, rimLight: false, finish: "forged",
      };
    case 2:
      return {
        ...common,
        rarity: "epic", bands: Math.max(2, source.bands),
        coreSize: source.coreSize, accentGems: Math.max(2, Math.min(source.accentGems, 4)),
        ornament: source.ornament, floater: source.floater,
        floaterCount: source.floater === "none" ? 0 : Math.max(2, Math.min(source.floaterCount, 3)),
        glow: Math.max(36, Math.min(source.glow, 56)), particles: Math.min(source.particles, 32),
        aura: false, rays: false, trail: false, magicCircle: false,
        glint: false, pulse: true, rimLight: true, finish: "engraved",
      };
    default:
      return {
        ...common,
        rarity: source.rarity === "common" || source.rarity === "uncommon" ? "legendary" : source.rarity,
        bands: Math.max(2, source.bands), accentGems: Math.max(3, source.accentGems),
        ornament: source.ornament, floater: source.floater,
        floaterCount: source.floater === "none" ? 0 : Math.max(3, source.floaterCount),
        glow: Math.max(55, source.glow), particles: Math.max(36, source.particles),
        pulse: true, rimLight: true, rays: source.rays,
        finish: source.finish === "vanilla" ? "gilded" : source.finish,
      };
  }
}

export function evolutionSeries(config: Config) {
  return EVOLUTION_STAGES.map((stage, index) => ({ ...stage, config: evolveRelic(config, index) }));
}