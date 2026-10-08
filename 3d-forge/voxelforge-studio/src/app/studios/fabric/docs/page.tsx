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
    id: "forge", title: "⚒ ゲーム内武器工房",
    body: (
      <div className="space-y-3">
        <p><b>1. Webの「武器工房」タブ:</b> 外見を追加し、PNGかBlockbenchでエクスポートしたJavaモデルJSONを取り込みます。材料と初期能力、初期スキルを選び、ZIPを再ビルドします。</p>
        <p><b>2. ゲーム内:</b> 武器工房ブロックを右クリック (または <code>/forge open</code>) して6行の画面を開きます。外見・素材・右/Shift右/左クリック用スキル・能力値をクリックで選択します。自由な名前は <code>/forge name &lt;名前&gt;</code> と入力。材料を持って「鍛造」をクリックすると、一振りだけ完成します。</p>
        <p><b>3. 登録ID:</b> 外見ごとに <code>&lt;modid&gt;:forged_&lt;外見ID&gt;</code> のアイテムがMod起動時に登録されます。完成した武器の名前・性能・スキルは個々のItemStackのデータとして保存され、リログ後も残ります。</p>
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200"><b>制限:</b> ゲーム起動後に新しい登録ID・PNG・モデルをサーバーだけから追加することはできません。新しい見た目はWeb側で取り込んでModを再ビルドし、導入する全クライアントに配布してください。<code>.bbmodel</code> 本体はMinecraft用JSONではないため、BlockbenchからJava Block/ItemモデルJSONとしてエクスポートします。</p>
        <p>材料は外見ごとに設定した追加材料と、選択した素材(WOOD / STONE / COPPER / IRON / GOLD / DIAMOND / NETHERITE)が1個ずつ必要です。クリエイティブモードでは消費しません。旧1.21.1/Yarnプロファイルでは未対応です。</p>
      </div>
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
    id: "worldgen", title: "ワールド生成 & 構造物 (Structure NBT / 初期村)",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li><b>構造物 (Structure NBT / Jigsaw)</b>: Minecraft の Structure Block や <b>Structure Viewer</b> (minecraftmaps.com) で書き出した <code>.nbt</code> をアップロードして自然生成に組み込めます。</li>
        <li><b>初期スポーンの村 (鍛冶工房 & 交易所)</b>: デフォルトでスポーン地点近辺 (X=0, Z=0付近) に鍛冶台・作業台・交易所・石レンガ屋根の初期村が自動生成されます。</li>
        <li><b>鉱石</b>: ディメンション・脈サイズ・高さ・バイオームタグ。ドロップは幸運/シルクタッチ/爆発に対応。</li>
        <li><b>地表クラスター</b>: 指定バイオームの地表にブロックが群生 (random_patch)。</li>
        <li>いずれも<b>新しく生成されるチャンクのみ</b>に適用されます。既存チャンクには追加されません。</li>
      </ul>
    ),
  },
  {
    id: "kotlin", title: "🧩 カスタムKotlinとスニペット",
    body: (
      <div className="space-y-3">
        <p>「Kotlinコード」アクションを選ぶと、15種類の<b>スニペット</b>をワンクリックで挿入できます (チャット送信・周囲の敵へスロウ・足元に円形パーティクル・防具確認・手持ちの耐久消費・満腹度回復・天候変更・近くのドロップ回収・変数操作・クールダウン解除 など)。</p>
        <p>スニペット挿入時に<b>必要なimportは自動追加</b>されます。書いたコードはその場で静的解析され、エラー行と修正案 (🔧) が表示されます。</p>
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200">1.21.11 では <b>Mojang 公式名</b>を使います (<code>ServerPlayer</code>, <code>Component.literal</code>, <code>Identifier.fromNamespaceAndPath</code>)。Yarn名 (<code>ServerPlayerEntity</code> など) は解析が検出して案内します。</p>
      </div>
    ),
  },
  {
    id: "recipes", title: "📜 レシピの種類",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li><b>作業台</b>: 定形 (配置が重要) / 不定形 (配置自由)。材料には <code>#minecraft:planks</code> のようなタグも使えます。</li>
        <li><b>かまど・溶鉱炉・燻製器・焚き火</b>: 材料1種 + 経験値 + 調理時間。種類を選ぶと既定値が自動設定されます。</li>
        <li><b>石切台</b>: 材料1種。経験値はありません。</li>
        <li>防具素材は <b>LEATHER / COPPER / CHAINMAIL / IRON / GOLD / DIAMOND / TURTLE_SCUTE / NETHERITE / ARMADILLO_SCUTE</b> に対応しています。</li>
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
/sp buy <id>          強化を習得
/forge open           武器工房画面を開く
/forge name <名前>    鍛造する武器の名前を設定
/forge style <id>     同梱済みの見た目を選択
/forge material <tier> 素材を変更 (IRON, DIAMONDなど)
/forge skill <id/none> 右クリックのスキルを設定
/forge shift <id/none> Shift+右クリックのスキルを設定
/forge left <id/none> 左クリックのスキルを設定
/forge create         材料を支払って武器を完成させる`}</pre>
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
        <li>武器工房はバニラのチェスト型画面を利用します。新デザインの専用クライアントGUI・独自エンティティ(新モデル)・構造物は未対応です。</li>
        <li>ゲーム内で登録済みの外見から武器を作れますが、新しいPNG/モデル/登録IDを追加した場合はModの再ビルドとクライアントへの配布が必要です。</li>
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
      <Link href="/studios/fabric" className="text-sm text-emerald-300 hover:underline">← ホームへ</Link>
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
