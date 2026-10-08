import Link from "next/link";
import { notFound } from "next/navigation";
import { LikeButton } from "@/studios/skyforge/components/like-button";
import { TextureExport } from "@/studios/skyforge/components/texture-export";
import { getItem } from "@/studios/skyforge/lib/catalog";
import { getPackMeta } from "@/studios/skyforge/lib/data";
import { RARITIES, type Rarity } from "@/studios/skyforge/lib/rarity";
import { getPalette, getSignature } from "@/studios/skyforge/lib/styles";

export const dynamic = "force-dynamic";

export default async function PackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pack = await getPackMeta(id);
  if (!pack) notFound();
  const palette = getPalette(pack.styleId);
  const signature = getSignature(pack.signatureId);

  return (
    <main className="bg-forge mx-auto min-h-screen max-w-6xl px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside>
          <div className="slot aspect-square overflow-hidden">
            {pack.textures.length ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/packs/${pack.id}/icon`}
                alt={pack.name}
                className="pixelated h-full w-full object-cover"
              />
            ) : null}
          </div>
          <h1 className="mt-4 font-display text-3xl text-gold-2">{pack.name}</h1>
          <p className="text-sm text-paper/50">
            {pack.author} · {pack.resolution}px · {pack.textures.length} textures
          </p>
          {pack.resolution === 64 ? (
            <p className="mt-2 inline-block border border-aqua/50 bg-aqua/10 px-2 py-1 font-pixel text-[9px] tracking-wider text-aqua">
              TRUE NATIVE 64 · SEPARATE GEOMETRY
            </p>
          ) : null}
          <div className="mt-3 space-y-2 border border-line bg-panel/70 p-3 text-[12px]">
            <div>
              <p className="font-pixel text-[9px] tracking-widest text-gold">画法</p>
              <p className="text-paper/85">{signature.nameJa}</p>
              <p className="text-[11px] text-paper/50">{signature.tagline}</p>
            </div>
            <div>
              <p className="font-pixel text-[9px] tracking-widest text-aqua">系譜</p>
              <p className="text-paper/85">{palette.nameJa}</p>
              <p className="text-[11px] text-paper/50">{palette.essence}</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-paper/70">{pack.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={`/api/packs/${pack.id}/export`}
              className="border border-gold/60 bg-gold/10 px-4 py-2 text-sm text-gold-2"
            >
              リソースパック ZIP
            </a>
            <Link
              href={`/studio/${pack.id}`}
              className="border border-line px-4 py-2 text-sm text-paper/80"
            >
              スタジオで開く
            </Link>
            <LikeButton packId={pack.id} initial={pack.likes} />
          </div>
          <p className="mt-3 text-[11px] text-paper/40">↓ {pack.downloads} downloads</p>
        </aside>

        <section>
          <p className="font-pixel text-[10px] tracking-[0.3em] text-paper/40">
            CONTENTS · {pack.textures.length}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {pack.textures.map((tex) => {
              const item = getItem(tex.itemId);
              const rarity = (tex.rarity || item?.rarity || "legendary") as Rarity;
              const color = RARITIES[rarity]?.color ?? "#fff";
              const px = tex.resolution === 16 ? 4 : 2;
              return (
                <div key={tex.id} className="border border-line bg-panel/70 p-2">
                  <div className="slot-item grid aspect-square place-items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/textures/${tex.id}/png`}
                      alt={tex.name}
                      className="pixelated"
                      style={{ width: tex.resolution * px, height: tex.resolution * px }}
                    />
                  </div>
                  <p className="mt-2 text-xs" style={{ color }}>
                    {tex.name}
                  </p>
                  <p className="text-[10px] text-paper/40">
                    {item?.nameJa} · {tex.templateId.startsWith("masterwork:") ? "原画" : tex.templateId}
                  </p>
                  <TextureExport
                    textureId={tex.id}
                    itemId={tex.itemId}
                    name={tex.name}
                    resolution={tex.resolution}
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
