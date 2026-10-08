import { useState, useMemo } from "react";
import type { MobDraft } from "@/types";
import { soundSynth } from "@/lib/audio";
import { cn } from "@/utils/cn";

export interface Opponent {
  id: string;
  name: string;
  health: number;
  armor: number;
  armorToughness: number;
  damage: number;
  attackSpeed: number; // 攻撃秒間隔
  knockback: number;
  icon: string;
}

export const OPPONENTS: Opponent[] = [
  {
    id: "player_bare",
    name: "プレイヤー (素手)",
    health: 20,
    armor: 0,
    armorToughness: 0,
    damage: 1,
    attackSpeed: 0.625,
    knockback: 0.4,
    icon: "👤",
  },
  {
    id: "player_iron",
    name: "プレイヤー (鉄装備)",
    health: 20,
    armor: 15,
    armorToughness: 0,
    damage: 6,
    attackSpeed: 0.625,
    knockback: 0.5,
    icon: "⚔️",
  },
  {
    id: "player_diamond",
    name: "プレイヤー (ダイヤ装備)",
    health: 20,
    armor: 20,
    armorToughness: 8,
    damage: 7,
    attackSpeed: 0.625,
    knockback: 0.5,
    icon: "💎",
  },
  {
    id: "player_netherite",
    name: "プレイヤー (ネザライト+鋭さV)",
    health: 20,
    armor: 20,
    armorToughness: 12,
    damage: 11,
    attackSpeed: 0.625,
    knockback: 0.7,
    icon: "🔥",
  },
  {
    id: "zombie",
    name: "ゾンビ",
    health: 20,
    armor: 2,
    armorToughness: 0,
    damage: 3,
    attackSpeed: 1.0,
    knockback: 0.4,
    icon: "🧟",
  },
  {
    id: "iron_golem",
    name: "アイアンゴーレム",
    health: 100,
    armor: 0,
    armorToughness: 0,
    damage: 14,
    attackSpeed: 1.2,
    knockback: 1.2,
    icon: "🦾",
  },
];

// Minecraft の防具ダメージ軽減計算式
function calculateDamage(rawDamage: number, armor: number, toughness: number): number {
  if (rawDamage <= 0) return 0;
  const defense = Math.max(armor / 5, armor - rawDamage / (2 + toughness / 4));
  const reduction = Math.min(20, Math.max(0, defense)) / 25;
  return Math.max(1, rawDamage * (1 - reduction));
}

interface BattleLog {
  time: string;
  attacker: "mob" | "opponent";
  damage: number;
  mobHp: number;
  oppHp: number;
  note?: string;
}

export function BattleArena({ mob }: { mob: MobDraft }) {
  const [selectedOppId, setSelectedOppId] = useState<string>("player_iron");
  const opponent = useMemo(() => OPPONENTS.find((o) => o.id === selectedOppId) ?? OPPONENTS[1], [selectedOppId]);

  const [simRunning, setSimRunning] = useState(false);
  const [mobHp, setMobHp] = useState(mob.health);
  const [oppHp, setOppHp] = useState(opponent.health);
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [winner, setWinner] = useState<"mob" | "opponent" | null>(null);

  // 100回試行での勝率・討伐予想タイム
  const stats = useMemo(() => {
    const mobDmgPerHit = calculateDamage(mob.attackDamage, opponent.armor, opponent.armorToughness);
    const oppDmgPerHit = calculateDamage(opponent.damage, mob.armor, mob.armorToughness);

    const mobHitsToKill = Math.ceil(opponent.health / Math.max(0.1, mobDmgPerHit));
    const mobTimeToKill = mobHitsToKill * Math.max(0.4, mob.attackInterval);

    const oppHitsToKill = Math.ceil(mob.health / Math.max(0.1, oppDmgPerHit));
    const oppTimeToKill = oppHitsToKill * opponent.attackSpeed;

    const winProbability = mobTimeToKill < oppTimeToKill ? Math.min(99, Math.round(50 + ((oppTimeToKill - mobTimeToKill) / oppTimeToKill) * 50)) : Math.max(1, Math.round((oppTimeToKill / (mobTimeToKill + oppTimeToKill)) * 100));

    return {
      mobDmgPerHit: mobDmgPerHit.toFixed(1),
      oppDmgPerHit: oppDmgPerHit.toFixed(1),
      mobTimeToKill: mobTimeToKill.toFixed(1),
      oppTimeToKill: oppTimeToKill.toFixed(1),
      winProbability,
    };
  }, [mob, opponent]);

  const runSimulation = () => {
    setSimRunning(true);
    setLogs([]);
    setWinner(null);

    let mHp = mob.health;
    let oHp = opponent.health;
    setMobHp(mHp);
    setOppHp(oHp);

    let t = 0;
    let nextMobAttack = mob.attackInterval;
    let nextOppAttack = opponent.attackSpeed;

    const stepLogs: BattleLog[] = [];
    const intervalId = window.setInterval(() => {
      t += 0.2;

      let acted = false;

      // モブの攻撃
      if (t >= nextMobAttack && mHp > 0 && oHp > 0) {
        nextMobAttack = t + mob.attackInterval;
        let raw = mob.attackDamage;
        if (mob.abilities.some((a) => a.id === "lifesteal")) {
          mHp = Math.min(mob.health, mHp + raw * 0.2);
        }
        const dmg = calculateDamage(raw, opponent.armor, opponent.armorToughness);
        oHp = Math.max(0, oHp - dmg);
        soundSynth.playAttack(1.0, mob.behaviors.includes("ranged"));
        stepLogs.unshift({
          time: t.toFixed(1) + "s",
          attacker: "mob",
          damage: parseFloat(dmg.toFixed(1)),
          mobHp: parseFloat(mHp.toFixed(1)),
          oppHp: parseFloat(oHp.toFixed(1)),
          note: mob.abilities.length > 0 ? `[${mob.abilities[0].id}発動]` : undefined,
        });
        acted = true;
      }

      // 相手の攻撃
      if (t >= nextOppAttack && mHp > 0 && oHp > 0) {
        nextOppAttack = t + opponent.attackSpeed;
        const dmg = calculateDamage(opponent.damage, mob.armor, mob.armorToughness);
        mHp = Math.max(0, mHp - dmg);
        soundSynth.playHurt(1.0, mob.armor > 8);
        stepLogs.unshift({
          time: t.toFixed(1) + "s",
          attacker: "opponent",
          damage: parseFloat(dmg.toFixed(1)),
          mobHp: parseFloat(mHp.toFixed(1)),
          oppHp: parseFloat(oHp.toFixed(1)),
        });
        acted = true;
      }

      if (acted) {
        setMobHp(parseFloat(mHp.toFixed(1)));
        setOppHp(parseFloat(oHp.toFixed(1)));
        setLogs([...stepLogs.slice(0, 30)]);
      }

      if (mHp <= 0 || oHp <= 0 || t > 40) {
        clearInterval(intervalId);
        setSimRunning(false);
        if (oHp <= 0) {
          setWinner("mob");
          soundSynth.playDeath(0.8);
        } else if (mHp <= 0) {
          setWinner("opponent");
          soundSynth.playDeath(1.2);
        }
      }
    }, 200);
  };

  return (
    <div className="space-y-4 rounded-xl border border-line bg-ink/60 p-3.5">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <div>
          <div className="text-[10px] font-mono tracking-wider text-emerald">TEST ARENA</div>
          <h3 className="text-sm font-bold text-cream">実戦バトルシミュレーター</h3>
        </div>
        <button
          type="button"
          disabled={simRunning}
          onClick={runSimulation}
          className="rounded-md bg-emerald px-3 py-1.5 text-xs font-bold text-ink shadow-sm transition hover:bg-emerald/90 disabled:opacity-40"
        >
          {simRunning ? "戦闘中..." : "⚔️ 実戦開始"}
        </button>
      </div>

      {/* 相手セレクター */}
      <div>
        <div className="mb-1 text-[11px] text-muted">テスト対戦相手を選択:</div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {OPPONENTS.map((opp) => (
            <button
              key={opp.id}
              type="button"
              onClick={() => {
                setSelectedOppId(opp.id);
                setMobHp(mob.health);
                setOppHp(opp.health);
                setWinner(null);
                setLogs([]);
              }}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-1.5 text-left text-xs transition",
                selectedOppId === opp.id
                  ? "border-gold/60 bg-gold/10 text-gold font-medium"
                  : "border-line bg-panel text-cream hover:bg-white/5"
              )}
            >
              <span className="text-base">{opp.icon}</span>
              <span className="truncate">{opp.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* HP バー対決 */}
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-line/80 bg-panel/70 p-3">
        {/* モブ側 */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="truncate font-bold text-cream">{mob.displayName}</span>
            <span className="font-mono text-emerald">
              {mobHp} / {mob.health} HP
            </span>
          </div>
          <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-ink">
            <div
              className="h-full bg-emerald transition-all duration-150"
              style={{ width: `${Math.max(0, Math.min(100, (mobHp / mob.health) * 100))}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between font-mono text-[10px] text-muted">
            <span>与ダメ: {stats.mobDmgPerHit}</span>
            <span>間隔: {mob.attackInterval}s</span>
          </div>
        </div>

        {/* 相手側 */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="truncate font-bold text-cream">{opponent.name}</span>
            <span className="font-mono text-rose">
              {oppHp} / {opponent.health} HP
            </span>
          </div>
          <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-ink">
            <div
              className="h-full bg-rose transition-all duration-150"
              style={{ width: `${Math.max(0, Math.min(100, (oppHp / opponent.health) * 100))}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between font-mono text-[10px] text-muted">
            <span>与ダメ: {stats.oppDmgPerHit}</span>
            <span>間隔: {opponent.attackSpeed}s</span>
          </div>
        </div>
      </div>

      {/* 勝率と討伐期待値カード */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-md border border-line bg-panel p-2">
          <div className="text-[10px] text-muted">モブ勝率推計</div>
          <div className={cn("text-base font-black font-mono", stats.winProbability > 50 ? "text-emerald" : "text-rose")}>
            {stats.winProbability}%
          </div>
        </div>
        <div className="rounded-md border border-line bg-panel p-2">
          <div className="text-[10px] text-muted">相手撃破所要時間</div>
          <div className="text-base font-black font-mono text-gold">{stats.mobTimeToKill} 秒</div>
        </div>
        <div className="rounded-md border border-line bg-panel p-2">
          <div className="text-[10px] text-muted">モブ被撃破時間</div>
          <div className="text-base font-black font-mono text-sky">{stats.oppTimeToKill} 秒</div>
        </div>
      </div>

      {winner && (
        <div
          className={cn(
            "rounded-md border p-2 text-center text-xs font-bold",
            winner === "mob" ? "border-emerald/40 bg-emerald/10 text-emerald" : "border-rose/40 bg-rose/10 text-rose"
          )}
        >
          {winner === "mob" ? `🏆 ${mob.displayName} の勝利！` : `💀 ${opponent.name} に敗北...`}
        </div>
      )}

      {/* バトルログ */}
      {logs.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-muted">リアルタイム・戦闘ログ:</div>
          <div className="mf-scroll max-h-36 overflow-y-auto rounded-md border border-line bg-ink p-2 font-mono text-[10px]">
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-center gap-1.5 py-0.5 border-b border-line/30 last:border-0">
                <span className="text-muted w-10">{log.time}</span>
                {log.attacker === "mob" ? (
                  <span className="text-emerald">
                    {mob.displayName} の一撃! 相手に <strong className="text-cream">{log.damage}</strong> ダメージ
                    {log.note && <span className="ml-1 text-gold">{log.note}</span>}
                  </span>
                ) : (
                  <span className="text-rose">
                    {opponent.name} の反撃! モブに <strong className="text-cream">{log.damage}</strong> ダメージ
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
