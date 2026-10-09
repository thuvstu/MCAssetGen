import { PackCard } from "@/studios/skyforge/components/pack-card";
import { listPublicPacks } from "@/studios/skyforge/lib/data";
import { ensureDemoPacks } from "@/studios/skyforge/lib/seed";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ギャラリー",
};

export default async function GalleryPage() {
  let packs: Awaited<ReturnType<typeof listPublicPacks>> = [];
  try {
    await ensureDemoPacks();
    packs = await listPublicPacks();
  } catch {
    packs = [];
  }

  return (
    <main className="bg-forge mx-auto min-h-screen max-w-6xl px-4 py-12">
      <p className="font-pixel text-[10px] tracking-[0.3em] text-gold">GALLERY</p>
      <h1 className="mt-2 font-display text-4xl text-gold-2">公開パック</h1>
      <p className="mt-3 max-w-2xl text-sm text-paper/65">
        SkyForge で鍛造され、公開されたテクスチャパック。気に入ったパックはスタジオで開き、エッセンスを継ぎ足せる。
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packs.map((pack) => (
          <PackCard key={pack.id} pack={pack} textures={pack.textures} />
        ))}
      </div>
    </main>
  );
}
