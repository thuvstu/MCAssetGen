import type { CatalogItem } from "@/lib/catalog";
import { RARITIES, type Rarity } from "@/lib/rarity";

export function ItemTooltip({
  item,
  rarity,
}: {
  item: CatalogItem;
  rarity?: Rarity;
}) {
  const r = RARITIES[rarity ?? item.rarity];
  return (
    <div className="sb-tooltip min-w-[220px] px-3 py-2 text-left">
      <p className="font-medium" style={{ color: r.color }}>
        {item.name}
      </p>
      <p className="text-[11px] text-paper/50">{item.nameJa}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-paper/70">{item.lore}</p>
      <p className="mt-2 font-pixel text-[10px] tracking-wider" style={{ color: r.color }}>
        {r.label}
      </p>
    </div>
  );
}
