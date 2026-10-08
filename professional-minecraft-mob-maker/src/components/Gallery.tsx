import { images } from "@/assets";
import { ARCHETYPES } from "@/data/archetypes";
import { buildPresets } from "@/data/presets";
import { RARITY_COLOR, TEMPERAMENT_LABEL } from "@/data/catalog";
import { combatScore, createMob, rankOf } from "@/lib/model";
import type { MobDraft } from "@/types";
import { Viewport } from "@/components/Viewport";
import { SpawnEgg } from "@/components/SpawnEgg";

const presets = buildPresets();

export function Gallery({
  onPick,
  onClose,
  canClose,
}: {
  onPick: (mob: MobDraft) => void;
  onClose: () => void;
  canClose: boolean;
}) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-ink/90 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-line">
          <img src={images.workshop} alt="" className="h-56 w-full object-cover sm:h-64" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/20" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
            <div className="text-[11px] font-semibold tracking-[0.28em] text-emerald">MOBFORGE</div>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-cream sm:text-4xl">型から、本格的に。</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-cream/80">
              シルエットを選び、部位・色・戦闘・出現・ドロップを詰めて、Fabric / NeoForge / Bedrock の雛形まで書き出す。
              空の型紙でも、仕上がったサンプルからでも始められます。
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-cream/75">
              {["1 型を選ぶ", "2 部位と色", "3 戦闘と出現", "4 雛形を書き出す"].map((s) => (
                <span key={s} className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
                  {s}
                </span>
              ))}
            </div>
          </div>
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-cream hover:bg-black/70"
            >
              工房に戻る
            </button>
          )}
        </div>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h3 className="text-lg font-black text-cream">仕上がったサンプル</h3>
              <p className="text-xs text-muted">名前、ステータス、出現、ドロップまで入った設計。開いてから削るのが早い。</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {presets.map((mob) => {
              const score = combatScore(mob);
              const rank = rankOf(score);
              return (
                <button
                  key={mob.entityId + mob.displayName}
                  type="button"
                  onClick={() => onPick(structuredCloneSafe(mob))}
                  className="group overflow-hidden rounded-xl border border-line bg-panel text-left transition hover:-translate-y-0.5 hover:border-emerald/50"
                >
                  <div className="relative h-40 bg-ink">
                    <Viewport mob={mob} miniature />
                    <div className="absolute left-2 top-2">
                      <SpawnEgg base={mob.eggBase} spots={mob.eggSpots} size={28} />
                    </div>
                    <span
                      className="absolute right-2 top-2 rounded-full px-2 py-0.5 font-mono text-[10px]"
                      style={{ color: RARITY_COLOR[mob.rarity], background: "#00000088" }}
                    >
                      {rank} · {TEMPERAMENT_LABEL[mob.temperament]}
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-bold text-cream">{mob.displayName}</div>
                      <div className="font-mono text-[10px] text-muted">{mob.modId}:{mob.entityId}</div>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{mob.summary}</p>
                    <div className="mt-2 text-[11px] text-emerald opacity-0 transition group-hover:opacity-100">この設計を開く</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-8 pb-10">
          <h3 className="text-lg font-black text-cream">空の型紙</h3>
          <p className="mb-3 text-xs text-muted">骨格と付属パーツだけ。色と数値は型の初期値です。変種は工房の中で切り替えられます。</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ARCHETYPES.map((arch) => {
              const blank = createMob(arch.id, arch.variants[0].id, {
                displayName: `新しい${arch.name}`,
                displayNameEn: `New ${arch.en}`,
                entityId: `new_${arch.id}`,
                summary: arch.tagline,
              });
              return (
                <button
                  key={arch.id}
                  type="button"
                  onClick={() => onPick(blank)}
                  className="overflow-hidden rounded-xl border border-line bg-panel text-left hover:border-gold/50"
                >
                  <div className="h-32">
                    <Viewport mob={blank} miniature />
                  </div>
                  <div className="flex items-start gap-2 p-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ink font-black text-gold">{arch.mark}</span>
                    <div>
                      <div className="font-bold text-cream">
                        {arch.name}
                        <span className="ml-2 font-mono text-[10px] font-normal text-muted">{arch.en}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{arch.tagline}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function structuredCloneSafe(mob: MobDraft): MobDraft {
  const copy = JSON.parse(JSON.stringify(mob)) as MobDraft;
  copy.uid = crypto.randomUUID();
  copy.createdAt = Date.now();
  copy.updatedAt = Date.now();
  return copy;
}
