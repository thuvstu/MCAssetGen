import Image from "next/image";
import Link from "next/link";
import { HeroShowcase } from "@/components/hero-showcase";
import { PackCard } from "@/components/pack-card";
import { listPublicPacks } from "@/lib/data";
import { ensureDemoPacks } from "@/lib/seed";
import { PALETTES, SIGNATURES, paletteSwatches } from "@/lib/styles";

export const dynamic = "force-dynamic";

const VOTES = [
  { name: "FurfSky 系", share: 42.5, note: "clean & detailed" },
  { name: "ImperiaL's 系", share: 33.0, note: "ornate / regalia" },
  { name: "Vanilla+ 系", share: 25.2, note: "classic & simple" },
  { name: "Faithful 32x 系", share: 7.9, note: "smooth ramp" },
  { name: "SkyPixel 系", share: 5.2, note: "crisp pixel" },
  { name: "3D SkyBlock 系", share: 4.5, note: "pseudo 3d" },
];

export default async function HomePage() {
  let packs: Awaited<ReturnType<typeof listPublicPacks>> = [];
  try {
    await ensureDemoPacks();
    packs = await listPublicPacks();
  } catch {
    packs = [];
  }

  return (
    <main className="bg-forge">
      <section className="relative overflow-hidden border-b border-line">
        <Image
          src="/images/hero-forge.jpg"
          alt="伝説の武器が浮かぶ地下工房"
          fill
          priority
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-abyss/30 via-abyss/75 to-abyss" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <p className="font-pixel text-[11px] tracking-[0.35em] text-gold">
            SKYBLOCK TEXTURE FORGE
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight tracking-wide text-gold-2 sm:text-6xl">
            パックの“画法”を蒸留し、
            <br />
            新しいテクスチャを鍛造する。
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-paper/75 sm:text-base">
            SkyBlock のテクスチャパックの違いは、色だけではない。輪郭の硬さ、ベベルの入れ方、階調の数、
            装飾の密度、発光の量——その<em className="not-italic text-gold-2">描き方</em>こそが各パックの正体だ。
            SkyForge はそれを {SIGNATURES.length} の「画法」と {PALETTES.length} の「系譜」に蒸留して混ぜ合わせる。
            64×64は16×の拡大ではない。全46型を64座標で別設計したネイティブモデルから生成する。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/studio"
              className="border border-gold/70 bg-gold/15 px-5 py-2.5 text-sm tracking-wider text-gold-2"
            >
              スタジオを開く
            </Link>
            <Link href="/gallery" className="border border-line px-5 py-2.5 text-sm text-paper/80">
              ギャラリー
            </Link>
            <Link href="/guide" className="border border-line px-5 py-2.5 text-sm text-paper/60">
              導入ガイド
            </Link>
          </div>
          <HeroShowcase />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="font-pixel text-[10px] tracking-[0.3em] text-aqua">SIGNATURE / 画法</p>
        <h2 className="mt-2 font-display text-3xl text-gold-2">どう描くか、がパックの性格</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-paper/70">
          コミュニティの人気投票で見えるのは「どれが一番綺麗か」ではなく「どんな描き方が支持されるか」だ。
          下の 8 つは、その支持された画法の骨格だけを抽出したもの。最大 2 つまで重ねられる。
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SIGNATURES.map((sig) => (
            <Link
              key={sig.id}
              href={`/studio?signature=${sig.id}`}
              className="border border-line bg-panel/70 p-4 transition hover:border-gold/40"
            >
              <h3 className="font-display text-sm tracking-wide text-gold-2">{sig.nameJa}</h3>
              <p className="text-[11px] text-paper/40">{sig.name}</p>
              <p className="mt-2 text-[12px] text-paper/70">{sig.tagline}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-paper/55">{sig.essence}</p>
              <p className="mt-3 font-pixel text-[9px] tracking-wider text-aqua/70">
                {sig.inspiredNote}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-ink/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div>
            <p className="font-pixel text-[10px] tracking-[0.3em] text-gold">PALETTE / 系譜</p>
            <h2 className="mt-2 font-display text-3xl text-gold-2">何で出来ているか、で色が決まる</h2>
            <p className="mt-4 text-sm leading-relaxed text-paper/70">
              地下墓地の骨と苔、虚空の紫、結晶洞のプリズム、真紅の島の溶岩、氷の蒼銀、妖精工房のパステル、
              竜鱗の金紫、ミダスの古金、ミスリル鉱脈、麦と土。12 の系譜を最大 3 つまで混ぜると、
              金属・宝石・木・革・布・発光体の色が一括で調合される。
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {PALETTES.map((pal) => (
                <Link
                  key={pal.id}
                  href={`/studio?palette=${pal.id}`}
                  className="border border-line bg-panel/60 p-2 transition hover:border-aqua/40"
                >
                  <span className="flex h-2.5 w-full overflow-hidden">
                    {paletteSwatches(pal).map((c) => (
                      <span key={c} className="flex-1" style={{ background: c }} />
                    ))}
                  </span>
                  <span className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="text-[12px] text-paper/85">{pal.nameJa}</span>
                    <span className="text-[10px] text-paper/40">{pal.tagline}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
          <div className="relative h-72 overflow-hidden border border-line lg:h-96">
            <Image
              src="/images/essence-alchemy.jpg"
              alt="絵の具のように混ざる魔法の顔料"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="font-pixel text-[10px] tracking-[0.3em] text-gold">FEATURED PACKS</p>
            <h2 className="mt-2 font-display text-3xl text-gold-2">工房の棚</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packs.length === 0 ? (
                <p className="border border-dashed border-line p-8 text-sm text-paper/50">
                  まだパックがありません。スタジオで最初の一振りを。
                </p>
              ) : (
                packs.slice(0, 6).map((pack) => (
                  <PackCard key={pack.id} pack={pack} textures={pack.textures} />
                ))
              )}
            </div>
          </div>
          <aside>
            <p className="font-pixel text-[10px] tracking-[0.3em] text-paper/40">WHY IT LOOKS DIFFERENT</p>
            <h3 className="mt-2 font-display text-xl text-gold-2">支持された画法の内訳</h3>
            <ul className="mt-4 space-y-3">
              {VOTES.map((vote) => (
                <li key={vote.name}>
                  <div className="flex items-baseline justify-between text-[12px]">
                    <span className="text-paper/80">{vote.name}</span>
                    <span className="text-paper/40">{vote.note}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-panel-2">
                    <div
                      className="h-full bg-gradient-to-r from-gold/70 to-gold-2"
                      style={{ width: `${Math.min(100, vote.share * 2)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-paper/45">
              SkyForge はこれらの描き方の“構造”だけを学び、画像・素材・ロゴは一切複製しない。
              生成されるのは常に新しいピクセルアートです。
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
