import Link from "next/link";

export const metadata = { title: "ドキュメント — MythicForge" };

const sections: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "quickstart", title: "クイックスタート",
    body: (
      <ol className="list-decimal space-y-1 pl-5">
        <li>ホームで「サンプル付き」のプロジェクトを作成します。</li>
        <li><b>スキル</b>タブで トリガー → 条件 → アクション のブロックを積みます。</li>
        <li><b>アイテム / ブロック / モブ / レシピ / 拡張</b>タブで Mod の中身を作ります。</li>
        <li><b>ビルド・解析</b>タブで検証し、<b>ZIP出力</b>。IntelliJ IDEA で開いて <code>./gradlew build</code>。</li>
      </ol>
    ),
  },
  {
    id: "skills", title: "スキルの仕組み",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li><b>トリガー</b>: 手動(右クリック/キー)・攻撃・撃破・被ダメージ・ブロック破壊・装備中・参加時・一定間隔・左クリック・死亡時。</li>
        <li><b>アイテム側の割り当て</b>: 右クリック / Shift+右クリック(排他) / 左クリック(殴る)。</li>
        <li><b>数値式</b>: ダメージ等の量は定数のほか式が使えます (例 <code>lastDamage*0.5</code>、<code>health*0.1</code>)。</li>
        <li><b>変数</b>: <code>&lt;var.x&gt;</code> <code>&lt;target.x&gt;</code> <code>&lt;global.x&gt;</code> をメッセージに埋め込み。ワールドに保存されます。</li>
        <li><b>ミサイル</b>: 毎tick飛ぶ弾。着弾点を origin として別スキルを発動できます。</li>
      </ul>
    ),
  },
  {
    id: "extras", title: "拡張タブ (1.21.11 プロファイル)",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li><b>エフェクト</b>: 独自のステータス効果。「復活」で不死のトーテム風、「毎tickスキル」で持続効果。</li>
        <li><b>実績</b>: 実績画面にModのタブを追加。アイテム入手 / 討伐カウント(n/N) / スキルから進行。</li>
        <li><b>ショップ</b>: 村人と同じ取引画面。ブロック右クリック・<code>/shop</code>・スキルから開けます。</li>
        <li><b>スキルポイント</b>: <code>/sp</code> で確認、<code>/sp buy &lt;id&gt;</code> で強化 (HP/攻撃/速度/マナ/幸運)。</li>
        <li><b>素材</b>: 倍率付きの独自ツール素材 (攻撃・採掘速度・耐久)。</li>
      </ul>
    ),
  },
  {
    id: "worldgen", title: "ワールド生成",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li><b>鉱石</b>: ディメンション・脈サイズ・高さ・バイオームタグ。ドロップは幸運/シルクタッチ/爆発に対応。</li>
        <li><b>地表クラスター</b>: 指定バイオームの地表にブロックが群生 (random_patch)。</li>
        <li>いずれも<b>新しく生成されるチャンクのみ</b>に適用されます。構造物(建物)の生成は未対応です。</li>
      </ul>
    ),
  },
  {
    id: "commands", title: "ゲーム内コマンド",
    body: (
      <pre className="overflow-auto rounded-lg bg-black/40 p-3 text-xs text-emerald-300">{`/skill cast <id>      スキル発動 (OP)
/skill list           スキル一覧
/skill mana           マナ確認
/skill slots          キースロット表示
/<modid> spawn <mob>  カスタムモブ召喚
/shop <id>            ショップを開く
/sp                   スキルポイント一覧
/sp buy <id>          強化を習得`}</pre>
    ),
  },
  {
    id: "build", title: "ビルドと環境",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>既定: Minecraft 1.21.11 / Mojang マッピング / Loom 1.14 / Gradle 9.6.1 / JDK 21。</li>
        <li><b>IntelliJ</b>: Settings → Build Tools → Gradle → <b>Gradle JVM を 21</b> にして Reload。</li>
        <li>Gradle Wrapper 同梱。<code>./gradlew build</code> → <code>build/libs/*.jar</code>。<code>./gradlew runServer</code> で動作確認。</li>
        <li>旧 1.21.1 / Yarn プロファイルも選べますが、拡張タブの機能は使えません。</li>
      </ul>
    ),
  },
  {
    id: "limits", title: "できること・できないこと (正直な現状)",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>生成コードは実際の JDK 21 + Gradle でコンパイル検証済みです。ただし<b>ゲーム内の細かな挙動(バランス・見た目)は実プレイで確認してください</b>。</li>
        <li>テクスチャは PNG アップロードかバニラ参照。3Dモデルは Blockbench の JSON を貼り付け。</li>
        <li>独自エンティティ(新モデル)・構造物・独自GUI画面は未対応です (カスタムモブはバニラMobの改造)。</li>
      </ul>
    ),
  },
  {
    id: "shortcuts", title: "ショートカット",
    body: <p><kbd>Ctrl</kbd>+<kbd>Z</kbd> 元に戻す / <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> やり直す (入力欄以外)。編集は自動保存されます。</p>,
  },
  {
    id: "verify", title: "回帰検証 (開発者向け)",
    body: <pre className="overflow-auto rounded-lg bg-black/40 p-3 text-xs text-emerald-300">{`npx tsx scripts/verify.ts                 # 全プリセット × 全プロファイルを静的解析
npx tsx scripts/verify.ts --out /tmp/kv   # 全アクション入りModを書き出し → ./gradlew build`}</pre>,
  },
];

export default function Docs() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10 text-slate-200">
      <Link href="/" className="text-sm text-emerald-300 hover:underline">← ホームへ</Link>
      <h1 className="mt-4 text-3xl font-extrabold">MythicForge ドキュメント</h1>
      <p className="mt-2 text-slate-400">コードを書かずに Minecraft Fabric Mod (Kotlin) を作るためのガイドです。</p>
      <nav className="mt-6 flex flex-wrap gap-2 text-xs">
        {sections.map((s) => <a key={s.id} href={`#${s.id}`} className="rounded-full border border-[#262f3e] px-3 py-1 text-slate-300 hover:bg-white/5">{s.title}</a>)}
      </nav>
      <div className="mt-8 space-y-8">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="rounded-xl border border-[#262f3e] bg-[#141922] p-5 text-sm leading-relaxed">
            <h2 className="mb-3 text-lg font-bold text-emerald-300">{s.title}</h2>
            {s.body}
          </section>
        ))}
      </div>
    </div>
  );
}
