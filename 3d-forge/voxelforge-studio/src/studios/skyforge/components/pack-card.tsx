import Link from "next/link";
import { getPalette, getSignature } from "@/studios/skyforge/lib/styles";
import type { PackDTO, TextureMetaDTO } from "@/studios/skyforge/lib/serialize";

export function PackCard({
  pack,
  textures,
}: {
  pack: PackDTO;
  textures: TextureMetaDTO[];
}) {
  const palette = getPalette(pack.styleId);
  const signature = getSignature(pack.signatureId);
  return (
    <Link
      href={`/packs/${pack.id}`}
      className="group block border border-line bg-panel/80 p-3 transition hover:border-gold/50 hover:bg-panel-2"
    >
      <div className="slot relative aspect-square overflow-hidden">
        {textures.length ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/packs/${pack.id}/icon`}
            alt={pack.name}
            className="pixelated h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-xs text-paper/40">empty</div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-display text-sm tracking-wide text-gold-2 group-hover:text-gold">
          {pack.name}
        </h3>
        <p className="text-[11px] text-paper/50">
          {pack.author} · {textures.length} textures · {pack.resolution}px
        </p>
        <p className="mt-1.5 text-[10px] tracking-wide text-aqua/80">
          {signature.nameJa} <span className="text-paper/30">×</span> {palette.nameJa}
        </p>
      </div>
      <p className="mt-2 line-clamp-2 text-[12px] text-paper/60">{pack.description}</p>
      <p className="mt-2 flex gap-3 text-[11px] text-paper/40">
        <span>♥ {pack.likes}</span>
        <span>↓ {pack.downloads}</span>
      </p>
    </Link>
  );
}
